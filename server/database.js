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

    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    );
`);

console.log('✅ Database connected and initialized.');

module.exports = db;
