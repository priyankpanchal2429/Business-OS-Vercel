
const supabase = require('../config/supabase');

const employeeService = {
    // Get all active employees
    async getAll() {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get employee by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('employees')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new employee
    async create(employeeData) {
        const newEmployee = {
            ...employeeData,
            id: employeeData.id || Date.now(), // Use provided ID or generate
            joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
            status: employeeData.status || 'Active'
        };

        const { data, error } = await supabase
            .from('employees')
            .insert(newEmployee)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update employee
    async update(id, updates) {
        // Exclude ID from updates just in case
        const { id: _, ...safeUpdates } = updates;
        // Proactive Sanitization
        if ('lastUpdated' in safeUpdates) delete safeUpdates.lastUpdated;
        if ('last_updated' in safeUpdates) delete safeUpdates.last_updated;
        if ('created_at' in safeUpdates) delete safeUpdates.created_at;

        const { data, error } = await supabase
            .from('employees')
            .update(safeUpdates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete employee
    async delete(id) {
        // Note: Cascade delete is handled by Foreign Keys in Postgres schema
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Reorder (update IDs or sort order? - Current JSON uses array order)
    // SQL doesn't have inherent order. We might need a "sortOrder" column if this is critical.
    // For now, we'll ignore reorder or implement it if a column exists.
    // The previous implementation used array reordering.
    // If user relies on Reorder, we might need to add a column. 
    // Checking schema... no sortOrder column. 
    // We will skip reorder logic for DB for now, or just do nothing as "default sort by name".
};

module.exports = employeeService;
