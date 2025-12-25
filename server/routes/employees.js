const express = require('express');
const router = express.Router();
const employeeService = require('../services/employee.service');

// GET all employees
router.get('/', async (req, res) => {
    try {
        const employees = await employeeService.getAllEmployees();
        res.json(employees);
    } catch (err) {
        console.error('Employees GET error:', err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// GET by ID
router.get('/:id', async (req, res) => {
    try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        if (!employee) return res.status(404).json({ error: 'Employee not found' });
        res.json(employee);
    } catch (err) {
        console.error('Employee GET error:', err);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// CREATE employee
router.post('/', async (req, res) => {
    try {
        const newEmployee = await employeeService.createEmployee(req.body);
        res.json(newEmployee);
    } catch (err) {
        console.error('Employee POST error:', err);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// UPDATE employee
router.patch('/:id', async (req, res) => {
    try {
        const updatedEmployee = await employeeService.updateEmployee(req.params.id, req.body);
        res.json(updatedEmployee);
    } catch (err) {
        console.error('Employee PATCH error:', err);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
    try {
        await employeeService.deleteEmployee(req.params.id);
        res.json({ success: true, message: 'Employee deleted' });
    } catch (err) {
        console.error('Employee DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;
