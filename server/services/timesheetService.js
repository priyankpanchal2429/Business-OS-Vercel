
const supabase = require('../config/supabase');

const timesheetService = {
    // Get timesheets for an employee in a date range
    async getForEmployee(employeeId, startDate, endDate) {
        const { data, error } = await supabase
            .from('timesheet_entries')
            .select('*')
            .eq('employeeId', employeeId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Create or Update a timesheet entry (Generic Save)
    // Supports full payload with calculated fields (totalMinutes, etc.)
    async saveEntry(entry) {
        // entry object should match Supabase schema columns
        const { unique_id, id, ...payload } = entry; // Remove IDs

        // Proactive Sanitization
        const forbidden = ['lastUpdated', 'last_updated', 'created_at', 'day', 'month', 'year', 'employeeName'];
        forbidden.forEach(field => delete payload[field]);

        let result;
        if (unique_id) {
            // Update by unique_id if we have it
            const { data, error } = await supabase
                .from('timesheet_entries')
                .update(payload)
                .eq('unique_id', unique_id)
                .select()
                .single();
            if (error) throw error;
            result = data;
        } else {
            // Upsert logic: Try to find by employeeId + date
            const { data: existing } = await supabase
                .from('timesheet_entries')
                .select('unique_id')
                .eq('employeeId', payload.employeeId)
                .eq('date', payload.date)
                .maybeSingle();

            if (existing) {
                const { data, error } = await supabase
                    .from('timesheet_entries')
                    .update(payload)
                    .eq('unique_id', existing.unique_id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                const { data, error } = await supabase
                    .from('timesheet_entries')
                    .insert(payload)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }
        }
        return result;
    },

    // Clock In (Specific helper)
    // Preserves legacy signature but uses generic save
    async clockIn(employeeId, date, time, shiftStart, shiftEnd) {
        return this.saveEntry({
            employeeId,
            date,
            clockIn: time,
            shiftStart,
            shiftEnd,
            status: 'active'
            // DB defaults will handle other fields if not provided
        });
    },

    // Clock Out
    async clockOut(employeeId, date, time) {
        // Find entry first
        const { data: existing } = await supabase
            .from('timesheet_entries')
            .select('*')
            .eq('employeeId', employeeId)
            .eq('date', date)
            .maybeSingle();

        if (!existing) {
            throw new Error('No timesheet entry found to clock out');
        }

        const { data, error } = await supabase
            .from('timesheet_entries')
            .update({ clockOut: time })
            .eq('unique_id', existing.unique_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update Break Time
    async updateBreak(employeeId, date, minutes) {
        const { data: existing } = await supabase
            .from('timesheet_entries')
            .select('unique_id')
            .eq('employeeId', employeeId)
            .eq('date', date)
            .maybeSingle();

        if (!existing) {
            throw new Error('No timesheet entry found');
        }

        const { data, error } = await supabase
            .from('timesheet_entries')
            .update({ breakMinutes: minutes })
            .eq('unique_id', existing.unique_id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = timesheetService;
