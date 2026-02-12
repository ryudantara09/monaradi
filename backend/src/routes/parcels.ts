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

// POST /api/parcels - Create new parcel
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { geometry, label, ownerName, status, areaSqm, pricePerSqm, terrainId, customerId } =
            req.body;

        // Validate and calculate total price
        const totalPrice = (areaSqm || 0) * (pricePerSqm || 0);

        // Determine status
        let finalStatus = status || 'AVAILABLE';
        if (customerId) finalStatus = 'SOLD';

        const parcel = await prisma.parcel.create({
            data: {
                geometry: JSON.stringify(geometry),
                label: label || 'Untitled',
                ownerName: ownerName || null,
                status: finalStatus,
                areaSqm: areaSqm || 0,
                pricePerSqm: pricePerSqm || 0,
                totalPrice,
                terrainId: terrainId || null,
                customerId: customerId || null,
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
        const { geometry, label, ownerName, status, areaSqm, pricePerSqm, customerId, terrainId } = req.body;

        // Fetch existing parcel
        const existing = await prisma.parcel.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ error: 'Parcel not found' });
        }

        // Calculate values
        const finalAreaSqm = areaSqm ?? existing.areaSqm;
        const finalPricePerSqm = pricePerSqm ?? existing.pricePerSqm;
        const totalPrice = finalAreaSqm * finalPricePerSqm;

        // Determine status if customerId is being changed
        let finalStatus = status;
        if (customerId !== undefined) {
            if (customerId) finalStatus = 'SOLD';
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
                customerId: customerId !== undefined ? (customerId || null) : undefined,
                terrainId: terrainId !== undefined ? (terrainId || null) : undefined,
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
