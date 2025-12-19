
const supabase = require('../config/supabase');

const vendorService = {
    // Get all vendors
    async getAll() {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data;
    },

    // Get vendor by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    // Create new vendor
    async create(vendor) {
        const newVendor = {
            ...vendor,
            id: vendor.id || Date.now(),
            created_at: new Date().toISOString()
        };
        // Remove known incompatible fields
        if ('lastUpdated' in newVendor) delete newVendor.lastUpdated;
        if ('last_updated' in newVendor) delete newVendor.last_updated;

        const { data, error } = await supabase
            .from('vendors')
            .insert(newVendor)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update vendor
    async update(id, updates) {
        const updatePayload = { ...updates };

        // Remove fields not in DB or protected
        delete updatePayload.id;
        delete updatePayload.created_at;
        if ('lastUpdated' in updatePayload) delete updatePayload.lastUpdated;
        if ('last_updated' in updatePayload) delete updatePayload.last_updated;

        const { data, error } = await supabase
            .from('vendors')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete vendor
    async delete(id) {
        const { error } = await supabase
            .from('vendors')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = vendorService;
