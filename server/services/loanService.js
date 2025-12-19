
const supabase = require('../config/supabase');

const loanService = {
    // Get all loans (optionally filter by employeeId)
    async getAll(employeeId = null) {
        let query = supabase.from('loans').select('*').order('date', { ascending: false });
        if (employeeId) {
            query = query.eq('employeeId', employeeId);
        }
        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },

    // Get active loan for employee
    async getActive(employeeId) {
        const { data, error } = await supabase
            .from('loans')
            .select('*')
            .eq('employeeId', employeeId)
            .eq('status', 'active')
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    // Create new loan
    async create(loanData) {
        const { data, error } = await supabase
            .from('loans')
            .insert({
                ...loanData,
                status: loanData.status || 'active',
                createdAt: new Date().toISOString()
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Update loan
    async update(id, loanData) {
        const { data, error } = await supabase
            .from('loans')
            .update({
                ...loanData,
                updatedAt: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Delete loan
    async delete(id) {
        const { error } = await supabase
            .from('loans')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = loanService;
