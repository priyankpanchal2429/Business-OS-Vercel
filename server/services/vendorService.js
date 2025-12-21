const { db } = require('../config/firebase');

const vendorService = {
    // Get all vendors
    async getAll() {
        const snapshot = await db.collection('vendors').get();
        if (snapshot.empty) return [];

        let vendors = [];
        snapshot.forEach(doc => {
            vendors.push({ id: doc.id, ...doc.data() });
        });

        return vendors.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },

    // Get vendor by ID
    async getById(id) {
        const doc = await db.collection('vendors').doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    // Create new vendor
    async create(vendor) {
        const id = String(vendor.id || Date.now());
        const newVendor = {
            ...vendor,
            id: parseInt(id),
            created_at: new Date().toISOString()
        };
        // Remove known incompatible fields
        if ('lastUpdated' in newVendor) delete newVendor.lastUpdated;
        if ('last_updated' in newVendor) delete newVendor.last_updated;

        await db.collection('vendors').doc(id).set(newVendor);
        return newVendor;
    },

    // Update vendor
    async update(id, updates) {
        const updatePayload = { ...updates };

        // Remove fields not in DB or protected
        delete updatePayload.id;
        delete updatePayload.created_at;
        if ('lastUpdated' in updatePayload) delete updatePayload.lastUpdated;
        if ('last_updated' in updatePayload) delete updatePayload.last_updated;

        const docRef = db.collection('vendors').doc(String(id));
        await docRef.update(updatePayload);

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    },

    // Delete vendor
    async delete(id) {
        await db.collection('vendors').doc(String(id)).delete();
        return true;
    }
};

module.exports = vendorService;
