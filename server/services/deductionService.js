
const supabase = require('../config/supabase');

const deductionService = {
    // Get deductions for an employee in a period
    async getForEmployee(employeeId, periodStart, periodEnd) {
        const { data, error } = await supabase
            .from('deductions')
            .select('*')
            .eq('employeeId', employeeId)
            .eq('periodStart', periodStart)
            .eq('periodEnd', periodEnd)
            .eq('status', 'active');

        if (error) throw error;
        return data || [];
    },

    // Get all deductions (for viewing history/list)
    async getAll() {
        const { data, error } = await supabase
            .from('deductions')
            .select('*')
            .order('periodStart', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Create a deduction (e.g. from Advance or Loan)
    async create(deduction) {
        const newDeduction = {
            id: deduction.id || `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            ...deduction,
            status: 'active'
        };

        const { data, error } = await supabase
            .from('deductions')
            .insert(newDeduction)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete/Cancel deduction
    async delete(id) {
        const { error } = await supabase
            .from('deductions')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = deductionService;
