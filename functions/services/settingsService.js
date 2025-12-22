const { db } = require('../config/firebase');

const settingsService = {
    // Get setting by key
    async get(key) {
        const doc = await db.collection('settings').doc(key).get();
        if (!doc.exists) return null;
        return doc.data().value;
    },

    // Update setting
    async update(key, value) {
        const docRef = db.collection('settings').doc(key);
        const data = { key, value, updated_at: new Date().toISOString() };
        await docRef.set(data);
        return value;
    }
};

module.exports = settingsService;
