const { db } = require('../config/firebase');

const bonusService = {
    // Get withdrawals
    async getWithdrawals(employeeId) {
        let query = db.collection('bonus_withdrawals');

        if (employeeId) {
            query = query.where('employeeId', '==', parseInt(employeeId));
        }

        const snapshot = await query.get();
        if (snapshot.empty) return [];

        let withdrawals = [];
        snapshot.forEach(doc => {
            withdrawals.push({ id: doc.id, ...doc.data() });
        });

        return withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    // Create withdrawal
    async createWithdrawal(withdrawal) {
        const id = withdrawal.id || `bw-${Date.now()}`;
        const newWithdrawal = {
            id,
            ...withdrawal
        };

        await db.collection('bonus_withdrawals').doc(id).set(newWithdrawal);
        return newWithdrawal;
    }
};

module.exports = bonusService;
