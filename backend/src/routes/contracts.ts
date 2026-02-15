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
                customer: true,
                parcels: {
                    include: {
                        terrain: true
                    }
                },
                _count: {
                    select: {
                        documents: true,
                        parcels: true,
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
                customer: true,
                parcels: {
                    include: { terrain: true }
                },
                documents: {
                    include: { document: true },
                },
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
            terms,
            notes,
            saleAmount,
            customerId,
            parcelIds, // [parcelId, ...]
        } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'Customer ID is required' });
        }

        const contract = await prisma.contract.create({
            data: {
                contractNumber,
                terms,
                notes,
                saleAmount: saleAmount ? parseFloat(saleAmount) : undefined,
                customer: {
                    connect: { id: customerId }
                },
                parcels: parcelIds && parcelIds.length > 0 ? {
                    connect: parcelIds.map((id: string) => ({ id }))
                } : undefined
            },
            include: {
                customer: true,
                parcels: {
                    include: {
                        terrain: true
                    }
                },
            },
        });

        // Update parcels status to SOLD and link contractId
        if (parcelIds && parcelIds.length > 0) {
            await prisma.parcel.updateMany({
                where: { id: { in: parcelIds } },
                data: {
                    status: 'SOLD',
                    customerId: customerId,
                    contractId: contract.id
                }
            });
        }

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
        const { contractNumber, terms, notes } = req.body;

        const contract = await prisma.contract.update({
            where: { id },
            data: {
                contractNumber,
                terms,
                notes,
            },
            include: {
                customer: true,
                parcels: {
                    include: {
                        terrain: true
                    }
                }
            }
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

        // First find the contract to unlink parcels
        const contract = await prisma.contract.findUnique({
            where: { id },
            include: { parcels: true }
        });

        if (contract) {
            // Reset parcels to AVAILABLE and unlink contract
            await prisma.parcel.updateMany({
                where: { contractId: id },
                data: {
                    status: 'AVAILABLE',
                    customerId: null,
                    contractId: null
                }
            });

            await prisma.contract.delete({ where: { id } });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting contract:', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

export default router;
