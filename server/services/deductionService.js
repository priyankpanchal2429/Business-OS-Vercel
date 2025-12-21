const { db } = require('../config/firebase');

const deductionService = {
    // Get deductions for an employee in a period
    async getForEmployee(employeeId, periodStart, periodEnd) {
        const snapshot = await db.collection('deductions')
            .where('employeeId', '==', parseInt(employeeId))
            .where('status', '==', 'active')
            .get();

        if (snapshot.empty) return [];

        let deductions = [];
        snapshot.forEach(doc => {
            deductions.push({ id: doc.id, ...doc.data() });
        });

        // Filter by period in memory
        return deductions.filter(d =>
            d.periodStart === periodStart &&
            d.periodEnd === periodEnd
        );
    },

    // Get all deductions (for viewing history/list)
    async getAll() {
        const snapshot = await db.collection('deductions').get();
        if (snapshot.empty) return [];

        let deductions = [];
        snapshot.forEach(doc => {
            deductions.push({ id: doc.id, ...doc.data() });
        });

        // Sort by periodStart desc
        return deductions.sort((a, b) => new Date(b.periodStart) - new Date(a.periodStart));
    },

    // Create a deduction
    async create(deduction) {
        const id = deduction.id || `ded-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newDeduction = {
            ...deduction,
            id,
            status: 'active'
        };

        await db.collection('deductions').doc(id).set(newDeduction);
        return newDeduction;
    },

    // Delete/Cancel deduction
    async delete(id) {
        await db.collection('deductions').doc(String(id)).delete();
        return true;
    }
};

module.exports = deductionService;
