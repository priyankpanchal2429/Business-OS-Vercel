const { db } = require('../config/firebase');

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
        const snapshot = await db.collection('inventory').get();
        if (snapshot.empty) return [];

        let items = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            items.push({
                id: doc.id,
                ...data,
                imageUrl: data.image // Frontend Compat
            });
        });

        // Sort by name
        return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },

    // Get item by ID
    async getById(id) {
        const doc = await db.collection('inventory').doc(String(id)).get();
        if (!doc.exists) return null;

        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            imageUrl: data.image
        };
    },

    // Create new item
    async create(item) {
        const id = String(item.id || Date.now());
        const newItem = sanitizePayload({
            ...item,
            id: parseInt(id), // Keep numeric ID in data for compatibility
            image: item.imageUrl || item.image,
            quantity: item.stock || item.quantity,
            minStockLevel: item.minStock,
            vendor: item.vendorName || item.vendor,
            lastUpdated: new Date().toISOString()
        });

        await db.collection('inventory').doc(id).set(newItem);

        return {
            ...newItem,
            imageUrl: newItem.image
        };
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

        const docRef = db.collection('inventory').doc(String(id));
        await docRef.update(updatePayload);

        const doc = await docRef.get();
        const data = doc.data();

        return {
            id: doc.id,
            ...data,
            imageUrl: data.image
        };
    },

    // Delete item
    async delete(id) {
        await db.collection('inventory').doc(String(id)).delete();
        return true;
    }
};

module.exports = inventoryService;
