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
        lastUpdated TEXT
    );

    CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT,
        contact TEXT,
        email TEXT,
        address TEXT,
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
        bankDetails TEXT, -- JSON
        emergencyContact TEXT, -- JSON
        documents TEXT, -- JSON
        status TEXT DEFAULT 'Active',
        image TEXT,
        lastWorkingDay TEXT,
        createdAt TEXT,
        updatedAt TEXT
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
`);

console.log('✅ Database connected and initialized.');

module.exports = db;
