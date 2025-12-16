const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'business.db'), { verbose: null }); // Set verbose: console.log for query logging

// Initialize Schema
const initSchema = () => {
    // Inventory
    db.exec(`
        CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            type TEXT,
            stock INTEGER DEFAULT 0,
            price REAL DEFAULT 0,
            description TEXT,
            imageUrl TEXT,
            vendorName TEXT,
            vendorContact TEXT,
            lowStockThreshold INTEGER DEFAULT 5,
            lastUpdated TEXT
        )
    `);

    // Vendors
    db.exec(`
        CREATE TABLE IF NOT EXISTS vendors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            contact TEXT,
            email TEXT,
            address TEXT,
            suppliedItems TEXT -- JSON array
        )
    `);

    // Employees
    db.exec(`
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            category TEXT,
            status TEXT DEFAULT 'Active',
            joiningDate TEXT,
            exitDate TEXT, -- Renamed from resignedDate/lastWorkingDay logic normalization
            email TEXT,
            phone TEXT,
            address TEXT,
            salary REAL DEFAULT 0,
            hourlyRate REAL DEFAULT 0,
            image TEXT,
            bankDetails TEXT, -- JSON
            emergencyContact TEXT, -- JSON
            documents TEXT, -- JSON
            shiftStart TEXT,
            shiftEnd TEXT,
            workingDays TEXT, -- JSON array
            perShiftAmount REAL,
            pfNumber TEXT,
            insuranceNumber TEXT
        )
    `);

    // Payroll Entries
    db.exec(`
        CREATE TABLE IF NOT EXISTS payroll_entries (
            id TEXT PRIMARY KEY,
            employeeId INTEGER,
            employeeName TEXT,
            employeeRole TEXT,
            periodStart TEXT,
            periodEnd TEXT,
            grossPay REAL,
            deductions REAL,
            advanceDeductions REAL,
            loanDeductions REAL DEFAULT 0,
            netPay REAL,
            status TEXT, -- Unpaid, Paid
            paidAt TEXT,
            paymentDetails TEXT, -- JSON
            isAdjusted INTEGER DEFAULT 0,
            frozenData TEXT -- JSON snapshot of employee/timesheet data at payment time
        )
    `);

    // Timesheet
    db.exec(`
        CREATE TABLE IF NOT EXISTS timesheet (
            id TEXT PRIMARY KEY,
            employeeId INTEGER,
            date TEXT,
            clockIn TEXT,
            clockOut TEXT,
            breakMinutes INTEGER DEFAULT 0,
            status TEXT,
            dayType TEXT
        )
    `);

    // Deductions (Advances & Loans tracked here or separate?)
    // Converting the unified 'deductions' array from JSON into specific tables or a unified log
    db.exec(`
        CREATE TABLE IF NOT EXISTS deductions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            type TEXT, -- 'manual', 'advance', 'loan'
            amount REAL,
            description TEXT,
            date TEXT,
            periodStart TEXT,
            periodEnd TEXT,
            status TEXT DEFAULT 'active',
            linkedAdvanceId TEXT
        )
    `);

    // Advance Salaries (The request/issued record)
    db.exec(`
        CREATE TABLE IF NOT EXISTS advance_salaries (
            id TEXT PRIMARY KEY,
            employeeId INTEGER,
            amount REAL,
            dateIssued TEXT,
            reason TEXT,
            installments INTEGER,
            deductedAmount REAL DEFAULT 0,
            status TEXT -- active, closed
        )
    `);

    // Loans
    db.exec(`
        CREATE TABLE IF NOT EXISTS loans (
            id TEXT PRIMARY KEY,
            employeeId INTEGER,
            amount REAL,
            date TEXT,
            reason TEXT,
            interestRate REAL DEFAULT 0,
            monthlyInstalment REAL,
            paidAmount REAL DEFAULT 0,
            status TEXT
        )
    `);

    // Bonus Withdrawals
    db.exec(`
        CREATE TABLE IF NOT EXISTS bonus_withdrawals (
            id TEXT PRIMARY KEY,
            employeeId INTEGER,
            amount REAL,
            date TEXT,
            status TEXT,
            approvedBy TEXT
        )
    `);

    // Settings
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT -- JSON
        )
    `);

    // Audit Logs
    db.exec(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            action TEXT,
            targetId TEXT,
            actor TEXT,
            timestamp TEXT,
            details TEXT
        )
    `);
};

// Run schema init
initSchema();

module.exports = db;
