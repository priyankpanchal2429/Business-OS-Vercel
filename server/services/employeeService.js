const { db } = require('../config/firebase');

const employeeService = {
    // Get all active employees
    async getAll() {
        const snapshot = await db.collection('employees').get();
        if (snapshot.empty) return [];

        let employees = [];
        snapshot.forEach(doc => {
            employees.push({ id: doc.id, ...doc.data() });
        });

        // Manual sort since Firestore sorting can be complex with mixed types, 
        // but name should be fine. For now, in-memory sort matches previous behavior.
        return employees.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    },

    // Get employee by ID
    async getById(id) {
        const doc = await db.collection('employees').doc(String(id)).get();
        if (!doc.exists) return null;
        return { id: doc.id, ...doc.data() };
    },

    // Create new employee
    async create(employeeData) {
        const id = String(employeeData.id || Date.now());
        const newEmployee = {
            ...employeeData,
            id: parseInt(id), // Keep numeric ID in data for compatibility
            joiningDate: employeeData.joiningDate || new Date().toISOString().split('T')[0],
            status: employeeData.status || 'Active'
        };

        // Firestore set (upsert-like, but we use it for creation here)
        await db.collection('employees').doc(id).set(newEmployee);

        return newEmployee;
    },

    // Update employee
    async update(id, updates) {
        const docRef = db.collection('employees').doc(String(id));

        // Exclude ID from updates
        const { id: _, ...safeUpdates } = updates;

        await docRef.update(safeUpdates);

        // Return updated data
        const doc = await docRef.get();
        return { id: doc.id, ...doc.data() };
    },

    // Delete employee
    async delete(id) {
        await db.collection('employees').doc(String(id)).delete();
        return true;
    }
};

module.exports = employeeService;
