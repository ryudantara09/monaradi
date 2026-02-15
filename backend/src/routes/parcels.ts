import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/parcels - Fetch all parcels
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const parcels = await prisma.parcel.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                customer: true,
                terrain: true,
            },
        });

        // Parse geometry JSON for each parcel
        const parsedParcels = parcels.map((p) => ({
            ...p,
            geometry: JSON.parse(p.geometry),
        }));

        res.json(parsedParcels);
    } catch (error) {
        console.error('Error fetching parcels:', error);
        res.status(500).json({ error: 'Failed to fetch parcels' });
    }
});

// GET /api/parcels/:id - Fetch single parcel with relations
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const parcel = await prisma.parcel.findUnique({
            where: { id },
            include: {
                customer: true,
                terrain: true,
                documents: {
                    include: { document: true },
                },
                contract: true,
            },
        });

        if (!parcel) {
            return res.status(404).json({ error: 'Parcel not found' });
        }

        res.json({
            ...parcel,
            geometry: JSON.parse(parcel.geometry),
        });
    } catch (error) {
        console.error('Error fetching parcel:', error);
        res.status(500).json({ error: 'Failed to fetch parcel' });
    }
});

// POST /api/parcels - Create new parcel
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { geometry, label, ownerName, status, areaSqm, pricePerSqm, terrainId, customerId, contractId, amountPaid } =
            req.body;

        // Validate: cannot mark as SOLD without a contract
        if ((status === 'SOLD' || customerId) && !contractId) {
            return res.status(400).json({
                error: 'Cannot create a sold parcel without a contract. Please create a contract first.'
            });
        }

        // Validate: parcel area cannot exceed available terrain area
        if (terrainId && areaSqm) {
            const terrain = await prisma.terrain.findUnique({
                where: { id: terrainId },
                include: { parcels: true }
            });

            if (terrain && terrain.areaSize) {
                // Sum existing parcel areas
                const existingParcelsTotalArea = terrain.parcels.reduce(
                    (sum, p) => sum + (p.areaSqm || 0),
                    0
                );

                // Check if adding this parcel would exceed terrain area
                if (existingParcelsTotalArea + areaSqm > terrain.areaSize) {
                    return res.status(400).json({
                        error: `Cannot create parcel: total parcel area (${existingParcelsTotalArea + areaSqm} m²) would exceed terrain area (${terrain.areaSize} m²). Available: ${terrain.areaSize - existingParcelsTotalArea} m².`
                    });
                }
            }
        }

        // Validate and calculate total price
        const totalPrice = (areaSqm || 0) * (pricePerSqm || 0);

        // Calculate payment status
        const finalAmountPaid = amountPaid || 0;
        let paymentStatus = 'UNPAID';
        if (finalAmountPaid >= totalPrice && totalPrice > 0) {
            paymentStatus = 'PAID';
        } else if (finalAmountPaid > 0) {
            paymentStatus = 'PARTIAL';
        }

        // Determine status
        let finalStatus = status || 'AVAILABLE';
        if (customerId && contractId) finalStatus = 'SOLD';

        const parcel = await prisma.parcel.create({
            data: {
                geometry: JSON.stringify(geometry),
                label: label || 'Untitled',
                ownerName: ownerName || null,
                status: finalStatus,
                areaSqm: areaSqm || 0,
                pricePerSqm: pricePerSqm || 0,
                totalPrice,
                amountPaid: finalAmountPaid,
                paymentStatus,
                terrainId: terrainId || null,
                customerId: customerId || null,
                contractId: contractId || null,
            },
            include: {
                customer: true,
                terrain: true,
            },
        });

        res.status(201).json({
            ...parcel,
            geometry: JSON.parse(parcel.geometry),
        });
    } catch (error) {
        console.error('Error creating parcel:', error);
        res.status(500).json({ error: 'Failed to create parcel' });
    }
});

// PUT /api/parcels/:id - Update parcel
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { geometry, label, ownerName, status, areaSqm, pricePerSqm, customerId, terrainId, contractId, amountPaid } = req.body;

        // Fetch existing parcel
        const existing = await prisma.parcel.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Parcel not found' });
        }

        // Determine final contractId
        const finalContractId = contractId !== undefined ? contractId : existing.contractId;

        // Validate: cannot mark as SOLD without a contract
        if ((status === 'SOLD' || customerId) && !finalContractId) {
            return res.status(400).json({
                error: 'Cannot mark parcel as sold without a contract. Please create a contract first.'
            });
        }

        // Calculate values
        const finalAreaSqm = areaSqm ?? existing.areaSqm;
        const finalPricePerSqm = pricePerSqm ?? existing.pricePerSqm;
        const totalPrice = finalAreaSqm * finalPricePerSqm;

        // Calculate payment status
        const finalAmountPaid = amountPaid !== undefined ? amountPaid : existing.amountPaid;
        let paymentStatus = existing.paymentStatus;
        if (amountPaid !== undefined || areaSqm !== undefined || pricePerSqm !== undefined) {
            if (finalAmountPaid >= totalPrice && totalPrice > 0) {
                paymentStatus = 'PAID';
            } else if (finalAmountPaid > 0) {
                paymentStatus = 'PARTIAL';
            } else {
                paymentStatus = 'UNPAID';
            }
        }

        // Determine the terrain ID (use new if provided, otherwise keep existing)
        const finalTerrainId = terrainId !== undefined ? terrainId : existing.terrainId;

        // Validate: parcel area cannot exceed available terrain area
        if (finalTerrainId && finalAreaSqm) {
            const terrain = await prisma.terrain.findUnique({
                where: { id: finalTerrainId },
                include: { parcels: true }
            });

            if (terrain && terrain.areaSize) {
                // Sum existing parcel areas (excluding the current parcel being updated)
                const existingParcelsTotalArea = terrain.parcels
                    .filter(p => p.id !== id)
                    .reduce((sum, p) => sum + (p.areaSqm || 0), 0);

                // Check if updating this parcel would exceed terrain area
                if (existingParcelsTotalArea + finalAreaSqm > terrain.areaSize) {
                    return res.status(400).json({
                        error: `Cannot update parcel: total parcel area (${existingParcelsTotalArea + finalAreaSqm} m²) would exceed terrain area (${terrain.areaSize} m²). Available: ${terrain.areaSize - existingParcelsTotalArea} m².`
                    });
                }
            }
        }

        // Determine status if customerId is being changed
        let finalStatus = status;
        if (customerId !== undefined) {
            if (customerId && finalContractId) finalStatus = 'SOLD';
            else if (customerId === null) finalStatus = 'AVAILABLE';
        }

        const parcel = await prisma.parcel.update({
            where: { id },
            data: {
                geometry: geometry ? JSON.stringify(geometry) : undefined,
                label,
                ownerName,
                status: finalStatus,
                areaSqm: finalAreaSqm,
                pricePerSqm: finalPricePerSqm,
                totalPrice,
                amountPaid: finalAmountPaid,
                paymentStatus,
                customerId: customerId !== undefined ? (customerId || null) : undefined,
                terrainId: terrainId !== undefined ? (terrainId || null) : undefined,
                contractId: contractId !== undefined ? (contractId || null) : undefined,
            },
            include: {
                customer: true,
                terrain: true,
            },
        });

        res.json({
            ...parcel,
            geometry: JSON.parse(parcel.geometry),
        });
    } catch (error) {
        console.error('Error updating parcel:', error);
        res.status(500).json({ error: 'Failed to update parcel' });
    }
});

// DELETE /api/parcels/:id - Delete parcel
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        await prisma.parcel.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting parcel:', error);
        res.status(500).json({ error: 'Failed to delete parcel' });
    }
});

export default router;
