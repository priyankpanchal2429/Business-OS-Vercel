const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Find Hitesh (Active)
// const hitesh = data.employees.find(e => e.name.toLowerCase().includes('hitesh') && e.status === 'active');
const hitesh = data.employees.find(e => e.id === 1765228926417);

if (!hitesh) {
    console.log("Hitesh (ID: 1765228926417) not found.");
    process.exit(1);
}

console.log(`Found Hitesh: ${hitesh.name} (ID: ${hitesh.id}, Status: ${hitesh.status})`);

// Bonus Settings
const bonusSettings = data.settings.bonus || { startDate: '2025-01-01', endDate: '2025-12-31', amountPerDay: 35 };
console.log(`Bonus Settings: Start=${bonusSettings.startDate}, End=${bonusSettings.endDate}`);

// Count Working Days
const periodEnd = '2025-11-09';
const safeBonusEndDate = new Date(periodEnd) > new Date(bonusSettings.endDate) ? bonusSettings.endDate : periodEnd;

console.log(`Calculating Bonus up to: ${safeBonusEndDate}`);

const entries = (data.timesheet_entries || []).filter(e => {
    return e.employeeId === hitesh.id &&
        e.date >= bonusSettings.startDate && e.date <= safeBonusEndDate &&
        (e.clockIn || e.shiftStart);
});

console.log(`Total Bonus Days Counted: ${entries.length}`);
console.log("--- Detailed Days ---");
console.log("--- Saved Payroll Entries for Hitesh ---");
const savedEntries = (data.payroll_entries || []).filter(p => p.employeeId === hitesh.id);
savedEntries.forEach(entry => {
    console.log(`Period: ${entry.periodStart} to ${entry.periodEnd}`);
    if (entry.details && entry.details.bonus) {
        console.log(`  Saved Bonus Data:`, JSON.stringify(entry.details.bonus));
    } else {
        console.log(`  No Bonus Data Saved`);
    }
});
