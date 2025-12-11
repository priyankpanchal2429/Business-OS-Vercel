const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

// Hitesh ID
const hiteshId = 1765228926417;
const periodStart = '2025-10-27';
const periodEnd = '2025-11-09';

// Find the saved entry
const entryIndex = (data.payroll_entries || []).findIndex(p =>
    p.employeeId === hiteshId && p.periodStart === periodStart && p.periodEnd === periodEnd
);

if (entryIndex === -1) {
    console.log("Entry not found.");
    process.exit(1);
}

console.log("Found entry. Patching bonus...");

// Calculate Correct Bonus (8 days)
// We know from debug script it's 8 days.
const bonusDays = 8;
const amountPerDay = data.settings.bonus.amountPerDay || 35;

// Update details
data.payroll_entries[entryIndex].details = data.payroll_entries[entryIndex].details || {};
data.payroll_entries[entryIndex].details.bonus = {
    currentCycleDays: bonusDays, // It's the first period, so cycle = total
    currentCycleAmount: bonusDays * amountPerDay,
    ytdDays: bonusDays,
    ytdAccrued: bonusDays * amountPerDay,
    totalWithdrawn: 0,
    balance: bonusDays * amountPerDay,
    ratePerDay: amountPerDay,
    yearStart: '2025-10-27',
    yearEnd: '2026-11-08',
    // Add breakdown if needed, but YTD is key
    breakdown: [
        { startDate: periodStart, endDate: periodEnd, days: bonusDays, amount: bonusDays * amountPerDay }
    ]
};

// Log change
data.audit_logs.push({
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action: 'PAYROLL_UPDATE_SYSTEM',
    details: `Patched Hitesh Bonus for ${periodEnd} to 8 days`
});

fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
console.log("Successfully patched Hitesh's bonus data.");
