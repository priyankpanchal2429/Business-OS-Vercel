
const supabase = require('../config/supabase');

const bonusService = {
    // Get withdrawals
    async getWithdrawals(employeeId) {
        let query = supabase.from('bonus_withdrawals').select('*');

        if (employeeId) {
            query = query.eq('employeeId', employeeId);
        }

        const { data, error } = await query.order('date', { ascending: false });
        if (error) throw error;
        return data;
    },

    // Create withdrawal
    async createWithdrawal(withdrawal) {
        const newWithdrawal = {
            id: withdrawal.id || `bw-${Date.now()}`,
            ...withdrawal
        };

        const { data, error } = await supabase
            .from('bonus_withdrawals')
            .insert(newWithdrawal)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = bonusService;
