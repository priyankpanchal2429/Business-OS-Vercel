const { db } = require('../config/firebase');

const loanService = {
    // Get all loans (optionally filter by employeeId)
    async getAll(employeeId = null) {
        let query = db.collection('loans');

        if (employeeId) {
            query = query.where('employeeId', '==', parseInt(employeeId));
        }

        const snapshot = await query.get();
        if (snapshot.empty) return [];

        let loans = [];
        snapshot.forEach(doc => {
            loans.push({ id: doc.id, ...doc.data() });
        });

        return loans.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Get active loan for employee
    async getActive(employeeId) {
        const snapshot = await db.collection('loans')
            .where('employeeId', '==', parseInt(employeeId))
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() };
    },

    // Create new loan
    async create(loanData) {
        const id = String(loanData.id || Date.now());
        const newLoan = {
            ...loanData,
            id: parseInt(id),
            status: loanData.status || 'active',
            createdAt: new Date().toISOString()
        };

        await db.collection('loans').doc(id).set(newLoan);
        return newLoan;
    },

    // Update loan
    async update(id, loanData) {
        const docRef = db.collection('loans').doc(String(id));
        const updates = {
            ...loanData,
            updatedAt: new Date().toISOString()
        };

        await docRef.update(updates);
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    },

    // Delete loan
    async delete(id) {
        await db.collection('loans').doc(String(id)).delete();
        return true;
    }
};

module.exports = loanService;
