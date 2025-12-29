const { db } = require('../config/firebase');

const timesheetService = {
    // Get timesheets for an employee in a date range
    async getForEmployee(employeeId, startDate, endDate) {
        // Note: Firestore requires an index for compound queries with range + sort.
        // To allow this to work immediately without manual index creation, 
        // we'll filter by range and sort in memory.
        const snapshot = await db.collection('timesheets')
            .where('employeeId', '==', String(employeeId))
            .where('date', '>=', startDate)
            .where('date', '<=', endDate)
            .get();

        if (snapshot.empty) return [];

        let entries = [];
        snapshot.forEach(doc => {
            entries.push({ unique_id: doc.id, ...doc.data() });
        });

        // Sort by date ascending
        return entries.sort((a, b) => new Date(a.date) - new Date(b.date));
    },

    // Create or Update a timesheet entry (Generic Save)
    async saveEntry(entry) {
        // entry object should match schema
        const { unique_id, id, ...payload } = entry; // Remove IDs from payload source

        // Proactive Sanitization
        const forbidden = ['lastUpdated', 'last_updated', 'created_at', 'day', 'month', 'year', 'employeeName'];
        forbidden.forEach(field => delete payload[field]);

        // Ensure string type for employeeId
        if (payload.employeeId) payload.employeeId = String(payload.employeeId);

        // Generate Composite Doc ID (One entry per day per employee)
        const docId = `${payload.employeeId}_${payload.date}`;

        const docRef = db.collection('timesheets').doc(docId);

        // Use set with merge to update or create
        await docRef.set({
            ...payload,
            unique_id: docId, // Store specific ID for reference
            updated_at: new Date().toISOString()
        }, { merge: true });

        const doc = await docRef.get();
        return { unique_id: doc.id, ...doc.data() };
    },

    // Clock In (Specific helper)
    async clockIn(employeeId, date, time, shiftStart, shiftEnd) {
        return this.saveEntry({
            employeeId,
            date,
            clockIn: time,
            shiftStart,
            shiftEnd,
            status: 'active'
        });
    },

    // Clock Out
    async clockOut(employeeId, date, time) {
        // Calculate Doc ID
        const docId = `${String(employeeId)}_${date}`;
        const docRef = db.collection('timesheets').doc(docId);

        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('No timesheet entry found to clock out');
        }

        await docRef.update({ clockOut: time });

        const updated = await docRef.get();
        return { unique_id: updated.id, ...updated.data() };
    },

    // Update Break Time
    async updateBreak(employeeId, date, minutes) {
        const docId = `${String(employeeId)}_${date}`;
        const docRef = db.collection('timesheets').doc(docId);

        const doc = await docRef.get();
        if (!doc.exists) {
            throw new Error('No timesheet entry found');
        }

        await docRef.update({ breakMinutes: minutes });

        const updated = await docRef.get();
        return { unique_id: updated.id, ...updated.data() };
    }
};

module.exports = timesheetService;
