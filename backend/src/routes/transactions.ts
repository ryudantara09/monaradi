import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/transactions - Fetch all transactions
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const transactions = await prisma.transaction.findMany({
            orderBy: { transactionDate: 'desc' },
            include: {
                contract: true,
                parties: {
                    include: { customer: true },
                },
                terrains: {
                    include: { terrain: true },
                },
                _count: {
                    select: { documents: true },
                },
            },
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/transactions/:id - Fetch single transaction with relations
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const transaction = await prisma.transaction.findUnique({
            where: { id },
            include: {
                contract: true,
                parties: {
                    include: { customer: true },
                },
                terrains: {
                    include: { terrain: true },
                },
                documents: {
                    include: { document: true },
                },
            },
        });

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        res.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            contractId,
            type,
            transactionDate,
            price,
            currency,
            notes,
            parties,      // [{customerId, role}]
            terrainIds,   // [terrainId, ...]
        } = req.body;

        const transaction = await prisma.transaction.create({
            data: {
                contractId,
                type,
                transactionDate: new Date(transactionDate),
                price,
                currency: currency || 'TND',
                notes,
                parties: parties?.length ? {
                    create: parties.map((p: { customerId: string; role: string }) => ({
                        customerId: p.customerId,
                        role: p.role,
                    })),
                } : undefined,
                terrains: terrainIds?.length ? {
                    create: terrainIds.map((terrainId: string) => ({
                        terrainId,
                    })),
                } : undefined,
            },
            include: {
                contract: true,
                parties: { include: { customer: true } },
                terrains: { include: { terrain: true } },
            },
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// PUT /api/transactions/:id - Update transaction
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { contractId, type, transactionDate, price, currency, notes } = req.body;

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                contractId,
                type,
                transactionDate: transactionDate ? new Date(transactionDate) : undefined,
                price,
                currency,
                notes,
            },
        });

        res.json(transaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        await prisma.transaction.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Failed to delete transaction' });
    }
});

// POST /api/transactions/:id/parties - Add party to transaction
router.post('/:id/parties', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { customerId, role } = req.body;

        const party = await prisma.transactionParty.create({
            data: {
                transactionId: id,
                customerId,
                role,
            },
            include: { customer: true },
        });

        res.status(201).json(party);
    } catch (error) {
        console.error('Error adding party:', error);
        res.status(500).json({ error: 'Failed to add party' });
    }
});

// DELETE /api/transactions/:id/parties/:customerId/:role - Remove party from transaction
router.delete('/:id/parties/:customerId/:role', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id, customerId, role } = req.params;

        await prisma.transactionParty.delete({
            where: {
                transactionId_customerId_role: {
                    transactionId: id,
                    customerId,
                    role,
                },
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error removing party:', error);
        res.status(500).json({ error: 'Failed to remove party' });
    }
});

export default router;
