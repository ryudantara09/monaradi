import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/contracts - Fetch all contracts
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const contracts = await prisma.contract.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                parties: {
                    include: { customer: true },
                },
                terrains: {
                    include: { terrain: true },
                },
                _count: {
                    select: {
                        documents: true,
                        transactions: true,
                    },
                },
            },
        });

        res.json(contracts);
    } catch (error) {
        console.error('Error fetching contracts:', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
});

// GET /api/contracts/:id - Fetch single contract with relations
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const contract = await prisma.contract.findUnique({
            where: { id },
            include: {
                parties: {
                    include: { customer: true },
                },
                terrains: {
                    include: { terrain: true },
                },
                documents: {
                    include: { document: true },
                },
                transactions: true,
            },
        });

        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        res.json(contract);
    } catch (error) {
        console.error('Error fetching contract:', error);
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
});

// POST /api/contracts - Create new contract
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            contractNumber,
            type,
            status,
            startDate,
            endDate,
            terms,
            notes,
            parties,      // [{customerId, role}]
            terrainIds,   // [terrainId, ...]
        } = req.body;

        const contract = await prisma.contract.create({
            data: {
                contractNumber,
                type,
                status: status || 'draft',
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                terms,
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
                parties: { include: { customer: true } },
                terrains: { include: { terrain: true } },
            },
        });

        res.status(201).json(contract);
    } catch (error) {
        console.error('Error creating contract:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

// PUT /api/contracts/:id - Update contract
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { contractNumber, type, status, startDate, endDate, terms, notes } = req.body;

        const contract = await prisma.contract.update({
            where: { id },
            data: {
                contractNumber,
                type,
                status,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                terms,
                notes,
            },
        });

        res.json(contract);
    } catch (error) {
        console.error('Error updating contract:', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
});

// DELETE /api/contracts/:id - Delete contract
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        await prisma.contract.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

// POST /api/contracts/:id/parties - Add party to contract
router.post('/:id/parties', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { customerId, role } = req.body;

        const party = await prisma.contractParty.create({
            data: {
                contractId: id,
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

// DELETE /api/contracts/:id/parties/:customerId/:role - Remove party from contract
router.delete('/:id/parties/:customerId/:role', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id, customerId, role } = req.params;

        await prisma.contractParty.delete({
            where: {
                contractId_customerId_role: {
                    contractId: id,
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

// POST /api/contracts/:id/terrains - Link terrain to contract
router.post('/:id/terrains', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { terrainId } = req.body;

        const link = await prisma.contractTerrain.create({
            data: {
                contractId: id,
                terrainId,
            },
            include: { terrain: true },
        });

        res.status(201).json(link);
    } catch (error) {
        console.error('Error linking terrain:', error);
        res.status(500).json({ error: 'Failed to link terrain' });
    }
});

// DELETE /api/contracts/:id/terrains/:terrainId - Unlink terrain from contract
router.delete('/:id/terrains/:terrainId', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id, terrainId } = req.params;

        await prisma.contractTerrain.delete({
            where: {
                contractId_terrainId: {
                    contractId: id,
                    terrainId,
                },
            },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error unlinking terrain:', error);
        res.status(500).json({ error: 'Failed to unlink terrain' });
    }
});

export default router;
