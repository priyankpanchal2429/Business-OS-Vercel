
const fs = require('fs');
const path = require('path');

const files = [
    'server/data/data.json',
    'server/data/data.production',
    'server/data/data.production.json'
];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
        console.log(`[MISSING] ${file}`);
        return;
    }
    console.log(`Checking ${file}...`);
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        console.log(`Read ${raw.length} bytes.`);
        JSON.parse(raw);
        console.log(`[VALID] ${file}`);
    } catch (err) {
        console.error(`[INVALID] ${file}:`, err.message);
    }
});
