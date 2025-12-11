const fs = require('fs');
const path = require('path');

const dataPath = '/Users/priyank/Documents/GitHub/Business-OS/server/data/data.json';

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Loaded data.json. Found ${data.employees.length} employees, ${data.timesheet_entries.length} timesheet entries, ${data.audit_logs ? data.audit_logs.length : 0} audit logs.`);

    // Find Hitesh
    const hitesh = data.employees.find(e => e.name.toLowerCase().includes('hitesh'));
    if (!hitesh) {
        console.error('Hitesh not found!');
        process.exit(1);
    }
    console.log(`Found Hitesh (ID: ${hitesh.id})`);

    // Check existing entries for Oct 27 - Nov 09
    const startObj = new Date('2025-10-27');
    const endObj = new Date('2025-11-23');

    const existing = data.timesheet_entries.filter(e => {
        const d = new Date(e.date);
        return e.employeeId === hitesh.id && d >= startObj && d <= endObj;
    });

    console.log(`Existing entries for Hitesh (Oct 27 - Nov 23):`);
    existing.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(e => {
        console.log(`- ${e.date}: ${e.dayType} (${e.totalMinutes}m)`);
    });

    // Check audit logs for deletion or updates
    // We are looking for logs that might contain the lost data
    console.log('\nScanning Audit Logs...');
    const relevantLogs = (data.audit_logs || []).filter(l =>
        l.targetId === hitesh.id &&
        (l.action.includes('TIMESHEET') || l.action.includes('PAYROLL'))
    );

    relevantLogs.forEach(l => {
        console.log(`[${l.timestamp}] ${l.action}: ${l.details}`);
    });

} catch (e) {
    console.error('Error:', e.message);
}
