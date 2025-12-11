const fs = require('fs');
const path = require('path');

const backupPath = '/Users/priyank/Documents/GitHub/Business-OS/server/backups/data_backup_2025-12-11T08-47-22-212Z.json';

try {
    const rawData = fs.readFileSync(backupPath, 'utf8');
    const data = JSON.parse(rawData);

    // Find Hitesh
    const hitesh = data.employees.find(e => e.name.toLowerCase().includes('hitesh'));
    if (!hitesh) {
        console.error('Hitesh not found in backup!');
        process.exit(1);
    }
    console.log(`Found Hitesh in BACKUP (ID: ${hitesh.id})`);

    // Check entries for Oct 27 - Nov 09
    const startObj = new Date('2025-10-27');
    const endObj = new Date('2025-11-09');

    const existing = data.timesheet_entries.filter(e => {
        const d = new Date(e.date);
        return e.employeeId === hitesh.id && d >= startObj && d <= endObj;
    });

    console.log(`Found ${existing.length} entries in backup for Hitesh (Oct 27 - Nov 09):`);
    existing.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => {
        console.log(`- ${e.date}: ${e.dayType} (${e.totalMinutes}m)`);
    });

} catch (e) {
    console.error('Error:', e.message);
}
