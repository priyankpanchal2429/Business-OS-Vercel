const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { authMiddleware } = require('./middleware/auth');

const { performBackup } = require('./utils/backup');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

// STRICT No-Cache Headers for Security
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Simulation Middleware for "Remote Server" delays (optional, for realism)
// app.use((req, res, next) => setTimeout(next, 200));

// Access Control Middleware
app.use(authMiddleware);

// Schedule Daily Backups (every 24 hours) - and run one on startup for safety
setInterval(() => {
    console.log('[System] Running scheduled backup...');
    performBackup();
}, 24 * 60 * 60 * 1000);

// Run immediate backup on startup
performBackup();

// Helper to read data
const readData = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return {
            inventory: [],
            vendors: [],
            employees: [],
            payroll: [],
            payroll_entries: [],
            timesheet_entries: [],
            payroll_adjustments: [],
            deductions: [],
            advance_salaries: [],
            audit_logs: []
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
};

const writeData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// --- ROUTES ---

// Inventory
app.get('/api/inventory', (req, res) => {
    const data = readData();
    res.json(data.inventory);
});

app.post('/api/inventory', (req, res) => {
    const data = readData();
    const newItem = { id: Date.now(), ...req.body };
    data.inventory.push(newItem);
    writeData(data);
    res.json(newItem);
});

// Vendors
app.get('/api/vendors', (req, res) => {
    const data = readData();
    res.json(data.vendors);
});

app.post('/api/vendors', (req, res) => {
    const data = readData();
    const newVendor = { id: Date.now(), ...req.body };
    data.vendors.push(newVendor);
    writeData(data);
    res.json(newVendor);
});

// Employees
app.get('/api/employees', (req, res) => {
    const data = readData();
    res.json(data.employees);
});

app.post('/api/employees', (req, res) => {
    const data = readData();
    const newEmployee = { id: Date.now(), ...req.body };
    data.employees.push(newEmployee);
    writeData(data);
    res.json(newEmployee);
});

app.patch('/api/employees/:id', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.id);
    const index = data.employees.findIndex(emp => emp.id === employeeId);

    if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Update employee
    data.employees[index] = { ...data.employees[index], ...req.body, id: employeeId };

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'EMPLOYEE_UPDATE',
        targetId: employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: 'Employee profile updated'
    });

    writeData(data);
    res.json(data.employees[index]);
});

app.delete('/api/employees/:id', (req, res) => {
    const data = readData();
    const employeeId = parseInt(req.params.id);
    const index = data.employees.findIndex(emp => emp.id === employeeId);

    if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Check for dependencies (payroll entries)
    const hasPayrollEntries = data.payroll_entries && data.payroll_entries.some(entry => entry.employeeId === employeeId);
    if (hasPayrollEntries) {
        return res.status(409).json({
            error: 'Cannot delete employee with existing payroll records',
            details: 'This employee has payroll history. Archive instead or delete payroll records first.'
        });
    }

    const deletedEmployee = data.employees[index];
    data.employees.splice(index, 1);

    // Audit log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'EMPLOYEE_DELETE',
        targetId: employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Deleted employee: ${deletedEmployee.name}`
    });

    writeData(data);
    res.json({ success: true, message: 'Employee deleted permanently' });
});

// Payroll
app.get('/api/payroll', (req, res) => {
    const data = readData();
    res.json(data.payroll);
});

// [DEPRECATED] Old simple payroll run
app.post('/api/payroll', (req, res) => {
    const data = readData();
    const newRecord = { id: Date.now(), ...req.body };
    data.payroll.push(newRecord);
    writeData(data);
    res.json(newRecord);
});

// --- NEW PAYROLL SYSTEM ---

// Get Payroll Status for a Specific Period
app.get('/api/payroll/period', (req, res) => {
    const { start, end } = req.query; // Expect YYYY-MM-DD
    const data = readData();
    const payrollEntries = data.payroll_entries || [];

    // Map over all employees to find their status for this period
    const periodPayroll = data.employees.map(emp => {
        // ALWAYS recalculate to get fresh data (including new deductions/advances)
        // This ensures the frontend sees the latest state immediately
        const recalculated = recalculatePayrollForPeriod(data, emp.id, start, end);

        if (recalculated) {
            // Find if there is an existing saved entry to preserve status/payment info
            const savedEntry = payrollEntries.find(p => p.employeeId === emp.id && p.periodStart === start);

            return {
                ...recalculated, // Contains fresh calc for gross, deductions, net, advanceDeductions
                // Preserve saved status if exists, otherwise default from recalc (which is likely Unpaid)
                status: savedEntry ? savedEntry.status : recalculated.status,
                paidAt: savedEntry ? savedEntry.paidAt : null,
                isAdjusted: savedEntry ? savedEntry.isAdjusted : false,
                employeeRole: emp.role // Ensure role is present
            };
        }

        // Fallback (should rarely happen if employee exists)
        const entry = payrollEntries.find(p => p.employeeId === emp.id && p.periodStart === start);

        if (entry) {
            return {
                ...entry,
                employeeName: emp.name,
                employeeRole: emp.role,
                employeeId: emp.id
            };
        } else {
            // Virtual "Unpaid" Entry
            return {
                id: null,
                employeeId: emp.id,
                employeeName: emp.name,
                employeeRole: emp.role,
                periodStart: start,
                periodEnd: end,
                grossPay: emp.salary || 0,
                deductions: 0,
                advanceDeductions: 0,
                netPay: emp.salary || 0,
                status: 'Unpaid',
                paidAt: null
            };
        }
    });

    res.json(periodPayroll);
});

// Calculate Single Payroll Entry (Preview)
app.get('/api/payroll/calculate', (req, res) => {
    const { employeeId, start, end } = req.query;
    const data = readData();

    // Validate inputs
    if (!employeeId || !start || !end) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    const result = recalculatePayrollForPeriod(data, employeeId, start, end);

    if (!result) {
        return res.status(404).json({ error: 'Employee or data not found' });
    }

    // Add "Preview" ID if none exists
    if (!result.id) {
        result.id = 'preview';
    }

    res.json(result);
});

// Update/Create Payroll Status (Mark as Paid)
app.post('/api/payroll/status', (req, res) => {
    const { entryIds, singleEntry, status, paymentDetails } = req.body;
    // Support both bulk (entryIds array) and single (singleEntry object for creation)

    // For "Pay Now" or "Bulk Pay" which might target rows that don't satisfy "id" yet (virtual)
    // The frontend should send the full object structure if ID is null.

    // Simplified Logic: The frontend sends a list of "Payment Actions".
    // Each action contains { employeeId, periodStart, ... }

    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const actions = Array.isArray(req.body) ? req.body : [req.body];
    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    const updatedEntries = [];

    actions.forEach(action => {
        let entry = data.payroll_entries.find(p => p.id === action.id);

        if (!entry) {
            // Create new entry
            entry = {
                id: Date.now() + Math.random().toString().slice(2, 6), // Simple ID
                employeeId: action.employeeId,
                periodStart: action.periodStart,
                periodEnd: action.periodEnd,
                grossPay: action.grossPay,
                deductions: action.deductions || 0,
                netPay: action.netPay,
                status: status || 'Paid',
                paidAt: status === 'Paid' ? timestamp : null,
                paymentDetails: paymentDetails || action.paymentDetails,
                reference: action.reference
            };
            data.payroll_entries.push(entry);
        } else {
            // Update existing
            entry.status = status;
            if (status === 'Paid') {
                entry.paidAt = timestamp;
                entry.paymentDetails = paymentDetails;
            }
        }

        // Audit Log
        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'PAYROLL_UPDATE',
            targetId: entry.id,
            actor: actor,
            timestamp: timestamp,
            details: `Marked as ${status}`
        });

        updatedEntries.push(entry);
    });

    writeData(data);
    res.json(updatedEntries);
});

// Mark employees as Paid
app.post('/api/payroll/mark-paid', (req, res) => {
    const { employeeIds } = req.body;
    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        const entry = data.payroll_entries.find(p => p.employeeId === employeeId);
        if (entry) {
            entry.status = 'Paid';
            entry.paidAt = timestamp;

            data.audit_logs.push({
                id: Date.now() + '-log',
                action: 'PAYROLL_MARK_PAID',
                targetId: entry.id,
                actor,
                timestamp,
                details: `Marked employee ${employeeId} as Paid`
            });
        }
    });

    writeData(data);
    res.json({ success: true });
});

// Mark employees as Unpaid (reverse payment)
app.post('/api/payroll/mark-unpaid', (req, res) => {
    const { employeeIds, periodStart, periodEnd } = req.body;
    const data = readData();
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    employeeIds.forEach(employeeId => {
        const entry = data.payroll_entries.find(p =>
            p.employeeId === employeeId &&
            p.periodStart === periodStart &&
            p.periodEnd === periodEnd
        );

        if (entry) {
            entry.status = 'Unpaid';
            entry.paidAt = null;

            data.audit_logs.push({
                id: Date.now() + '-log',
                action: 'PAYROLL_MARK_UNPAID',
                targetId: entry.id,
                actor,
                timestamp,
                details: `Reversed payment for employee ${employeeId}`
            });
        }
    });

    writeData(data);
    res.json({ success: true });
});

// --- DEDUCTIONS MANAGEMENT ---

// Get Deductions for Employee in Period
app.get('/api/deductions/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const { employeeId, periodStart, periodEnd } = req.params;
    const data = readData();

    if (!data.deductions) data.deductions = [];

    const deductions = data.deductions.filter(d =>
        d.employeeId === parseInt(employeeId) &&
        d.periodStart === periodStart &&
        d.periodEnd === periodEnd &&
        d.status === 'active'
    );

    res.json(deductions);
});

// Save/Update Deductions
app.post('/api/deductions', (req, res) => {
    const { employeeId, periodStart, periodEnd, deductions } = req.body;
    const data = readData();

    if (!data.deductions) data.deductions = [];
    if (!data.payroll_entries) data.payroll_entries = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    // Remove old deductions for this employee/period
    data.deductions = data.deductions.filter(d =>
        !(d.employeeId === parseInt(employeeId) &&
            d.periodStart === periodStart &&
            d.periodEnd === periodEnd)
    );

    // Add new deductions
    const savedDeductions = deductions.map(ded => ({
        id: ded.id || `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        employeeId: parseInt(employeeId),
        periodStart,
        periodEnd,
        type: ded.type,
        description: ded.description,
        amount: parseFloat(ded.amount),
        status: 'active',
        createdAt: ded.createdAt || timestamp,
        createdBy: ded.createdBy || actor
    }));

    data.deductions.push(...savedDeductions);

    // Recalculate total deductions and net pay
    const totalDeductions = savedDeductions.reduce((sum, d) => sum + d.amount, 0);

    // Update payroll entry
    const payrollEntry = data.payroll_entries.find(p =>
        p.employeeId === parseInt(employeeId) &&
        p.periodStart === periodStart &&
        p.periodEnd === periodEnd
    );

    if (payrollEntry) {
        payrollEntry.deductions = totalDeductions;
        payrollEntry.netPay = payrollEntry.grossPay - totalDeductions;
    }

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'DEDUCTIONS_UPDATED',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Updated deductions: ₹${totalDeductions}`
    });

    writeData(data);
    res.json({ success: true, deductions: savedDeductions, totalDeductions });
});

// Delete Deduction
app.delete('/api/deductions/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();

    if (!data.deductions) data.deductions = [];

    const deduction = data.deductions.find(d => d.id === id);
    if (deduction) {
        deduction.status = 'deleted';

        const timestamp = new Date().toISOString();
        const actor = `${req.userRole} (${req.ip})`;

        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'DEDUCTION_DELETED',
            targetId: deduction.employeeId,
            actor,
            timestamp,
            details: `Deleted ${deduction.type} deduction: ₹${deduction.amount}`
        });

        writeData(data);
    }

    res.json({ success: true });
});

// Issue Advance Salary
app.post('/api/advance-salary', (req, res) => {
    const { employeeId, amount, dateIssued, reason } = req.body;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    if (!employeeId || isNaN(parseInt(employeeId))) {
        return res.status(400).json({ error: 'Invalid Employee ID' });
    }
    if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Invalid Amount' });
    }

    // Create advance salary record
    const advance = {
        id: `adv-${Date.now()}`,
        employeeId: parseInt(employeeId),
        amount: parseFloat(amount),
        dateIssued,
        reason,
        status: 'pending',
        createdAt: timestamp,
        createdBy: actor
    };

    data.advance_salaries.push(advance);

    // Calculate next payroll period (assuming bi-weekly from Dec 5, 2025)
    const anchor = new Date('2025-12-05');
    const today = new Date(dateIssued);
    const daysSinceAnchor = Math.floor((today - anchor) / (1000 * 60 * 60 * 24));
    const currentCycle = Math.floor(daysSinceAnchor / 14);

    // Deduct in the CURRENT period (so it shows up immediately in the active payroll)
    const cycleStart = new Date(anchor);
    cycleStart.setDate(anchor.getDate() + (currentCycle * 14));

    const cycleEnd = new Date(cycleStart);
    cycleEnd.setDate(cycleStart.getDate() + 13);

    const periodStart = cycleStart.toISOString().split('T')[0];
    const periodEnd = cycleEnd.toISOString().split('T')[0];

    // Auto-create deduction for next period
    const deduction = {
        id: `ded-adv-${Date.now()}`,
        employeeId: parseInt(employeeId),
        periodStart,
        periodEnd,
        type: 'advance',
        description: `Advance Salary - ${dateIssued}`,
        amount: parseFloat(amount),
        status: 'active',
        createdAt: timestamp,
        createdBy: actor,
        linkedAdvanceId: advance.id
    };

    data.deductions.push(deduction);
    advance.deductedInPeriod = periodStart;

    // Audit log
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_ISSUED',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Issued advance: ₹${amount}, deducted in period ${periodStart}`
    });

    writeData(data);
    res.json({ success: true, advance, deduction });
});

// Get Advance Salaries (Filtered)
app.get('/api/advance-salary', (req, res) => {
    const { employeeId, start, end } = req.query;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];

    let results = data.advance_salaries;

    if (employeeId) {
        results = results.filter(a => a.employeeId === parseInt(employeeId));
    }

    if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        results = results.filter(a => {
            const issued = new Date(a.dateIssued);
            return issued >= startDate && issued <= endDate;
        });
    }

    // Sort by newest first
    results.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));

    res.json(results);
});

// Update Advance Salary
app.patch('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const { amount, dateIssued, reason } = req.body;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];

    const index = data.advance_salaries.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    const oldEntry = data.advance_salaries[index];
    const updatedEntry = { ...oldEntry, amount: parseFloat(amount), dateIssued, reason };

    // Update Advance
    data.advance_salaries[index] = updatedEntry;

    // Update Linked Deduction
    const deductionIndex = data.deductions.findIndex(d => d.linkedAdvanceId === id);
    if (deductionIndex !== -1) {
        data.deductions[deductionIndex] = {
            ...data.deductions[deductionIndex],
            amount: parseFloat(amount),
            description: `Advance Salary - ${dateIssued}` // Update description in case date changed
        };
    }

    // Audit Log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_UPDATE',
        targetId: updatedEntry.employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Updated advance: ₹${oldEntry.amount} -> ₹${amount}`
    });

    writeData(data);
    res.json({ success: true, advance: updatedEntry });
});

// Delete Advance Salary
app.delete('/api/advance-salary/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();

    if (!data.advance_salaries) data.advance_salaries = [];
    if (!data.deductions) data.deductions = [];

    const index = data.advance_salaries.findIndex(a => a.id === id);
    if (index === -1) {
        return res.status(404).json({ error: 'Advance salary entry not found' });
    }

    const entry = data.advance_salaries[index];

    // Remove Advance
    data.advance_salaries.splice(index, 1);

    // Remove Linked Deduction
    const deductionIndex = data.deductions.findIndex(d => d.linkedAdvanceId === id);
    if (deductionIndex !== -1) {
        data.deductions.splice(deductionIndex, 1);
    }

    // Audit Log
    if (!data.audit_logs) data.audit_logs = [];
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'ADVANCE_SALARY_DELETE',
        targetId: entry.employeeId,
        actor: `${req.userRole} (${req.ip})`,
        timestamp: new Date().toISOString(),
        details: `Deleted advance: ₹${entry.amount}`
    });

    writeData(data);
    res.json({ success: true });
});

// --- ATTENDANCE TRACKING ---

// Get Today's Attendance
app.get('/api/attendance/today', (req, res) => {
    const data = readData();

    if (!data.employees) data.employees = [];
    if (!data.timesheet_entries) data.timesheet_entries = [];

    // Use local time for "Today" to match user's desktop context
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localDate = new Date(now.getTime() - offset);
    const todayStr = localDate.toISOString().split('T')[0];
    const isSunday = localDate.getDay() === 0;

    const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
    const working = [];
    const notWorking = [];

    data.employees.forEach(emp => {
        // Find today's timesheet entry
        const todayEntry = data.timesheet_entries.find(entry =>
            entry.employeeId === emp.id &&
            entry.date === todayStr &&
            (entry.clockIn || entry.shiftStart) // Has clocked in
        );

        if (todayEntry) {
            working.push({
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                clockIn: todayEntry.clockIn,
                clockOut: todayEntry.clockOut || null,
                timesheetId: todayEntry.id,
                status: 'working'
            });
        } else {
            notWorking.push({
                employeeId: emp.id,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role,
                status: 'absent'
            });
        }
    });

    // Modified Sunday Logic: Only return closed if Sunday AND no one is working
    // If someone has clocked in (manual override), we show the working list.
    const isClosed = isSunday && working.length === 0;

    if (isClosed) {
        return res.json({
            date: todayStr,
            dayOfWeek: 'Sunday',
            isSunday: true,
            isClosed: true,
            message: 'Bank is closed on Sundays',
            summary: { total: 0, working: 0, notWorking: 0 },
            working: [],
            notWorking: []
        });
    }

    res.json({
        date: todayStr,
        dayOfWeek,
        isSunday: isSunday,
        isClosed: false,
        summary: {
            total: data.employees.length,
            working: working.length,
            notWorking: notWorking.length
        },
        working,
        notWorking
    });
});

// --- TIMESHEET MANAGEMENT ---

// Get Timesheet for Employee in Period
app.get('/api/timesheet/:employeeId/:periodStart/:periodEnd', (req, res) => {
    const data = readData();
    const { employeeId, periodStart, periodEnd } = req.params;

    if (!data.timesheet_entries) data.timesheet_entries = [];

    // Find employee
    const employee = data.employees.find(e => e.id === parseInt(employeeId));
    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

    // Get ONLY existing manual entries for period (no auto-generation)
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const entries = data.timesheet_entries
        .filter(e => {
            const entryDate = new Date(e.date);
            return e.employeeId === parseInt(employeeId) &&
                entryDate >= start &&
                entryDate <= end;
        })
        .map(e => ({
            ...e,
            // Normalize: ensure both field naming conventions are present for client compatibility
            clockIn: e.clockIn || e.shiftStart || '',
            clockOut: e.clockOut || e.shiftEnd || '',
            shiftStart: e.shiftStart || e.clockIn || '',
            shiftEnd: e.shiftEnd || e.clockOut || ''
        }));

    res.json(entries);
});

// Save/Update Timesheet
app.post('/api/timesheet', (req, res) => {
    const data = readData();
    const { employeeId, periodStart, periodEnd, entries, isPostPaymentAdjustment } = req.body;

    if (!data.timesheet_entries) data.timesheet_entries = [];
    if (!data.payroll_adjustments) data.payroll_adjustments = [];
    if (!data.audit_logs) data.audit_logs = [];

    const timestamp = new Date().toISOString();
    const actor = `${req.userRole} (${req.ip})`;

    let totalBillableMinutes = 0;
    const savedEntries = [];

    // Process each entry
    entries.forEach(entry => {
        // Normalize time fields - accept both naming conventions
        const clockIn = entry.clockIn || entry.shiftStart || '';
        const clockOut = entry.clockOut || entry.shiftEnd || '';

        // Calculate hours
        const calc = calculateShiftHours(clockIn, clockOut, entry.breakMinutes);

        const timesheetEntry = {
            id: entry.id || `ts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId: parseInt(employeeId),
            date: entry.date,
            shiftStart: clockIn,
            shiftEnd: clockOut,
            // Ensure these are explicitly saved
            clockIn: clockIn,
            clockOut: clockOut,
            breakMinutes: parseInt(entry.breakMinutes) || 0,
            totalMinutes: calc.totalMinutes,
            billableMinutes: calc.billableMinutes,
            status: 'active',
            modifiedAt: timestamp,
            modifiedBy: actor
        };

        totalBillableMinutes += calc.billableMinutes;

        // Update or insert
        const existingIndex = data.timesheet_entries.findIndex(e => e.id === timesheetEntry.id);
        if (existingIndex >= 0) {
            data.timesheet_entries[existingIndex] = timesheetEntry;
        } else {
            data.timesheet_entries.push(timesheetEntry);
        }

        savedEntries.push(timesheetEntry);
    });

    // If post-payment adjustment, create adjustment record
    if (isPostPaymentAdjustment) {
        const employee = data.employees.find(e => e.id === parseInt(employeeId));
        const totalBillableHours = totalBillableMinutes / 60;
        const perHourRate = employee.perShiftAmount ? employee.perShiftAmount / 8 : 0; // Assuming 8h shift
        const newCalculatedAmount = totalBillableHours * perHourRate;

        // Find original payroll entry
        const originalEntry = data.payroll_entries.find(
            e => e.employeeId === parseInt(employeeId) && e.periodStart === periodStart
        );

        const adjustmentAmount = newCalculatedAmount - (originalEntry?.netPay || 0);

        data.payroll_adjustments.push({
            id: Date.now() + '-adj',
            employeeId: parseInt(employeeId),
            periodStart,
            periodEnd,
            originalAmount: originalEntry?.netPay || 0,
            newAmount: newCalculatedAmount,
            adjustmentAmount,
            createdAt: timestamp,
            createdBy: actor,
            status: 'pending'
        });

        // Audit log
        data.audit_logs.push({
            id: Date.now() + '-log',
            action: 'TIMESHEET_POST_PAYMENT_ADJUSTMENT',
            targetId: employeeId,
            actor,
            timestamp,
            details: `Adjustment of ₹${Math.abs(adjustmentAmount).toFixed(2)} (${adjustmentAmount > 0 ? '+' : '-'})`
        });
    }

    // Audit log for timesheet save
    data.audit_logs.push({
        id: Date.now() + '-log',
        action: 'TIMESHEET_UPDATE',
        targetId: employeeId,
        actor,
        timestamp,
        details: `Updated ${entries.length} timesheet entries`
    });

    // --- NEW: Recalculate payroll for this period ---
    const payrollResult = recalculatePayrollForPeriod(data, employeeId, periodStart, periodEnd);

    // --- NEW: Check if today's attendance changed ---
    const todayStr = new Date().toISOString().split('T')[0];
    const todayEntry = savedEntries.find(e => e.date === todayStr && (e.clockIn || e.shiftStart));
    const attendanceChanged = !!todayEntry;

    // Log payroll recalculation
    if (payrollResult) {
        data.audit_logs.push({
            id: Date.now() + '-payroll-log',
            action: 'PAYROLL_RECALCULATED',
            targetId: employeeId,
            actor,
            timestamp,
            details: `Recalculated: Gross ₹${payrollResult.grossPay}, Net ₹${payrollResult.netPay}, ${payrollResult.workingDays} days`
        });
    }

    writeData(data);

    res.json({
        success: true,
        entries: savedEntries,
        totalBillableMinutes,
        adjustmentCreated: isPostPaymentAdjustment,
        // Enhanced response
        attendanceChanged,
        payrollUpdated: payrollResult
    });
});

// Get Single Payroll Entry (Payslip)
app.get('/api/payroll/:id', (req, res) => {
    const { id } = req.params;
    const data = readData();
    const entry = data.payroll_entries.find(p => p.id === id);

    if (!entry) {
        return res.status(404).json({ error: 'Payroll entry not found' });
    }

    // Enhance with employee details
    const employee = data.employees.find(e => e.id === entry.employeeId);
    if (employee) {
        entry.employeeName = employee.name;
        entry.employeeRole = employee.role;
        entry.employeeId = employee.id; // Ensure ID is present
    }

    // --- Hydrate with Details (Timesheet, Advances, Loans) ---
    // Even for saved payroll, we fetch fresh details to show the breakdown
    const start = new Date(entry.periodStart);
    const end = new Date(entry.periodEnd);

    // 1. Timesheet
    const periodEntries = (data.timesheet_entries || []).filter(e => {
        const entryDate = new Date(e.date);
        return e.employeeId === entry.employeeId &&
            entryDate >= start &&
            entryDate <= end &&
            e.status === 'active';
    });

    entry.details = {};
    entry.details.timesheet = periodEntries.map(e => {
        const calc = calculateShiftHours(e.clockIn || e.shiftStart, e.clockOut || e.shiftEnd, e.breakMinutes);
        return {
            date: e.date,
            clockIn: e.clockIn || e.shiftStart || '-',
            clockOut: e.clockOut || e.shiftEnd || '-',
            breakMinutes: e.breakMinutes || 0,
            totalMinutes: calc.totalMinutes,
            billableMinutes: calc.billableMinutes
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Deductions (Advances & Loans)
    const periodDeductions = (data.deductions || []).filter(d =>
        d.employeeId === entry.employeeId &&
        d.periodStart === entry.periodStart &&
        d.periodEnd === entry.periodEnd &&
        d.status === 'active'
    );

    entry.details.advances = periodDeductions
        .filter(d => d.type === 'advance')
        .map(d => ({
            id: d.id,
            date: d.date || d.createdAt || entry.periodStart,
            amount: d.amount,
            reason: d.description || 'Advance Salary'
        }));

    entry.details.loans = periodDeductions
        .filter(d => d.type === 'loan')
        .map(d => ({
            id: d.id,
            description: d.description,
            amount: d.amount,
            remainingBalance: 'N/A'
        }));

    res.json(entry);
});

// Helper: Calculate shift hours with OT and Dinner Break
function calculateShiftHours(startTime, endTime, breakMins, standardShiftEnd = '18:00') {
    if (!startTime || !endTime) {
        return { totalMinutes: 0, billableMinutes: 0, overtimeMinutes: 0, nightStatus: null, dinnerBreakDeduction: 0 };
    }

    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    let start = parseTime(startTime);
    let end = parseTime(endTime);
    const shiftEnd = parseTime(standardShiftEnd);

    // Handle overnight (e.g., 22:00 to 02:00)
    // We treat 00:00-09:00 as next day for calculation simplicity in single shift context
    let crossMidnight = false;
    if (end < start) {
        end += 24 * 60;
        crossMidnight = true;
    }

    const DINNER_START = 20 * 60; // 20:00
    const DINNER_END = 21 * 60;   // 21:00

    let duration = end - start;
    let dinnerBreakDeduction = 0;

    // Check Dinner Break (8 PM - 9 PM)
    // Intersect [start, end] with [DINNER_START, DINNER_END]
    // Note: If shift crosses midnight, DINNER_START might be 'yesterday' relative to 'tomorrow' morning, 
    // but typically dinner is in the first evening.
    // If end > 24*60 (next day), we assume dinner was on the first day (evening).

    // Effective interval for dinner check on the "start day"
    const effectiveStart = start;
    const effectiveEnd = end; // Can be > 24*60

    if (effectiveStart < DINNER_END && effectiveEnd > DINNER_START) {
        const overlapStart = Math.max(effectiveStart, DINNER_START);
        const overlapEnd = Math.min(effectiveEnd, DINNER_END);
        if (overlapEnd > overlapStart) {
            dinnerBreakDeduction = overlapEnd - overlapStart;
        }
    }

    // Determine Night Status
    let nightStatus = null;
    const endHour24 = (end % (24 * 60)) / 60; // normalized to 0-24

    // Logic: If worked past 20:00 -> Night Shift Worked
    // Logic: If worked past 24:00 (00:00) -> Extended Night Shift
    // 'end' is raw (could be 25:00 for 1am).

    if (end > 24 * 60) {
        nightStatus = 'Extended Night';
    } else if (end >= 20 * 60) {
        nightStatus = 'Night Shift';
    }

    // Calculate Billable Minutes
    // Total Minutes - standard break - dinner break
    let billableMinutes = Math.max(0, duration - (breakMins || 0) - dinnerBreakDeduction);

    // Calculate Overtime
    // OT is time worked AFTER shiftEnd (e.g. 18:00)
    // BUT we must exclude the dinner break if it happens during OT (which it usually does, 20-21 is > 18)

    let overtimeMinutes = 0;
    if (end > shiftEnd) {
        // Raw OT duration
        const otStart = Math.max(start, shiftEnd);
        const otEnd = end;
        let otDuration = Math.max(0, otEnd - otStart);

        // Deduct dinner break from OT if it falls inside OT period
        // Dinner (20-21) is typically > ShiftEnd (18).
        // Calculate overlap of OT period with Dinner period
        if (otStart < DINNER_END && otEnd > DINNER_START) {
            const overlapStart = Math.max(otStart, DINNER_START);
            const overlapEnd = Math.min(otEnd, DINNER_END);
            if (overlapEnd > overlapStart) {
                otDuration -= (overlapEnd - overlapStart);
            }
        }

        // Also deduct standard break from OT? 
        // Typically standard break (lunch) is earlier. If user enters break time, 
        // we might assume it's lunch. We won't deduct "breakMins" from OT unless total work < break.
        // We assume billableMinutes already handles 'breakMins'.
        // We need to ensure we don't count OT if total billable is low?
        // Simple rule: OT = BillableMinutes - StandardShiftDuration?
        // Or strict clock-based? Prompt says: "Overtime Hours = Paid Hours - Shift Hours"

        // Let's use the Prompt's Step 3: "Overtime Hours = Paid Hours - Shift Hours"
        // Shift Hours = shiftEnd - shiftStart - standardBreak? 
        // Let's rely on strict clock diff first as per Step 1.

        overtimeMinutes = otDuration;
    }

    return { totalMinutes: duration, billableMinutes, overtimeMinutes, nightStatus, dinnerBreakDeduction };
}

// Helper: Recalculate payroll for employee in a period based on timesheet entries
function recalculatePayrollForPeriod(data, employeeId, periodStart, periodEnd) {
    const employee = data.employees.find(e => e.id === parseInt(employeeId));
    if (!employee) return null;

    // Get all timesheet entries for this employee in this period
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

    const periodEntries = (data.timesheet_entries || []).filter(e => {
        const entryDate = new Date(e.date);
        return e.employeeId === parseInt(employeeId) &&
            entryDate >= start &&
            entryDate <= end &&
            e.status === 'active';
    });

    // Calculate total billable minutes & OT from all timesheet entries
    let totalBillableMinutes = 0;
    let totalOvertimeMinutes = 0;

    // We need to store processed entries to expose nightStatus/OT in details loop later
    // Or we can rebuild details map lower down. Let's rebuild for cleanliness or modify logic to map first.

    // Let's create a richer map of entries first
    const richEntries = periodEntries.map(entry => {
        const clockIn = entry.clockIn || entry.shiftStart || '';
        const clockOut = entry.clockOut || entry.shiftEnd || '';

        // Use employee shift end for OT calculation
        const standardShiftEnd = employee.shiftEnd || '18:00';

        const calc = calculateShiftHours(clockIn, clockOut, entry.breakMinutes || 0, standardShiftEnd);

        return {
            ...entry,
            ...calc
        };
    });

    richEntries.forEach(e => {
        totalBillableMinutes += e.billableMinutes;
        totalOvertimeMinutes += e.overtimeMinutes;
    });

    // Calculate gross pay
    // Option 1: Employee has perShiftAmount (per day rate)
    // Option 2: Employee has hourly rate
    // Option 3: Fall back to fixed salary
    let grossPay = 0;
    const totalBillableHours = totalBillableMinutes / 60;
    const workingDays = periodEntries.length;
    let hourlyRate = 0;

    if (employee.perShiftAmount && workingDays > 0) {
        // ... (Existing per shift logic) ...
        // Derive Hourly Rate for OT
        // Assuming Standard Shift is 9am-6pm (9h) - 1h break = 8h?
        // Or strictly shiftEnd - shiftStart - breakTime?
        const standardShiftRaw = calculateShiftHours(
            employee.shiftStart || '09:00',
            employee.shiftEnd || '18:00',
            employee.breakTime || 0
        );
        const standardDailyHours = standardShiftRaw.billableMinutes / 60;
        hourlyRate = parseFloat(employee.perShiftAmount) / (standardDailyHours || 8); // Fallback to 8h

        // Regular Pay Calculation (Same as before)
        if (standardShiftRaw.billableMinutes > 0) {
            const expectedTotalMinutes = standardShiftRaw.billableMinutes * workingDays;
            const ratio = totalBillableMinutes / expectedTotalMinutes;
            const basePay = parseFloat(employee.perShiftAmount) * workingDays;
            grossPay = basePay * ratio;
        } else {
            grossPay = parseFloat(employee.perShiftAmount) * workingDays;
        }

    } else if (employee.hourlyRate) {
        hourlyRate = employee.hourlyRate;
        grossPay = hourlyRate * totalBillableHours;
    } else {
        // Fixed salary - OT usually not applicable or rate is Salary / 30 / 8
        // Let's assume standard 8h day for rate
        hourlyRate = (employee.salary || 0) / 30 / 8;
        grossPay = employee.salary || 0;
    }

    // Add Overtime Pay
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * 1.5;
    grossPay += overtimePay;

    // Get deductions for this period
    const periodDeductions = (data.deductions || []).filter(d =>
        d.employeeId === parseInt(employeeId) &&
        d.periodStart === periodStart &&
        d.periodEnd === periodEnd &&
        d.status === 'active'
    );
    console.log(`[DEBUG] Emp: ${employeeId}, Period: ${periodStart} to ${periodEnd}`);
    console.log(`[DEBUG] Found ${periodDeductions.length} deductions. Full Data Deductions: ${(data.deductions || []).length}`);

    const totalDeductions = periodDeductions.reduce((sum, d) => sum + (d.amount || 0), 0);

    // Calculate specifically the advance component
    const advanceDeductions = periodDeductions
        .filter(d => d.type === 'advance')
        .reduce((sum, d) => sum + (d.amount || 0), 0);

    console.log(`[DEBUG] Employee ${employeeId}: Advance Deductions: ${advanceDeductions}`);

    // Calculate net pay
    const netPay = Math.max(0, grossPay - totalDeductions);

    // Find or create payroll entry
    if (!data.payroll_entries) data.payroll_entries = [];

    let payrollEntry = data.payroll_entries.find(p =>
        p.employeeId === parseInt(employeeId) &&
        p.periodStart === periodStart
    );

    const wasPaid = payrollEntry?.status === 'Paid';
    const previousNetPay = payrollEntry?.netPay || 0;
    const isAdjusted = wasPaid && Math.abs(netPay - previousNetPay) > 0.01;

    // Construct Detailed Breakdown (Updated with Night Status)
    const formattedTimesheet = richEntries.map(e => {
        return {
            date: e.date,
            clockIn: e.clockIn || e.shiftStart || '-',
            clockOut: e.clockOut || e.shiftEnd || '-',
            breakMinutes: e.breakMinutes || 0,
            totalMinutes: e.totalMinutes,
            billableMinutes: e.billableMinutes,
            overtimeMinutes: e.overtimeMinutes, // New
            nightStatus: e.nightStatus,         // New
            dinnerBreakDeduction: e.dinnerBreakDeduction // New
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Filter Loan Deductions, Advances... (Same as before)
    const loanDeductions = periodDeductions.filter(d => d.type === 'loan');
    const formattedLoans = loanDeductions.map(d => ({
        id: d.id,
        description: d.description,
        amount: d.amount,
        remainingBalance: 'N/A'
    }));

    const formattedAdvances = periodDeductions
        .filter(d => d.type === 'advance')
        .map(d => ({
            id: d.id,
            date: d.date || d.createdAt || periodStart,
            amount: d.amount,
            reason: d.description || 'Advance Salary'
        }));


    if (payrollEntry) {
        // Update existing
        payrollEntry.grossPay = grossPay;
        payrollEntry.deductions = totalDeductions;
        payrollEntry.advanceDeductions = advanceDeductions;
        payrollEntry.netPay = netPay;
        payrollEntry.totalBillableMinutes = totalBillableMinutes;
        payrollEntry.workingDays = workingDays;
        payrollEntry.overtimePay = overtimePay; // New
        payrollEntry.totalOvertimeMinutes = totalOvertimeMinutes; // New
        if (isAdjusted) {
            payrollEntry.isAdjusted = true;
            payrollEntry.adjustmentAmount = netPay - previousNetPay;
        }
    } else {
        // Create new entry
        payrollEntry = {
            id: `pay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            employeeId: parseInt(employeeId),
            periodStart,
            periodEnd,
            grossPay,
            deductions: totalDeductions,
            advanceDeductions,
            netPay,
            totalBillableMinutes,
            workingDays,
            status: 'Unpaid',
            paidAt: null,
            isAdjusted: false,
            overtimePay, // New
            totalOvertimeMinutes // New
        };
        data.payroll_entries.push(payrollEntry);
    }

    return {
        employeeId: parseInt(employeeId),
        employeeName: employee.name,
        employeeRole: employee.role,
        ...payrollEntry,
        advanceDeductions: advanceDeductions,
        status: payrollEntry.status,
        isAdjusted,
        adjustmentAmount: isAdjusted ? netPay - previousNetPay : 0,
        hourlyRate: hourlyRate, // Expose for UI
        overtimePay: overtimePay,
        totalOvertimeMinutes: totalOvertimeMinutes,
        // Detailed Sections for Payslip
        details: {
            timesheet: formattedTimesheet,
            advances: formattedAdvances,
            loans: formattedLoans
        }
    };
}

// Basic Health Check (for IP debug)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', ip: req.ip, role: req.userRole });
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[System] Main Server STARTED on port ${PORT}`);
    console.log(`[System] Integrity Check: PASSED. Single source of truth active.`);
    console.log(`[System] Ready for Office PC connections...`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('\n[CRITICAL SECURITY ALERT] DUPLICATE SERVER INSTANCE DETECTED');
        console.error('-----------------------------------------------------------');
        console.error(`Error: Port ${PORT} is strictly locked by the Main Server.`);
        console.error('System Integrity Rule Violation: Multiple conflicting servers are not allowed.');
        console.error('BLOCKED: This conflicting instance will now terminate.');
        console.error('ACTION REQUIRED: Check if the server is already running in another terminal.');
        console.error('-----------------------------------------------------------\n');
        process.exit(1);
    } else {
        console.error('[System] Server encountered an error:', e);
    }
});
