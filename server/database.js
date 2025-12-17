// server/database.js
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'database.db');
const db = new Database(dbPath); // verbose: console.log for debugging

// Initialize Tables
db.exec(`
    CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        type TEXT,
        stock INTEGER DEFAULT 0,
        price REAL DEFAULT 0,
        description TEXT,
        vendorName TEXT,
        lowStockThreshold INTEGER DEFAULT 5,
        imageUrl TEXT,
        hsnCode TEXT,
        lastUpdated TEXT
    );

    CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        contactPerson TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        status TEXT DEFAULT 'active',
        logoUrl TEXT,
        suppliedItems TEXT, -- JSON
        createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        role TEXT,
        contact TEXT,
        email TEXT,
        address TEXT,
        salary REAL DEFAULT 0,
        perShiftAmount REAL DEFAULT 0,
        hourlyRate REAL DEFAULT 0,
        shiftStart TEXT,
        shiftEnd TEXT,
        workingDays TEXT, -- JSON
        emergencyContact TEXT, -- JSON
        documents TEXT, -- JSON
        birthday TEXT, -- ADDED
        status TEXT DEFAULT 'Active',
        image TEXT,
        lastWorkingDay TEXT,
        resignationDate TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        displayOrder INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS loans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER,
        amount REAL,
        date TEXT,
        status TEXT DEFAULT 'active', -- active, paid, written_off
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS timesheet_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER,
        date TEXT,
        clockIn TEXT,
        clockOut TEXT,
        breakMinutes INTEGER DEFAULT 0,
        status TEXT,
        dayType TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS bonus_withdrawals (
        id TEXT PRIMARY KEY,
        employeeId INTEGER,
        amount REAL,
        date TEXT,
        notes TEXT,
        status TEXT,
        createdAt TEXT,
        createdBy TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        targetId TEXT,
        actor TEXT,
        timestamp TEXT,
        details TEXT
    );

    CREATE TABLE IF NOT EXISTS payroll_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER,
        periodStart TEXT,
        periodEnd TEXT,
        grossPay REAL,
        deductions REAL,
        advanceDeductions REAL,
        netPay REAL,
        paidAt TEXT,
        status TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS deductions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employeeId INTEGER,
        amount REAL,
        reason TEXT,
        date TEXT,
        FOREIGN KEY(employeeId) REFERENCES employees(id)
    );
`);

console.log('✅ Database connected and initialized.');

// --- MIGRATIONS ---
// Attempt to add new columns if they don't exist
const migrations = [
    'ALTER TABLE inventory ADD COLUMN imageUrl TEXT',
    'ALTER TABLE inventory ADD COLUMN hsnCode TEXT',
    'ALTER TABLE employees ADD COLUMN displayOrder INTEGER DEFAULT 0',
    'ALTER TABLE employees ADD COLUMN resignationDate TEXT',
    'CREATE TABLE IF NOT EXISTS loans (id INTEGER PRIMARY KEY AUTOINCREMENT, employeeId INTEGER, amount REAL, date TEXT, status TEXT DEFAULT "active", notes TEXT, createdAt TEXT, updatedAt TEXT, FOREIGN KEY(employeeId) REFERENCES employees(id))',
    'ALTER TABLE vendors ADD COLUMN contactPerson TEXT',
    'ALTER TABLE vendors ADD COLUMN logoUrl TEXT',
    'ALTER TABLE vendors ADD COLUMN status TEXT DEFAULT "active"',
    'ALTER TABLE vendors ADD COLUMN phone TEXT',
    'ALTER TABLE employees ADD COLUMN birthday TEXT'
];

migrations.forEach(query => {
    try {
        db.exec(query);
        console.log(`✅ Applied migration: ${query}`);
    } catch (err) {
        // Prepare statement compilation checks syntax, execution checks logic.
        // "duplicate column name" is the expected error if column exists.
        if (!err.message.toLowerCase().includes('duplicate column name')) {
            console.log(`ℹ️ Migration skipped/failed: ${err.message}`);
        }
    }
});

module.exports = db;
