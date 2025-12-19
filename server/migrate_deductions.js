
const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

const DATA_FILE = path.join(__dirname, 'data/data.json');

async function migrateDeductions() {
    console.log('🚀 Starting Deduction Migration...');

    if (!fs.existsSync(DATA_FILE)) return;

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entries = data.deduction_entries || [];

    if (entries.length === 0) return;

    console.log(`📊 Found ${entries.length} entries. Syncing...`);

    let successCount = 0;
    const batchSize = 50;
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize).map(e => ({
            employeeId: parseInt(e.employeeId),
            date: e.date,
            description: e.description || '',
            amount: parseFloat(e.amount) || 0,
            type: e.type || 'advance',
            status: e.status || 'active',
            created_at: e.createdAt || new Date().toISOString()
        }));

        const { error } = await supabase.from('deduction_entries').insert(batch);
        if (error) console.error(`❌ Batch failed:`, error.message);
        else successCount += batch.length;
    }
    console.log(`✅ Success: ${successCount}`);
}

migrateDeductions();
