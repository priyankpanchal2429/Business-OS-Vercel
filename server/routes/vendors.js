const express = require('express');
const router = express.Router();
const prisma = require('../services/prisma'); // Using core prisma since vendor service wasn't explicit in task, but can create inline or better create service.

// I will quickly create a service-less implementation here for expediency, but following pattern, I really should stick to Service pattern.
// Let's create a small Vendor Service inline or just use Prisma directly here since it's simple.
// In "industry standard", we should separate concerns.
// I will emulate the pattern by using a helper or just Prisma calls here as a "Controller" layer.

// GET all vendors
router.get('/', async (req, res) => {
    try {
        const vendors = await prisma.vendor.findMany();
        res.json(vendors);
    } catch (err) {
        console.error('Vendors GET error:', err);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

// CREATE vendor
router.post('/', async (req, res) => {
    try {
        const newVendor = await prisma.vendor.create({
            data: {
                ...req.body,
                createdAt: new Date().toISOString()
            }
        });
        res.json(newVendor);
    } catch (err) {
        console.error('Vendors POST error:', err);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

// UPDATE vendor
router.patch('/:id', async (req, res) => {
    try {
        const updatedVendor = await prisma.vendor.update({
            where: { id: parseInt(req.params.id) },
            data: req.body
        });
        res.json(updatedVendor);
    } catch (err) {
        console.error('Vendors PATCH error:', err);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
    try {
        await prisma.vendor.delete({
            where: { id: parseInt(req.params.id) }
        });
        res.json({ success: true, message: 'Vendor deleted' });
    } catch (err) {
        console.error('Vendors DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

module.exports = router;
