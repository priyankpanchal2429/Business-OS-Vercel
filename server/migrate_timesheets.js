
const fs = require('fs');
const path = require('path');
const supabase = require('./config/supabase');

const DATA_FILE = path.join(__dirname, 'data/data.json');

async function migrateTimesheets() {
    console.log('🚀 Starting Timesheet Migration...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('❌ data/data.json not found!');
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const entries = data.timesheet_entries || [];

    if (entries.length === 0) {
        console.log('ℹ️ No timesheet entries found in data.json');
        return;
    }

    console.log(`📊 Found ${entries.length} entries in data.json. Syncing to Supabase...`);

    // Fetch existing unique_ids to avoid duplicates if possible, or just use upsert
    // The table uses unique_id (UUID) as PK, but we have employeeId + date as logical key

    let successCount = 0;
    let failCount = 0;

    // Process in batches to avoid overwhelming Supabase or hitting timeouts
    const batchSize = 50;
    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize).map(e => ({
            employeeId: parseInt(e.employeeId),
            date: e.date,
            clockIn: e.clockIn || e.shiftStart || null,
            clockOut: e.clockOut || e.shiftEnd || null,
            shiftStart: e.shiftStart || null,
            shiftEnd: e.shiftEnd || null,
            breakMinutes: parseInt(e.breakMinutes) || 0,
            dayType: e.dayType || 'Work',
            status: e.status || 'active',
            created_at: e.createdAt || new Date().toISOString()
        }));

        const { error } = await supabase
            .from('timesheet_entries')
            .insert(batch);

        if (error) {
            console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
            failCount += batch.length;
        } else {
            successCount += batch.length;
            console.log(`✅ Synced batch ${i / batchSize + 1}...`);
        }
    }

    console.log(`\n🎉 Migration Complete!`);
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

migrateTimesheets();
