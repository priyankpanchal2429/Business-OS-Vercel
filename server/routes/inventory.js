const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventory.service');

// GET all items
router.get('/', async (req, res) => {
    try {
        const items = await inventoryService.getAllItems();
        res.json(items);
    } catch (err) {
        console.error('Inventory GET error:', err);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// CREATE item
router.post('/', async (req, res) => {
    try {
        const newItem = await inventoryService.createItem(req.body);
        res.json(newItem);
    } catch (err) {
        console.error('Inventory POST error:', err);
        res.status(500).json({ error: 'Failed to create item' });
    }
});

// UPDATE item
router.patch('/:id', async (req, res) => {
    try {
        const updatedItem = await inventoryService.updateItem(req.params.id, req.body);
        res.json(updatedItem);
    } catch (err) {
        console.error('Inventory PATCH error:', err);
        res.status(500).json({ error: 'Failed to update item' });
    }
});

// DELETE item
router.delete('/:id', async (req, res) => {
    try {
        await inventoryService.deleteItem(req.params.id);
        res.json({ success: true, message: 'Item deleted' });
    } catch (err) {
        console.error('Inventory DELETE error:', err);
        res.status(500).json({ error: 'Failed to delete item' });
    }
});

module.exports = router;
