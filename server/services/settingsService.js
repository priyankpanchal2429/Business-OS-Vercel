
const supabase = require('../config/supabase');

const settingsService = {
    // Get setting by key
    async get(key) {
        const { data, error } = await supabase
            .from('settings')
            .select('value')
            .eq('key', key)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore Not Found
        return data ? data.value : null;
    },

    // Update setting
    async update(key, value) {
        const { data, error } = await supabase
            .from('settings')
            .upsert({ key, value, updated_at: new Date().toISOString() })
            .select()
            .single();

        if (error) throw error;
        return data.value;
    }
};

module.exports = settingsService;
