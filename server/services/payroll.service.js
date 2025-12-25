const prisma = require('./prisma');
const { calculateShiftHours, countWorkingDays } = require('../utils/timeUtils');

class PayrollService {

    // Get generic payroll history (all paid entries)
    async getPayrollHistory(employeeId) {
        const where = employeeId ? { employeeId: parseInt(employeeId) } : {};
        return await prisma.payrollHistory.findMany({
            where: where,
            orderBy: { periodStart: 'desc' },
            include: { employee: true }
        });
    }

    // Get specific entry details (for Payslip/Preview)
    async getEntryWithDetails(id) {
        let entry = await prisma.payrollHistory.findUnique({
            where: { id: parseInt(id) },
            include: { employee: true } // Assuming relation exists
        });

        if (!entry) return null;

        // If pending, force recalculate to get latest numbers
        if (entry.status !== 'Paid') {
            entry = await this.recalculate(entry.employeeId, entry.periodStart, entry.periodEnd);
        }

        // Fetch related data for detailed view
        const timesheets = await prisma.timesheetEntry.findMany({
            where: {
                employeeId: entry.employeeId,
                date: { gte: entry.periodStart, lte: entry.periodEnd }
            },
            orderBy: { date: 'asc' }
        });

        const deductions = await prisma.deduction.findMany({
            where: {
                employeeId: entry.employeeId,
                date: { gte: entry.periodStart, lte: entry.periodEnd } // Assuming deduction has date within period
                // OR legacy logic checked 'periodStart'/'periodEnd' fields in deduction table?
                // Prisma schema has 'date'. Legacy seemed to have periodStart/End in deduction. 
                // Let's stick to date range for simplicity or strictly follow schema.
                // Schema has `date`. We filter by date.
            }
        });

        // Enrich Timesheets
        const employee = entry.employee;
        const enrichedTimesheets = timesheets.map(e => {
            const calc = calculateShiftHours(e.clockIn, e.clockOut, e.breakMinutes, e.dayType, employee?.shiftEnd || '18:00');
            return { ...e, ...calc };
        });

        return {
            ...entry,
            details: {
                timesheet: enrichedTimesheets,
                deductions: deductions
            }
        };
    }

    // RECALCULATE Logic
    async recalculate(employeeId, periodStart, periodEnd) {
        const eid = parseInt(employeeId);

        // 1. Fetch Employee
        const employee = await prisma.employee.findUnique({ where: { id: eid } });
        if (!employee) throw new Error('Employee not found');

        // 2. Fetch Timesheets
        const timesheets = await prisma.timesheetEntry.findMany({
            where: {
                employeeId: eid,
                date: { gte: periodStart, lte: periodEnd }
            }
        });

        // 3. Fetch Deductions
        // Legacy Deductions model had periodStart/End. My schema has `date`. 
        // I will assume deductions are valid if their date falls in range OR if we add period fields to schema.
        // For now, filtering by date usage.
        const deductions = await prisma.deduction.findMany({
            where: {
                employeeId: eid,
                date: { gte: periodStart, lte: periodEnd }
            }
        });

        // --- CALCULATION LOGIC ---
        let totalRegularMinutes = 0;
        let totalOvertimeMinutes = 0;
        let totalBillableMinutes = 0;

        const processedTimesheets = timesheets.map(e => {
            const calc = calculateShiftHours(e.clockIn, e.clockOut, e.breakMinutes, e.dayType, employee.shiftEnd || '18:00');
            return { ...e, ...calc };
        });

        processedTimesheets.forEach(e => {
            totalRegularMinutes += e.regularMinutes;
            totalOvertimeMinutes += e.overtimeMinutes;
            totalBillableMinutes += e.billableMinutes;
        });

        // Calculate Gross Pay
        let grossPay = 0;
        let hourlyRate = 0;
        const workingDays = processedTimesheets.filter(e => e.clockIn).length; // check clockIn existence
        const totalRegularHours = totalRegularMinutes / 60;

        if (employee.perShiftAmount && workingDays > 0) {
            const standardShiftRaw = calculateShiftHours(
                employee.shiftStart || '09:00',
                employee.shiftEnd || '18:00',
                employee.breakTime || 0
            );
            const standardDailyHours = standardShiftRaw.billableMinutes / 60;
            hourlyRate = parseFloat(employee.perShiftAmount) / (standardDailyHours || 8); // Avoid div by 0

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

        // Note: Deductions schema needs 'type' if check is required. I added it to schema.
        const netPay = Math.round(grossPay - totalDeductions);

        // --- UPSERT PAYROLL ENTRY ---
        // Check if entry exists for this period
        const existing = await prisma.payrollHistory.findFirst({
            where: {
                employeeId: eid,
                periodStart: periodStart,
                periodEnd: periodEnd
            }
        });

        if (existing && existing.status === 'Paid') {
            return existing; // Don't modify paid entries
        }

        const data = {
            employeeId: eid,
            periodStart,
            periodEnd,
            grossPay,
            deductions: totalDeductions,
            advanceDeductions,
            netPay,
            status: existing ? existing.status : 'Pending',
            paidAt: existing ? existing.paidAt : null
        };

        if (existing) {
            return await prisma.payrollHistory.update({
                where: { id: existing.id },
                data: data
            });
        } else {
            return await prisma.payrollHistory.create({
                data: data
            });
        }
    }

    // Bonus logic
    async getBonuses(employeeId) {
        const where = employeeId ? { employeeId: parseInt(employeeId) } : {};
        return await prisma.bonusWithdrawal.findMany({
            where,
            include: { employee: true },
            orderBy: { date: 'desc' }
        });
    }

    async addBonus(data) {
        return await prisma.bonusWithdrawal.create({
            data: {
                ...data,
                createdAt: new Date().toISOString()
            }
        });
    }
}

module.exports = new PayrollService();
