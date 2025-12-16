// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('./middleware/auth');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---

// Uploads Directory
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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

app.get('/', (req, res) => {
    res.send({ status: 'OK', message: 'Business-OS Backend Running', time: new Date().toISOString() });
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
        const { name, category, type, stock, price, description, vendorName, lowStockThreshold } = req.body;
        const stmt = db.prepare(`
            INSERT INTO inventory (name, category, type, stock, price, description, vendorName, lowStockThreshold, lastUpdated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const info = stmt.run(name, category, type, stock || 0, price || 0, description, vendorName, lowStockThreshold || 5, new Date().toISOString());
        const newItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(info.lastInsertRowid);
        res.json(newItem);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Data: ${path.join(__dirname, 'data')}`);
});
