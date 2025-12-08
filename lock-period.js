#!/usr/bin/env node

/**
 * Quick script to lock the payroll period to 08-Dec-2025 → 21-Dec-2025
 * Usage: node lock-period.js
 */

const http = require('http');

const data = JSON.stringify({
    start: '2025-12-08',
    end: '2025-12-21',
    lockedBy: 'Admin (Manual Lock Script)'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/payroll/lock-period',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('🔒 Locking payroll period to 08-Dec-2025 → 21-Dec-2025...\n');

const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            const result = JSON.parse(responseData);
            console.log('✅ SUCCESS! Payroll period locked successfully.');
            console.log('\nPeriod Details:');
            console.log(`  Start Date: ${result.period.start}`);
            console.log(`  End Date: ${result.period.end}`);
            console.log(`  Locked By: ${result.period.lockedBy}`);
            console.log(`  Locked At: ${new Date(result.period.lockedAt).toLocaleString()}`);
            console.log('\n📌 The current period will now show as 08-Dec-2025 – 21-Dec-2025');
            console.log('📌 Automatic period calculations are now disabled');
            console.log('📌 07-Dec-2025 is excluded from this period');
            console.log('\n🎯 To unlock: Use the "Unlock" button on the Payroll page or call /api/payroll/unlock-period');
        } else {
            console.error(`❌ ERROR: Failed to lock period (HTTP ${res.statusCode})`);
            console.error('Response:', responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ ERROR: Failed to connect to server');
    console.error('Error:', error.message);
    console.error('\n💡 Make sure the server is running on http://localhost:3000');
});

req.write(data);
req.end();
