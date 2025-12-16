const fs = require('fs');
const path = require('path');
const db = require('./database');

const DATA_FILE = path.join(__dirname, 'data', 'data.json');

if (!fs.existsSync(DATA_FILE)) {
    console.error('No data.json found!');
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

console.log('Starting migration...');

const insertMany = (table, items, mapFn) => {
    if (!items || items.length === 0) return;
    console.log(`Migrating ${items.length} items to ${table}...`);
    const stmt = db.prepare(`INSERT OR IGNORE INTO ${table} (${Object.keys(mapFn(items[0])).join(', ')}) VALUES (${Object.keys(mapFn(items[0])).map(k => '@' + k).join(', ')})`);
    const insert = db.transaction((rows) => {
        for (const row of rows) stmt.run(mapFn(row));
    });
    insert(items);
};

// 1. Inventory
insertMany('inventory', data.inventory, (item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    type: item.type,
    stock: item.stock || 0,
    price: item.price || 0,
    description: item.description,
    imageUrl: item.imageUrl,
    vendorName: item.vendorName,
    vendorContact: item.vendorContact,
    lowStockThreshold: item.lowStockThreshold || 5,
    lastUpdated: item.lastUpdated || new Date().toISOString()
}));

// 2. Vendors
insertMany('vendors', data.vendors, (item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    contact: item.contact,
    email: item.email,
    address: item.address,
    suppliedItems: JSON.stringify(item.suppliedItems || [])
}));

// 3. Employees
insertMany('employees', data.employees, (item) => ({
    id: item.id,
    name: item.name,
    role: item.role,
    category: item.category,
    status: item.status || 'Active',
    joiningDate: item.joiningDate,
    exitDate: item.lastWorkingDay || item.resignedDate, // Normalize
    email: item.email,
    phone: item.phone,
    address: item.address,
    salary: item.salary || 0,
    hourlyRate: item.hourlyRate || 0, // Ensure hourly rate is migrated
    image: item.image,
    bankDetails: JSON.stringify(item.bankDetails || {}),
    emergencyContact: JSON.stringify(item.emergencyContact || {}),
    documents: JSON.stringify(item.documents || []),
    shiftStart: item.shiftStart,
    shiftEnd: item.shiftEnd || '18:00',
    workingDays: JSON.stringify(item.workingDays || []),
    perShiftAmount: item.perShiftAmount,
    pfNumber: item.pfNumber,
    insuranceNumber: item.insuranceNumber
}));

// 4. Payroll Entries
insertMany('payroll_entries', data.payroll_entries, (item) => ({
    id: String(item.id),
    employeeId: item.employeeId,
    employeeName: item.employeeName || item.frozenEmployeeName,
    employeeRole: item.employeeRole || item.frozenEmployeeRole,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    grossPay: item.grossPay,
    deductions: item.deductions,
    advanceDeductions: item.advanceDeductions,
    loanDeductions: item.loanDeductions,
    netPay: item.netPay,
    status: item.status,
    paidAt: item.paidAt,
    paymentDetails: JSON.stringify(item.paymentDetails || {}),
    isAdjusted: item.isAdjusted ? 1 : 0,
    frozenData: JSON.stringify({
        frozenEmployeeName: item.frozenEmployeeName,
        frozenEmployeeRole: item.frozenEmployeeRole,
        frozenEmployeeImage: item.frozenEmployeeImage,
        frozenPerShiftAmount: item.frozenPerShiftAmount,
        frozenHourlyRate: item.frozenHourlyRate,
        frozenSalary: item.frozenSalary,
        frozenTimesheet: item.frozenTimesheet,
        frozenAdvances: item.frozenAdvances,
        frozenLoans: item.frozenLoans,
        frozenLoanSummary: item.frozenLoanSummary,
        frozenBonus: item.frozenBonus
    })
}));

// 5. Timesheet
// Flatten timesheet entries if they are nested or just standard list?
// Inspecting data structure usage suggests data.timesheet_entries is a list
insertMany('timesheet', data.timesheet_entries, (item) => ({
    id: item.id || `${item.employeeId}_${item.date}`,
    employeeId: item.employeeId,
    date: item.date,
    clockIn: item.clockIn || item.shiftStart,
    clockOut: item.clockOut || item.shiftEnd,
    breakMinutes: item.breakMinutes || 0,
    status: item.status,
    dayType: item.dayType
}));

// 6. Deductions
insertMany('deductions', data.deductions, (item) => ({
    // id: item.id, // Let AUTOINCREMENT handle it since some might conflict or be missing
    employeeId: item.employeeId,
    type: item.type,
    amount: item.amount,
    description: item.description,
    date: item.date,
    periodStart: item.periodStart,
    periodEnd: item.periodEnd,
    status: item.status,
    linkedAdvanceId: item.linkedAdvanceId
}));

// 7. Advance Salaries
insertMany('advance_salaries', data.advance_salaries, (item) => ({
    id: String(item.id),
    employeeId: item.employeeId,
    amount: item.amount,
    dateIssued: item.dateIssued || item.date,
    reason: item.reason,
    installments: item.installments,
    deductedAmount: item.deductedAmount || 0,
    status: item.status
}));

// 8. Loans
insertMany('loans', data.loans, (item) => ({
    id: String(item.id),
    employeeId: item.employeeId,
    amount: item.amount,
    date: item.date,
    reason: item.reason,
    interestRate: item.interestRate || 0,
    monthlyInstalment: item.monthlyInstalment || item.monthlyInstallment,
    paidAmount: item.paidAmount || 0,
    status: item.status
}));

// 9. Bonus Withdrawals
insertMany('bonus_withdrawals', data.bonus_withdrawals, (item) => ({
    id: String(item.id),
    employeeId: item.employeeId,
    amount: item.amount,
    date: item.date,
    status: item.status,
    approvedBy: item.approvedBy
}));

// 10. Settings
if (data.settings) {
    const settingsEntries = Object.entries(data.settings).map(([key, value]) => ({
        key,
        value: JSON.stringify(value)
    }));
    insertMany('settings', settingsEntries, (item) => item);
}

// 11. Audit Logs
insertMany('audit_logs', data.audit_logs, (item) => ({
    id: String(item.id),
    action: item.action || 'UNKNOWN',
    targetId: String(item.targetId || ''),
    actor: item.actor || 'System',
    timestamp: item.timestamp || new Date().toISOString(),
    details: typeof item.details === 'object' ? JSON.stringify(item.details) : String(item.details || '')
}));

console.log('Migration completed successfully.');
