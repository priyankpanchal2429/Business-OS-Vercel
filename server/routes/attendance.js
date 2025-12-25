const express = require('express');
const router = express.Router();
const employeeService = require('../services/employee.service');
const prisma = require('../services/prisma'); // Proper service import

// GET Today's Attendance
router.get('/today', async (req, res) => {
    try {
        // Use local time for "Today" to match user's desktop context
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000;
        const localDate = new Date(now.getTime() - offset);
        const todayStr = localDate.toISOString().split('T')[0];
        const isSunday = localDate.getUTCDay() === 0;

        // 1. Get all employees
        const employees = await employeeService.getAllEmployees(); // Corrected method name from getAll()
        const activeEmployees = employees.filter(emp => emp.status !== 'Resigned');

        // 2. Get today's timesheet entries from Prisma
        const entries = await prisma.timesheetEntry.findMany({
            where: {
                date: todayStr
            }
        });

        const working = [];
        const notWorking = [];

        activeEmployees.forEach(emp => {
            const todayEntry = entries.find(entry =>
                entry.employeeId === emp.id &&
                (entry.clockIn || entry.status === 'working')
            );

            if (todayEntry) {
                working.push({
                    employeeId: emp.id,
                    employeeName: emp.name,
                    employeeImage: emp.image,
                    employeeRole: emp.role,
                    clockIn: todayEntry.clockIn,
                    clockOut: todayEntry.clockOut || null,
                    timesheetId: todayEntry.id,
                    status: 'working'
                });
            } else {
                notWorking.push({
                    employeeId: emp.id,
                    employeeName: emp.name,
                    employeeImage: emp.image,
                    employeeRole: emp.role,
                    status: 'absent'
                });
            }
        });

        const dayOfWeek = localDate.toLocaleDateString('en-US', { weekday: 'long' });
        const isClosed = isSunday && working.length === 0;

        if (isClosed) {
            return res.json({
                date: todayStr,
                dayOfWeek: 'Sunday',
                isSunday: true,
                isClosed: true,
                message: 'Bank is closed on Sundays',
                summary: { total: 0, working: 0, notWorking: 0 },
                working: [],
                notWorking: []
            });
        }

        res.json({
            date: todayStr,
            dayOfWeek,
            isSunday,
            summary: {
                total: activeEmployees.length,
                working: working.length,
                notWorking: notWorking.length
            },
            working,
            notWorking
        });
    } catch (err) {
        console.error('Attendance Error:', err);
        res.status(500).json({ error: 'Failed to fetch attendance' });
    }
});

module.exports = router;
