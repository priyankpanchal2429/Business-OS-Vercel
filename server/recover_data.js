const fs = require('fs');
const path = require('path');

const backupsDir = '/Users/priyank/Documents/GitHub/Business-OS/server/backups';

try {
    const files = fs.readdirSync(backupsDir)
        .filter(f => f.startsWith('data_backup_') && f.endsWith('.json'))
        .sort().reverse(); // Newest first

    console.log(`Scanning ${files.length} backups...`);

    let foundEntries = new Map(); // Date -> Entry

    const startObj = new Date('2025-10-27');
    const endObj = new Date('2025-11-23');

    // We only care about Hitesh
    const targetName = 'Hitesh';

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(backupsDir, file), 'utf8');
            const data = JSON.parse(raw);

            const hitesh = data.employees?.find(e => e.name.toLowerCase().includes(targetName.toLowerCase()));
            if (!hitesh) continue;

            const entries = (data.timesheet_entries || []).filter(e => {
                const d = new Date(e.date);
                return e.employeeId === hitesh.id && d >= startObj && d <= endObj;
            });

            if (entries.length > 0) {
                // console.log(`[${file}] Found ${entries.length} candidate entries`);
                entries.forEach(e => {
                    // If we haven't found a "good" entry for this date yet, or if this one is "better" (has minutes)
                    // Actually, since we iterate newest to oldest, the first one we find is the latest state.
                    // BUT, we want to find the latest state *that has data*.

                    if (!foundEntries.has(e.date)) {
                        if (e.totalMinutes > 0 || (e.clockIn && e.clockOut)) {
                            foundEntries.set(e.date, { ...e, sourceBackup: file });
                        }
                    }
                });
            }
        } catch (err) {
            // Ignore corrupted backups
        }
    }

    console.log(`\n=== RECOVERY RESULTS for ${targetName} ===`);
    if (foundEntries.size === 0) {
        console.log('No recoverable data found in any backup.');
    } else {
        const sortedDates = Array.from(foundEntries.keys()).sort();
        sortedDates.forEach(date => {
            const e = foundEntries.get(date);
            console.log(`[RECOVERABLE] ${date}: ${e.dayType} (${e.totalMinutes}m) - from ${e.sourceBackup}`);
        });

        console.log(`\nTo restore, run this SQL (or manual insert):`);
        console.log(`-- Insert Logic Here --`);
    }

} catch (e) {
    console.error('Fatal Error:', e);
}
