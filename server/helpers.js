
// --- HELPER FUNCTIONS ---

function calculateShiftHours(clockIn, clockOut, breakMinutes = 0, dayType = 'Work', shiftEnd = '18:00') {
    if (!clockIn) return { totalMinutes: 0, billableMinutes: 0, regularMinutes: 0, overtimeMinutes: 0, nightStatus: 'None', dinnerBreakDeduction: 0 };

    const start = new Date(`1970-01-01T${clockIn}:00`);
    // If no clockOut, assume it's ongoing or handle gracefully
    // For calculation purposes, we need a clock out. If null, maybe default to now? or partial? 
    // Usually invalid if no clockOut.
    if (!clockOut) return { totalMinutes: 0, billableMinutes: 0, regularMinutes: 0, overtimeMinutes: 0, nightStatus: 'None', dinnerBreakDeduction: 0 };

    let end = new Date(`1970-01-01T${clockOut}:00`);
    if (end < start) {
        end.setDate(end.getDate() + 1); // Next day
    }

    const diffMs = end - start;
    let totalMinutes = Math.floor(diffMs / 60000);

    // Deduct break
    totalMinutes -= (breakMinutes || 0);
    if (totalMinutes < 0) totalMinutes = 0;

    // Dinner Break Logic for Late shifts
    let dinnerBreakDeduction = 0;
    const nightShiftThreshold = new Date(`1970-01-01T21:00:00`); // 9 PM
    if (end > nightShiftThreshold) {
        // e.g. 15 mins dinner break if working past 9pm
        // Checking if already deducted? Assuming breakMinutes includes it or separate?
        // Let's assume standard breakMinutes is lunch. Dinner is extra strictly logic based?
        // For now, simpler logic:
        // if (totalMinutes > 600) dinnerBreakDeduction = 15; // Example
    }
    // Applying provided breakMinutes is usually safer.

    // Day Type multipliers?
    // Travel = 0 billable usually, or 50%? 
    // Assuming standard 100% for Work, 0 for Travel unless specified.
    let billableMinutes = totalMinutes;
    if (dayType === 'Travel') {
        // Maybe travel is paid but no OT? 
        // Logic specific to user rules. Assuming full pay for now.
    }

    // Overtime Calculation
    // OT starts after Shift End (usually 18:00) OR after 8 hours?
    // User logic: OT is time *after* 18:00
    const shiftEndObj = new Date(`1970-01-01T${shiftEnd}:00`);

    let regularMinutes = totalMinutes;
    let overtimeMinutes = 0;

    // Check if worked past shift end
    // Logic: Time worked AFTER 18:00 is OT.
    // Time worked BEFORE 18:00 is Regular.

    // Intersection of [Start, End] with [ShiftStart, ShiftEnd]
    // Simplified:

    // If clockOut > shiftEnd
    if (end > shiftEndObj) {
        const otDiffMs = end - shiftEndObj;
        let otMins = Math.floor(otDiffMs / 60000);

        // If break was taken during OT? Hard to know.
        // Assuming break was during regular hours (lunch).

        if (otMins > totalMinutes) otMins = totalMinutes; // Cap
        overtimeMinutes = otMins;
        regularMinutes = totalMinutes - overtimeMinutes;
    }

    return {
        totalMinutes,
        billableMinutes,
        regularMinutes,
        overtimeMinutes,
        nightStatus: end.getHours() >= 22 ? 'Night' : 'None',
        dinnerBreakDeduction
    };
}

function recalculatePayrollForPeriod(database, employeeId, periodStart, periodEnd) {
    const employee = database.prepare('SELECT * FROM employees WHERE id = ?').get(employeeId);
    if (!employee) return null;

    // Get timesheet entries
    const entries = database.prepare('SELECT * FROM timesheet_entries WHERE employeeId = ? AND date BETWEEN ? AND ? AND status = ?').all(employeeId, periodStart, periodEnd, 'active');

    let totalMinutes = 0;
    let totalOvertimeMinutes = 0;
    let workingDays = 0;
    let totalBillableAmount = 0;

    const shiftAmount = employee.perShiftAmount || 0;
    const hourlyRate = employee.hourlyRate || (shiftAmount / 8) || 0;
    const otRate = hourlyRate; // 1x or 1.5x? Assuming 1x based on previous code.

    const details = {
        days: [],
        breakdown: []
    };

    entries.forEach(e => {
        const clockIn = e.clockIn || e.shiftStart;
        const clockOut = e.clockOut || e.shiftEnd;

        if (!clockIn) return;

        const calc = calculateShiftHours(clockIn, clockOut, e.breakMinutes, e.dayType, employee.shiftEnd || '18:00');

        totalMinutes += calc.billableMinutes;
        totalOvertimeMinutes += calc.overtimeMinutes;
        workingDays += 1;

        // Daily Calculation
        // If per shift amount is set, do they get that plus OT?
        // Or is it pure hourly?
        let dailyPay = 0;
        if (shiftAmount > 0 && calc.billableMinutes > 0) {
            // Pro-rate if less than full shift? Or fixed?
            // Assuming fixed per day if present?
            // Let's use Hourly for precision if available
            dailyPay = (calc.regularMinutes / 60) * hourlyRate + (calc.overtimeMinutes / 60) * otRate;
        } else {
            dailyPay = (calc.billableMinutes / 60) * hourlyRate;
        }

        totalBillableAmount += dailyPay;

        details.days.push({
            date: e.date,
            pay: dailyPay,
            minutes: calc.billableMinutes,
            ot: calc.overtimeMinutes
        });
    });

    // Deductions
    const deductions = database.prepare('SELECT SUM(amount) as total FROM deductions WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').get(employeeId, periodStart, periodEnd, 'active');
    const totalDeductions = deductions.total || 0;

    // Adjustments
    const adjustments = database.prepare('SELECT SUM(adjustmentAmount) as total FROM payroll_adjustments WHERE employeeId = ? AND periodStart = ? AND periodEnd = ? AND status = ?').get(employeeId, periodStart, periodEnd, 'approved'); // Only approved?
    const totalAdjustments = adjustments.total || 0;

    const grossPay = totalBillableAmount + totalAdjustments;
    const netPay = grossPay - totalDeductions;

    return {
        id: null, // Virtual
        employeeId,
        periodStart,
        periodEnd,
        grossPay: parseFloat(grossPay.toFixed(2)),
        deductions: parseFloat(totalDeductions.toFixed(2)),
        netPay: Math.max(0, parseFloat(netPay.toFixed(2))),
        status: 'Unpaid',
        workingDays,
        totalMinutes,
        totalOvertimeMinutes,
        hourlyRate,
        perShiftAmount: shiftAmount,
        overtimePay: parseFloat(((totalOvertimeMinutes / 60) * otRate).toFixed(2)),
        details
    };
}
