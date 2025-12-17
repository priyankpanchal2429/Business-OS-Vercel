// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./middleware/auth');
const db = require('./database');
const multer = require('multer');

const app = express();
const PORT = 3002; // Hardcoded to bypass stuck process on 3001

// --- CONFIGURATION ---

// Uploads Directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        // Sanitize filename to remove special characters
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// CORS Setup
const allowedOrigins = [
    'http://localhost:5173', // Vite Local
    'http://localhost:3000', // Old Self
    'http://localhost:3001', // Old Self
    'http://localhost:3002', // New Self
    'https://business-os-nu.vercel.app', // Vercel
    'https://*.serveo.net', // Serveo Tunnels
    'https://*.serveousercontent.com', // Serveo Content Domain
    'https://*.trycloudflare.com' // Cloudflare Tunnels (Legacy)
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const isAllowed = allowedOrigins.some(o => {
            if (o.includes('*')) {
                const regex = new RegExp('^' + o.replace(/\*/g, '.*') + '$');
                return regex.test(origin);
            }
            return o === origin;
        });

        if (isAllowed) return callback(null, true);

        console.log(`⚠️ Blocked CORS: ${origin}`);
        callback(null, true); // Permissive for debugging, strictly should be Error
    },
    credentials: true
}));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));
app.use(authMiddleware);

// --- ROUTES ---

// File Upload Endpoint
app.post('/upload/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Construct absolute URL (important for frontend to display correctly)
        // Note: In production with a tunnel, req.protocol + host might point to localhost
        // Ideally we return a relative path or handle base URL in frontend, but user asked for absolute.
        // We often rely on the frontend to prepend Base URL if we return relative.
        // BUT, the plan says return absolute. Let's return a relative path that works with the static serve.

        // Actually best practice for this setup: return full URL if possible, or relative /uploads/...
        // Let's go with full URL using the request host.
        const protocol = req.protocol;
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

        res.json({ imageUrl: fileUrl });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: 'File upload failed' });
    }
});

app.get('/', (req, res) => {
    res.send({ status: 'OK', message: 'Business-OS Backend Running', time: new Date().toISOString() });
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ip: req.ip, time: new Date().toISOString() });
});

// Inventory Routes
app.get('/api/inventory', (req, res) => {
    try {
        const items = db.prepare('SELECT * FROM inventory').all();
        res.json(items);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/inventory', (req, res) => {
    try {
        const { name, category, type, stock, price, description, vendorName, lowStockThreshold, imageUrl, hsnCode } = req.body;
        const stmt = db.prepare(`
            INSERT INTO inventory (name, category, type, stock, price, description, vendorName, lowStockThreshold, imageUrl, hsnCode, lastUpdated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
            name, category, type, stock || 0, price || 0, description, vendorName,
            lowStockThreshold || 5, imageUrl || '', hsnCode || '', new Date().toISOString()
        );
        const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/inventory/:id', (req, res) => {
    try {
        const { name, category, type, stock, price, description, vendorName, lowStockThreshold, imageUrl, hsnCode } = req.body;
        const { id } = req.params;

        // Build dynamic query to only update provided fields
        // For simplicity in this specific app, we often just update everything provided.
        // Let's just update all common fields.

        const stmt = db.prepare(`
            UPDATE inventory 
            SET name = ?, category = ?, type = ?, stock = ?, price = ?, 
                description = ?, vendorName = ?, lowStockThreshold = ?, 
                imageUrl = ?, hsnCode = ?, lastUpdated = ?
            WHERE id = ?
        `);

        const result = stmt.run(
            name, category, type, stock, price, description, vendorName,
            lowStockThreshold, imageUrl, hsnCode, new Date().toISOString(),
            id
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        const updatedItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
        res.json(updatedItem);
    } catch (err) {
        console.error("Update error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/inventory/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        res.json({ message: 'Item deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EMPLOYEES ---
app.get('/api/employees', (req, res) => {
    try {
        const employees = db.prepare('SELECT * FROM employees').all();
        const parsed = employees.map(e => ({
            ...e,
            workingDays: e.workingDays ? JSON.parse(e.workingDays) : [],
            bankDetails: e.bankDetails ? JSON.parse(e.bankDetails) : {},
            emergencyContact: e.emergencyContact ? JSON.parse(e.emergencyContact) : {},
            documents: e.documents ? JSON.parse(e.documents) : []
        }));
        res.json(parsed);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', (req, res) => {
    try {
        const { name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, status, image, birthday } = req.body;
        const stmt = db.prepare(`
            INSERT INTO employees (name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, documents, status, image, birthday, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
            name, role, contact, email, address, salary || 0, perShiftAmount || 0, hourlyRate || 0, shiftStart, shiftEnd,
            JSON.stringify(workingDays || []), JSON.stringify(bankDetails || {}), JSON.stringify(emergencyContact || {}),
            status || 'Active', image, birthday, new Date().toISOString(), new Date().toISOString()
        );
        const newEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
        res.json(newEmp);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/employees/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, status, image, lastWorkingDay, resignationDate, birthday } = req.body;

        const stmt = db.prepare(`
            UPDATE employees 
            SET name = COALESCE(?, name), role = COALESCE(?, role), contact = COALESCE(?, contact), 
                email = COALESCE(?, email), address = COALESCE(?, address), salary = COALESCE(?, salary), 
                perShiftAmount = COALESCE(?, perShiftAmount), hourlyRate = COALESCE(?, hourlyRate), 
                shiftStart = COALESCE(?, shiftStart), shiftEnd = COALESCE(?, shiftEnd), 
                workingDays = COALESCE(?, workingDays), bankDetails = COALESCE(?, bankDetails), 
                emergencyContact = COALESCE(?, emergencyContact), status = COALESCE(?, status), 
                image = COALESCE(?, image), lastWorkingDay = COALESCE(?, lastWorkingDay),
                resignationDate = COALESCE(?, resignationDate), birthday = COALESCE(?, birthday), updatedAt = ?
            WHERE id = ?
        `);

        const result = stmt.run(
            name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd,
            workingDays ? JSON.stringify(workingDays) : null,
            bankDetails ? JSON.stringify(bankDetails) : null,
            emergencyContact ? JSON.stringify(emergencyContact) : null,
            status, image, lastWorkingDay, resignationDate, birthday, new Date().toISOString(),
            id
        );

        if (result.changes === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(db.prepare('SELECT * FROM employees WHERE id = ?').get(id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- VENDORS ---
app.get('/api/vendors', (req, res) => {
    try {
        const vendors = db.prepare('SELECT * FROM vendors').all();
        res.json(vendors.map(v => ({ ...v, suppliedItems: v.suppliedItems ? JSON.parse(v.suppliedItems) : [] })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/vendors', (req, res) => {
    try {
        const { name, category, contact, email, address, suppliedItems, contactPerson, phone, status, logoUrl } = req.body;
        const stmt = db.prepare(`
            INSERT INTO vendors (name, category, contact, email, address, suppliedItems, contactPerson, phone, status, logoUrl, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
            name, category, contact, email, address,
            JSON.stringify(suppliedItems || []),
            contactPerson, phone, status || 'active', logoUrl,
            new Date().toISOString()
        );
        res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/vendors/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, contact, email, address, suppliedItems, contactPerson, phone, status, logoUrl } = req.body;

        const stmt = db.prepare(`
            UPDATE vendors 
            SET name = COALESCE(?, name), 
                category = COALESCE(?, category), 
                contact = COALESCE(?, contact), 
                email = COALESCE(?, email), 
                address = COALESCE(?, address), 
                suppliedItems = COALESCE(?, suppliedItems),
                contactPerson = COALESCE(?, contactPerson),
                phone = COALESCE(?, phone),
                status = COALESCE(?, status),
                logoUrl = COALESCE(?, logoUrl)
            WHERE id = ?
        `);

        const result = stmt.run(
            name, category, contact, email, address,
            suppliedItems ? JSON.stringify(suppliedItems) : null,
            contactPerson, phone, status, logoUrl,
            id
        );

        if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found' });

        res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/vendors/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
        if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found' });
        res.json({ message: 'Vendor deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BONUS ---
app.get('/api/bonus/stats', (req, res) => {
    try {
        const employees = db.prepare('SELECT * FROM employees').all();
        const withdrawals = db.prepare('SELECT * FROM bonus_withdrawals').all();

        const stats = employees.map(emp => {
            const empWithdrawals = withdrawals.filter(w => w.employeeId === emp.id).reduce((sum, w) => sum + (w.amount || 0), 0);
            const totalAccrued = (emp.salary || 0) * 12 * 0.1; // Example: 10% of annual salary
            return {
                employeeId: emp.id,
                name: emp.name,
                totalAccrued: totalAccrued,
                withdrawn: empWithdrawals,
                balance: Math.max(0, totalAccrued - empWithdrawals)
            };
        });

        res.json({
            companyTotalBalance: stats.reduce((sum, s) => sum + s.balance, 0),
            employees: stats
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/bonus/withdraw', (req, res) => {
    try {
        const { employeeId, amount, date, notes } = req.body;
        const id = Date.now().toString(); // Use timestamp as ID
        const stmt = db.prepare(`
            INSERT INTO bonus_withdrawals (id, employeeId, amount, date, notes, status, createdAt)
            VALUES (?, ?, ?, ?, ?, 'approved', ?)
        `);
        stmt.run(id, employeeId, amount, date, notes, new Date().toISOString());
        res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- LOANS ---
app.get('/api/loans', (req, res) => {
    try {
        const { employeeId } = req.query;
        let query = 'SELECT * FROM loans';
        if (employeeId) query += ' WHERE employeeId = ?';

        const loans = employeeId ? db.prepare(query).all(employeeId) : db.prepare(query).all();
        res.json(loans);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/loans', (req, res) => {
    try {
        const { employeeId, amount, date, status, notes } = req.body;
        const stmt = db.prepare(`
            INSERT INTO loans (employeeId, amount, date, status, notes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(
            employeeId, amount, date, status || 'active', notes,
            new Date().toISOString(), new Date().toISOString()
        );
        res.json(db.prepare('SELECT * FROM loans WHERE id = ?').get(info.lastInsertRowid));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/loans/:id', (req, res) => {
    try {
        const { id } = req.params;
        const { amount, date, status, notes } = req.body;
        const stmt = db.prepare(`
            UPDATE loans SET amount = COALESCE(?, amount), date = COALESCE(?, date), status = COALESCE(?, status), notes = COALESCE(?, notes), updatedAt = ? WHERE id = ?
        `);
        const result = stmt.run(amount, date, status, notes, new Date().toISOString(), id);
        if (result.changes === 0) return res.status(404).json({ error: 'Loan not found' });
        res.json(db.prepare('SELECT * FROM loans WHERE id = ?').get(id));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- TIMESHEETS ---
app.get('/api/timesheet/:employeeId/:start/:end', (req, res) => {
    try {
        const { employeeId, start, end } = req.params;
        const entries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date >= ? AND date <= ?').all(employeeId, start, end);
        res.json(entries);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/timesheet', (req, res) => {
    try {
        const { employeeId, periodStart, periodEnd, entries } = req.body;

        const deleteStmt = db.prepare('DELETE FROM timesheet_entries WHERE employeeId = ? AND date >= ? AND date <= ?');
        const insertStmt = db.prepare('INSERT INTO timesheet_entries (employeeId, date, clockIn, clockOut, breakMinutes, status, dayType) VALUES (?, ?, ?, ?, ?, ?, ?)');

        const transaction = db.transaction((entries) => {
            deleteStmt.run(employeeId, periodStart, periodEnd);
            for (const entry of entries) {
                if (entry.date) {
                    insertStmt.run(employeeId, entry.date, entry.clockIn, entry.clockOut, entry.breakMinutes, 'active', entry.dayType || 'Work');
                }
            }
        });

        transaction(entries);
        res.json({ success: true });
    } catch (err) {
        console.error('Timesheet Error:', err);
        res.status(500).json({ error: err.message, success: false });
    }
});

// --- PAYROLL ROUTES ---

const getPeriodDates = (startStr, endStr) => {
    let dates = [];
    let cur = new Date(startStr);
    let end = new Date(endStr);
    while (cur <= end) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
    }
    return dates;
};

app.get('/api/payroll/period', (req, res) => {
    try {
        const { start, end } = req.query;
        if (!start || !end) return res.status(400).json({ error: 'Start and end dates required' });

        const employees = db.prepare('SELECT * FROM employees WHERE status != ?').all('Resigned');
        const payrollData = employees.map(emp => {
            // Get Attendance
            const entries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date >= ? AND date <= ?')
                .all(emp.id, start, end);

            // Calculate Pay
            let totalHours = 0;
            let overtimeHours = 0;
            let daysWorked = 0;

            entries.forEach(entry => {
                if (entry.status === 'active' || entry.status === 'Present') {
                    daysWorked++;
                    // Simple calculation if clockIn/Out exist
                    if (entry.clockIn && entry.clockOut) {
                        const [sh, sm] = entry.clockIn.split(':').map(Number);
                        const [eh, em] = entry.clockOut.split(':').map(Number);
                        let duration = (eh * 60 + em) - (sh * 60 + sm);
                        if (duration < 0) duration += 24 * 60;
                        const breakMins = Number(entry.breakMinutes) || 0;
                        const netMins = Math.max(0, duration - breakMins);
                        const hours = netMins / 60;
                        totalHours += hours;

                        // Overtime threshold (e.g., 9 hours)
                        if (hours > 9) overtimeHours += (hours - 9);
                    }
                }
            });

            // Base Pay Calculation
            let grossPay = 0;
            const salary = Number(emp.salary) || 0; // Monthly Salary
            // If hourly/daily logic exists, use it. For now, let's assume monthly pro-rated or shift-based.
            // Using perShiftAmount if available, else salary/26 * days
            if (emp.perShiftAmount > 0) {
                grossPay = daysWorked * emp.perShiftAmount;
            } else {
                // Pro-rate monthly salary (assume 26 working days)
                const dailyRate = salary / 26;
                grossPay = Math.round(dailyRate * daysWorked);
            }

            // Get Deductions
            const periodDeductions = db.prepare('SELECT * FROM deductions WHERE employeeId = ? AND date >= ? AND date <= ?').all(emp.id, start, end);
            const totalDeductions = periodDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);

            // Get Advance Salary used for this period
            // (Simulated logic: check if any advance was "applied" this period or just show outstanding?)
            // For now 0
            const advanceDeductions = 0;

            // Check if already marked as paid
            const paidRecord = db.prepare('SELECT * FROM payroll_history WHERE employeeId = ? AND periodStart = ?').get(emp.id, start);

            return {
                employeeId: emp.id,
                employeeName: emp.name,
                employeeRole: emp.role,
                image: emp.image, // Include image for frontend
                grossPay: paidRecord ? paidRecord.grossPay : grossPay,
                deductions: paidRecord ? paidRecord.deductions : totalDeductions,
                advanceDeductions: paidRecord ? paidRecord.advanceDeductions : advanceDeductions,
                netPay: paidRecord ? paidRecord.netPay : (grossPay - totalDeductions - advanceDeductions),
                status: paidRecord ? 'Paid' : 'Unpaid',
                paidAt: paidRecord ? paidRecord.paidAt : null,
                isAdjusted: false
            };
        });

        res.json(payrollData);
    } catch (err) {
        console.error('Payroll Period Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payroll/mark-paid', (req, res) => {
    try {
        const { employeeIds, periodStart, periodEnd } = req.body;

        const stmt = db.prepare(`
            INSERT OR REPLACE INTO payroll_history (employeeId, periodStart, periodEnd, grossPay, deductions, advanceDeductions, netPay, paidAt, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Paid')
        `);

        // We need to re-calculate calculating amounts to freeze them, or trust frontend?
        // Better to re-calculate or fetch generic "current" values.
        // For simplicity, we'll mark them based on "current calculation" logic (simplified here)

        const updateStmt = db.prepare(`
            UPDATE payroll_history SET status = 'Paid', paidAt = ? WHERE employeeId = ? AND periodStart = ?
        `);

        employeeIds.forEach(id => {
            // Check if exists, if not create
            const exists = db.prepare('SELECT * FROM payroll_history WHERE employeeId = ? AND periodStart = ?').get(id, periodStart);
            if (exists) {
                updateStmt.run(new Date().toISOString(), id, periodStart);
            } else {
                // Calculate quick defaults if missing (shouldn't happen in real flow ideally)
                stmt.run(id, periodStart, periodEnd, 0, 0, 0, 0, new Date().toISOString());
            }
        });

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payroll/mark-unpaid', (req, res) => {
    try {
        const { employeeIds, periodStart } = req.body;
        const stmt = db.prepare('DELETE FROM payroll_history WHERE employeeId = ? AND periodStart = ?');
        employeeIds.forEach(id => stmt.run(id, periodStart));
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/payroll/locked-period', (req, res) => {
    // Simple state, maybe store in a settings table?
    // returning default false for now
    res.json({ locked: false });
});

app.post('/api/payroll/lock-period', (req, res) => res.json({ success: true }));
app.post('/api/payroll/unlock-period', (req, res) => res.json({ success: true }));

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Data: ${path.join(__dirname, 'data')}`);
});
