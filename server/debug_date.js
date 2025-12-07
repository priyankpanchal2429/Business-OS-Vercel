
// Simulate Server Date Logic
const now = new Date();
const offset = now.getTimezoneOffset() * 60000; // Client (Mac) offset
const localDate = new Date(now.getTime() - offset);
const todayStr = localDate.toISOString().split('T')[0];

console.log('Server Logic Today:', todayStr);
console.log('Current Time (ISO):', now.toISOString());
console.log('Offset (mins):', now.getTimezoneOffset());

// Simulate "User" adding entry for "2025-12-07" (Today in IST)
const entryDate = "2025-12-07";

if (entryDate === todayStr) {
    console.log('MATCH: Entry date matches Server Today');
} else {
    console.log('MISMATCH: Entry date', entryDate, 'does not match Server Today', todayStr);
}
