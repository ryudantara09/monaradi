import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/customers - Fetch all customers
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const customers = await prisma.customer.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                purchasedParcels: {
                    include: { terrain: true },
                },
                _count: {
                    select: {
                        documents: true,
                        contracts: true,
                        purchasedParcels: true,
                    },
                },
            },
        });

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET /api/customers/:id - Fetch single customer with relations
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                purchasedParcels: {
                    include: {
                        terrain: true,
                    },
                },
                documents: {
                    include: { document: true },
                },
                contracts: {
                    include: {
                        parcels: true,
                    },
                },
            },
        });

        if (!customer) {
            return res.status(404).json({ error: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer:', error);
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// POST /api/customers - Create new customer
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { name, email, phone, address, idNumber, notes } = req.body;

        const customer = await prisma.customer.create({
            data: {
                name,
                email,
                phone,
                address,
                idNumber,
                notes,
            },
        });

        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { name, email, phone, address, idNumber, notes } = req.body;

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email,
                phone,
                address,
                idNumber,
                notes,
            },
        });

        res.json(customer);
    } catch (error) {
        console.error('Error updating customer:', error);
        res.status(500).json({ error: 'Failed to update customer' });
    }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        await prisma.customer.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

// GET /api/customers/search - Search customers
router.get('/search/:query', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { query } = req.params;

        const customers = await prisma.customer.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { email: { contains: query } },
                    { phone: { contains: query } },
                ],
            },
            orderBy: { name: 'asc' },
        });

        res.json(customers);
    } catch (error) {
        console.error('Error searching customers:', error);
        res.status(500).json({ error: 'Failed to search customers' });
    }
});

export default router;
