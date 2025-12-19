
const supabase = require('../config/supabase');
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
        const { data, error } = await supabase
            .from('payroll_entries')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (data?.frozenData) {
            return {
                ...data,
                ...data.frozenData
            };
        }
        return data;
    },

    // Get history for employee
    async getHistory(employeeId) {
        const { data, error } = await supabase
            .from('payroll_entries')
            .select('*')
            .eq('employeeId', employeeId)
            .eq('status', 'Paid')
            .order('periodStart', { ascending: false });

        if (error) throw error;
        return (data || []).map(entry => {
            if (entry.frozenData) {
                return { ...entry, ...entry.frozenData };
            }
            return entry;
        });
    },

    // RECALCULATE Logic
    // This replaces the complex function in index.js
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
            const shiftEnd = employee.shiftEnd || '18:00'; // OT Cutoff

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
        // Count ONLY working days (present entries)
        const workingDays = processedTimesheets.filter(e => e.clockIn || e.shiftStart).length;
        const totalRegularHours = totalRegularMinutes / 60;

        if (employee.perShiftAmount && workingDays > 0) {
            // Per Shift Logic
            const standardShiftRaw = calculateShiftHours(
                employee.shiftStart || '09:00',
                employee.shiftEnd || '18:00',
                employee.breakTime || 0
            );
            const standardDailyHours = standardShiftRaw.billableMinutes / 60;
            hourlyRate = parseFloat(employee.perShiftAmount) / (standardDailyHours || 8);

            // Regular Pay: Pro-rated
            const expectedTotalMinutes = standardShiftRaw.billableMinutes * workingDays;

            if (expectedTotalMinutes > 0) {
                const ratio = totalRegularMinutes / expectedTotalMinutes;
                const basePay = parseFloat(employee.perShiftAmount) * workingDays;
                grossPay = basePay * ratio;
            } else {
                grossPay = parseFloat(employee.perShiftAmount) * workingDays;
            }

        } else if (employee.hourlyRate) {
            // Hourly Logic
            hourlyRate = employee.hourlyRate;
            grossPay = hourlyRate * totalRegularHours;
        } else {
            // Fixed Salary Logic
            hourlyRate = (employee.salary || 0) / 30 / 8;
            grossPay = employee.salary || 0;
        }

        // Round Basic Salary
        grossPay = Math.round(grossPay);

        // Calculate Overtime Pay
        const overtimePay = Math.round((totalOvertimeMinutes / 60) * hourlyRate * 1.5);
        grossPay += overtimePay;

        // Calculate Deductions
        const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);

        const advanceDeductions = deductions
            .filter(d => d.type === 'advance')
            .reduce((sum, d) => sum + (d.amount || 0), 0);

        const loanDeductions = deductions
            .filter(d => d.type === 'loan')
            .reduce((sum, d) => sum + (d.amount || 0), 0);

        // Net Pay
        const netPay = Math.round(grossPay - totalDeductions);

        // --- UPSERT PAYROLL ENTRY ---
        // Try to find existing entry for this period
        const { data: existing } = await supabase
            .from('payroll_entries')
            .select('id, status')
            .eq('employeeId', employeeId)
            .eq('periodStart', periodStart)
            .maybeSingle();

        // If paid, don't recalculate unless specifically handled (usually we don't)
        if (existing?.status === 'Paid') {
            // Need to fetch full record to get frozenData
            const fullEntry = await this.getEntry(existing.id);
            return fullEntry;
        }

        const payload = {
            employeeId,
            periodStart,
            periodEnd,
            grossPay,
            deductions: totalDeductions,
            advanceDeductions,
            loanDeductions,
            netPay,
            status: existing ? existing.status : 'Pending',
            // totalBillableMinutes and workingDays are not in schema, move to frozenData
            frozenData: {
                totalBillableMinutes,
                workingDays,
                calculatedAt: new Date().toISOString()
            },
            overtimePay,
            totalOvertimeMinutes,
            perShiftAmount: employee.perShiftAmount, // Snapshot rate
            hourlyRate: hourlyRate
        };

        let result;
        try {
            if (existing) {
                const { data, error } = await supabase
                    .from('payroll_entries')
                    .update(payload)
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('payroll_entries')
                    .insert({
                        id: `pay-${Date.now()}-${employeeId}`,
                        ...payload
                    })
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }
        } catch (dbErr) {
            console.error(`❌ DB Error during payroll upsert for ${employee.name}:`, dbErr);
            throw dbErr;
        }

        // Merge back non-column data for frontend compatibility
        return {
            ...result,
            totalBillableMinutes,
            workingDays
        };
    },

    // BULK RECALCULATE Logic
    // Optimizes performance by batching database calls and supporting "Fast-Read" from existing entries
    async recalculateBulk(employeeIds, periodStart, periodEnd, force = false) {
        console.log(`🚀 Bulk Recalculating Payroll for ${employeeIds.length} employees (${periodStart} - ${periodEnd}) | force: ${force}`);
        const startTime = Date.now();

        // 1. Fetch Existing Payroll Entries and Employees first
        const [employees, existingEntries] = await Promise.all([
            supabase.from('employees').select('id, name, role, image, perShiftAmount, shiftStart, shiftEnd, hourlyRate, salary').in('id', employeeIds),
            supabase.from('payroll_entries')
                .select('*')
                .in('employeeId', employeeIds)
                .eq('periodStart', periodStart)
                .eq('periodEnd', periodEnd)
        ]);

        if (employees.error) throw employees.error;
        if (existingEntries.error) throw existingEntries.error;

        const results = [];
        const idsToCalculate = [];

        // Identify who needs calculation
        for (const employeeId of employeeIds) {
            const emp = employees.data.find(e => e.id == employeeId);
            if (!emp) continue;

            const existing = existingEntries.data.find(e => e.employeeId == employeeId);

            // FAST-READ: If not forced and entry exists, skip heavy calculation
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
                // If forced, or missing, or entry is NOT 'Paid' (we don't re-calc paid ones usually)
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

        // 2. Fetch Data ONLY for those needing calculation
        const [allTimesheets, allDeductions] = await Promise.all([
            // Timesheets
            supabase.from('timesheet_entries')
                .select('*')
                .in('employeeId', idsToCalculate)
                .gte('date', periodStart)
                .lte('date', periodEnd),
            // Deductions
            supabase.from('deductions')
                .select('*')
                .in('employeeId', idsToCalculate)
                .eq('periodStart', periodStart)
                .eq('periodEnd', periodEnd)
                .eq('status', 'active')
        ]);

        if (allTimesheets.error) throw allTimesheets.error;
        if (allDeductions.error) throw allDeductions.error;

        const upsertPayloads = [];

        // 3. Process each missing/forced employee
        for (const employeeId of idsToCalculate) {
            const emp = employees.data.find(e => e.id == employeeId);
            const existing = existingEntries.data.find(e => e.employeeId == employeeId);
            const timesheets = allTimesheets.data.filter(t => t.employeeId == employeeId);
            const deductions = allDeductions.data.filter(d => d.employeeId == employeeId);

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

            const payload = {
                id: existing ? existing.id : `pay-${Date.now()}-${employeeId}`,
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

            upsertPayloads.push(payload);
            results.push({
                ...payload,
                totalBillableMinutes,
                workingDays,
                employeeName: emp.name,
                employeeImage: emp.image,
                employeeRole: emp.role
            });
        }

        // 4. Bulk Upsert only if calculated
        if (upsertPayloads.length > 0) {
            const { error: upsertError } = await supabase
                .from('payroll_entries')
                .upsert(upsertPayloads, { onConflict: 'id' });

            if (upsertError) console.error('❌ Bulk Upsert Error:', upsertError);
        }

        console.log(`✅ Bulk Recalculate Complete. Mode: ${idsToCalculate.length} calculated, ${results.length - idsToCalculate.length} cached. Took ${Date.now() - startTime}ms`);
        return results;
    },

    // Get Rich Entry with full details for Payslip
    async getEntryWithDetails(id) {
        console.log(`📄 Fetching Rich Details for Entry: ${id}`);

        // 1. Get Base Entry
        const entry = await this.getEntry(id);
        if (!entry) return null;

        // 2. If Unpaid, Recalculate to ensure fresh data
        let currentEntry = entry;
        if (entry.status !== 'Paid') {
            currentEntry = await this.recalculate(entry.employeeId, entry.periodStart, entry.periodEnd);
        }

        // 3. Aggregate Details for the Frontend
        const [employee, timesheets, deductions, allWithdrawals, bonusSettings, activeLoan] = await Promise.all([
            employeeService.getById(currentEntry.employeeId),
            timesheetService.getForEmployee(currentEntry.employeeId, currentEntry.periodStart, currentEntry.periodEnd),
            deductionService.getForEmployee(currentEntry.employeeId, currentEntry.periodStart, currentEntry.periodEnd),
            bonusService.getWithdrawals(currentEntry.employeeId),
            settingsService.get('bonus'),
            loanService.getActive(currentEntry.employeeId)
        ]);

        const settings = bonusSettings || { startDate: '2025-04-01', endDate: '2026-03-31', amountPerDay: 35 };

        // Process Timesheets enrichment
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

        // Loan Summary Logic
        let loanSummary = null;
        if (activeLoan) {
            // Calculate previous repayments
            const { data: allLoanDeductions } = await supabase
                .from('deductions')
                .select('amount, periodEnd')
                .eq('employeeId', currentEntry.employeeId)
                .eq('type', 'loan')
                .eq('status', 'active');

            const previousRepayments = (allLoanDeductions || [])
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

        // Bonus Stats
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

        // Construct final rich payload
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
