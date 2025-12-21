const { db } = require('../config/firebase');
const employeeService = require('./employeeService');
const timesheetService = require('./timesheetService');
const deductionService = require('./deductionService');
const loanService = require('./loanService');
const bonusService = require('./bonusService');
const settingsService = require('./settingsService');
const { calculateShiftHours, countWorkingDays } = require('../utils/timeUtils');

const payrollService = {
    // Get single payroll entry
    async getEntry(id) {
        const doc = await db.collection('payroll_entries').doc(String(id)).get();
        if (!doc.exists) return null;

        const data = { id: doc.id, ...doc.data() };
        if (data.frozenData) {
            return { ...data, ...data.frozenData };
        }
        return data;
    },

    // Get history for employee
    async getHistory(employeeId) {
        const snapshot = await db.collection('payroll_entries')
            .where('employeeId', '==', parseInt(employeeId))
            .where('status', '==', 'Paid')
            .get();

        if (snapshot.empty) return [];

        let entries = [];
        snapshot.forEach(doc => {
            entries.push({ id: doc.id, ...doc.data() });
        });

        // Sort desc
        return entries.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart))
            .map(entry => entry.frozenData ? { ...entry, ...entry.frozenData } : entry);
    },

    // RECALCULATE Logic
    async recalculate(employeeId, periodStart, periodEnd) {
        console.log(`🔄 Recalculating Payroll for ${employeeId} (${periodStart} - ${periodEnd})`);

        // 1. Fetch Employee
        let employee;
        try {
            employee = await employeeService.getById(employeeId);
        } catch (err) {
            console.error(`❌ Recalculate Error: Employee ${employeeId} fetch failed:`, err);
            throw new Error(`Employee ${employeeId} fetch failed: ${err.message}`);
        }
        if (!employee) throw new Error(`Employee ${employeeId} not found`);

        // 2. Fetch Timesheets
        let timesheets = [];
        try {
            timesheets = await timesheetService.getForEmployee(employeeId, periodStart, periodEnd);
        } catch (err) {
            console.error(`❌ Recalculate Error: Timesheets fetch failed for ${employee.name}:`, err);
            throw new Error(`Timesheets fetch failed for ${employee.name}: ${err.message}`);
        }

        // 3. Fetch Deductions
        let deductions = [];
        try {
            deductions = await deductionService.getForEmployee(employeeId, periodStart, periodEnd);
        } catch (err) {
            console.error(`❌ Recalculate Error: Deductions fetch failed for ${employee.name}:`, err);
            throw new Error(`Deductions fetch failed for ${employee.name}: ${err.message}`);
        }

        // --- CALCULATION LOGIC ---
        let totalRegularMinutes = 0;
        let totalOvertimeMinutes = 0;
        let totalBillableMinutes = 0;

        const processedTimesheets = timesheets.map(e => {
            const clockIn = e.clockIn || e.shiftStart;
            const clockOut = e.clockOut || e.shiftEnd;
            const breakMins = e.breakMinutes;
            const dayType = e.dayType || 'Work';
            const shiftEnd = employee.shiftEnd || '18:00';

            const calc = calculateShiftHours(clockIn, clockOut, breakMins, dayType, shiftEnd);
            return {
                ...e,
                ...calc
            };
        });

        processedTimesheets.forEach(e => {
            totalRegularMinutes += e.regularMinutes;
            totalOvertimeMinutes += e.overtimeMinutes;
            totalBillableMinutes += e.billableMinutes;
        });

        // Calculate Gross Pay
        let grossPay = 0;
        let hourlyRate = 0;
        const workingDays = processedTimesheets.filter(e => e.clockIn || e.shiftStart).length;
        const totalRegularHours = totalRegularMinutes / 60;

        if (employee.perShiftAmount && workingDays > 0) {
            const standardShiftRaw = calculateShiftHours(
                employee.shiftStart || '09:00',
                employee.shiftEnd || '18:00',
                employee.breakTime || 0
            );
            const standardDailyHours = standardShiftRaw.billableMinutes / 60;
            hourlyRate = parseFloat(employee.perShiftAmount) / (standardDailyHours || 8);

            const expectedTotalMinutes = standardShiftRaw.billableMinutes * workingDays;

            if (expectedTotalMinutes > 0) {
                const ratio = totalRegularMinutes / expectedTotalMinutes;
                const basePay = parseFloat(employee.perShiftAmount) * workingDays;
                grossPay = basePay * ratio;
            } else {
                grossPay = parseFloat(employee.perShiftAmount) * workingDays;
            }

        } else if (employee.hourlyRate) {
            hourlyRate = employee.hourlyRate;
            grossPay = hourlyRate * totalRegularHours;
        } else {
            hourlyRate = (employee.salary || 0) / 30 / 8;
            grossPay = employee.salary || 0;
        }

        grossPay = Math.round(grossPay);
        const overtimePay = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
        grossPay += overtimePay;

        const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
        const advanceDeductions = deductions.filter(d => d.type === 'advance').reduce((sum, d) => sum + (d.amount || 0), 0);
        const loanDeductions = deductions.filter(d => d.type === 'loan').reduce((sum, d) => sum + (d.amount || 0), 0);

        const netPay = Math.round(grossPay - totalDeductions);

        // --- UPSERT PAYROLL ENTRY ---
        const snapshot = await db.collection('payroll_entries')
            .where('employeeId', '==', parseInt(employeeId))
            .where('periodStart', '==', periodStart)
            .get();

        let existing = null;
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            existing = { id: doc.id, ...doc.data() };
        }

        if (existing?.status === 'Paid') {
            const fullEntry = await this.getEntry(existing.id);
            return fullEntry;
        }

        const payload = {
            employeeId: parseInt(employeeId),
            periodStart,
            periodEnd,
            grossPay,
            deductions: totalDeductions,
            advanceDeductions,
            loanDeductions,
            netPay,
            status: existing ? existing.status : 'Pending',
            frozenData: {
                totalBillableMinutes,
                workingDays,
                calculatedAt: new Date().toISOString()
            },
            overtimePay,
            totalOvertimeMinutes,
            perShiftAmount: employee.perShiftAmount,
            hourlyRate: hourlyRate
        };

        const id = existing ? existing.id : `pay-${Date.now()}-${employeeId}`;
        const docRef = db.collection('payroll_entries').doc(id);

        await docRef.set({
            ...payload,
            id // Ensure ID is in doc
        }, { merge: true });

        const saved = await docRef.get();
        return {
            id: saved.id,
            ...saved.data(),
            totalBillableMinutes,
            workingDays
        };
    },

    // BULK RECALCULATE Logic
    async recalculateBulk(employeeIds, periodStart, periodEnd, force = false) {
        console.log(`🚀 Bulk Recalculating Payroll for ${employeeIds.length} employees (${periodStart} - ${periodEnd}) | force: ${force}`);
        const startTime = Date.now();

        // 1. Fetch Existing Payroll Entries for period
        const payrollSnapshot = await db.collection('payroll_entries')
            .where('periodStart', '==', periodStart)
            .where('periodEnd', '==', periodEnd)
            .get();

        const existingEntries = [];
        payrollSnapshot.forEach(doc => existingEntries.push({ id: doc.id, ...doc.data() }));

        // 2. Fetch Employees
        const requestEmployeeIds = employeeIds.map(id => parseInt(id));
        const allEmployees = await employeeService.getAll();
        const employees = allEmployees.filter(e => requestEmployeeIds.includes(e.id));

        const results = [];
        const idsToCalculate = [];

        for (const employeeId of requestEmployeeIds) {
            const emp = employees.find(e => e.id == employeeId);
            if (!emp) continue;

            const existing = existingEntries.find(e => e.employeeId == employeeId);

            if (!force && existing) {
                results.push({
                    ...existing,
                    ...(existing.frozenData || {}),
                    employeeName: emp.name,
                    employeeImage: emp.image,
                    employeeRole: emp.role,
                    employeeId: emp.id
                });
            } else {
                if (existing?.status === 'Paid' && !force) {
                    results.push({
                        ...existing,
                        ...(existing.frozenData || {}),
                        employeeName: emp.name,
                        employeeImage: emp.image,
                        employeeRole: emp.role,
                        employeeId: emp.id
                    });
                } else {
                    idsToCalculate.push(employeeId);
                }
            }
        }

        if (idsToCalculate.length === 0) {
            console.log(`⚡ All entries served from cache. Took ${Date.now() - startTime}ms`);
            return results;
        }

        console.log(`🧮 Recalculating for ${idsToCalculate.length} employees...`);

        // 3. Fetch Data ONLY for those needing calculation (Fetch all for period to suffice)
        const timesheetSnapshot = await db.collection('timesheets')
            .where('date', '>=', periodStart)
            .where('date', '<=', periodEnd)
            .get();

        const allTimesheets = [];
        timesheetSnapshot.forEach(doc => allTimesheets.push(doc.data()));

        const deductionSnapshot = await db.collection('deductions')
            .where('status', '==', 'active')
            .get(); // Filter date in memory

        const allDeductions = [];
        deductionSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.periodStart === periodStart && data.periodEnd === periodEnd) {
                allDeductions.push(data);
            }
        });

        const batch = db.batch();
        const upsertPayloads = [];

        for (const employeeId of idsToCalculate) {
            const emp = employees.find(e => e.id == employeeId);
            const existing = existingEntries.find(e => e.employeeId == employeeId);
            const timesheets = allTimesheets.filter(t => t.employeeId == employeeId);
            const deductions = allDeductions.filter(d => d.employeeId == employeeId);

            // --- CALCULATION LOGIC ---
            let totalRegularMinutes = 0;
            let totalOvertimeMinutes = 0;
            let totalBillableMinutes = 0;

            const processedTimesheets = timesheets.map(e => {
                const clockIn = e.clockIn || e.shiftStart;
                const clockOut = e.clockOut || e.shiftEnd;
                const breakMins = e.breakMinutes;
                const dayType = e.dayType || 'Work';
                const shiftEndLimit = emp.shiftEnd || '18:00';

                const calc = calculateShiftHours(clockIn, clockOut, breakMins, dayType, shiftEndLimit);
                return { ...e, ...calc };
            });

            processedTimesheets.forEach(e => {
                totalRegularMinutes += e.regularMinutes;
                totalOvertimeMinutes += e.overtimeMinutes;
                totalBillableMinutes += e.billableMinutes;
            });

            let grossPay = 0;
            let hourlyRate = 0;
            const workingDays = processedTimesheets.filter(e => e.clockIn || e.shiftStart).length;
            const totalRegularHours = totalRegularMinutes / 60;

            if (emp.perShiftAmount && workingDays > 0) {
                const standardShiftRaw = calculateShiftHours(
                    emp.shiftStart || '09:00',
                    emp.shiftEnd || '18:00',
                    emp.breakTime || 0
                );
                const standardDailyHours = standardShiftRaw.billableMinutes / 60;
                hourlyRate = parseFloat(emp.perShiftAmount) / (standardDailyHours || 8);
                const expectedTotalMinutes = standardShiftRaw.billableMinutes * workingDays;

                if (expectedTotalMinutes > 0) {
                    const ratio = totalRegularMinutes / expectedTotalMinutes;
                    const basePay = parseFloat(emp.perShiftAmount) * workingDays;
                    grossPay = basePay * ratio;
                } else {
                    grossPay = parseFloat(emp.perShiftAmount) * workingDays;
                }
            } else if (emp.hourlyRate) {
                hourlyRate = emp.hourlyRate;
                grossPay = hourlyRate * totalRegularHours;
            } else {
                hourlyRate = (emp.salary || 0) / 30 / 8;
                grossPay = emp.salary || 0;
            }

            grossPay = Math.round(grossPay);
            const overtimePay = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
            grossPay += overtimePay;

            const totalDeductions = deductions.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            const advanceDeductions = deductions.filter(d => d.type === 'advance').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            const loanDeductions = deductions.filter(d => d.type === 'loan').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

            const netPay = Math.round(grossPay - totalDeductions);

            const id = existing ? existing.id : `pay-${Date.now()}-${employeeId}`;
            const payload = {
                id,
                employeeId,
                periodStart,
                periodEnd,
                grossPay,
                deductions: totalDeductions,
                advanceDeductions,
                loanDeductions,
                netPay,
                status: existing ? existing.status : 'Pending',
                overtimePay,
                totalOvertimeMinutes,
                perShiftAmount: emp.perShiftAmount,
                hourlyRate,
                frozenData: {
                    totalBillableMinutes,
                    workingDays,
                    calculatedAt: new Date().toISOString()
                }
            };

            const docRef = db.collection('payroll_entries').doc(id);
            batch.set(docRef, payload, { merge: true });

            results.push({
                ...payload,
                totalBillableMinutes,
                workingDays,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role
            });
        }

        if (idsToCalculate.length > 0) {
            await batch.commit();
        }

        console.log(`✅ Bulk Recalculate Complete.`);
        return results;
    },

    // Get Rich Entry with full details for Payslip
    async getEntryWithDetails(id) {
        console.log(`📄 Fetching Rich Details for Entry: ${id}`);

        const entry = await this.getEntry(id);
        if (!entry) return null;

        let currentEntry = entry;
        if (entry.status !== 'Paid') {
            currentEntry = await this.recalculate(entry.employeeId, entry.periodStart, entry.periodEnd);
        }

        const [employee, timesheets, deductions, allWithdrawals, bonusSettings, activeLoan] = await Promise.all([
            employeeService.getById(currentEntry.employeeId),
            timesheetService.getForEmployee(currentEntry.employeeId, currentEntry.periodStart, currentEntry.periodEnd),
            deductionService.getForEmployee(currentEntry.employeeId, currentEntry.periodStart, currentEntry.periodEnd),
            bonusService.getWithdrawals(currentEntry.employeeId),
            settingsService.get('bonus'),
            loanService.getActive(currentEntry.employeeId)
        ]);

        const settings = bonusSettings || { startDate: '2025-04-01', endDate: '2026-03-31', amountPerDay: 35 };

        const enrichedTimesheets = timesheets.map(e => {
            const clockIn = e.clockIn || e.shiftStart;
            const clockOut = e.clockOut || e.shiftEnd;
            const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes, e.dayType, employee?.shiftEnd || '18:00');
            return {
                ...e,
                ...calc,
                clockIn: clockIn || '-',
                clockOut: clockOut || '-'
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        let loanSummary = null;
        if (activeLoan) {
            const allLoanDeductionsSnapshot = await db.collection('deductions')
                .where('employeeId', '==', parseInt(currentEntry.employeeId))
                .where('type', '==', 'loan')
                .where('status', '==', 'active')
                .get();

            const allLoanDeductions = [];
            allLoanDeductionsSnapshot.forEach(doc => allLoanDeductions.push(doc.data()));

            const previousRepayments = allLoanDeductions
                .filter(d => new Date(d.periodEnd) < new Date(currentEntry.periodStart))
                .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

            const currentPeriodRepayment = deductions
                .filter(d => d.type === 'loan')
                .reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

            const openingBalance = activeLoan.amount - previousRepayments;
            loanSummary = {
                loanDate: activeLoan.date,
                originalAmount: activeLoan.amount,
                openingBalance: openingBalance,
                currentDeduction: currentPeriodRepayment,
                remainingBalance: Math.max(0, openingBalance - currentPeriodRepayment)
            };
        }

        const historicalTimesheets = await timesheetService.getForEmployee(currentEntry.employeeId, settings.startDate, currentEntry.periodEnd);
        const ytdDays = countWorkingDays(historicalTimesheets);
        const ytdAccrued = ytdDays * settings.amountPerDay;
        const totalWithdrawn = allWithdrawals
            .filter(w => w.status !== 'rejected' && new Date(w.date) <= new Date(currentEntry.periodEnd))
            .reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0);

        const bonusData = {
            ytdDays,
            ytdAccrued,
            totalWithdrawn,
            balance: ytdAccrued - totalWithdrawn
        };

        return {
            ...currentEntry,
            employeeName: employee?.name,
            employeeRole: employee?.role,
            employeeImage: employee?.image,
            employeeContact: employee?.contact,
            perShiftAmount: employee?.perShiftAmount,
            salary: employee?.salary,
            details: {
                timesheet: enrichedTimesheets,
                advances: deductions.filter(d => d.type === 'advance').map(d => ({
                    id: d.id,
                    amount: d.amount,
                    reason: d.description || 'Advance Salary'
                })),
                loans: deductions.filter(d => d.type === 'loan').map(d => ({
                    id: d.id,
                    amount: d.amount,
                    description: d.description
                })),
                loanSummary,
                bonus: bonusData
            }
        };
    }
};

module.exports = payrollService;
