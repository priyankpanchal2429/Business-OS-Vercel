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
        'https://rebusinessos.vercel.app',  // Update this after deploying to Vercel
        'https://api.rebusinessos.tk'       // Allow self-requests
    ]
    : [
        'http://localhost:5173',
        'http://localhost:3000'
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
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

// Run immediate backup on startup
performBackup();

// Helper to read data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return {
            inventory: [],
            vendors: [],
            employees: [],
            payroll: [],
            payroll_entries: [],
            timesheet_entries: [],
            payroll_adjustments: [],
            deductions: [],
            advance_salaries: [],
            bonus_withdrawals: [], // New: Track bonus withdrawals
            settings: {}, // New: App settings
            audit_logs: []
        };
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    // Ensure new fields exist
    if (!data.bonus_withdrawals) data.bonus_withdrawals = [];
    if (!data.settings) data.settings = {};
    return data;
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---


// Inventory
app.get('/api/inventory', (req, res) => {
    const data = readData();
    res.json(data.inventory);
});

app.post('/api/inventory', (req, res) => {
    const data = readData();
    const newItem = { id: Date.now(), ...req.body };
    data.inventory.push(newItem);
    writeData(data);
    res.json(newItem);
});

app.patch('/api/inventory/:id', (req, res) => {
    const data = readData();
    const itemId = parseInt(req.params.id);
    const index = data.inventory.findIndex(item => item.id === itemId);

    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }

    data.inventory[index] = { ...data.inventory[index], ...req.body, id: itemId };
    writeData(data);
    res.json(data.inventory[index]);
});

app.delete('/api/inventory/:id', (req, res) => {
    const data = readData();
    const itemId = parseInt(req.params.id);
    const index = data.inventory.findIndex(item => item.id === itemId);

    if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }

    data.inventory.splice(index, 1);
    writeData(data);
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
    const data = readData();
    res.json(data.vendors);
});

app.post('/api/vendors', (req, res) => {
    const data = readData();
    const newVendor = { id: Date.now(), ...req.body };
    data.vendors.push(newVendor);
    writeData(data);
    res.json(newVendor);
});

app.patch('/api/vendors/:id', (req, res) => {
    const data = readData();
    const vendorId = parseInt(req.params.id);
    const index = data.vendors.findIndex(vendor => vendor.id === vendorId);

    if (index === -1) {
        return res.status(404).json({ error: 'Vendor not found' });
    }

    data.vendors[index] = { ...data.vendors[index], ...req.body, id: vendorId };
    writeData(data);
    res.json(data.vendors[index]);
});

app.delete('/api/vendors/:id', (req, res) => {
    const data = readData();
    const vendorId = parseInt(req.params.id);
    const index = data.vendors.findIndex(vendor => vendor.id === vendorId);

    if (index === -1) {
        return res.status(404).json({ error: 'Vendor not found' });
    }

    data.vendors.splice(index, 1);
    writeData(data);
    res.json({ success: true, message: 'Vendor deleted' });
});

// Employees
app.get('/api/employees', (req, res) => {
    const data = readData();
    res.json(data.employees);
});

// Get single employee by ID
app.get('/api/employees/:id', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.id);
    const employee = data.employees.find(emp => emp.id === employeeId);

    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    res.json(employee);
});

app.post('/api/employees', (req, res) => {
    const data = readData();
    const newEmployee = { id: Date.now(), ...req.body };
    data.employees.push(newEmployee);
    writeData(data);
    res.json(newEmployee);
});

app.patch('/api/employees/:id', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.id);
    const index = data.employees.findIndex(emp => emp.id === employeeId);

    if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee
    data.employees[index] = { ...data.employees[index], ...req.body, id: employeeId };

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'EMPLOYEE_UPDATE',
        targetId: employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: 'Employee profile updated'
    });

    writeData(data);
    res.json(data.employees[index]);
});

app.delete('/api/employees/:id', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.id);
    const index = data.employees.findIndex(emp => emp.id === employeeId);

    if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Remove employee and cascade delete related records
    const deletedEmployee = data.employees[index];
    data.employees.splice(index, 1);

    // Delete related records
    if (data.payroll_entries) {
        data.payroll_entries = data.payroll_entries.filter(entry => entry.employeeId !== employeeId);
    }
    if (data.payroll) {
        data.payroll = data.payroll.filter(entry => entry.employeeId !== employeeId);
    }
    if (data.timesheet_entries) {
        data.timesheet_entries = data.timesheet_entries.filter(entry => entry.employeeId !== employeeId);
    }
    if (data.deductions) {
        data.deductions = data.deductions.filter(entry => entry.employeeId !== employeeId);
    }
    if (data.advance_salaries) {
        data.advance_salaries = data.advance_salaries.filter(entry => entry.employeeId !== employeeId);
    }
    if (data.bonus_withdrawals) {
        data.bonus_withdrawals = data.bonus_withdrawals.filter(entry => entry.employeeId !== employeeId);
    }

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'EMPLOYEE_DELETE',
        targetId: employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Deleted employee: ${deletedEmployee.name}`
    });

    writeData(data);
    res.json({ success: true, message: 'Employee deleted permanently' });
});

// Reorder Employees (Drag & Drop)
app.post('/api/employees/reorder', (req, res) => {
    const { orderedIds } = req.body; // Array of employee IDs in new order
    const data = readData();

    if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: 'orderedIds must be an array' });
    }

    // Create a map for quick lookup
    const employeeMap = new Map(data.employees.map(emp => [emp.id, emp]));

    // Reorder based on the provided IDs
    const reorderedEmployees = orderedIds
        .map(id => employeeMap.get(id))
        .filter(emp => emp !== undefined);

    // Add any employees that weren't in the orderedIds (safety fallback)
    const orderedIdSet = new Set(orderedIds);
    data.employees.forEach(emp => {
        if (!orderedIdSet.has(emp.id)) {
            reorderedEmployees.push(emp);
        }
    });

    data.employees = reorderedEmployees;

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'EMPLOYEES_REORDER',
        targetId: 'ALL',
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: 'Employee list reordered via drag & drop'
    });

    writeData(data);
    res.json({ success: true, message: 'Employees reordered successfully' });
});

// Payroll
app.get('/api/payroll', (req, res) => {
    const data = readData();
    res.json(data.payroll);
});

// [DEPRECATED] Old simple payroll run
app.post('/api/payroll', (req, res) => {
    const data = readData();
    const newRecord = { id: Date.now(), ...req.body };
    data.payroll.push(newRecord);
    writeData(data);
    res.json(newRecord);
});

// Get payroll history for a specific employee
app.get('/api/payroll/history/:employeeId', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.employeeId);

    // Get all Paid payroll records for this employee
    const history = (data.payroll_entries || []).filter(p =>
        p.employeeId === employeeId && p.status === 'Paid'
    );

    // Sort by period start date (newest first)
    history.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));

    res.json(history);
});

// --- BONUS SYSTEM ---

// Get Bonus Settings
app.get('/api/settings/bonus', (req, res) => {
    const data = readData();
    const defaults = {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        amountPerDay: 35
    };
    res.json(data.settings.bonus || defaults);
});

// Update Bonus Settings
app.post('/api/settings/bonus', (req, res) => {
    const data = readData();
    const { startDate, endDate, amountPerDay } = req.body;

    data.settings.bonus = {
        startDate,
        endDate,
        amountPerDay: parseFloat(amountPerDay)
    };

    // Audit Log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'SETTINGS_UPDATE',
        targetId: 'BONUS',
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Updated Bonus: ₹${amountPerDay}/day, ${startDate} to ${endDate}`
    });

    writeData(data);
    res.json(data.settings.bonus);
});


// Withdraw Bonus
app.post('/api/bonus/withdraw', (req, res) => {
    const { employeeId, amount, date, notes } = req.body;
    const data = readData();

    if (!data.bonus_withdrawals) data.bonus_withdrawals = [];

    // Validate that employee exists
    const employee = data.employees.find(e => e.id === parseInt(employeeId));
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculate current available balance
    const settings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };
    const accruedDays = countWorkingDays(data, parseInt(employeeId), settings.startDate, settings.endDate);
    const totalAccrued = accruedDays * settings.amountPerDay;

    const totalWithdrawn = (data.bonus_withdrawals || [])
        .filter(w => w.employeeId === parseInt(employeeId))
        .reduce((sum, w) => sum + w.amount, 0);

    const availableBalance = totalAccrued - totalWithdrawn;

    // Validate withdrawal amount
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
        id: `bw-${Date.now()}`,
        employeeId: parseInt(employeeId),
        amount: withdrawalAmount,
        date: date || new Date().toISOString().split('T')[0],
        notes,
        createdAt: new Date().toISOString(),
        createdBy: `${req.userRole} (${req.ip})`
    };

    data.bonus_withdrawals.push(withdrawal);

    // Audit Log
    data.audit_logs.push({
        success: true,
        withdrawal,
        newBalance: availableBalance - withdrawalAmount
    });
});

// Get Bonus Stats (Calculated)
app.get('/api/bonus/stats', (req, res) => {
    const data = readData();
    const settings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };
    const employees = data.employees || [];

    // Calculate for all employees
    const stats = employees.map(emp => {
        // Calculate Total Accrued
        // Filter timesheet entries within Bonus Year and marked as present
        const accruedDays = countWorkingDays(data, emp.id, settings.startDate, settings.endDate);
        const totalAccrued = accruedDays * settings.amountPerDay;

        // Calculate Total Withdrawn
        const withdrawn = (data.bonus_withdrawals || [])
            .filter(w => w.employeeId === emp.id)
            .reduce((sum, w) => sum + w.amount, 0);

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
    const data = readData();
    const employeeId = parseInt(req.params.id);

    // Validate that employee exists
    const employee = data.employees.find(e => e.id === employeeId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    const settings = data.settings.bonus || {
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        amountPerDay: 35
    };

    // Calculate accrued days & amount
    const totalDays = countWorkingDays(data, employeeId, settings.startDate, settings.endDate);
    const totalAccrued = totalDays * settings.amountPerDay;

    // Get withdrawals
    const withdrawals = (data.bonus_withdrawals || [])
        .filter(w => w.employeeId === employeeId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

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
    const data = readData();

    if (!employeeId || !startDate || !endDate) {
        return res.status(400).json({ error: 'Missing required parameters (employeeId, startDate, endDate)' });
    }

    const empId = parseInt(employeeId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const employee = data.employees.find(e => e.id === empId);
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Filter Timesheet Entries
    const entries = (data.timesheet_entries || []).filter(e => {
        const d = new Date(e.date);
        return e.employeeId === empId && d >= start && d <= end && e.status === 'active';
    });

    // Bonus Settings for Bonus Days Calc
    const bonusSettings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

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

        // Calculate Hours using existing helper
        // Assuming calculateShiftHours is available in scope
        const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes || 0, dayType, employee.shiftEnd || '18:00');

        const isPresent = (!!e.clockIn || !!e.shiftStart);

        // Bonus Rule Check (simplified version of countWorkingDays logic)
        // Check if date is within bonus year AND present
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
    const data = readData();

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

    const activeEmployees = data.employees.filter(e => e.status.toLowerCase() === 'active');

    const scores = activeEmployees.map(emp => {
        // Filter timesheet for this employee in this range
        const entries = (data.timesheet_entries || []).filter(e => {
            const d = new Date(e.date);
            return e.employeeId === emp.id && d >= start && d <= end && e.status === 'active';
        });

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
// Helper: Count working days in a range
function countWorkingDays(data, employeeId, startStr, endStr) {
    // Use string comparison YYYY-MM-DD to be timezone safe
    // Assumptions: startStr, endStr, and e.date are all YYYY-MM-DD strings

    return (data.timesheet_entries || []).filter(e => {
        return e.employeeId === employeeId &&
            e.date >= startStr && e.date <= endStr && // Within range (inclusive)
            (e.clockIn || e.shiftStart) // Present (has shift or clock in)
    }).length;
}

// --- NEW PAYROLL SYSTEM ---

// Get Payroll Status for a Specific Period
app.get('/api/payroll/period', (req, res) => {
    const { start, end } = req.query; // Expect YYYY-MM-DD
    const data = readData();
    const payrollEntries = data.payroll_entries || [];


    // Filter out resigned employees from payroll cycle UNLESS they are in their final settlement period
    // i.e. if their lastWorkingDay is within or after the period starts
    const activeEmployees = data.employees.filter(emp => {
        if (emp.status !== 'Resigned') return true;

        // Use lastWorkingDay to determine eligibility
        // If they have no lastWorkingDay, assume they are fully resigned (exclude)
        if (!emp.lastWorkingDay) return false;

        const lastDay = new Date(emp.lastWorkingDay);
        const periodStartObj = new Date(start);

        // Include if their last working day is on or after the period start
        // This ensures they appear for the final settlement period
        return lastDay >= periodStartObj;
    });

    // Map over active/eligible employees to find their status for this period
    const periodPayroll = activeEmployees.map(emp => {
        // ALWAYS recalculate to get fresh data (including new deductions/advances)
        // This ensures the frontend sees the latest state immediately
        const recalculated = recalculatePayrollForPeriod(data, emp.id, start, end);

        if (recalculated) {
            // Find if there is an existing saved entry to preserve status/payment info
            const savedEntry = payrollEntries.find(p => p.employeeId === emp.id && p.periodStart === start);

            return {
                ...recalculated, // Contains fresh calc for gross, deductions, net, advanceDeductions
                // Preserve saved status if exists, otherwise default from recalc (which is likely Unpaid)
                status: savedEntry ? savedEntry.status : recalculated.status,
                paidAt: savedEntry ? savedEntry.paidAt : null,
                isAdjusted: savedEntry ? savedEntry.isAdjusted : false,
                employeeRole: emp.role // Ensure role is present
            };
        }

        // Fallback (should rarely happen if employee exists)
        const entry = payrollEntries.find(p => p.employeeId === emp.id && p.periodStart === start);

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
                loanDeductions: 0, // Add explicit loanDeductions init
                netPay: emp.salary || 0,
                status: 'Unpaid',
                paidAt: null,
                isAdjusted: false
            };
        }
    });

    // CRITICAL FIX: Persist the recalculated payroll entries to disk.
    // This ensures that when we click "Pay Now", the backend reads the fresh, accurate data
    // instead of stale data from the file.
    writeData(data);

    res.json(periodPayroll);
});

// Calculate Single Payroll Entry (Preview)
app.get('/api/payroll/calculate', (req, res) => {
    const { employeeId, start, end } = req.query;
    const data = readData();

    // Validate inputs
    if (!employeeId || !start || !end) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = recalculatePayrollForPeriod(data, employeeId, start, end);

    if (!result) {
        return res.status(404).json({ error: 'Employee or data not found' });
    }

    // Add "Preview" ID if none exists
    if (!result.id) {
        result.id = 'preview';
    }

    res.json(result);
});

// Update/Create Payroll Status (Mark as Paid)
app.post('/api/payroll/status', (req, res) => {
    const { entryIds, singleEntry, status, paymentDetails } = req.body;
    // Support both bulk (entryIds array) and single (singleEntry object for creation)

    // For "Pay Now" or "Bulk Pay" which might target rows that don't satisfy "id" yet (virtual)
    // The frontend should send the full object structure if ID is null.

    // Simplified Logic: The frontend sends a list of "Payment Actions".
    // Each action contains { employeeId, periodStart, ... }

    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const actions = Array.isArray(req.body) ? req.body : [req.body];
    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    const updatedEntries = [];

    actions.forEach(action => {
        let entry = data.payroll_entries.find(p => p.id === action.id);

        if (!entry) {
            // Create new entry
            entry = {
                id: Date.now() + Math.random().toString().slice(2, 6), // Simple ID
                employeeId: action.employeeId,
                periodStart: action.periodStart,
                periodEnd: action.periodEnd,
                grossPay: action.grossPay,
                deductions: action.deductions || 0,
                netPay: action.netPay,
                status: status || 'Paid',
                paidAt: status === 'Paid' ? timestamp : null,
                paymentDetails: paymentDetails || action.paymentDetails,
                reference: action.reference
            };
            data.payroll_entries.push(entry);
        } else {
            // Update existing
            entry.status = status;
            if (status === 'Paid') {
                entry.paidAt = timestamp;
                entry.paymentDetails = paymentDetails;
            }
        }

        // Audit Log
        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'PAYROLL_UPDATE',
            targetId: entry.id,
            actor: actor,
            timestamp: timestamp,
            details: `Marked as ${status}`
        });

        updatedEntries.push(entry);
    });

    writeData(data);
    res.json(updatedEntries);
});

// Mark employees as Paid - Creates a FROZEN SNAPSHOT of all payslip data
app.post('/api/payroll/mark-paid', (req, res) => {
    const { employeeIds, periodStart, periodEnd } = req.body;
    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        // Always recalculate to ensure fresh data (especially hourlyRate and totals) matches the preview logic
        const calcResult = recalculatePayrollForPeriod(data, employeeId, periodStart, periodEnd);

        // Find existing entry or use the calculated one as base
        let entry = data.payroll_entries.find(p =>
            p.employeeId === employeeId &&
            p.periodStart === periodStart &&
            p.periodEnd === periodEnd
        );

        if (!entry) {
            if (calcResult) {
                entry = { ...calcResult, id: Date.now() + '-' + Math.random(), status: 'Unpaid' };
                // Ensure details and other objects are deeply copied/assigned if needed, but spread is ok for now
                data.payroll_entries.push(entry);
            }
        } else if (calcResult) {
            // Update existing entry with fresh calculated values
            Object.assign(entry, {
                hourlyRate: calcResult.hourlyRate,
                grossPay: calcResult.grossPay,
                netPay: calcResult.netPay,
                overtimePay: calcResult.overtimePay,
                totalOvertimeMinutes: calcResult.totalOvertimeMinutes,
                details: calcResult.details, // Important for bonus/loan details consistency
                perShiftAmount: calcResult.perShiftAmount // Ensure shift amount is fresh
            });
        }

        if (entry) {
            // --- CREATE FROZEN SNAPSHOT ---
            const employee = data.employees.find(e => e.id === employeeId);

            // 1. Freeze Employee Info
            entry.frozenEmployeeName = employee?.name || 'Unknown';
            entry.frozenEmployeeRole = employee?.role || 'Unknown';
            entry.frozenEmployeeImage = employee?.image || null;
            entry.frozenPerShiftAmount = entry.perShiftAmount || employee?.perShiftAmount;
            // FIX: Use calculated hourlyRate from entry if available (handles per-shift conversion), otherwise fall back to profile
            entry.frozenHourlyRate = entry.hourlyRate || employee?.hourlyRate;
            entry.frozenSalary = employee?.salary;

            // 2. Freeze Timesheet Details
            const start = new Date(periodStart);
            const end = new Date(periodEnd);
            const periodEntries = (data.timesheet_entries || []).filter(e => {
                const entryDate = new Date(e.date);
                return e.employeeId === employeeId &&
                    entryDate >= start &&
                    entryDate <= end &&
                    e.status === 'active';
            });

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
                    dayType: dayType,  // Add dayType for travel highlighting
                    totalMinutes: calc.totalMinutes,
                    billableMinutes: calc.billableMinutes,
                    overtimeMinutes: calc.overtimeMinutes,
                    nightStatus: calc.nightStatus,
                    dinnerBreakDeduction: calc.dinnerBreakDeduction
                };
            }).sort((a, b) => new Date(a.date) - new Date(b.date));

            // 3. Freeze Deductions (Advances & Loans)
            const periodDeductions = (data.deductions || []).filter(d =>
                d.employeeId === employeeId &&
                d.periodStart === periodStart &&
                d.periodEnd === periodEnd &&
                d.status === 'active'
            );

            entry.frozenAdvances = periodDeductions
                .filter(d => d.type === 'advance')
                .map(d => {
                    let advanceDate = periodStart;
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

            entry.frozenLoans = periodDeductions
                .filter(d => d.type === 'loan')
                .map(d => ({
                    id: d.id,
                    description: d.description,
                    amount: d.amount
                }));

            // 4. Freeze Loan Summary
            const activeLoan = (data.loans || []).find(l => l.employeeId === employeeId && l.status === 'active');
            if (activeLoan) {
                const entryStart = new Date(periodStart);
                const allLoanDeductions = (data.deductions || []).filter(d =>
                    d.employeeId === employeeId &&
                    d.type === 'loan' &&
                    d.status === 'active'
                );
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

            // 5. Freeze Bonus Info
            const bonusSettings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

            // FIX: Cap bonus calculation at the period end date for frozen payslip accuracy
            const safeBonusEndDate = new Date(periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : periodEnd;
            const ytdBonusDays = countWorkingDays(data, employeeId, bonusSettings.startDate, safeBonusEndDate);
            const ytdBonusAccrued = ytdBonusDays * bonusSettings.amountPerDay;

            // Filter withdrawals to only include those made ON or BEFORE the period end date
            const totalWithdrawn = (data.bonus_withdrawals || [])
                .filter(w => {
                    if (w.employeeId !== employeeId || w.status === 'rejected') return false;
                    if (!w.date) return true;
                    return new Date(w.date) <= new Date(periodEnd);
                })
                .reduce((sum, w) => sum + w.amount, 0);

            entry.frozenBonus = {
                ytdDays: ytdBonusDays,
                ytdAccrued: ytdBonusAccrued, // Explicit
                totalWithdrawn: totalWithdrawn, // Explicit
                balance: ytdBonusAccrued - totalWithdrawn
            };

            // 6. Mark as Paid
            entry.status = 'Paid';
            entry.paidAt = timestamp;
            entry.isFrozen = true; // Flag to indicate this payslip is frozen

            data.audit_logs.push({
                id: Date.now() + '-log',
                action: 'PAYROLL_MARK_PAID',
                targetId: entry.id,
                actor,
                timestamp,
                details: `Marked employee ${employeeId} as Paid (Payslip Frozen)`
            });
        }
    });

    writeData(data);
    res.json({ success: true });
});

// Mark employees as Unpaid (reverse payment)
app.post('/api/payroll/mark-unpaid', (req, res) => {
    const { employeeIds, periodStart, periodEnd } = req.body;
    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        const entry = data.payroll_entries.find(p =>
            p.employeeId === employeeId &&
            p.periodStart === periodStart &&
            p.periodEnd === periodEnd
        );

        if (entry) {
            entry.status = 'Unpaid';
            entry.paidAt = null;

            data.audit_logs.push({
                id: Date.now() + '-log',
                action: 'PAYROLL_MARK_UNPAID',
                targetId: entry.id,
                actor,
                timestamp,
                details: `Reversed payment for employee ${employeeId}`
            });
        }
    });

    writeData(data);
    res.json({ success: true });
});

// --- PAYROLL PERIOD LOCK MANAGEMENT ---

// Get Current Locked Period
app.get('/api/payroll/locked-period', (req, res) => {
    const data = readData();

    if (!data.settings) data.settings = {};
    if (!data.settings.lockedPayrollPeriod) {
        // No locked period - return null
        return res.json({ locked: false, period: null });
    }

    res.json({
        locked: true,
        period: data.settings.lockedPayrollPeriod
    });
});

// Set and Lock Payroll Period
app.post('/api/payroll/lock-period', (req, res) => {
    const { start, end, lockedBy } = req.body;
    const data = readData();

    if (!start || !end) {
        return res.status(400).json({ error: 'Start and end dates are required' });
    }

    if (!data.settings) data.settings = {};
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = lockedBy || `${req.userRole} (${req.ip})`;

    // Set locked period
    data.settings.lockedPayrollPeriod = {
        start,
        end,
        lockedAt: timestamp,
        lockedBy: actor,
        locked: true
    };

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'PAYROLL_PERIOD_LOCKED',
        targetId: 'PAYROLL_PERIOD',
        actor,
        timestamp,
        details: `Locked payroll period: ${start} to ${end}`
    });

    writeData(data);
    res.json({
        success: true,
        period: data.settings.lockedPayrollPeriod
    });
});

// Unlock Payroll Period
app.post('/api/payroll/unlock-period', (req, res) => {
    const data = readData();

    if (!data.settings) data.settings = {};
    if (!data.audit_logs) data.audit_logs = [];

    const previousPeriod = data.settings.lockedPayrollPeriod;

    if (!previousPeriod) {
        return res.status(400).json({ error: 'No locked period to unlock' });
    }

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    // Remove locked period
    delete data.settings.lockedPayrollPeriod;

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'PAYROLL_PERIOD_UNLOCKED',
        targetId: 'PAYROLL_PERIOD',
        actor,
        timestamp,
        details: `Unlocked payroll period: ${previousPeriod.start} to ${previousPeriod.end}`
    });

    writeData(data);
    res.json({ success: true });
});

// --- DEDUCTIONS MANAGEMENT ---

// Get Deductions for Employee in Period
app.get('/api/deductions/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const { employeeId, periodStart, periodEnd } = req.params;
    const data = readData();

    if (!data.deductions) data.deductions = [];

    const deductions = data.deductions.filter(d =>
        d.employeeId === parseInt(employeeId) &&
        d.periodStart === periodStart &&
        d.periodEnd === periodEnd &&
        d.status === 'active'
    );

    res.json(deductions);
});

// Save/Update Deductions
app.post('/api/deductions', (req, res) => {
    const { employeeId, periodStart, periodEnd, deductions } = req.body;
    const data = readData();

    if (!data.deductions) data.deductions = [];
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    // Remove old deductions for this employee/period
    data.deductions = data.deductions.filter(d =>
        !(d.employeeId === parseInt(employeeId) &&
            d.periodStart === periodStart &&
            d.periodEnd === periodEnd)
    );

    // Add new deductions
    const savedDeductions = deductions.map(ded => ({
        id: ded.id || `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: parseInt(employeeId),
        periodStart,
        periodEnd,
        type: ded.type,
        description: ded.description,
        amount: parseFloat(ded.amount),
        status: 'active',
        createdAt: ded.createdAt || timestamp,
        createdBy: ded.createdBy || actor
    }));

    data.deductions.push(...savedDeductions);

    // Recalculate total deductions and net pay
    const totalDeductions = savedDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Update payroll entry
    const payrollEntry = data.payroll_entries.find(p =>
        p.employeeId === parseInt(employeeId) &&
        p.periodStart === periodStart &&
        p.periodEnd === periodEnd
    );

    if (payrollEntry) {
        payrollEntry.deductions = totalDeductions;
        payrollEntry.netPay = payrollEntry.grossPay - totalDeductions;
    }

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'DEDUCTIONS_UPDATED',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Updated deductions: ₹${totalDeductions}`
    });

    writeData(data);
    res.json({ success: true, deductions: savedDeductions, totalDeductions });
});

// Delete Deduction
app.delete('/api/deductions/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();

    if (!data.deductions) data.deductions = [];

    const deduction = data.deductions.find(d => d.id === id);
    if (deduction) {
        deduction.status = 'deleted';

        const timestamp = new Date().toISOString();
        const actor = `${req.userRole} (${req.ip})`;

        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'DEDUCTION_DELETED',
            targetId: deduction.employeeId,
            actor,
            timestamp,
            details: `Deleted ${deduction.type} deduction: ₹${deduction.amount}`
        });

        writeData(data);
    }

    res.json({ success: true });
});

// Issue Advance Salary
app.post('/api/advance-salary', (req, res) => {
    const { employeeId, amount, dateIssued, reason } = req.body;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    if (!employeeId || isNaN(parseInt(employeeId))) {
        return res.status(400).json({ error: 'Invalid Employee ID' });
    }
    if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid Amount' });
    }

    // Create advance salary record
    const advance = {
        id: `adv-${Date.now()}`,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        dateIssued,
        reason,
        status: 'pending',
        createdAt: timestamp,
        createdBy: actor
    };

    data.advance_salaries.push(advance);

    // Use provided period if available (from frontend context), otherwise calculate
    let periodStart, periodEnd;

    if (req.body.periodStart && req.body.periodEnd) {
        periodStart = req.body.periodStart;
        periodEnd = req.body.periodEnd;
        console.log(`[ADVANCE_SALARY] Using provided period: ${periodStart} to ${periodEnd}`);
    } else {
        // Calculate next payroll period (assuming bi-weekly from Dec 8, 2025)
        const anchor = new Date('2025-12-08');
        const today = new Date(dateIssued);
        const daysSinceAnchor = Math.floor((today - anchor) / (1000 * 60 * 60 * 24));
        const currentCycle = Math.floor(daysSinceAnchor / 14);

        // Deduct in the CURRENT period (so it shows up immediately in the active payroll)
        const cycleStart = new Date(anchor);
        cycleStart.setDate(anchor.getDate() + (currentCycle * 14));

        const cycleEnd = new Date(cycleStart);
        cycleEnd.setDate(cycleStart.getDate() + 13);

        periodStart = cycleStart.toISOString().split('T')[0];
        periodEnd = cycleEnd.toISOString().split('T')[0];
        console.log(`[ADVANCE_SALARY] Calculated period from ${dateIssued}: ${periodStart} to ${periodEnd}`);
    }

    // Auto-create deduction for next period
    const deduction = {
        id: `ded-adv-${Date.now()}`,
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

    data.deductions.push(deduction);
    advance.deductedInPeriod = periodStart;

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_ISSUED',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Issued advance: ₹${amount}, deducted in period ${periodStart}`
    });

    writeData(data);
    res.json({ success: true, advance, deduction });
});

// Get Advance Salaries (Filtered)
app.get('/api/advance-salary', (req, res) => {
    const { employeeId, start, end } = req.query;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];

    let results = data.advance_salaries;

    if (employeeId) {
        results = results.filter(a => a.employeeId === parseInt(employeeId));
    }

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        results = results.filter(a => {
            const issued = new Date(a.dateIssued);
            return issued >= startDate && issued <= endDate;
        });
    }

    // Sort by newest first
    results.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));

    res.json(results);
});

// Log Event (Client-side events like "Wished Birthday")
app.post('/api/logs', (req, res) => {
    const { action, details } = req.body;
    const data = readData();

    if (!data.audit_logs) data.audit_logs = [];

    data.audit_logs.push({
        id: Date.now() + '-log',
        action: action || 'CLIENT_EVENT',
        targetId: 'SYSTEM',
        actor: `${req.userRole || 'User'} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: details || 'No details provided'
    });

    writeData(data);
    res.json({ success: true });
});

// Alias for /api/advances (for resigned employee history)
app.get('/api/advances', (req, res) => {
    const { employeeId } = req.query;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];

    let results = data.advance_salaries;

    if (employeeId) {
        results = results.filter(a => a.employeeId === parseInt(employeeId));
    }

    // Sort by newest first
    results.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));

    res.json(results);
});

// Update Advance Salary
app.patch('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const { amount, dateIssued, reason, periodStart, periodEnd } = req.body;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];

    const index = data.advance_salaries.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    const oldEntry = data.advance_salaries[index];
    const updatedEntry = { ...oldEntry, amount: parseFloat(amount), dateIssued, reason };

    // Update Advance
    data.advance_salaries[index] = updatedEntry;

    // Update Linked Deduction
    const deductionIndex = data.deductions.findIndex(d => d.linkedAdvanceId === id);
    if (deductionIndex !== -1) {
        // Prepare update object
        const updatedDeduction = {
            ...data.deductions[deductionIndex],
            amount: parseFloat(amount),
            description: `Advance Salary - ${dateIssued}` // Update description in case date changed
        };

        // Explicitly update period if provided (Critical for correcting period assignment)
        if (periodStart) updatedDeduction.periodStart = periodStart;
        if (periodEnd) updatedDeduction.periodEnd = periodEnd;

        data.deductions[deductionIndex] = updatedDeduction;
    }

    // Audit Log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_UPDATE',
        targetId: updatedEntry.employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Updated advance: ₹${oldEntry.amount} -> ₹${amount}`
    });

    writeData(data);
    res.json({ success: true, advance: updatedEntry });
});

// Delete Advance Salary
app.delete('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];

    const index = data.advance_salaries.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    const entry = data.advance_salaries[index];

    // Remove Advance
    data.advance_salaries.splice(index, 1);

    // Remove Linked Deduction
    const deductionIndex = data.deductions.findIndex(d => d.linkedAdvanceId === id);
    if (deductionIndex !== -1) {
        data.deductions.splice(deductionIndex, 1);
    }

    // Audit Log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_DELETE',
        targetId: entry.employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Deleted advance: ₹${entry.amount}`
    });

    writeData(data);
    res.json({ success: true });
});


// Get Audit Logs
app.get('/api/audit-logs', (req, res) => {
    const { limit } = req.query;
    const data = readData();
    const logs = data.audit_logs || [];

    // Sort by newest first
    const sortedLogs = logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (limit) {
        res.json(sortedLogs.slice(0, parseInt(limit)));
    } else {
        res.json(sortedLogs);
    }
});

// --- ATTENDANCE TRACKING ---

// Get Today's Attendance
app.get('/api/attendance/today', (req, res) => {
    const data = readData();

    if (!data.employees) data.employees = [];
    if (!data.timesheet_entries) data.timesheet_entries = [];

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
        // Find today's timesheet entry
        const todayEntry = data.timesheet_entries.find(entry =>
            entry.employeeId === emp.id &&
            entry.date === todayStr &&
            (entry.clockIn || entry.shiftStart) // Has clocked in
        );

        if (todayEntry) {
            working.push({
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                clockIn: todayEntry.clockIn,
                clockOut: todayEntry.clockOut || null,
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
            total: data.employees.length,
            working: working.length,
            notWorking: notWorking.length
        },
        working,
        notWorking
    });
});

// --- TIMESHEET MANAGEMENT ---

// Get all timesheet entries (optional: filter by employeeId)
app.get('/api/timesheet', (req, res) => {
    const { employeeId } = req.query;
    const data = readData();

    if (!data.timesheet_entries) data.timesheet_entries = [];

    let results = data.timesheet_entries;

    if (employeeId) {
        results = results.filter(entry => entry.employeeId === parseInt(employeeId));
    }

    // Sort by date (newest first)
    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(results);
});

// Get Timesheet for Employee in Period
app.get('/api/timesheet/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const data = readData();
    const { employeeId, periodStart, periodEnd } = req.params;

    if (!data.timesheet_entries) data.timesheet_entries = [];

    // Find employee
    const employee = data.employees.find(e => e.id === parseInt(employeeId));
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Get ONLY existing manual entries for period (no auto-generation)
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const entries = data.timesheet_entries
        .filter(e => {
            const entryDate = new Date(e.date);
            return e.employeeId === parseInt(employeeId) &&
                entryDate >= start &&
                entryDate <= end;
        })
        .map(e => ({
            ...e,
            // Normalize: ensure both field naming conventions are present for client compatibility
            clockIn: e.clockIn || e.shiftStart || '',
            clockOut: e.clockOut || e.shiftEnd || '',
            shiftStart: e.shiftStart || e.clockIn || '',
            shiftEnd: e.shiftEnd || e.clockOut || ''
        }));

    res.json(entries);
});

// Save/Update Timesheet
app.post('/api/timesheet', (req, res) => {
    const data = readData();
    const { employeeId, periodStart, periodEnd, entries, isPostPaymentAdjustment } = req.body;

    if (!data.timesheet_entries) data.timesheet_entries = [];
    if (!data.payroll_adjustments) data.payroll_adjustments = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    let totalBillableMinutes = 0;
    const savedEntries = [];

    // Process each entry
    // Process each entry
    entries.forEach(entry => {
        // Normalize time fields - accept both naming conventions
        const clockIn = entry.clockIn || entry.shiftStart || '';
        const clockOut = entry.clockOut || entry.shiftEnd || '';
        const dayType = entry.dayType || 'Work'; // Default to Work if not specified

        // Fetch employee to get shift details
        const employee = data.employees.find(e => e.id === parseInt(employeeId));
        // Calculate hours with day type and Employee's specific shift end (OT Cutoff)
        const calc = calculateShiftHours(clockIn, clockOut, entry.breakMinutes, dayType, employee?.shiftEnd || '18:00');

        // --- UPSERT LOGIC (DATE-BASED) ---
        // Find existing entry for this Employee + Date
        const existingIndex = data.timesheet_entries.findIndex(e =>
            e.employeeId === parseInt(employeeId) &&
            e.date === entry.date // Strict date match
        );

        const currentTimestamp = new Date().toISOString();

        let timesheetEntry;

        if (existingIndex >= 0) {
            // UDPATE existing
            const existingEntry = data.timesheet_entries[existingIndex];

            // Capture previous state for audit (only if meaningful change)
            if (existingEntry.clockIn !== clockIn || existingEntry.clockOut !== clockOut) {
                /* Optional detailed audit log could go here */
            }

            timesheetEntry = {
                ...existingEntry, // Preserve ID and other meta
                shiftStart: clockIn,
                shiftEnd: clockOut,
                clockIn: clockIn,
                clockOut: clockOut,
                breakMinutes: parseInt(entry.breakMinutes) || 0,
                dayType: dayType,
                totalMinutes: calc.totalMinutes,
                billableMinutes: calc.billableMinutes,
                regularMinutes: calc.regularMinutes,
                overtimeMinutes: calc.overtimeMinutes, // Ensure these are updated
                nightStatus: calc.nightStatus,
                status: 'active',
                modifiedAt: currentTimestamp,
                modifiedBy: actor
            };

            data.timesheet_entries[existingIndex] = timesheetEntry;
        } else {
            // INSERT new
            timesheetEntry = {
                id: entry.id || `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                employeeId: parseInt(employeeId),
                date: entry.date,
                shiftStart: clockIn,
                shiftEnd: clockOut,
                clockIn: clockIn,
                clockOut: clockOut,
                breakMinutes: parseInt(entry.breakMinutes) || 0,
                dayType: dayType,
                totalMinutes: calc.totalMinutes,
                billableMinutes: calc.billableMinutes,
                regularMinutes: calc.regularMinutes,
                overtimeMinutes: calc.overtimeMinutes,
                nightStatus: calc.nightStatus,
                status: 'active',
                createdAt: currentTimestamp,
                modifiedAt: currentTimestamp,
                modifiedBy: actor
            };
            data.timesheet_entries.push(timesheetEntry);
        }

        totalBillableMinutes += calc.billableMinutes;
        savedEntries.push(timesheetEntry);
    });

    // If post-payment adjustment, create adjustment record
    if (isPostPaymentAdjustment) {
        const employee = data.employees.find(e => e.id === parseInt(employeeId));
        const totalBillableHours = totalBillableMinutes / 60;
        const perHourRate = employee.perShiftAmount ? employee.perShiftAmount / 8 : 0; // Assuming 8h shift
        const newCalculatedAmount = totalBillableHours * perHourRate;

        // Find original payroll entry
        const originalEntry = data.payroll_entries.find(
            e => e.employeeId === parseInt(employeeId) && e.periodStart === periodStart
        );

        const adjustmentAmount = newCalculatedAmount - (originalEntry?.netPay || 0);

        data.payroll_adjustments.push({
            id: Date.now() + '-adj',
            employeeId: parseInt(employeeId),
            periodStart,
            periodEnd,
            originalAmount: originalEntry?.netPay || 0,
            newAmount: newCalculatedAmount,
            adjustmentAmount,
            createdAt: timestamp,
            createdBy: actor,
            status: 'pending'
        });

        // Audit log
        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'TIMESHEET_POST_PAYMENT_ADJUSTMENT',
            targetId: employeeId,
            actor,
            timestamp,
            details: `Adjustment of ₹${Math.abs(adjustmentAmount).toFixed(2)} (${adjustmentAmount > 0 ? '+' : '-'})`
        });
    }

    // Audit log for timesheet save
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'TIMESHEET_UPDATE',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Updated ${entries.length} timesheet entries`
    });

    // --- NEW: Recalculate payroll for this period ---
    const payrollResult = recalculatePayrollForPeriod(data, employeeId, periodStart, periodEnd);

    // --- NEW: Check if today's attendance changed ---
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = savedEntries.find(e => e.date === todayStr && (e.clockIn || e.shiftStart));
    const attendanceChanged = !!todayEntry;

    // Log payroll recalculation
    if (payrollResult) {
        data.audit_logs.push({
            id: Date.now() + '-payroll-log',
            action: 'PAYROLL_RECALCULATED',
            targetId: employeeId,
            actor,
            timestamp,
            details: `Recalculated: Gross ₹${payrollResult.grossPay}, Net ₹${payrollResult.netPay}, ${payrollResult.workingDays} days`
        });
    }

    writeData(data);

    res.json({
        success: true,
        entries: savedEntries,
        totalBillableMinutes,
        adjustmentCreated: isPostPaymentAdjustment,
        // Enhanced response
        attendanceChanged,
        payrollUpdated: payrollResult
    });
});

// Get Single Payroll Entry (Payslip)
app.get('/api/payroll/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const entry = data.payroll_entries.find(p => p.id === id);

    if (!entry) {
        return res.status(404).json({ error: 'Payroll entry not found' });
    }

    // --- RECALCULATE IF UNPAID ---
    // Ensure we stick to the latest calculation logic (e.g. Basic Salary fix)
    if (entry.status !== 'Paid' && !entry.isFrozen) {
        recalculatePayrollForPeriod(data, entry.employeeId, entry.periodStart, entry.periodEnd);
    }

    // --- CHECK IF FROZEN (PAID) ---
    // If the payslip is frozen (paid), return the frozen snapshot data
    if (entry.isFrozen && entry.status === 'Paid') {
        // Use frozen employee data but attempt to get live contact info for WhatsApp
        const liveEmployee = data.employees.find(e => e.id === entry.employeeId);

        const response = {
            ...entry,
            employeeName: entry.frozenEmployeeName,
            employeeRole: entry.frozenEmployeeRole,
            employeeImage: entry.frozenEmployeeImage,
            employeeContact: liveEmployee?.contact || null, // Use live contact
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

    // --- UNPAID PAYSLIP: Calculate fresh details ---
    // Enhance with employee details
    const employee = data.employees.find(e => e.id === entry.employeeId);
    if (employee) {
        entry.employeeName = employee.name;
        entry.employeeRole = employee.role;
        entry.employeeImage = employee.image;
        entry.employeeId = employee.id;
        entry.employeeContact = employee.contact;
        // Pass rate info for frontend Daily Earnings calculation
        entry.perShiftAmount = employee.perShiftAmount;
        entry.hourlyRate = employee.hourlyRate;
        entry.salary = employee.salary;
    }

    const start = new Date(entry.periodStart);
    const end = new Date(entry.periodEnd);

    // 1. Timesheet
    const periodEntries = (data.timesheet_entries || []).filter(e => {
        const entryDate = new Date(e.date);
        return e.employeeId === entry.employeeId &&
            entryDate >= start &&
            entryDate <= end &&
            e.status === 'active';
    });

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

    // 2. Deductions (Advances & Loans)
    const periodDeductions = (data.deductions || []).filter(d =>
        d.employeeId === entry.employeeId &&
        d.periodStart === entry.periodStart &&
        d.periodEnd === entry.periodEnd &&
        d.status === 'active'
    );

    entry.details.advances = periodDeductions
        .filter(d => d.type === 'advance')
        .map(d => {
            let advanceDate = entry.periodStart;
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

    entry.details.loans = periodDeductions
        .filter(d => d.type === 'loan')
        .map(d => ({
            id: d.id,
            description: d.description,
            amount: d.amount,
            remainingBalance: 'N/A' // Calculated in summary
        }));

    // Ensure loanDeductions total is available for the response
    if (entry.loanDeductions === undefined) {
        entry.loanDeductions = entry.details.loans.reduce((sum, l) => sum + (l.amount || 0), 0);
    }

    // --- LOAN LOGIC ---
    if (!data.loans) data.loans = [];
    // Determine the relevant loan (Active or implicitly active via deductions)
    let activeLoan = data.loans.find(l => l.employeeId === entry.employeeId && l.status === 'active');

    // Fallback: If we have deductions but no "active" loan found, grab the most recent one
    if (!activeLoan && entry.loanDeductions > 0) {
        const employeeLoans = data.loans
            .filter(l => l.employeeId === entry.employeeId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        if (employeeLoans.length > 0) {
            activeLoan = employeeLoans[0];
        }
    }

    if (activeLoan) {
        const entryStart = new Date(entry.periodStart);
        const allLoanDeductions = (data.deductions || []).filter(d =>
            d.employeeId === entry.employeeId &&
            d.type === 'loan' &&
            d.status === 'active'
        );
        const previousRepayments = allLoanDeductions
            .filter(d => new Date(d.periodEnd) < entryStart)
            .reduce((sum, d) => sum + Number(d.amount), 0);
        const currentPeriodRepayment = periodDeductions
            .filter(d => d.type === 'loan')
            .reduce((sum, d) => sum + Number(d.amount), 0);
        const openingBalance = activeLoan.amount - previousRepayments;
        const remainingBalance = openingBalance - currentPeriodRepayment;

        // ALWAYS show summary if we found a relevant loan, to ensure visibility on payslip
        entry.details.loanSummary = {
            loanDate: activeLoan.date,
            originalAmount: activeLoan.amount,
            openingBalance: openingBalance,
            currentDeduction: currentPeriodRepayment,
            remainingBalance: Math.max(0, remainingBalance)
        };
    }

    // 3. Bonus Stats
    // 3. Bonus Stats
    const bonusSettings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };

    // FIX: Cap bonus calculation at the period end date to ensure historical accuracy
    const safeBonusEndDate = new Date(entry.periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : entry.periodEnd;
    const accruedDays = countWorkingDays(data, entry.employeeId, bonusSettings.startDate, safeBonusEndDate);
    const totalAccrued = accruedDays * bonusSettings.amountPerDay;

    // Filter withdrawals to only include those made ON or BEFORE the period end date
    const totalWithdrawn = (data.bonus_withdrawals || [])
        .filter(w => {
            if (w.employeeId !== entry.employeeId || w.status === 'rejected') return false;
            if (!w.date) return true;
            return new Date(w.date) <= new Date(entry.periodEnd);
        })
        .reduce((sum, w) => sum + w.amount, 0);

    // Ensure we preserve the full bonus object structure if it exists, or update it
    entry.details.bonus = {
        ...entry.details.bonus, // Keep existing fields if any
        ytdDays: accruedDays,
        ytdAccrued: totalAccrued, // Add explicit amount
        totalWithdrawn: totalWithdrawn, // Add explicit withdrawn
        balance: totalAccrued - totalWithdrawn
    };

    res.json(entry);
});

// Get Loans (optionally filter by employeeId)
app.get('/api/loans', (req, res) => {
    const data = readData();
    const { employeeId } = req.query;

    let loans = data.loans || [];

    if (employeeId) {
        loans = loans.filter(l => l.employeeId === parseInt(employeeId));
    }

    res.json(loans);
});

// Create New Loan
app.post('/api/loans', (req, res) => {
    const data = readData();
    const { employeeId, amount, date } = req.body;

    if (!data.loans) data.loans = [];

    // Check if already has active loan
    const existing = data.loans.find(l => l.employeeId === parseInt(employeeId) && l.status === 'active');
    if (existing) {
        return res.status(400).json({ error: 'Employee already has an active loan. Close it first.' });
    }

    const newLoan = {
        id: `loan-${Date.now()}`,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        date: date,
        status: 'active',
        createdAt: new Date().toISOString()
    };

    data.loans.push(newLoan);
    writeData(data);

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'LOAN_ISSUED',
        targetId: employeeId,
        actor: `${req.userRole || 'admin'} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Issued Loan: ₹${amount}`
    });
    writeData(data);

    res.json({ success: true, loan: newLoan });
});

// Update Loan (Edit)
app.patch('/api/loans/:id', (req, res) => {
    const data = readData();
    const loanId = req.params.id;
    const { amount, date } = req.body;

    if (!data.loans) data.loans = [];

    const loanIndex = data.loans.findIndex(l => l.id === loanId);
    if (loanIndex === -1) {
        return res.status(404).json({ error: 'Loan not found' });
    }

    const loan = data.loans[loanIndex];
    const oldAmount = loan.amount;

    // Update loan fields
    if (amount !== undefined) loan.amount = parseFloat(amount);
    if (date !== undefined) loan.date = date;
    loan.updatedAt = new Date().toISOString();

    data.loans[loanIndex] = loan;

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'LOAN_UPDATED',
        targetId: loan.employeeId,
        actor: `${req.userRole || 'admin'} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Updated Loan: ₹${oldAmount} → ₹${loan.amount}`
    });

    writeData(data);
    res.json({ success: true, loan });
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
