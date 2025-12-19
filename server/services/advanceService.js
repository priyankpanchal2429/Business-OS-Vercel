
const supabase = require('../config/supabase');

const advanceService = {
    // Get all advance requests
    async getAll() {
        const { data, error } = await supabase
            .from('advance_salaries')
            .select('*')
            .order('dateIssued', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Get for employee
    async getForEmployee(employeeId) {
        const { data, error } = await supabase
            .from('advance_salaries')
            .select('*')
            .eq('employeeId', employeeId)
            .order('dateIssued', { ascending: false });

        if (error) throw error;
        return data;
    },

    // Create new advance request
    async create(advance) {
        const newAdvance = {
            id: advance.id || `adv-${Date.now()}`,
            ...advance,
            status: advance.status || 'pending'
        };

        const { data, error } = await supabase
            .from('advance_salaries')
            .insert(newAdvance)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update status (Approve/Reject)
    async updateStatus(id, status) {
        const { data, error } = await supabase
            .from('advance_salaries')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = advanceService;
