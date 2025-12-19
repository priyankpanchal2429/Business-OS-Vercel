
const supabase = require('../config/supabase');

const VALID_COLUMNS = [
    'id', 'name', 'description', 'category', 'type',
    'quantity', 'unit', 'price', 'minStockLevel',
    'location', 'image', 'vendor', 'lastUpdated'
];

const sanitizePayload = (data) => {
    const payload = {};
    Object.keys(data).forEach(key => {
        if (VALID_COLUMNS.includes(key)) {
            payload[key] = data[key];
        }
    });
    return payload;
};

const inventoryService = {
    // Get all items
    async getAll() {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        // Map image to imageUrl for frontend
        return data.map(item => ({
            ...item,
            imageUrl: item.image
        }));
    },

    // Get item by ID
    async getById(id) {
        const { data, error } = await supabase
            .from('inventory')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        // Map image to imageUrl for frontend
        return data ? { ...data, imageUrl: data.image } : null;
    },

    // Create new item
    async create(item) {
        const newItem = sanitizePayload({
            ...item,
            id: item.id || Date.now(),
            image: item.imageUrl || item.image,
            quantity: item.stock || item.quantity,
            minStockLevel: item.minStock,
            vendor: item.vendorName || item.vendor,
            lastUpdated: new Date().toISOString()
        });

        const { data, error } = await supabase
            .from('inventory')
            .insert(newItem)
            .select()
            .single();

        if (error) throw error;
        return data ? { ...data, imageUrl: data.image } : null;
    },

    // Update item
    async update(id, updates) {
        const updatePayload = sanitizePayload({
            ...updates,
            image: updates.imageUrl || updates.image,
            quantity: updates.stock || updates.quantity,
            minStockLevel: updates.minStock,
            vendor: updates.vendorName || updates.vendor,
            lastUpdated: new Date().toISOString()
        });

        // Ensure ID is not updated
        delete updatePayload.id;

        const { data, error } = await supabase
            .from('inventory')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data ? { ...data, imageUrl: data.image } : null;
    },

    // Delete item
    async delete(id) {
        const { error } = await supabase
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    }
};

module.exports = inventoryService;
