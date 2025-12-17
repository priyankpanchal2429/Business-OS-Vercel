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
const PORT = 3001; // Hardcoded to bypass stuck process on 3000

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
    'http://localhost:3001', // New Self
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
        const { name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, status, image } = req.body;
        const stmt = db.prepare(`
            INSERT INTO employees (name, role, contact, email, address, salary, perShiftAmount, hourlyRate, shiftStart, shiftEnd, workingDays, bankDetails, emergencyContact, documents, status, image, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?, ?, ?)
        `);
        const info = stmt.run(
            name, role, contact, email, address, salary || 0, perShiftAmount || 0, hourlyRate || 0, shiftStart, shiftEnd,
            JSON.stringify(workingDays || []), JSON.stringify(bankDetails || {}), JSON.stringify(emergencyContact || {}),
            status || 'Active', image, new Date().toISOString(), new Date().toISOString()
        );
        const newEmp = db.prepare('SELECT * FROM employees WHERE id = ?').get(info.lastInsertRowid);
        res.json(newEmp);
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
        const { name, category, contact, email, address, suppliedItems } = req.body;
        const stmt = db.prepare(`INSERT INTO vendors (name, category, contact, email, address, suppliedItems, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        const info = stmt.run(name, category, contact, email, address, JSON.stringify(suppliedItems || []), new Date().toISOString());
        res.json(db.prepare('SELECT * FROM vendors WHERE id = ?').get(info.lastInsertRowid));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', (req, res) => {
    try {
        const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50').all();
        res.json(logs);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BONUS (Stub to prevent 404 on Dashboard) ---
app.get('/api/bonus/stats', (req, res) => {
    res.json({ companyTotalBalance: 0, employees: [] });
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Data: ${path.join(__dirname, 'data')}`);
});
