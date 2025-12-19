
// Time Calculation Utilities

// Helper: Calculate shift hours with Travel/Work Day distinction and OT logic
function calculateShiftHours(startTime, endTime, breakMins, dayType = 'Work', otCutoff = '18:00', dinnerStart = '20:00', dinnerEnd = '21:00') {
    if (!startTime || !endTime) {
        return {
            totalMinutes: 0,
            billableMinutes: 0,
            regularMinutes: 0,
            overtimeMinutes: 0,
            nightStatus: null,
            dinnerBreakDeduction: 0
        };
    }

    const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    let start = parseTime(startTime);
    let end = parseTime(endTime);
    const otCutoffMins = parseTime(otCutoff);

    // Handle overnight shifts (e.g., 22:00 to 02:00)
    if (end < start) {
        end += 24 * 60;
    }

    const DINNER_START = parseTime(dinnerStart); // 20:00
    const DINNER_END = parseTime(dinnerEnd);   // 21:00

    let duration = end - start;
    let dinnerBreakDeduction = 0;

    // Check Dinner Break (8 PM - 9 PM) - auto deduction if working during this time
    if (start < DINNER_END && end > DINNER_START) {
        const overlapStart = Math.max(start, DINNER_START);
        const overlapEnd = Math.min(end, DINNER_END);
        if (overlapEnd > overlapStart) {
            dinnerBreakDeduction = overlapEnd - overlapStart;
        }
    }

    // Determine Night Status
    let nightStatus = null;
    if (end > 24 * 60) {
        nightStatus = 'Extended Night';
    } else if (end >= 20 * 60) {
        nightStatus = 'Night Shift';
    }

    // --- TRAVEL vs WORK DAY LOGIC ---
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    let billableMinutes = 0;

    if (dayType === 'Travel') {
        // RULE: Travel days = ALL hours are regular pay, but breaks are DEDUCTED
        // Travel calculation: Total duration - breaks
        billableMinutes = Math.max(0, duration - (breakMins || 0));
        regularMinutes = billableMinutes;
        overtimeMinutes = 0;
        dinnerBreakDeduction = 0; // No dinner break for travel
        nightStatus = 'Travel'; // Custom status for visual clarity
    } else {
        // WORK DAY: Calculate regular vs OT based on 6 PM (18:00) cutoff

        // First calculate billable minutes (with break deductions for work days)
        billableMinutes = Math.max(0, duration - (breakMins || 0) - dinnerBreakDeduction);

        // Recalculate more precisely:
        regularMinutes = Math.max(0, Math.min(end, otCutoffMins) - start);
        overtimeMinutes = Math.max(0, end - Math.max(start, otCutoffMins));

        // Deduct standard break from regular time first
        let remainingBreak = breakMins || 0;
        if (regularMinutes >= remainingBreak) {
            regularMinutes -= remainingBreak;
            remainingBreak = 0;
        } else {
            remainingBreak -= regularMinutes;
            regularMinutes = 0;
        }

        // Deduct remaining break from OT
        if (remainingBreak > 0 && overtimeMinutes >= remainingBreak) {
            overtimeMinutes -= remainingBreak;
        } else if (remainingBreak > 0) {
            overtimeMinutes = 0;
        }

        // Deduct dinner break if it falls in OT period (typically 8-9 PM is after 6 PM)
        if (overtimeMinutes > 0 && dinnerBreakDeduction > 0) {
            // Check if dinner time overlaps with OT period
            const otStartTime = Math.max(start, otCutoffMins);
            if (otStartTime < DINNER_END && end > DINNER_START) {
                const dinnerOverlapInOT = Math.min(
                    dinnerBreakDeduction,
                    Math.max(0, Math.min(end, DINNER_END) - Math.max(otStartTime, DINNER_START))
                );
                overtimeMinutes = Math.max(0, overtimeMinutes - dinnerOverlapInOT);
            }
        }

        // Recalculate billable to match
        billableMinutes = regularMinutes + overtimeMinutes;

        // If no overtime, clear night status (no OT = no night shift)
        if (overtimeMinutes === 0) {
            nightStatus = null;
        }
    }

    return {
        totalMinutes: duration,
        billableMinutes,
        regularMinutes,
        overtimeMinutes,
        nightStatus,
        dinnerBreakDeduction,
        dayType
    };
}

// Check if a day is a working day (present)
function isWorkingDay(timesheetEntry) {
    if (!timesheetEntry) return false;
    // Check if clocked in or has shift hours
    return !!(timesheetEntry.clockIn || timesheetEntry.shiftStart);
}

// Count working days in a set of entries
function countWorkingDays(entries) {
    if (!Array.isArray(entries)) return 0;
    return entries.filter(isWorkingDay).length;
}

module.exports = {
    calculateShiftHours,
    isWorkingDay,
    countWorkingDays
};
