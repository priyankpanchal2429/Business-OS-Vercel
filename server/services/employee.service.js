const prisma = require('./prisma');

class EmployeeService {
    async getAllEmployees() {
        return await prisma.employee.findMany({
            orderBy: { displayOrder: 'desc' },
            include: {
                loans: true,
                timesheets: {
                    take: 5,
                    orderBy: { date: 'desc' }
                }
            }
        });
    }

    async getEmployeeById(id) {
        return await prisma.employee.findUnique({
            where: { id: parseInt(id) },
            include: {
                loans: true,
                timesheets: true,
                bonuses: true,
                deductions: true
            }
        });
    }

    async createEmployee(data) {
        // Handle JSON fields which might be passed as strings or objects
        const workingDays = typeof data.workingDays === 'object' ? JSON.stringify(data.workingDays) : data.workingDays;
        const documents = typeof data.documents === 'object' ? JSON.stringify(data.documents) : data.documents;

        return await prisma.employee.create({
            data: {
                ...data,
                workingDays,
                documents,
                createdAt: new Date().toISOString()
            }
        });
    }

    async updateEmployee(id, data) {
        if (data.workingDays && typeof data.workingDays === 'object') {
            data.workingDays = JSON.stringify(data.workingDays);
        }

        return await prisma.employee.update({
            where: { id: parseInt(id) },
            data: {
                ...data,
                updatedAt: new Date().toISOString()
            }
        });
    }

    async deleteEmployee(id) {
        // Basic soft delete or status update is safer, but mirroring standard delete for now
        // Or strictly setting status to 'Inactive' as per typically usage
        return await prisma.employee.update({
            where: { id: parseInt(id) },
            data: { status: 'Inactive' }
        });
    }
}

module.exports = new EmployeeService();
