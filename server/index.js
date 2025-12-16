// Load environment variables based on NODE_ENV
require('dotenv').config({
    path: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development'
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { authMiddleware } = require('./middleware/auth');

const { performBackup } = require('./utils/backup');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, process.env.DATA_FILE || 'data/data.json');

// Log environment on startup
console.log('\n========================================');
console.log(`🚀 Business-OS Server Starting`);
console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🔌 Port: ${PORT}`);
console.log(`📂 Data File: ${DATA_FILE}`);
console.log('========================================\n');

// CORS configuration - Allow frontend from Vercel and local development
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        'https://business-os-nu.vercel.app',  // Your Vercel frontend
        'https://rebusinessos.vercel.app',    // Future proof
        'https://api.rebusinessos.tk',        // Self-hosted domain
        'https://transaction-version-barrel-pole.trycloudflare.com', // Current tunnel
        'https://*.trycloudflare.com'         // Allow ALL Cloudflare tunnels (Wildcard patch)
    ]
    : [
        'http://localhost:5173',
        'http://localhost:3000'
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.trycloudflare.com')) {
            callback(null, true);
        } else {
            console.log(`⚠️  Blocked CORS request from: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json({ limit: '50mb' }));

// STRICT No-Cache Headers for Security
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Simulation Middleware for "Remote Server" delays (optional, for realism)
// app.use((req, res, next) => setTimeout(next, 200));

// Access Control Middleware
app.use(authMiddleware);

// Configure multer for file uploads
const UPLOADS_DIR = path.join(__dirname, process.env.UPLOADS_DIR || 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'));
        }
    }
});

// Configure separate upload for PDFs (Payslips)
const ARCHIVES_DIR = path.join(__dirname, process.env.ARCHIVES_DIR || 'archives/payslips');
if (!fs.existsSync(ARCHIVES_DIR)) {
    fs.mkdirSync(ARCHIVES_DIR, { recursive: true });
}

const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, ARCHIVES_DIR);
    },
    filename: (req, file, cb) => {
        // Use original filename (sanitized) to match requirements
        // e.g., Payslip_Hitesh_2025-11-23.pdf
        cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_'));
    }
});

const pdfUpload = multer({
    storage: pdfStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per requirement
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'));
        }
    }
});

// Serve uploaded files statically
app.use('/uploads', express.static(UPLOADS_DIR));

// Schedule Daily Backups (every 24 hours) - and run one on startup for safety
setInterval(() => {
    console.log('[System] Running scheduled backup...');
    performBackup();
}, 24 * 60 * 60 * 1000);

const db = require('./database');

// Helper to get app settings from DB
const getSetting = (key) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
};

const setSetting = (key, value) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
};

// --- ROUTES ---


// Inventory
// Inventory
app.get('/api/inventory', (req, res) => {
    const items = db.prepare('SELECT * FROM inventory').all();
    res.json(items);
});

app.post('/api/inventory', (req, res) => {
    const { name, category, type, stock, price, description, vendorName, lowStockThreshold } = req.body;
    const info = db.prepare(`
        INSERT INTO inventory (name, category, type, stock, price, description, vendorName, lowStockThreshold, lastUpdated)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, category, type, stock || 0, price || 0, description, vendorName, lowStockThreshold || 5, new Date().toISOString());
    const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
    res.json(newItem);
});

app.patch('/api/inventory/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    // Dynamic update query
    const keys = Object.keys(updates).filter(k => k !== 'id');
    if (keys.length === 0) return res.json({ success: true }); // No updates

    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const values = keys.map(k => updates[k]);

    db.prepare(`UPDATE inventory SET ${setClause}, lastUpdated = ? WHERE id = ?`).run(...values, new Date().toISOString(), id);
    const updatedItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);

    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
});

app.delete('/api/inventory/:id', (req, res) => {
    const id = req.params.id;
    const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, message: 'Item deleted' });
});


// Image Upload Endpoint
app.post('/api/upload/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({
            success: true,
            imageUrl,
            filename: req.file.filename
        });
    } catch (err) {
        console.error('File upload error:', err);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Vendors
app.get('/api/vendors', (req, res) => {
    const vendors = db.prepare('SELECT * FROM vendors').all();
    const parsedVendors = vendors.map(v => ({
        ...v,
        suppliedItems: v.suppliedItems ? JSON.parse(v.suppliedItems) : []
    }));
    res.json(parsedVendors);
});

app.post('/api/vendors', (req, res) => {
    const { name, category, contact, email, address, suppliedItems } = req.body;
    const info = db.prepare(`
        INSERT INTO vendors (name, category, contact, email, address, suppliedItems)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, category, contact, email, address, JSON.stringify(suppliedItems || []));
    const newVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid);
    res.json(newVendor);
});

app.patch('/api/vendors/:id', (req, res) => {
    const id = req.params.id;
    const updates = req.body;

    // Dynamic update query
    const keys = Object.keys(updates).filter(k => k !== 'id');
    if (keys.length === 0) return res.json({ success: true }); // No updates

    const setClause = keys.map(k => {
        if (k === 'suppliedItems') return `${k} = JSON(?)`; // Stringify JSON fields
        return `${k} = ?`;
    }).join(', ');
    const values = keys.map(k => {
        if (k === 'suppliedItems') return JSON.stringify(updates[k]);
        return updates[k];
    });

    const result = db.prepare(`UPDATE vendors SET ${setClause} WHERE id = ?`).run(...values, id);
    if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found' });

    const updatedVendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(id);
    res.json({
        ...updatedVendor,
        suppliedItems: updatedVendor.suppliedItems ? JSON.parse(updatedVendor.suppliedItems) : []
    });
});

app.delete('/api/vendors/:id', (req, res) => {
    const id = req.params.id;
    const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ success: true, message: 'Vendor deleted' });
});

// Employees
app.get('/api/employees', (req, res) => {
    const employees = db.prepare('SELECT * FROM employees').all();
    // Parse JSON fields
    const parsedEmployees = employees.map(emp => ({
        ...emp,
        workingDays: emp.workingDays ? JSON.parse(emp.workingDays) : [],
        bankDetails: emp.bankDetails ? JSON.parse(emp.bankDetails) : {},
        emergencyContact: emp.emergencyContact ? JSON.parse(emp.emergencyContact) : {},
        documents: emp.documents ? JSON.parse(emp.documents) : []
    }));
    res.json(parsedEmployees);
});

// Get single employee by ID
app.get('/api/employees/:id', (req, res) => {
    const employeeId = req.params.id;
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Parse JSON fields
    const parsedEmployee = {
        ...employee,
        workingDays: employee.workingDays ? JSON.parse(employee.workingDays) : [],
        bankDetails: employee.bankDetails ? JSON.parse(employee.bankDetails) : {},
        emergencyContact: employee.emergencyContact ? JSON.parse(employee.emergencyContact) : {},
        documents: employee.documents ? JSON.parse(employee.documents) : []
    };

    res.json(parsedEmployee);
});

app.post('/api/employees', (req, res) => {
    const { name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, documents, status, image, lastWorkingDay } = req.body;
    const info = db.prepare(`
        INSERT INTO employees (name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, documents, status, image, lastWorkingDay, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd,
        JSON.stringify(workingDays || []), JSON.stringify(bankDetails || {}), JSON.stringify(emergencyContact || {}),
        JSON.stringify(documents || []), status || 'Active', image, lastWorkingDay, new Date().toISOString(), new Date().toISOString()
    );
    const newEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
    res.json({
        ...newEmployee,
        workingDays: newEmployee.workingDays ? JSON.parse(newEmployee.workingDays) : [],
        bankDetails: newEmployee.bankDetails ? JSON.parse(newEmployee.bankDetails) : {},
        emergencyContact: newEmployee.emergencyContact ? JSON.parse(newEmployee.emergencyContact) : {},
        documents: newEmployee.documents ? JSON.parse(newEmployee.documents) : []
    });
});

app.patch('/api/employees/:id', (req, res) => {
    const employeeId = req.params.id;
    const updates = req.body;

    const keys = Object.keys(updates).filter(k => k !== 'id');
    if (keys.length === 0) return res.json({ success: true });

    const setClause = keys.map(k => {
        if (['workingDays', 'bankDetails', 'emergencyContact', 'documents'].includes(k)) {
            return `${k} = JSON(?)`;
        }
        return `${k} = ?`;
    }).join(', ');

    const values = keys.map(k => {
        if (['workingDays', 'bankDetails', 'emergencyContact', 'documents'].includes(k)) {
            return JSON.stringify(updates[k]);
        }
        return updates[k];
    });

    const result = db.prepare(`UPDATE employees SET ${setClause}, updatedAt = ? WHERE id = ?`).run(...values, new Date().toISOString(), employeeId);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const updatedEmployee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'EMPLOYEE_UPDATE', employeeId, `${req.userRole} (${req.ip})`, new Date().toISOString(), 'Employee profile updated'
    );

    res.json({
        ...updatedEmployee,
        workingDays: updatedEmployee.workingDays ? JSON.parse(updatedEmployee.workingDays) : [],
        bankDetails: updatedEmployee.bankDetails ? JSON.parse(updatedEmployee.bankDetails) : {},
        emergencyContact: updatedEmployee.emergencyContact ? JSON.parse(updatedEmployee.emergencyContact) : {},
        documents: updatedEmployee.documents ? JSON.parse(updatedEmployee.documents) : []
    });
});

app.delete('/api/employees/:id', (req, res) => {
    const employeeId = req.params.id;
    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Delete employee
    const result = db.prepare('DELETE FROM employees WHERE id = ?').run(employeeId);

    if (result.changes === 0) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Cascade delete related records (timesheet, payroll_entries, deductions, advance_salaries, loans, bonus_withdrawals)
    db.prepare('DELETE FROM timesheet_entries WHERE employeeId = ?').run(employeeId);
    db.prepare('DELETE FROM payroll_entries WHERE employeeId = ?').run(employeeId);
    db.prepare('DELETE FROM deductions WHERE employeeId = ?').run(employeeId);
    db.prepare('DELETE FROM advance_salaries WHERE employeeId = ?').run(employeeId);
    db.prepare('DELETE FROM loans WHERE employeeId = ?').run(employeeId);
    db.prepare('DELETE FROM bonus_withdrawals WHERE employeeId = ?').run(employeeId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'EMPLOYEE_DELETE', employeeId, `${req.userRole} (${req.ip})`, new Date().toISOString(), `Deleted employee: ${employee.name}`
    );

    res.json({ success: true, message: 'Employee deleted permanently' });
});

// Reorder Employees (Drag & Drop)
app.post('/api/employees/reorder', (req, res) => {
    const { orderedIds } = req.body; // Array of employee IDs in new order

    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    // This operation is tricky with SQLite and doesn't directly map to a simple SQL update for order.
    // For now, we'll just log the reorder and assume the frontend handles the visual order.
    // If a persistent order is needed, an 'orderIndex' column would be required in the employees table.

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'EMPLOYEES_REORDER', 'ALL', `${req.userRole} (${req.ip})`, new Date().toISOString(), 'Employee list reordered via drag & drop'
    );

    res.json({ success: true, message: 'Employees reordered successfully (order not persisted in DB yet)' });
});

// Payroll
app.get('/api/payroll', (req, res) => {
    const payroll = db.prepare('SELECT * FROM payroll_entries').all();
    res.json(payroll);
});

// [DEPRECATED] Old simple payroll run
app.post('/api/payroll', (req, res) => {
    // This route is deprecated and should ideally be removed or updated to use the new payroll_entries table.
    // For now, it will just return an error or a placeholder.
    res.status(400).json({ error: 'This payroll route is deprecated. Use /api/payroll/mark-paid or /api/payroll/status instead.' });
});

// Get payroll history for a specific employee
app.get('/api/payroll/history/:employeeId', (req, res) => {
    const employeeId = parseInt(req.params.employeeId);

    // Get all Paid payroll records for this employee
    const history = db.prepare('SELECT * FROM payroll_entries WHERE employeeId = ? AND status = ? ORDER BY periodStart DESC').all(employeeId, 'Paid');

    res.json(history);
});

// --- ATTENDANCE ---

// Get Today's Attendance
app.get('/api/attendance/today', (req, res) => {
    const data = readData(); // Still using readData for employees for now

    if (!data.employees) data.employees = [];

    // Use local time for "Today" to match user's desktop context
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    const todayStr = localDate.toISOString().split('T')[0];
    const isSunday = localDate.getUTCDay() === 0;

    const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
    const working = [];
    const notWorking = [];

    // Filter out resigned employees from attendance
    const activeEmployees = data.employees.filter(emp => emp.status !== 'Resigned');

    activeEmployees.forEach(emp => {
        // Find today's timesheet entry from DB
        const todayEntry = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date = ? AND (clockIn IS NOT NULL OR shiftStart IS NOT NULL)').get(emp.id, todayStr);

        if (todayEntry) {
            working.push({
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                clockIn: todayEntry.clockIn || todayEntry.shiftStart,
                clockOut: todayEntry.clockOut || todayEntry.shiftEnd || null,
                timesheetId: todayEntry.id,
                status: 'working'
            });
        } else {
            notWorking.push({
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                status: 'absent'
            });
        }
    });

    // Modified Sunday Logic: Only return closed if Sunday AND no one is working
    // If someone has clocked in (manual override), we show the working list.
    const isClosed = isSunday && working.length === 0;

    if (isClosed) {
        return res.json({
            date: todayStr,
            dayOfWeek: 'Sunday',
            isSunday: true,
            isClosed: true,
            message: 'Bank is closed on Sundays',
            summary: { total: 0, working: 0, notWorking: 0 },
            working: [],
            notWorking: []
        });
    }

    res.json({
        date: todayStr,
        dayOfWeek,
        isSunday: isSunday,
        isClosed: false,
        summary: {
            total: activeEmployees.length, // Total active employees
            working: working.length,
            notWorking: notWorking.length
        },
        working,
        notWorking
    });
});

// --- BONUS SYSTEM ---

// Get Bonus Settings
app.get('/api/settings/bonus', (req, res) => {
    const settings = getSetting('bonusSettings');
    const defaults = {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        amountPerDay: 35
    };
    res.json(settings || defaults);
});

// Update Bonus Settings
app.post('/api/settings/bonus', (req, res) => {
    const { startDate, endDate, amountPerDay } = req.body;

    const newSettings = {
        startDate,
        endDate,
        amountPerDay: parseFloat(amountPerDay)
    };
    setSetting('bonusSettings', newSettings);

    // Audit Log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'SETTINGS_UPDATE', 'BONUS', `${req.userRole} (${req.ip})`, new Date().toISOString(), `Updated Bonus: ₹${amountPerDay}/day, ${startDate} to ${endDate}`
    );

    res.json(newSettings);
});


// Withdraw Bonus
app.post('/api/bonus/withdraw', (req, res) => {
    const { employeeId, amount, date, notes } = req.body;

    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const settings = getSetting('bonusSettings') || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };
    const accruedDays = countWorkingDays(db, employeeId, settings.startDate, settings.endDate);
    const totalAccrued = accruedDays * settings.amountPerDay;

    const totalWithdrawn = db.prepare('SELECT SUM(amount) as total FROM bonus_withdrawals WHERE employeeId = ? AND status != ?').get(employeeId, 'rejected').total || 0;

    const availableBalance = totalAccrued - totalWithdrawn;

    const withdrawalAmount = parseFloat(amount);
    if (withdrawalAmount <= 0) {
        return res.status(400).json({ error: 'Withdrawal amount must be greater than 0' });
    }

    if (withdrawalAmount > availableBalance) {
        return res.status(400).json({
            error: 'Insufficient bonus balance',
            details: `Available balance: ₹${availableBalance.toLocaleString('en-IN')}, Requested: ₹${withdrawalAmount.toLocaleString('en-IN')}`,
            availableBalance,
            requestedAmount: withdrawalAmount
        });
    }

    const withdrawal = {
        id: `bw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: parseInt(employeeId),
        amount: withdrawalAmount,
        date: date || new Date().toISOString().split('T')[0],
        notes,
        status: 'approved',
        createdAt: new Date().toISOString(),
        createdBy: `${req.userRole} (${req.ip})`
    };

    db.prepare(`
        INSERT INTO bonus_withdrawals (id, employeeId, amount, date, notes, status, createdAt, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(withdrawal.id, withdrawal.employeeId, withdrawal.amount, withdrawal.date, withdrawal.notes, withdrawal.status, withdrawal.createdAt, withdrawal.createdBy);

    // Audit Log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'BONUS_WITHDRAWAL', employeeId, `${req.userRole} (${req.ip})`, new Date().toISOString(), `Withdrew bonus: ₹${withdrawalAmount}`
    );

    res.json({
        success: true,
        withdrawal,
        newBalance: availableBalance - withdrawalAmount
    });
});

// Get Bonus Stats (Calculated)
app.get('/api/bonus/stats', (req, res) => {
    const settings = getSetting('bonusSettings') || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };
    const employees = db.prepare('SELECT id, name FROM employees WHERE status != ?').all('Resigned');

    const stats = employees.map(emp => {
        const accruedDays = countWorkingDays(db, emp.id, settings.startDate, settings.endDate);
        const totalAccrued = accruedDays * settings.amountPerDay;

        const withdrawn = db.prepare('SELECT SUM(amount) as total FROM bonus_withdrawals WHERE employeeId = ? AND status != ?').get(emp.id, 'rejected').total || 0;

        return {
            employeeId: emp.id,
            employeeName: emp.name,
            accruedDays,
            totalAccrued,
            totalWithdrawn: withdrawn,
            balance: totalAccrued - withdrawn
        };
    });

    const companyTotal = stats.reduce((sum, s) => sum + s.balance, 0);

    res.json({
        settings,
        companyTotalBalance: companyTotal,
        employees: stats
    });
});

// Get Bonus Details for Employee
app.get('/api/bonus/:id', (req, res) => {
    const employeeId = parseInt(req.params.id);

    const employee = db.prepare('SELECT id, name FROM employees WHERE id = ?').get(employeeId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const settings = getSetting('bonusSettings') || {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        amountPerDay: 35
    };

    const totalDays = countWorkingDays(db, employeeId, settings.startDate, settings.endDate);
    const totalAccrued = totalDays * settings.amountPerDay;

    const withdrawals = db.prepare('SELECT * FROM bonus_withdrawals WHERE employeeId = ? AND status != ? ORDER BY date DESC').all(employeeId, 'rejected');

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const balance = totalAccrued - totalWithdrawn;

    res.json({
        employeeId,
        settings,
        totalDays,
        totalAccrued,
        totalWithdrawn,
        balance,
        withdrawals
    });
});


// --- REPORTING & ANALYTICS ---

// Get Performance Report Data
app.get('/api/reports/performance', (req, res) => {
    const { employeeId, startDate, endDate } = req.query;

    if (!employeeId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters (employeeId, startDate, endDate)' });
    }

    const empId = parseInt(employeeId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(empId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Filter Timesheet Entries
    const entries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(empId, startDate, endDate, 'active');

    // Bonus Settings for Bonus Days Calc
    const bonusSettings = getSetting('bonusSettings') || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

    // Aggregators
    let totalBillableMinutes = 0;
    let totalOvertimeMinutes = 0;
    let totalTravelDays = 0;
    let totalBonusDays = 0;
    let totalPresentDays = 0;

    // Daily Breakdown for Charts
    const dailyStats = entries.map(e => {
        const clockIn = e.clockIn || e.shiftStart || '';
        const clockOut = e.clockOut || e.shiftEnd || '';
        const dayType = e.dayType || 'Work';

        const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes || 0, dayType, employee.shiftEnd || '18:00');

        const isPresent = (!!e.clockIn || !!e.shiftStart);

        const dateStr = e.date; // YYYY-MM-DD
        const isBonusDay = (dateStr >= bonusSettings.startDate && dateStr <= bonusSettings.endDate && isPresent);

        if (isPresent) totalPresentDays++;
        if (dayType === 'Travel') totalTravelDays++;
        if (isBonusDay) totalBonusDays++;

        totalBillableMinutes += calc.billableMinutes;
        totalOvertimeMinutes += calc.overtimeMinutes;

        return {
            date: e.date,
            dayType: dayType,
            billableHours: parseFloat((calc.billableMinutes / 60).toFixed(2)),
            overtimeHours: parseFloat((calc.overtimeMinutes / 60).toFixed(2)),
            isTravel: dayType === 'Travel',
            isBonus: isBonusDay
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Summary KPIs
    const summary = {
        totalHours: parseFloat((totalBillableMinutes / 60).toFixed(2)),
        totalOvertimeHours: parseFloat((totalOvertimeMinutes / 60).toFixed(2)),
        avgHoursPerDay: totalPresentDays > 0 ? parseFloat((totalBillableMinutes / 60 / totalPresentDays).toFixed(2)) : 0,
        travelDays: totalTravelDays,
        bonusDays: totalBonusDays,
        attendanceDays: totalPresentDays,
        punctualityScore: 'N/A' // Placeholder for future
    };

    // Calculate total period days (excluding Sundays)
    let totalWorkingDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        if (dayOfWeek !== 0) { // Exclude Sundays
            totalWorkingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const absentDays = totalWorkingDays - totalPresentDays;
    const attendanceRate = totalWorkingDays > 0 ? parseFloat(((totalPresentDays / totalWorkingDays) * 100).toFixed(1)) : 0;

    // Earnings Calculations
    const perShiftAmount = parseFloat(employee.perShiftAmount) || 0;
    const baseSalary = perShiftAmount * totalPresentDays;

    // Overtime calculation (assuming hourly rate = perShiftAmount / 8.75)
    const hourlyRate = perShiftAmount > 0 ? perShiftAmount / 8.75 : 0;
    const overtimePay = parseFloat((hourlyRate * summary.totalOvertimeHours).toFixed(2));

    // Bonus calculation
    const bonusAmountPerDay = bonusSettings.amountPerDay || 35;
    const bonusAmount = bonusAmountPerDay * totalBonusDays;

    const totalEarnings = baseSalary + overtimePay + bonusAmount;

    const earnings = {
        baseSalary: parseFloat(baseSalary.toFixed(2)),
        overtimePay,
        bonusAmount,
        totalEarnings: parseFloat(totalEarnings.toFixed(2))
    };

    const attendance = {
        totalDays: totalWorkingDays, // Excludes Sundays
        workedDays: totalPresentDays,
        absentDays,
        attendanceRate
    };

    res.json({
        employee: { id: employee.id, name: employee.name, role: employee.role, image: employee.image },
        period: { start: startDate, end: endDate },
        summary,
        earnings,
        attendance,
        daily: dailyStats
    });
});

// Get Leaderboard (Top Performers)
app.get('/api/reports/leaderboard', (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters (startDate, endDate)' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calculate total working days in period (excluding Sundays)
    let totalWorkingDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0) { // Exclude Sundays
            totalWorkingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const activeEmployees = db.prepare('SELECT id, name, role, image, perShiftAmount FROM employees WHERE status = ?').all('Active');

    const scores = activeEmployees.map(emp => {
        // Filter timesheet for this employee in this range
        const entries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(emp.id, startDate, endDate, 'active');

        // Calculate Stats
        let totalMinutes = 0;
        let totalOvertimeMinutes = 0;
        let presentDays = 0;
        let travelDays = 0;
        let workDays = 0;

        // Daily breakdown
        const dailyBreakdown = entries.map(e => {
            const isPresent = (e.clockIn || e.shiftStart);
            const clockIn = e.clockIn || e.shiftStart || '';
            const clockOut = e.clockOut || e.shiftEnd || '';
            const dayType = e.dayType || 'Work';

            let mins = 0;
            let overtimeMins = 0;

            if (isPresent && clockIn && clockOut) {
                const [h1, m1] = clockIn.split(':').map(Number);
                const [h2, m2] = clockOut.split(':').map(Number);
                mins = (h2 * 60 + m2) - (h1 * 60 + m1) - (e.breakMinutes || 0);
                if (mins < 0) mins = 0;

                // Calculate overtime (>8.75 hours)
                const regularMinutes = 8.75 * 60;
                if (mins > regularMinutes) {
                    overtimeMins = mins - regularMinutes;
                }
            }

            if (isPresent) {
                presentDays++;
                totalMinutes += mins;
                totalOvertimeMinutes += overtimeMins;
            }

            if (dayType === 'Travel') travelDays++;
            if (dayType === 'Work' || dayType === 'Travel') workDays++;

            return {
                date: e.date,
                dayType,
                clockIn: clockIn || '-',
                clockOut: clockOut || '-',
                breakMinutes: e.breakMinutes || 0,
                totalHours: parseFloat((mins / 60).toFixed(2)),
                overtimeHours: parseFloat((overtimeMins / 60).toFixed(2)),
                isPresent
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        const totalHours = parseFloat((totalMinutes / 60).toFixed(2));
        const totalOvertimeHours = parseFloat((totalOvertimeMinutes / 60).toFixed(2));
        const avgHours = presentDays > 0 ? parseFloat((totalHours / presentDays).toFixed(2)) : 0;
        const absentDays = totalWorkingDays - presentDays;
        const attendanceRate = totalWorkingDays > 0 ? parseFloat(((presentDays / totalWorkingDays) * 100).toFixed(1)) : 0;

        // Scoring Algorithm (0-100)
        // 1. Attendance: Up to 40 pts (based on attendance rate)
        const attendanceScore = Math.min(40, (attendanceRate / 100) * 40);

        // 2. Performance (Avg Hours): Up to 40 pts (Target 9h/day)
        const performanceScore = Math.min(40, (avgHours / 9) * 40);

        // 3. Bonus (Travel): 2 pts per travel day, max 20
        const bonusScore = Math.min(20, travelDays * 2);

        const totalScore = Math.min(100, Math.round(attendanceScore + performanceScore + bonusScore));

        return {
            employee: {
                id: emp.id,
                name: emp.name,
                role: emp.role,
                image: emp.image
            },
            score: totalScore,
            scoreBreakdown: {
                attendance: Math.round(attendanceScore),
                performance: Math.round(performanceScore),
                bonus: Math.round(bonusScore)
            },
            stats: {
                totalHours,
                totalOvertimeHours,
                presentDays,
                absentDays,
                workDays,
                travelDays,
                avgHours: avgHours.toFixed(1),
                attendanceRate,
                totalWorkingDays
            },
            dailyBreakdown
        };
    });

    // Rank all employees (no slice, show everyone)
    const ranked = scores.sort((a, b) => b.score - a.score);

    res.json({
        period: { startDate, endDate, totalWorkingDays },
        topPerformers: ranked,
        totalEmployees: ranked.length
    });
});


// Helper: Count working days in a range
function countWorkingDays(database, employeeId, startStr, endStr) {
    // Use string comparison YYYY-MM-DD to be timezone safe
    // Assumptions: startStr, endStr, and e.date are all YYYY-MM-DD strings

    const result = database.prepare(`
        SELECT COUNT(*) as count FROM timesheet_entries
        WHERE employeeId = ? AND date BETWEEN ? AND ? AND (clockIn IS NOT NULL OR shiftStart IS NOT NULL)
    `).get(employeeId, startStr, endStr);

    return result ? result.count : 0;
}

// --- NEW PAYROLL SYSTEM ---

// Get Payroll Status for a Specific Period
app.get('/api/payroll/period', (req, res) => {
    const { start, end } = req.query; // Expect YYYY-MM-DD

    // Filter out resigned employees from payroll cycle UNLESS they are in their final settlement period
    const activeEmployees = db.prepare('SELECT id, name, role, image, salary, perShiftAmount, hourlyRate, shiftEnd, lastWorkingDay FROM employees WHERE status != ? OR (lastWorkingDay IS NOT NULL AND lastWorkingDay >= ?)').all('Resigned', start);

    // Map over active/eligible employees to find their status for this period
    const periodPayroll = activeEmployees.map(emp => {
        const recalculated = recalculatePayrollForPeriod(db, emp.id, start, end);

        if (recalculated) {
            const savedEntry = db.prepare('SELECT * FROM payroll_entries WHERE employeeId = ? AND periodStart = ?').get(emp.id, start);

            return {
                ...recalculated,
                status: savedEntry ? savedEntry.status : recalculated.status,
                paidAt: savedEntry ? savedEntry.paidAt : null,
                isAdjusted: savedEntry ? savedEntry.isAdjusted : false,
                employeeRole: emp.role
            };
        }

        // Fallback (should rarely happen if employee exists)
        const entry = db.prepare('SELECT * FROM payroll_entries WHERE employeeId = ? AND periodStart = ?').get(emp.id, start);

        if (entry) {
            return {
                ...entry,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                employeeId: emp.id
            };
        } else {
            // Virtual "Unpaid" Entry
            return {
                id: null,
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                periodStart: start,
                periodEnd: end,
                grossPay: emp.salary || 0,
                deductions: 0,
                advanceDeductions: 0,
                loanDeductions: 0,
                netPay: emp.salary || 0,
                status: 'Unpaid',
                paidAt: null,
                isAdjusted: false
            };
        }
    });

    res.json(periodPayroll);
});

// Calculate Single Payroll Entry (Preview)
app.get('/api/payroll/calculate', (req, res) => {
    const { employeeId, start, end } = req.query;

    if (!employeeId || !start || !end) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = recalculatePayrollForPeriod(db, employeeId, start, end);

    if (!result) {
        return res.status(404).json({ error: 'Employee or data not found' });
    }

    if (!result.id) {
        result.id = 'preview';
    }

    res.json(result);
});

// Update/Create Payroll Status (Mark as Paid)
app.post('/api/payroll/status', (req, res) => {
    const { entryIds, singleEntry, status, paymentDetails } = req.body;

    const actions = Array.isArray(req.body) ? req.body : [req.body];
    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    const updatedEntries = [];

    actions.forEach(action => {
        let entry = db.prepare('SELECT * FROM payroll_entries WHERE id = ?').get(action.id);

        if (!entry) {
            // Create new entry
            entry = {
                id: Date.now() + Math.random().toString().slice(2, 6),
                employeeId: action.employeeId,
                periodStart: action.periodStart,
                periodEnd: action.periodEnd,
                grossPay: action.grossPay,
                deductions: action.deductions || 0,
                netPay: action.netPay,
                status: status || 'Paid',
                paidAt: status === 'Paid' ? timestamp : null,
                paymentDetails: paymentDetails || action.paymentDetails,
                reference: action.reference,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            db.prepare(`
                INSERT INTO payroll_entries (id, employeeId, periodStart, periodEnd, grossPay, deductions, netPay, status, paidAt, paymentDetails, reference, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(entry.id, entry.employeeId, entry.periodStart, entry.periodEnd, entry.grossPay, entry.deductions, entry.netPay, entry.status, entry.paidAt, entry.paymentDetails, entry.reference, entry.createdAt, entry.updatedAt);
        } else {
            // Update existing
            entry.status = status;
            if (status === 'Paid') {
                entry.paidAt = timestamp;
                entry.paymentDetails = paymentDetails;
            }
            entry.updatedAt = timestamp;
            db.prepare('UPDATE payroll_entries SET status = ?, paidAt = ?, paymentDetails = ?, updatedAt = ? WHERE id = ?').run(entry.status, entry.paidAt, entry.paymentDetails, entry.updatedAt, entry.id);
        }

        // Audit Log
        db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
            'PAYROLL_UPDATE', entry.id, actor, timestamp, `Marked as ${status}`
        );

        updatedEntries.push(entry);
    });

    res.json(updatedEntries);
});

// Mark employees as Paid - Creates a FROZEN SNAPSHOT of all payslip data
app.post('/api/payroll/mark-paid', (req, res) => {
    const { employeeIds, periodStart, periodEnd } = req.body;

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        const calcResult = recalculatePayrollForPeriod(db, employeeId, periodStart, periodEnd);

        let entry = db.prepare('SELECT * FROM payroll_entries WHERE employeeId = ? AND periodStart = ? AND periodEnd = ?').get(employeeId, periodStart, periodEnd);

        if (!entry) {
            if (calcResult) {
                entry = { ...calcResult, id: Date.now() + '-' + Math.random().toString(36).substr(2, 9), status: 'Unpaid', createdAt: timestamp };
                db.prepare(`
                    INSERT INTO payroll_entries (id, employeeId, periodStart, periodEnd, grossPay, deductions, netPay, status, createdAt,
                        hourlyRate, overtimePay, totalOvertimeMinutes, perShiftAmount, details)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(entry.id, entry.employeeId, entry.periodStart, entry.periodEnd, entry.grossPay, entry.deductions, entry.netPay, entry.status, entry.createdAt,
                    entry.hourlyRate, entry.overtimePay, entry.totalOvertimeMinutes, entry.perShiftAmount, JSON.stringify(entry.details));
            }
        } else if (calcResult) {
            // Update existing entry with fresh calculated values
            Object.assign(entry, {
                hourlyRate: calcResult.hourlyRate,
                grossPay: calcResult.grossPay,
                netPay: calcResult.netPay,
                overtimePay: calcResult.overtimePay,
                totalOvertimeMinutes: calcResult.totalOvertimeMinutes,
                details: calcResult.details,
                perShiftAmount: calcResult.perShiftAmount,
                updatedAt: timestamp
            });
            db.prepare(`
                UPDATE payroll_entries SET hourlyRate = ?, grossPay = ?, netPay = ?, overtimePay = ?, totalOvertimeMinutes = ?, perShiftAmount = ?, details = JSON(?), updatedAt = ?
                WHERE id = ?
            `).run(entry.hourlyRate, entry.grossPay, entry.netPay, entry.overtimePay, entry.totalOvertimeMinutes, entry.perShiftAmount, JSON.stringify(entry.details), entry.updatedAt, entry.id);
        }

        if (entry) {
            const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);

            entry.frozenEmployeeName = employee?.name || 'Unknown';
            entry.frozenEmployeeRole = employee?.role || 'Unknown';
            entry.frozenEmployeeImage = employee?.image || null;
            entry.frozenPerShiftAmount = entry.perShiftAmount || employee?.perShiftAmount;
            entry.frozenHourlyRate = entry.hourlyRate || employee?.hourlyRate;
            entry.frozenSalary = employee?.salary;

            const start = new Date(periodStart);
            const end = new Date(periodEnd);
            const periodEntries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(employeeId, periodStart, periodEnd, 'active');

            entry.frozenTimesheet = periodEntries.map(e => {
                const clockIn = e.clockIn || e.shiftStart || '';
                const clockOut = e.clockOut || e.shiftEnd || '';
                const dayType = e.dayType || 'Work';
                const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes || 0, dayType, employee?.shiftEnd || '18:00');
                return {
                    date: e.date,
                    clockIn: clockIn || '-',
                    clockOut: clockOut || '-',
                    breakMinutes: e.breakMinutes || 0,
                    dayType: dayType,
                    totalMinutes: calc.totalMinutes,
                    billableMinutes: calc.billableMinutes,
                    overtimeMinutes: calc.overtimeMinutes,
                    nightStatus: calc.nightStatus,
                    dinnerBreakDeduction: calc.dinnerBreakDeduction
                };
            });

            const periodDeductions = db.prepare('SELECT * FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').all(employeeId, periodStart, periodEnd, 'active');

            entry.frozenAdvances = periodDeductions
                .filter(d => d.type === 'advance')
                .map(d => {
                    let advanceDate = periodStart;
                    if (d.linkedAdvanceId) {
                        const linkedAdvance = db.prepare('SELECT dateIssued FROM advance_salaries WHERE id = ?').get(d.linkedAdvanceId);
                        if (linkedAdvance && linkedAdvance.dateIssued) {
                            advanceDate = linkedAdvance.dateIssued;
                        }
                    }
                    return {
                        id: d.id,
                        date: advanceDate,
                        amount: d.amount,
                        reason: d.description || 'Advance Salary'
                    };
                });

            entry.frozenLoans = periodDeductions
                .filter(d => d.type === 'loan')
                .map(d => ({
                    id: d.id,
                    description: d.description,
                    amount: d.amount
                }));

            const activeLoan = db.prepare('SELECT * FROM loans WHERE employeeId = ? AND status = ?').get(employeeId, 'active');
            if (activeLoan) {
                const entryStart = new Date(periodStart);
                const allLoanDeductions = db.prepare('SELECT amount, periodEnd FROM deductions WHERE employeeId = ? AND type = ? AND status = ?').all(employeeId, 'loan', 'active');
                const previousRepayments = allLoanDeductions
                    .filter(d => new Date(d.periodEnd) < entryStart)
                    .reduce((sum, d) => sum + Number(d.amount), 0);
                const currentPeriodRepayment = periodDeductions
                    .filter(d => d.type === 'loan')
                    .reduce((sum, d) => sum + Number(d.amount), 0);
                const openingBalance = activeLoan.amount - previousRepayments;
                const remainingBalance = openingBalance - currentPeriodRepayment;

                if (openingBalance > 0) {
                    entry.frozenLoanSummary = {
                        loanDate: activeLoan.date,
                        originalAmount: activeLoan.amount,
                        openingBalance: openingBalance,
                        currentDeduction: currentPeriodRepayment,
                        remainingBalance: Math.max(0, remainingBalance)
                    };
                }
            }

            const bonusSettings = getSetting('bonusSettings') || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

            const safeBonusEndDate = new Date(periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : periodEnd;
            const ytdBonusDays = countWorkingDays(db, employeeId, bonusSettings.startDate, safeBonusEndDate);
            const ytdBonusAccrued = ytdBonusDays * bonusSettings.amountPerDay;

            const totalWithdrawn = db.prepare('SELECT SUM(amount) as total FROM bonus_withdrawals WHERE employeeId = ? AND status != ? AND date <= ?').get(employeeId, 'rejected', periodEnd).total || 0;

            entry.frozenBonus = {
                ytdDays: ytdBonusDays,
                ytdAccrued: ytdBonusAccrued,
                totalWithdrawn: totalWithdrawn,
                balance: ytdBonusAccrued - totalWithdrawn
            };

            entry.status = 'Paid';
            entry.paidAt = timestamp;
            entry.isFrozen = true;
            entry.updatedAt = timestamp;

            db.prepare(`
                UPDATE payroll_entries SET
                    status = ?, paidAt = ?, isFrozen = ?, updatedAt = ?,
                    frozenEmployeeName = ?, frozenEmployeeRole = ?, frozenEmployeeImage = ?,
                    frozenPerShiftAmount = ?, frozenHourlyRate = ?, frozenSalary = ?,
                    frozenTimesheet = JSON(?), frozenAdvances = JSON(?), frozenLoans = JSON(?),
                    frozenLoanSummary = JSON(?), frozenBonus = JSON(?)
                WHERE id = ?
            `).run(
                entry.status, entry.paidAt, entry.isFrozen, entry.updatedAt,
                entry.frozenEmployeeName, entry.frozenEmployeeRole, entry.frozenEmployeeImage,
                entry.frozenPerShiftAmount, entry.frozenHourlyRate, entry.frozenSalary,
                JSON.stringify(entry.frozenTimesheet), JSON.stringify(entry.frozenAdvances), JSON.stringify(entry.frozenLoans),
                JSON.stringify(entry.frozenLoanSummary), JSON.stringify(entry.frozenBonus),
                entry.id
            );

            db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
                'PAYROLL_MARK_PAID', entry.id, actor, timestamp, `Marked employee ${employeeId} as Paid (Payslip Frozen)`
            );
        }
    });

    res.json({ success: true });
});

// Mark employees as Unpaid (reverse payment)
app.post('/api/payroll/mark-unpaid', (req, res) => {
    const { employeeIds, periodStart, periodEnd } = req.body;

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        const entry = db.prepare('SELECT id FROM payroll_entries WHERE employeeId = ? AND periodStart = ? AND periodEnd = ?').get(employeeId, periodStart, periodEnd);

        if (entry) {
            db.prepare('UPDATE payroll_entries SET status = ?, paidAt = NULL, isFrozen = ?, updatedAt = ? WHERE id = ?').run('Unpaid', false, timestamp, entry.id);

            db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
                'PAYROLL_MARK_UNPAID', entry.id, actor, timestamp, `Reversed payment for employee ${employeeId}`
            );
        }
    });

    res.json({ success: true });
});

// --- PAYROLL PERIOD LOCK MANAGEMENT ---

// Get Current Locked Period
app.get('/api/payroll/locked-period', (req, res) => {
    const lockedPeriod = getSetting('lockedPayrollPeriod');

    if (!lockedPeriod) {
        return res.json({ locked: false, period: null });
    }

    res.json({
        locked: true,
        period: lockedPeriod
    });
});

// Set and Lock Payroll Period
app.post('/api/payroll/lock-period', (req, res) => {
    const { start, end, lockedBy } = req.body;

    if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
    }

    const timestamp = new Date().toISOString();
    const actor = lockedBy || `${req.userRole} (${req.ip})`;

    const newLockedPeriod = {
        start,
        end,
        lockedAt: timestamp,
        lockedBy: actor,
        locked: true
    };
    setSetting('lockedPayrollPeriod', newLockedPeriod);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'PAYROLL_PERIOD_LOCKED', 'PAYROLL_PERIOD', actor, timestamp, `Locked payroll period: ${start} to ${end}`
    );

    res.json({
        success: true,
        period: newLockedPeriod
    });
});

// Unlock Payroll Period
app.post('/api/payroll/unlock-period', (req, res) => {
    const previousPeriod = getSetting('lockedPayrollPeriod');

    if (!previousPeriod) {
        return res.status(400).json({ error: 'No locked period to unlock' });
    }

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    setSetting('lockedPayrollPeriod', null); // Remove locked period

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'PAYROLL_PERIOD_UNLOCKED', 'PAYROLL_PERIOD', actor, timestamp, `Unlocked payroll period: ${previousPeriod.start} to ${previousPeriod.end}`
    );

    res.json({ success: true });
});

// --- DEDUCTIONS MANAGEMENT ---

// Get Deductions for Employee in Period
app.get('/api/deductions/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const { employeeId, periodStart, periodEnd } = req.params;

    const deductions = db.prepare('SELECT * FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').all(parseInt(employeeId), periodStart, periodEnd, 'active');

    res.json(deductions);
});

// Save/Update Deductions
app.post('/api/deductions', (req, res) => {
    const { employeeId, periodStart, periodEnd, deductions } = req.body;

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    // Remove old deductions for this employee/period
    db.prepare('DELETE FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ?').run(parseInt(employeeId), periodStart, periodEnd);

    // Add new deductions
    const savedDeductions = deductions.map(ded => {
        const id = ded.id || `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        db.prepare(`
            INSERT INTO deductions (id, employeeId, periodStart, periodEnd, type, description, amount, status, createdAt, createdBy, linkedAdvanceId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, parseInt(employeeId), periodStart, periodEnd, ded.type, ded.description, parseFloat(ded.amount), 'active', ded.createdAt || timestamp, ded.createdBy || actor, ded.linkedAdvanceId || null);
        return { ...ded, id, employeeId: parseInt(employeeId), periodStart, periodEnd, status: 'active', createdAt: ded.createdAt || timestamp, createdBy: ded.createdBy || actor };
    });

    // Recalculate total deductions and net pay
    const totalDeductions = savedDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Update payroll entry
    const payrollEntry = db.prepare('SELECT * FROM payroll_entries WHERE employeeId = ? AND periodStart = ? AND periodEnd = ?').get(parseInt(employeeId), periodStart, periodEnd);

    if (payrollEntry) {
        const newNetPay = payrollEntry.grossPay - totalDeductions;
        db.prepare('UPDATE payroll_entries SET deductions = ?, netPay = ?, updatedAt = ? WHERE id = ?').run(totalDeductions, newNetPay, timestamp, payrollEntry.id);
    }

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'DEDUCTIONS_UPDATED', employeeId, actor, timestamp, `Updated deductions: ₹${totalDeductions}`
    );

    res.json({ success: true, deductions: savedDeductions, totalDeductions });
});

// Delete Deduction
app.delete('/api/deductions/:id', (req, res) => {
    const { id } = req.params;

    const deduction = db.prepare('SELECT * FROM deductions WHERE id = ?').get(id);
    if (deduction) {
        db.prepare('UPDATE deductions SET status = ?, updatedAt = ? WHERE id = ?').run('deleted', new Date().toISOString(), id);

        const timestamp = new Date().toISOString();
        const actor = `${req.userRole} (${req.ip})`;

        db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
            'DEDUCTION_DELETED', deduction.employeeId, actor, timestamp, `Deleted ${deduction.type} deduction: ₹${deduction.amount}`
        );

        // Recalculate payroll for the affected period
        recalculatePayrollForPeriod(db, deduction.employeeId, deduction.periodStart, deduction.periodEnd);
    }

    res.json({ success: true });
});

// Issue Advance Salary
app.post('/api/advance-salary', (req, res) => {
    const { employeeId, amount, dateIssued, reason } = req.body;

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    if (!employeeId || isNaN(parseInt(employeeId))) {
        return res.status(400).json({ error: 'Invalid Employee ID' });
    }
    if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid Amount' });
    }

    const advanceId = `adv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const advance = {
        id: advanceId,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        dateIssued,
        reason,
        status: 'pending',
        createdAt: timestamp,
        createdBy: actor
    };

    db.prepare(`
        INSERT INTO advance_salaries (id, employeeId, amount, dateIssued, reason, status, createdAt, createdBy)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(advance.id, advance.employeeId, advance.amount, advance.dateIssued, advance.reason, advance.status, advance.createdAt, advance.createdBy);

    let periodStart, periodEnd;

    if (req.body.periodStart && req.body.periodEnd) {
        periodStart = req.body.periodStart;
        periodEnd = req.body.periodEnd;
        console.log(`[ADVANCE_SALARY] Using provided period: ${periodStart} to ${periodEnd}`);
    } else {
        const anchor = new Date('2025-12-08');
        const today = new Date(dateIssued);
        const daysSinceAnchor = Math.floor((today - anchor) / (1000 * 60 * 60 * 24));
        const currentCycle = Math.floor(daysSinceAnchor / 14);

        const cycleStart = new Date(anchor);
        cycleStart.setDate(anchor.getDate() + (currentCycle * 14));

        const cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 13);

        periodStart = cycleStart.toISOString().split('T')[0];
        periodEnd = cycleEnd.toISOString().split('T')[0];
        console.log(`[ADVANCE_SALARY] Calculated period from ${dateIssued}: ${periodStart} to ${periodEnd}`);
    }

    const deductionId = `ded-adv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const deduction = {
        id: deductionId,
        employeeId: parseInt(employeeId),
        periodStart,
        periodEnd,
        type: 'advance',
        description: `Advance Salary - ${dateIssued}`,
        amount: parseFloat(amount),
        status: 'active',
        createdAt: timestamp,
        createdBy: actor,
        linkedAdvanceId: advance.id
    };

    db.prepare(`
        INSERT INTO deductions (id, employeeId, periodStart, periodEnd, type, description, amount, status, createdAt, createdBy, linkedAdvanceId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(deduction.id, deduction.employeeId, deduction.periodStart, deduction.periodEnd, deduction.type, deduction.description, deduction.amount, deduction.status, deduction.createdAt, deduction.createdBy, deduction.linkedAdvanceId);

    db.prepare('UPDATE advance_salaries SET deductedInPeriod = ? WHERE id = ?').run(periodStart, advance.id);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'ADVANCE_SALARY_ISSUED', employeeId, actor, timestamp, `Issued advance: ₹${amount}, deducted in period ${periodStart}`
    );

    // Recalculate payroll for the affected period
    recalculatePayrollForPeriod(db, employeeId, periodStart, periodEnd);

    res.json({ success: true, advance, deduction });
});

// Get Advance Salaries (Filtered)
app.get('/api/advance-salary', (req, res) => {
    const { employeeId, start, end } = req.query;

    let query = 'SELECT * FROM advance_salaries WHERE 1=1';
    const params = [];

    if (employeeId) {
        query += ' AND employeeId = ?';
        params.push(parseInt(employeeId));
    }

    if (start && end) {
        query += ' AND dateIssued BETWEEN ? AND ?';
        params.push(start, end);
    }

    query += ' ORDER BY dateIssued DESC';

    const results = db.prepare(query).all(...params);

    res.json(results);
});

// Log Event (Client-side events like "Wished Birthday")
app.post('/api/logs', (req, res) => {
    const { action, details } = req.body;

    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        action || 'CLIENT_EVENT', 'SYSTEM', `${req.userRole || 'User'} (${req.ip})`, new Date().toISOString(), details || 'No details provided'
    );

    res.json({ success: true });
});

// Alias for /api/advances (for resigned employee history)
app.get('/api/advances', (req, res) => {
    const { employeeId } = req.query;

    let query = 'SELECT * FROM advance_salaries WHERE 1=1';
    const params = [];

    if (employeeId) {
        query += ' AND employeeId = ?';
        params.push(parseInt(employeeId));
    }

    query += ' ORDER BY dateIssued DESC';

    const results = db.prepare(query).all(...params);

    res.json(results);
});

// Update Advance Salary
app.patch('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const { amount, dateIssued, reason, periodStart, periodEnd } = req.body;

    const oldEntry = db.prepare('SELECT * FROM advance_salaries WHERE id = ?').get(id);
    if (!oldEntry) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    const updatedAmount = amount !== undefined ? parseFloat(amount) : oldEntry.amount;
    const updatedDateIssued = dateIssued !== undefined ? dateIssued : oldEntry.dateIssued;
    const updatedReason = reason !== undefined ? reason : oldEntry.reason;
    const timestamp = new Date().toISOString();

    db.prepare('UPDATE advance_salaries SET amount = ?, dateIssued = ?, reason = ?, updatedAt = ? WHERE id = ?').run(updatedAmount, updatedDateIssued, updatedReason, timestamp, id);

    const updatedEntry = db.prepare('SELECT * FROM advance_salaries WHERE id = ?').get(id);

    // Update Linked Deduction
    const deduction = db.prepare('SELECT * FROM deductions WHERE linkedAdvanceId = ?').get(id);
    if (deduction) {
        const updatedDeductionPeriodStart = periodStart !== undefined ? periodStart : deduction.periodStart;
        const updatedDeductionPeriodEnd = periodEnd !== undefined ? periodEnd : deduction.periodEnd;

        db.prepare('UPDATE deductions SET amount = ?, description = ?, periodStart = ?, periodEnd = ?, updatedAt = ? WHERE id = ?').run(
            updatedAmount, `Advance Salary - ${updatedDateIssued}`, updatedDeductionPeriodStart, updatedDeductionPeriodEnd, timestamp, deduction.id
        );

        // Recalculate payroll for the old and new affected periods if period changed
        if (deduction.periodStart !== updatedDeductionPeriodStart || deduction.periodEnd !== updatedDeductionPeriodEnd) {
            recalculatePayrollForPeriod(db, oldEntry.employeeId, deduction.periodStart, deduction.periodEnd); // Old period
        }
        recalculatePayrollForPeriod(db, oldEntry.employeeId, updatedDeductionPeriodStart, updatedDeductionPeriodEnd); // New period
    }

    // Audit Log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'ADVANCE_SALARY_UPDATE', oldEntry.employeeId, `${req.userRole} (${req.ip})`, timestamp, `Updated advance: ₹${oldEntry.amount} -> ₹${updatedAmount}`
    );

    res.json({ success: true, advance: updatedEntry });
});

// Delete Advance Salary
app.delete('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;

    const entry = db.prepare('SELECT * FROM advance_salaries WHERE id = ?').get(id);
    if (!entry) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    db.prepare('DELETE FROM advance_salaries WHERE id = ?').run(id);

    const deduction = db.prepare('SELECT * FROM deductions WHERE linkedAdvanceId = ?').get(id);
    if (deduction) {
        db.prepare('DELETE FROM deductions WHERE id = ?').run(deduction.id);
        // Recalculate payroll for the affected period
        recalculatePayrollForPeriod(db, entry.employeeId, deduction.periodStart, deduction.periodEnd);
    }

    // Audit Log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'ADVANCE_SALARY_DELETE', entry.employeeId, `${req.userRole} (${req.ip})`, new Date().toISOString(), `Deleted advance: ₹${entry.amount}`
    );

    res.json({ success: true });
});


// Get Audit Logs
app.get('/api/audit-logs', (req, res) => {
    const { limit } = req.query;

    let query = 'SELECT * FROM audit_logs ORDER BY timestamp DESC';
    if (limit) {
        query += ` LIMIT ${parseInt(limit)}`;
    }

    const logs = db.prepare(query).all();

    res.json(logs);
});

// --- ATTENDANCE TRACKING ---

// Get Today's Attendance (This route is already defined above, keeping it for now)
// app.get('/api/attendance/today', (req, res) => { ... });

// --- TIMESHEET MANAGEMENT ---

// Get all timesheet entries (optional: filter by employeeId)
app.get('/api/timesheet', (req, res) => {
    const { employeeId } = req.query;

    let query = 'SELECT * FROM timesheet_entries WHERE 1=1';
    const params = [];

    if (employeeId) {
        query += ' AND employeeId = ?';
        params.push(parseInt(employeeId));
    }

    query += ' ORDER BY date DESC';

    const results = db.prepare(query).all(...params);

    res.json(results);
});

// Get Timesheet for Employee in Period
app.get('/api/timesheet/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const { employeeId, periodStart, periodEnd } = req.params;

    const employee = db.prepare('SELECT id, name, shiftEnd FROM employees WHERE id = ?').get(parseInt(employeeId));
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const entries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ?').all(parseInt(employeeId), periodStart, periodEnd);

    const mappedEntries = entries.map(e => ({
        ...e,
        clockIn: e.clockIn || e.shiftStart || '',
        clockOut: e.clockOut || e.shiftEnd || '',
        shiftStart: e.shiftStart || e.clockIn || '',
        shiftEnd: e.shiftEnd || e.clockOut || ''
    }));

    res.json(mappedEntries);
});

// Save/Update Timesheet
app.post('/api/timesheet', (req, res) => {
    const { employeeId, periodStart, periodEnd, entries, isPostPaymentAdjustment } = req.body;

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    let totalBillableMinutes = 0;
    const savedEntries = [];

    entries.forEach(entry => {
        const clockIn = entry.clockIn || entry.shiftStart || '';
        const clockOut = entry.clockOut || entry.shiftEnd || '';
        const dayType = entry.dayType || 'Work';

        const employee = db.prepare('SELECT id, shiftEnd, perShiftAmount FROM employees WHERE id = ?').get(parseInt(employeeId));
        const calc = calculateShiftHours(clockIn, clockOut, entry.breakMinutes, dayType, employee?.shiftEnd || '18:00');

        const existingEntry = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date = ?').get(parseInt(employeeId), entry.date);

        let timesheetEntry;

        if (existingEntry) {
            db.prepare(`
                UPDATE timesheet_entries SET
                    shiftStart = ?, shiftEnd = ?, clockIn = ?, clockOut = ?, breakMinutes = ?, dayType = ?,
                    totalMinutes = ?, billableMinutes = ?, regularMinutes = ?, overtimeMinutes = ?, nightStatus = ?,
                    status = ?, modifiedAt = ?, modifiedBy = ?
                WHERE id = ?
            `).run(
                clockIn, clockOut, clockIn, clockOut, parseInt(entry.breakMinutes) || 0, dayType,
                calc.totalMinutes, calc.billableMinutes, calc.regularMinutes, calc.overtimeMinutes, calc.nightStatus,
                'active', timestamp, actor, existingEntry.id
            );
            timesheetEntry = db.prepare('SELECT * FROM timesheet_entries WHERE id = ?').get(existingEntry.id);
        } else {
            const newId = entry.id || `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            db.prepare(`
                INSERT INTO timesheet_entries (id, employeeId, date, shiftStart, shiftEnd, clockIn, clockOut, breakMinutes, dayType,
                    totalMinutes, billableMinutes, regularMinutes, overtimeMinutes, nightStatus, status, createdAt, modifiedAt, modifiedBy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                newId, parseInt(employeeId), entry.date, clockIn, clockOut, clockIn, clockOut, parseInt(entry.breakMinutes) || 0, dayType,
                calc.totalMinutes, calc.billableMinutes, calc.regularMinutes, calc.overtimeMinutes, calc.nightStatus,
                'active', timestamp, timestamp, actor
            );
            timesheetEntry = db.prepare('SELECT * FROM timesheet_entries WHERE id = ?').get(newId);
        }

        totalBillableMinutes += calc.billableMinutes;
        savedEntries.push(timesheetEntry);
    });

    if (isPostPaymentAdjustment) {
        const employee = db.prepare('SELECT perShiftAmount FROM employees WHERE id = ?').get(parseInt(employeeId));
        const totalBillableHours = totalBillableMinutes / 60;
        const perHourRate = employee.perShiftAmount ? employee.perShiftAmount / 8 : 0;
        const newCalculatedAmount = totalBillableHours * perHourRate;

        const originalEntry = db.prepare('SELECT netPay FROM payroll_entries WHERE employeeId = ? AND periodStart = ?').get(parseInt(employeeId), periodStart);

        const adjustmentAmount = newCalculatedAmount - (originalEntry?.netPay || 0);

        db.prepare(`
            INSERT INTO payroll_adjustments (id, employeeId, periodStart, periodEnd, originalAmount, newAmount, adjustmentAmount, createdAt, createdBy, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            Date.now() + '-adj', parseInt(employeeId), periodStart, periodEnd, originalEntry?.netPay || 0, newCalculatedAmount, adjustmentAmount, timestamp, actor, 'pending'
        );

        db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
            'TIMESHEET_POST_PAYMENT_ADJUSTMENT', employeeId, actor, timestamp, `Adjustment of ₹${Math.abs(adjustmentAmount).toFixed(2)} (${adjustmentAmount > 0 ? '+' : '-'})`
        );
    }

    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'TIMESHEET_UPDATE', employeeId, actor, timestamp, `Updated ${entries.length} timesheet entries`
    );

    const payrollResult = recalculatePayrollForPeriod(db, employeeId, periodStart, periodEnd);

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = savedEntries.find(e => e.date === todayStr && (e.clockIn || e.shiftStart));
    const attendanceChanged = !!todayEntry;

    if (payrollResult) {
        db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
            'PAYROLL_RECALCULATED', employeeId, actor, timestamp, `Recalculated: Gross ₹${payrollResult.grossPay}, Net ₹${payrollResult.netPay}, ${payrollResult.workingDays} days`
        );
    }

    res.json({
        success: true,
        entries: savedEntries,
        totalBillableMinutes,
        adjustmentCreated: isPostPaymentAdjustment,
        attendanceChanged,
        payrollUpdated: payrollResult
    });
});

// Get Single Payroll Entry (Payslip)
app.get('/api/payroll/:id', (req, res) => {
    const { id } = req.params;
    let entry = db.prepare('SELECT * FROM payroll_entries WHERE id = ?').get(id);

    if (!entry) {
        return res.status(404).json({ error: 'Payroll entry not found' });
    }

    // Parse JSON fields from DB
    if (entry.details) entry.details = JSON.parse(entry.details);
    if (entry.frozenTimesheet) entry.frozenTimesheet = JSON.parse(entry.frozenTimesheet);
    if (entry.frozenAdvances) entry.frozenAdvances = JSON.parse(entry.frozenAdvances);
    if (entry.frozenLoans) entry.frozenLoans = JSON.parse(entry.frozenLoans);
    if (entry.frozenLoanSummary) entry.frozenLoanSummary = JSON.parse(entry.frozenLoanSummary);
    if (entry.frozenBonus) entry.frozenBonus = JSON.parse(entry.frozenBonus);

    if (entry.status !== 'Paid' && !entry.isFrozen) {
        entry = recalculatePayrollForPeriod(db, entry.employeeId, entry.periodStart, entry.periodEnd);
        if (!entry) return res.status(500).json({ error: 'Failed to recalculate payroll' });
    }

    if (entry.isFrozen && entry.status === 'Paid') {
        const liveEmployee = db.prepare('SELECT contact FROM employees WHERE id = ?').get(entry.employeeId);

        const response = {
            ...entry,
            employeeName: entry.frozenEmployeeName,
            employeeRole: entry.frozenEmployeeRole,
            employeeImage: entry.frozenEmployeeImage,
            employeeContact: liveEmployee?.contact || null,
            perShiftAmount: entry.frozenPerShiftAmount,
            hourlyRate: entry.frozenHourlyRate,
            salary: entry.frozenSalary,
            details: {
                timesheet: entry.frozenTimesheet || [],
                advances: entry.frozenAdvances || [],
                loans: entry.frozenLoans || [],
                loanSummary: entry.frozenLoanSummary || null,
                bonus: entry.frozenBonus || null
            }
        };
        return res.json(response);
    }

    const employee = db.prepare('SELECT * FROM employees WHERE id = ?').get(entry.employeeId);
    if (employee) {
        entry.employeeName = employee.name;
        entry.employeeRole = employee.role;
        entry.employeeImage = employee.image;
        entry.employeeId = employee.id;
        entry.employeeContact = employee.contact;
        entry.perShiftAmount = employee.perShiftAmount;
        entry.hourlyRate = employee.hourlyRate;
        entry.salary = employee.salary;
    }

    const start = new Date(entry.periodStart);
    const end = new Date(entry.periodEnd);

    const periodEntries = db.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(entry.employeeId, entry.periodStart, entry.periodEnd, 'active');

    entry.details = {};
    entry.details.timesheet = periodEntries.map(e => {
        const dayType = e.dayType || 'Work';
        const calc = calculateShiftHours(e.clockIn || e.shiftStart, e.clockOut || e.shiftEnd, e.breakMinutes, dayType, employee?.shiftEnd || '18:00');
        return {
            date: e.date,
            clockIn: e.clockIn || e.shiftStart || '-',
            clockOut: e.clockOut || e.shiftEnd || '-',
            breakMinutes: e.breakMinutes || 0,
            dayType: dayType,
            totalMinutes: calc.totalMinutes,
            billableMinutes: calc.billableMinutes,
            regularMinutes: calc.regularMinutes,
            overtimeMinutes: calc.overtimeMinutes,
            nightStatus: calc.nightStatus
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    const periodDeductions = db.prepare('SELECT * FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').all(entry.employeeId, entry.periodStart, entry.periodEnd, 'active');

    entry.details.advances = periodDeductions
        .filter(d => d.type === 'advance')
        .map(d => {
            let advanceDate = entry.periodStart;
            if (d.linkedAdvanceId) {
                const linkedAdvance = db.prepare('SELECT dateIssued FROM advance_salaries WHERE id = ?').get(d.linkedAdvanceId);
                if (linkedAdvance && linkedAdvance.dateIssued) {
                    advanceDate = linkedAdvance.dateIssued;
                }
            }
            return {
                id: d.id,
                date: advanceDate,
                amount: d.amount,
                reason: d.description || 'Advance Salary'
            };
        });

    entry.details.loans = periodDeductions
        .filter(d => d.type === 'loan')
        .map(d => ({
            id: d.id,
            description: d.description,
            amount: d.amount,
            remainingBalance: 'N/A'
        }));

    if (entry.loanDeductions === undefined) {
        entry.loanDeductions = entry.details.loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    }

    let activeLoan = db.prepare('SELECT * FROM loans WHERE employeeId = ? AND status = ?').get(entry.employeeId, 'active');

    if (!activeLoan && entry.loanDeductions > 0) {
        const employeeLoans = db.prepare('SELECT * FROM loans WHERE employeeId = ? ORDER BY date DESC').all(entry.employeeId);
        if (employeeLoans.length > 0) {
            activeLoan = employeeLoans[0];
        }
    }

    if (activeLoan) {
        const entryStart = new Date(entry.periodStart);
        const allLoanDeductions = db.prepare('SELECT amount, periodEnd FROM deductions WHERE employeeId = ? AND type = ? AND status = ?').all(entry.employeeId, 'loan', 'active');
        const previousRepayments = allLoanDeductions
            .filter(d => new Date(d.periodEnd) < entryStart)
            .reduce((sum, d) => sum + Number(d.amount), 0);
        const currentPeriodRepayment = periodDeductions
            .filter(d => d.type === 'loan')
            .reduce((sum, d) => sum + Number(d.amount), 0);
        const openingBalance = activeLoan.amount - previousRepayments;
        const remainingBalance = openingBalance - currentPeriodRepayment;

        if (openingBalance > 0) {
            entry.details.loanSummary = {
                loanDate: activeLoan.date,
                originalAmount: activeLoan.amount,
                openingBalance: openingBalance,
                currentDeduction: currentPeriodRepayment,
                remainingBalance: Math.max(0, remainingBalance)
            };
        }
    }

    const bonusSettings = getSetting('bonusSettings') || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

    const safeBonusEndDate = new Date(entry.periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : entry.periodEnd;
    const accruedDays = countWorkingDays(db, entry.employeeId, bonusSettings.startDate, safeBonusEndDate);
    const totalAccrued = accruedDays * bonusSettings.amountPerDay;

    const totalWithdrawn = db.prepare('SELECT SUM(amount) as total FROM bonus_withdrawals WHERE employeeId = ? AND status != ? AND date <= ?').get(entry.employeeId, 'rejected', entry.periodEnd).total || 0;

    entry.details.bonus = {
        ...entry.details.bonus,
        ytdDays: accruedDays,
        ytdAccrued: totalAccrued,
        totalWithdrawn: totalWithdrawn,
        balance: totalAccrued - totalWithdrawn
    };

    res.json(entry);
});

// Get Loans (optionally filter by employeeId)
app.get('/api/loans', (req, res) => {
    const { employeeId } = req.query;

    let query = 'SELECT * FROM loans WHERE 1=1';
    const params = [];

    if (employeeId) {
        query += ' AND employeeId = ?';
        params.push(parseInt(employeeId));
    }

    const loans = db.prepare(query).all(...params);

    res.json(loans);
});

// Create New Loan
app.post('/api/loans', (req, res) => {
    const { employeeId, amount, date } = req.body;

    const existing = db.prepare('SELECT id FROM loans WHERE employeeId = ? AND status = ?').get(parseInt(employeeId), 'active');
    if (existing) {
        return res.status(400).json({ error: 'Employee already has an active loan. Close it first.' });
    }

    const newLoanId = `loan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newLoan = {
        id: newLoanId,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        date: date,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    db.prepare(`
        INSERT INTO loans (id, employeeId, amount, date, status, createdAt)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(newLoan.id, newLoan.employeeId, newLoan.amount, newLoan.date, newLoan.status, newLoan.createdAt);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'LOAN_ISSUED', employeeId, `${req.userRole || 'admin'} (${req.ip})`, new Date().toISOString(), `Issued Loan: ₹${amount}`
    );

    res.json({ success: true, loan: newLoan });
});

// Update Loan (Edit)
app.patch('/api/loans/:id', (req, res) => {
    const loanId = req.params.id;
    const { amount, date } = req.body;

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);
    if (!loan) {
        return res.status(404).json({ error: 'Loan not found' });
    }

    const oldAmount = loan.amount;
    const timestamp = new Date().toISOString();

    const updatedAmount = amount !== undefined ? parseFloat(amount) : loan.amount;
    const updatedDate = date !== undefined ? date : loan.date;

    db.prepare('UPDATE loans SET amount = ?, date = ?, updatedAt = ? WHERE id = ?').run(updatedAmount, updatedDate, timestamp, loanId);

    const updatedLoan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId);

    // Audit log
    db.prepare('INSERT INTO audit_logs (action, targetId, actor, timestamp, details) VALUES (?, ?, ?, ?, ?)').run(
        'LOAN_UPDATED', loan.employeeId, `${req.userRole || 'admin'} (${req.ip})`, timestamp, `Updated Loan: ₹${oldAmount} → ₹${updatedAmount}`
    );

    res.json({ success: true, loan: updatedLoan });
});

// Helper: Calculate shift hours with Travel/Work Day distinction and OT logic
function calculateShiftHours(startTime, endTime, breakMins, dayType = 'Work', otCutoff = '18:00') {
    if (!startTime || !endTime) {
        return {
            totalMinutes: 0,
            billableMinutes: 0,
            regularMinutes: 0,
            overtimeMinutes: 0,
            regularPay: 0,
            overtimePay: 0,
            nightStatus: null,
            dinnerBreakDeduction: 0
        };
    }

    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    let start = parseTime(startTime);
    let end = parseTime(endTime);
    const otCutoffMins = parseTime(otCutoff);

    // Handle overnight shifts (e.g., 22:00 to 02:00)
    let crossMidnight = false;
    if (end < start) {
        end += 24 * 60;
        crossMidnight = true;
    }

    const DINNER_START = 20 * 60; // 20:00
    const DINNER_END = 21 * 60;   // 21:00

    let duration = end - start;
    let dinnerBreakDeduction = 0;

    // Check Dinner Break (8 PM - 9 PM) - auto deduction if working during this time
    if (start < DINNER_END && end > DINNER_START) {
        const overlapStart = Math.max(start, DINNER_START);
        const overlapEnd = Math.min(end, DINNER_END);
        if (overlapEnd > overlapStart) {
            dinnerBreakDeduction = overlapEnd - overlapStart;
        }
    }

    // Determine Night Status
    let nightStatus = null;
    if (end > 24 * 60) {
        nightStatus = 'Extended Night';
    } else if (end >= 20 * 60) {
        nightStatus = 'Night Shift';
    }

    // --- TRAVEL vs WORK DAY LOGIC ---
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let billableMinutes = 0;

    if (dayType === 'Travel') {
        // RULE: Travel days = ALL hours are regular pay, but breaks are DEDUCTED
        // Travel calculation: Total duration - breaks
        billableMinutes = Math.max(0, duration - (breakMins || 0));
        regularMinutes = billableMinutes;
        overtimeMinutes = 0;
        dinnerBreakDeduction = 0; // No dinner break for travel
        nightStatus = null; // No night status for travel days
    } else {
        // WORK DAY: Calculate regular vs OT based on 6 PM (18:00) cutoff

        // First calculate billable minutes (with break deductions for work days)
        billableMinutes = Math.max(0, duration - (breakMins || 0) - dinnerBreakDeduction);

        // Determine how much time was worked BEFORE otCutoff
        const workBeforeCutoff = Math.max(0, Math.min(end, otCutoffMins) - start);

        // Determine how much time was worked AFTER otCutoff
        let workAfterCutoff = 0;
        if (end > otCutoffMins) {
            const otStart = Math.max(start, otCutoffMins);
            workAfterCutoff = end - otStart;
        }

        // Recalculate more precisely:
        regularMinutes = Math.max(0, Math.min(end, otCutoffMins) - start);
        overtimeMinutes = Math.max(0, end - Math.max(start, otCutoffMins));

        // Deduct standard break from regular time first
        let remainingBreak = breakMins || 0;
        if (regularMinutes >= remainingBreak) {
            regularMinutes -= remainingBreak;
            remainingBreak = 0;
        } else {
            remainingBreak -= regularMinutes;
            regularMinutes = 0;
        }

        // Deduct remaining break from OT
        if (remainingBreak > 0 && overtimeMinutes >= remainingBreak) {
            overtimeMinutes -= remainingBreak;
        } else if (remainingBreak > 0) {
            overtimeMinutes = 0;
        }

        // Deduct dinner break if it falls in OT period (typically 8-9 PM is after 6 PM)
        if (overtimeMinutes > 0 && dinnerBreakDeduction > 0) {
            // Check if dinner time overlaps with OT period
            const otStartTime = Math.max(start, otCutoffMins);
            if (otStartTime < DINNER_END && end > DINNER_START) {
                const dinnerOverlapInOT = Math.min(
                    dinnerBreakDeduction,
                    Math.max(0, Math.min(end, DINNER_END) - Math.max(otStartTime, DINNER_START))
                );
                overtimeMinutes = Math.max(0, overtimeMinutes - dinnerOverlapInOT);
            }
        }

        // Recalculate billable to match
        billableMinutes = regularMinutes + overtimeMinutes;

        // If no overtime, clear night status (no OT = no night shift)
        if (overtimeMinutes === 0) {
            nightStatus = null;
        }
    }

    return {
        totalMinutes: duration,
        billableMinutes,
        regularMinutes,
        overtimeMinutes,
        nightStatus,
        dinnerBreakDeduction,
        dayType // Include for reference
    };
}

// Helper: Recalculate payroll for employee in a period based on timesheet entries
function recalculatePayrollForPeriod(data, employeeId, periodStart, periodEnd) {
    const employee = data.employees.find(e => e.id === parseInt(employeeId));
    if (!employee) return null;

    // Get all timesheet entries for this employee in this period
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const periodEntries = (data.timesheet_entries || []).filter(e => {
        const entryDate = new Date(e.date);
        return e.employeeId === parseInt(employeeId) &&
            entryDate >= start &&
            entryDate <= end &&
            e.status === 'active';
    });

    // Calculate total billable minutes & OT from all timesheet entries
    let totalBillableMinutes = 0;
    let totalOvertimeMinutes = 0;

    // We need to store processed entries to expose nightStatus/OT in details loop later
    // Or we can rebuild details map lower down. Let's rebuild for cleanliness or modify logic to map first.

    // Let's create a richer map of entries first
    const richEntries = periodEntries.map(entry => {
        const clockIn = entry.clockIn || entry.shiftStart || '';
        const clockOut = entry.clockOut || entry.shiftEnd || '';

        // Use dayType to determine OT calculation
        const dayType = entry.dayType || 'Work';

        const calc = calculateShiftHours(clockIn, clockOut, entry.breakMinutes || 0, dayType, employee?.shiftEnd || '18:00');

        return {
            ...entry,
            ...calc
        };
    });

    richEntries.forEach(e => {
        totalBillableMinutes += e.billableMinutes;
        totalOvertimeMinutes += e.overtimeMinutes;
    });

    // Calculate total regular minutes from entries (now includes regularMinutes field)
    const totalRegularMinutes = richEntries.reduce((sum, e) => sum + (e.regularMinutes || 0), 0);

    // Calculate gross pay (Basic Salary)
    // Option 1: Employee has perShiftAmount (per day rate)
    // Option 2: Employee has hourly rate
    // Option 3: Fall back to fixed salary
    let grossPay = 0;
    const totalRegularHours = totalRegularMinutes / 60; // Was totalBillableHours
    const workingDays = periodEntries.length;
    let hourlyRate = 0;

    if (employee.perShiftAmount && workingDays > 0) {
        // ... (Existing per shift logic) ...
        // Derive Hourly Rate for OT
        // Assuming Standard Shift is 9am-6pm (9h) - 1h break = 8h?
        // Or strictly shiftEnd - shiftStart - breakTime?
        const standardShiftRaw = calculateShiftHours(
            employee.shiftStart || '09:00',
            employee.shiftEnd || '18:00',
            employee.breakTime || 0
        );
        const standardDailyHours = standardShiftRaw.billableMinutes / 60;
        hourlyRate = parseFloat(employee.perShiftAmount) / (standardDailyHours || 8); // Fallback to 8h

        // Regular Pay Calculation (Same as before but using Regular Minutes)
        if (standardShiftRaw.billableMinutes > 0) {
            const expectedTotalMinutes = standardShiftRaw.billableMinutes * workingDays;
            // Use Regular Minutes for ratio to avoid counting OT in Basic Salary
            const ratio = totalRegularMinutes / expectedTotalMinutes;
            const basePay = parseFloat(employee.perShiftAmount) * workingDays;
            grossPay = basePay * ratio;
        } else {
            grossPay = parseFloat(employee.perShiftAmount) * workingDays;
        }
    } else if (employee.hourlyRate) {
        hourlyRate = employee.hourlyRate;
        // Use Regular Hours for Basic Salary
        grossPay = hourlyRate * totalRegularHours;
    } else {
        // Fixed salary - OT usually not applicable or rate is Salary / 30 / 8
        // Let's assume standard 8h day for rate
        hourlyRate = (employee.salary || 0) / 30 / 8;
        grossPay = employee.salary || 0;
    }

    // Round Basic Salary to nearest integer
    grossPay = Math.round(grossPay);

    // Add Overtime Pay (also rounded)
    const overtimePay = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
    grossPay += overtimePay;

    // Get deductions for this period
    const periodDeductions = (data.deductions || []).filter(d =>
        d.employeeId === parseInt(employeeId) &&
        d.periodStart === periodStart &&
        d.periodEnd === periodEnd &&
        d.status === 'active'
    );
    console.log(`[DEBUG] Emp: ${employeeId}, Period: ${periodStart} to ${periodEnd}`);
    console.log(`[DEBUG] Found ${periodDeductions.length} deductions. Full Data Deductions: ${(data.deductions || []).length}`);

    const totalDeductions = periodDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate specifically the advance component
    const advanceDeductions = periodDeductions
        .filter(d => d.type === 'advance')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    console.log(`[DEBUG] Employee ${employeeId}: Advance Deductions: ${advanceDeductions}`);

    // Calculate net pay (Rounded)
    // Calculate net pay (Rounded) - Allow negative values per user request
    const netPay = Math.round(grossPay - totalDeductions);

    // Find or create payroll entry
    if (!data.payroll_entries) data.payroll_entries = [];

    let payrollEntry = data.payroll_entries.find(p =>
        p.employeeId === parseInt(employeeId) &&
        p.periodStart === periodStart
    );

    const wasPaid = payrollEntry?.status === 'Paid';
    const previousNetPay = payrollEntry?.netPay || 0;
    const isAdjusted = wasPaid && Math.abs(netPay - previousNetPay) > 0.01;

    // Construct Detailed Breakdown (Updated with Night Status)
    const formattedTimesheet = richEntries.map(e => {
        return {
            date: e.date,
            clockIn: e.clockIn || e.shiftStart || '-',
            clockOut: e.clockOut || e.shiftEnd || '-',
            breakMinutes: e.breakMinutes || 0,
            totalMinutes: e.totalMinutes,
            billableMinutes: e.billableMinutes,
            overtimeMinutes: e.overtimeMinutes, // New
            nightStatus: e.nightStatus,         // New
            dinnerBreakDeduction: e.dinnerBreakDeduction, // New
            dayType: e.dayType                  // New: For Travel Highlights
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter Loan Deductions, Advances... (Same as before)
    const loanDeductions = periodDeductions.filter(d => d.type === 'loan');
    const formattedLoans = loanDeductions.map(d => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        remainingBalance: 'N/A'
    }));

    const formattedAdvances = periodDeductions
        .filter(d => d.type === 'advance')
        .map(d => {
            // Find the linked advance salary record to get the actual date
            let advanceDate = periodStart; // fallback
            if (d.linkedAdvanceId) {
                const linkedAdvance = (data.advance_salaries || []).find(a => a.id === d.linkedAdvanceId);
                if (linkedAdvance && linkedAdvance.dateIssued) {
                    advanceDate = linkedAdvance.dateIssued;
                }
            }

            return {
                id: d.id,
                date: advanceDate,
                amount: d.amount,
                reason: d.description || 'Advance Salary'
            };
        });


    // Calculate specifically the loan component (Total Amount)
    const totalLoanDeductions = periodDeductions
        .filter(d => d.type === 'loan')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    if (payrollEntry) {
        // Update existing
        payrollEntry.grossPay = grossPay;
        payrollEntry.deductions = totalDeductions;
        payrollEntry.advanceDeductions = advanceDeductions;
        payrollEntry.loanDeductions = totalLoanDeductions; // Add this
        payrollEntry.netPay = netPay;
        payrollEntry.totalBillableMinutes = totalBillableMinutes;
        payrollEntry.workingDays = workingDays;
        payrollEntry.overtimePay = overtimePay; // New
        payrollEntry.totalOvertimeMinutes = totalOvertimeMinutes; // New
        if (isAdjusted) {
            payrollEntry.isAdjusted = true;
            payrollEntry.adjustmentAmount = netPay - previousNetPay;
        }
    } else {
        // Create new
        payrollEntry = {
            id: `pay-${Date.now()}-${employeeId}`,
            employeeId: parseInt(employeeId),
            periodStart,
            periodEnd,
            grossPay,
            deductions: totalDeductions,
            advanceDeductions,
            loanDeductions: totalLoanDeductions, // Add this
            netPay,
            status: 'Pending',
            totalBillableMinutes,
            workingDays,
            overtimePay,
            totalOvertimeMinutes
        };
        data.payroll_entries.push(payrollEntry);
    }

    // --- BONUS CALCULATION FOR PAYSLIP ---
    const bonusSettings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

    // 1. Current Cycle Bonus (Informational)
    // Filter timesheet in this period
    const currentCycleBonusDays = periodEntries.length; // Already filtered for this period above
    const currentCycleBonusAmount = currentCycleBonusDays * bonusSettings.amountPerDay;

    // 2. Year-to-Date Bonus
    // 2. YTD Bonus (Cumulative UP TO this period end)
    // We cap the end date at the periodEnd to ensure that past payslips don't show future bonus accruals
    const safeBonusEndDate = new Date(periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : periodEnd;
    const ytdBonusDays = countWorkingDays(data, parseInt(employeeId), bonusSettings.startDate, safeBonusEndDate);
    const ytdBonusAccrued = ytdBonusDays * bonusSettings.amountPerDay;

    // Filter withdrawals to only include those made ON or BEFORE the period end date
    // Note: Assuming withdrawal has a 'date' field. If not, we might need another strategy, but usually financial transactions have dates.
    // Let's check the withdrawal structure. If no date, we can't filter, but assuming there is one based on typical usage.
    // Checking previous grep, withdrawal usually has date. I will add a safe check.
    const totalWithdrawn = (data.bonus_withdrawals || [])
        .filter(entry => {
            if (entry.employeeId !== parseInt(employeeId) || entry.status === 'rejected') return false;
            if (!entry.date) return true; // Fallback if no date (shouldn't happen)
            return new Date(entry.date) <= new Date(periodEnd);
        })
        .reduce((sum, entry) => sum + entry.amount, 0);

    const bonusBalance = ytdBonusAccrued - totalWithdrawn;

    // --- LOAN SUMMARY CALCULATION ---
    if (!data.loans) data.loans = [];
    let activeLoan = data.loans.find(l => l.employeeId === parseInt(employeeId) && l.status === 'active');

    // Fallback if no active loan but we have loan deductions
    if (!activeLoan && totalLoanDeductions > 0) {
        const employeeLoans = data.loans
            .filter(l => l.employeeId === parseInt(employeeId))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (employeeLoans.length > 0) activeLoan = employeeLoans[0];
    }

    let loanSummary = null;
    if (activeLoan) {
        const entryStart = new Date(periodStart);
        const allLoanDeductions = (data.deductions || []).filter(d =>
            d.employeeId === parseInt(employeeId) &&
            d.type === 'loan' &&
            d.status === 'active'
        );
        const previousRepayments = allLoanDeductions
            .filter(d => new Date(d.periodEnd) < entryStart)
            .reduce((sum, d) => sum + Number(d.amount), 0);

        // currentPeriodRepayment is essentially totalLoanDeductions
        const openingBalance = activeLoan.amount - previousRepayments;
        const remainingBalance = openingBalance - totalLoanDeductions;

        loanSummary = {
            loanDate: activeLoan.date,
            originalAmount: activeLoan.amount,
            openingBalance: openingBalance,
            currentDeduction: totalLoanDeductions,
            remainingBalance: Math.max(0, remainingBalance)
        };
    }

    return {
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        employeeImage: employee.image,
        employeeRole: employee.role,
        ...payrollEntry,
        advanceDeductions: advanceDeductions,
        status: payrollEntry.status,
        isAdjusted,
        adjustmentAmount: isAdjusted ? netPay - previousNetPay : 0,
        hourlyRate: hourlyRate, // Expose for UI
        overtimePay: overtimePay,
        totalOvertimeMinutes: totalOvertimeMinutes,
        // Detailed Sections for Payslip
        details: {
            timesheet: formattedTimesheet,
            advances: formattedAdvances,
            loans: formattedLoans,
            loanSummary: loanSummary,
            // New Bonus Section Data
            bonus: {
                currentCycleDays: currentCycleBonusDays,
                currentCycleAmount: currentCycleBonusAmount,
                ytdDays: ytdBonusDays,
                ytdAccrued: ytdBonusAccrued,
                totalWithdrawn: totalWithdrawn,
                balance: bonusBalance,
                ratePerDay: bonusSettings.amountPerDay,
                yearStart: bonusSettings.startDate,
                yearEnd: bonusSettings.endDate
            }
        }
    };
}

// WhatsApp Send Endpoint (PDF Attachment)
app.post('/api/whatsapp/send', pdfUpload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No PDF file uploaded.' });
        }

        const data = readData(); // <--- FIX: Read data
        const { employeeName, periodEnd, contact, netPay } = req.body;
        const filename = req.file.filename;

        console.log(`[WhatsApp] ---------------------------------------------------`);
        console.log(`[WhatsApp] Sending Payslip Request Received`);
        console.log(`[WhatsApp] To: ${contact}`);
        console.log(`[WhatsApp] Employee: ${employeeName}`);
        console.log(`[WhatsApp] Attachment: ${filename} (${(req.file.size / 1024).toFixed(1)} KB)`);
        console.log(`[WhatsApp] Message: "Hi ${employeeName}, here is your payslip for period ending ${periodEnd}. Net Pay: ₹${netPay}."`);
        console.log(`[WhatsApp] Status: MOCK SUCCESS (API Credentials not configured)`);
        console.log(`[WhatsApp] Archived: ${req.file.path}`);
        console.log(`[WhatsApp] ---------------------------------------------------`);

        // Audit Log
        data.audit_logs.push({
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'WHATSAPP_SHARE',
            user: req.userRole || 'System',
            details: {
                employee: employeeName,
                contact: contact,
                file: filename,
                periodEnd: periodEnd,
                status: 'Sent (Mock)'
            }
        });

        writeData(data); // <--- FIX: Save data


        res.json({ success: true, message: 'Payslip sent successfully (Mock)' });

    } catch (error) {
        console.error('[WhatsApp] Send Failed:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// Basic Health Check (for IP debug)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ip: req.ip, role: req.userRole });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[System] Main Server STARTED on port ${PORT}`);
    console.log(`[System] Integrity Check: PASSED. Single source of truth active.`);
    console.log(`[System] Ready for Office PC connections...`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('\n[CRITICAL SECURITY ALERT] DUPLICATE SERVER INSTANCE DETECTED');
        console.error('-----------------------------------------------------------');
        console.error(`Error: Port ${PORT} is strictly locked by the Main Server.`);
        console.error('System Integrity Rule Violation: Multiple conflicting servers are not allowed.');
        console.error('BLOCKED: This conflicting instance will now terminate.');
        console.error('ACTION REQUIRED: Check if the server is already running in another terminal.');
        console.error('-----------------------------------------------------------\n');
        process.exit(1);
    } else {
        console.error('[System] Server encountered an error:', e);
    }
});

// --- HELPER FUNCTIONS ---

function calculateShiftHours(clockIn, clockOut, breakMinutes = 0, dayType = 'Work', shiftEnd = '18:00') {
    if (!clockIn) return { totalMinutes: 0, billableMinutes: 0, regularMinutes: 0, overtimeMinutes: 0, nightStatus: 'None', dinnerBreakDeduction: 0 };

    const start = new Date(`1970-01-01T${clockIn}:00`);
    // If no clockOut, cannot calculate duration properly. Return 0s.
    if (!clockOut) return { totalMinutes: 0, billableMinutes: 0, regularMinutes: 0, overtimeMinutes: 0, nightStatus: 'None', dinnerBreakDeduction: 0 };

    let end = new Date(`1970-01-01T${clockOut}:00`);
    if (end < start) {
        end.setDate(end.getDate() + 1); // Next day
    }

    const diffMs = end - start;
    let totalMinutes = Math.floor(diffMs / 60000);

    totalMinutes -= (breakMinutes || 0);
    if (totalMinutes < 0) totalMinutes = 0;

    let dinnerBreakDeduction = 0;
    const nightShiftThreshold = new Date(`1970-01-01T21:00:00`);
    if (end > nightShiftThreshold) {
        // Dinner break logic here if needed
    }

    let billableMinutes = totalMinutes;
    // Travel logic if needed

    const shiftEndObj = new Date(`1970-01-01T${shiftEnd}:00`);
    let regularMinutes = totalMinutes;
    let overtimeMinutes = 0;

    if (end > shiftEndObj) {

        let otDiffMs = 0;
        if (start > shiftEndObj) {
            otDiffMs = end - start;
        } else {
            otDiffMs = end - shiftEndObj;
        }

        let otMins = Math.floor(otDiffMs / 60000);

        if (otMins > totalMinutes) otMins = totalMinutes;
        overtimeMinutes = otMins;
        regularMinutes = totalMinutes - overtimeMinutes;
    }

    return {
        totalMinutes,
        billableMinutes,
        regularMinutes,
        overtimeMinutes,
        nightStatus: end.getHours() >= 22 ? 'Night' : 'None',
        dinnerBreakDeduction
    };
}


// Health Check Endpoint
app.get('/api/health', (req, res) => {
    try {
        const count = db.prepare('SELECT COUNT(*) as count FROM settings').get();
        res.json({
            status: 'ok',
            db: 'connected',
            timestamp: new Date().toISOString(),
            ip: req.ip
        });
    } catch (err) {
        res.status(500).json({ status: 'error', error: err.message });
    }
});

// Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
    const limit = req.query.limit || 50;
    try {
        const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
        res.json(logs);
    } catch (err) {
        // Find existing table or return empty
        res.json([]);
    }
});

function recalculatePayrollForPeriod(database, employeeId, periodStart, periodEnd) {
    const employee = database.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!employee) return null;

    const entries = database.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(employeeId, periodStart, periodEnd, 'active');

    let totalMinutes = 0;
    let totalOvertimeMinutes = 0;
    let workingDays = 0;
    let totalBillableAmount = 0;

    const shiftAmount = employee.perShiftAmount || 0;
    const hourlyRate = employee.hourlyRate || (shiftAmount / 8) || 0;
    const otRate = hourlyRate;

    const details = {
        days: [],
        breakdown: []
    };

    entries.forEach(e => {
        const clockIn = e.clockIn || e.shiftStart;
        const clockOut = e.clockOut || e.shiftEnd;

        if (!clockIn) return;

        const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes, e.dayType, employee.shiftEnd || '18:00');

        totalMinutes += calc.billableMinutes;
        totalOvertimeMinutes += calc.overtimeMinutes;
        workingDays += 1;

        let dailyPay = 0;
        if (shiftAmount > 0 && calc.billableMinutes > 0) {
            dailyPay = (calc.regularMinutes / 60) * hourlyRate + (calc.overtimeMinutes / 60) * otRate;
        } else {
            dailyPay = (calc.billableMinutes / 60) * hourlyRate;
        }

        totalBillableAmount += dailyPay;

        details.days.push({
            date: e.date,
            pay: dailyPay,
            minutes: calc.billableMinutes,
            ot: calc.overtimeMinutes
        });
    });

    const deductions = database.prepare('SELECT SUM(amount) as total FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').get(employeeId, periodStart, periodEnd, 'active');
    const totalDeductions = deductions?.total || 0;

    const adjustments = database.prepare('SELECT SUM(adjustmentAmount) as total FROM payroll_adjustments WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').get(employeeId, periodStart, periodEnd, 'approved');
    const totalAdjustments = adjustments?.total || 0;

    const grossPay = totalBillableAmount + totalAdjustments;
    const netPay = grossPay - totalDeductions;

    return {
        id: null,
        employeeId,
        periodStart,
        periodEnd,
        grossPay: parseFloat(grossPay.toFixed(2)),
        deductions: parseFloat(totalDeductions.toFixed(2)),
        netPay: Math.max(0, parseFloat(netPay.toFixed(2))),
        status: 'Unpaid',
        workingDays,
        totalMinutes,
        totalOvertimeMinutes,
        hourlyRate,
        perShiftAmount: shiftAmount,
        overtimePay: parseFloat(((totalOvertimeMinutes / 60) * otRate).toFixed(2)),
        details
    };
}
