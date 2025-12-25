const prisma = require('./prisma');

class InventoryService {
    async getAllItems() {
        return await prisma.inventory.findMany({
            orderBy: { name: 'asc' }
        });
    }

    async getItemById(id) {
        return await prisma.inventory.findUnique({
            where: { id: parseInt(id) }
        });
    }

    async createItem(data) {
        return await prisma.inventory.create({
            data: {
                ...data,
                lastUpdated: new Date().toISOString()
            }
        });
    }

    async updateItem(id, data) {
        return await prisma.inventory.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                lastUpdated: new Date().toISOString()
            }
        });
    }

    async deleteItem(id) {
        return await prisma.inventory.delete({
            where: { id: parseInt(id) }
        });
    }

    async updateStock(id, quantity, type = 'add') {
        const item = await prisma.inventory.findUnique({ where: { id: parseInt(id) } });
        if (!item) throw new Error('Item not found');

        let newStock = item.stock;
        if (type === 'add') newStock += quantity;
        else if (type === 'subtract') newStock -= quantity;
        else if (type === 'set') newStock = quantity;

        return await prisma.inventory.update({
            where: { id: parseInt(id) },
            data: {
                stock: newStock,
                lastUpdated: new Date().toISOString()
            }
        });
    }
}

module.exports = new InventoryService();
