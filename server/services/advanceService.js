const { db } = require('../config/firebase');

const advanceService = {
    // Get all advance requests
    async getAll() {
        const snapshot = await db.collection('advance_salaries').get();
        if (snapshot.empty) return [];

        let advances = [];
        snapshot.forEach(doc => {
            advances.push({ id: doc.id, ...doc.data() });
        });

        // Sort by dateIssued in memory
        return advances.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));
    },

    // Get for employee
    async getForEmployee(employeeId) {
        const snapshot = await db.collection('advance_salaries')
            .where('employeeId', '==', parseInt(employeeId))
            .get();

        if (snapshot.empty) return [];

        let advances = [];
        snapshot.forEach(doc => {
            advances.push({ id: doc.id, ...doc.data() });
        });

        return advances.sort((a, b) => new Date(b.dateIssued) - new Date(a.dateIssued));
    },

    // Create new advance request
    async create(advance) {
        const id = advance.id || `adv-${Date.now()}`;
        const newAdvance = {
            ...advance,
            id,
            status: advance.status || 'pending'
        };

        await db.collection('advance_salaries').doc(id).set(newAdvance);
        return newAdvance;
    },

    // Update status (Approve/Reject)
    async updateStatus(id, status) {
        const docRef = db.collection('advance_salaries').doc(String(id));
        await docRef.update({ status });

        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    }
};

module.exports = advanceService;
