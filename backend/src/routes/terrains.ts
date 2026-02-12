import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

// GET /api/terrains - Fetch all terrains
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const terrains = await prisma.terrain.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                parcels: {
                    include: { customer: true },
                },
                _count: {
                    select: {
                        documents: true,
                    },
                },
            },
        });

        res.json(terrains);
    } catch (error) {
        console.error('Error fetching terrains:', error);
        res.status(500).json({ error: 'Failed to fetch terrains' });
    }
});

// GET /api/terrains/:id - Fetch single terrain with relations
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const terrain = await prisma.terrain.findUnique({
            where: { id },
            include: {
                parcels: {
                    include: { customer: true },
                },
                documents: {
                    include: { document: true },
                },
            },
        });

        if (!terrain) {
            return res.status(404).json({ error: 'Terrain not found' });
        }

        res.json(terrain);
    } catch (error) {
        console.error('Error fetching terrain:', error);
        res.status(500).json({ error: 'Failed to fetch terrain' });
    }
});

// POST /api/terrains - Create new terrain
router.post('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            name,
            address,
            latitude,
            longitude,
            mapReference,
            areaSize,
            areaUnit,
            notes,
            // Project merged fields
            imagePath,
            scaleFactor,
            refLineData
        } = req.body;

        const terrain = await prisma.terrain.create({
            data: {
                name,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                mapReference,
                areaSize: areaSize ? parseFloat(areaSize) : null,
                areaUnit: areaUnit || 'sqm',
                notes,
                imagePath,
                scaleFactor: scaleFactor ? parseFloat(scaleFactor) : null,
                refLineData,
            },
        });

        res.status(201).json(terrain);
    } catch (error) {
        console.error('Error creating terrain:', error);
        res.status(500).json({ error: 'Failed to create terrain' });
    }
});

// PUT /api/terrains/:id - Update terrain
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const {
            name,
            address,
            latitude,
            longitude,
            mapReference,
            areaSize,
            areaUnit,
            notes,
            imagePath,
            scaleFactor,
            refLineData
        } = req.body;

        const terrain = await prisma.terrain.update({
            where: { id },
            data: {
                name,
                address,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                mapReference,
                areaSize: areaSize ? parseFloat(areaSize) : null,
                areaUnit,
                notes,
                imagePath,
                scaleFactor: scaleFactor ? parseFloat(scaleFactor) : null,
                refLineData,
            },
        });

        res.json(terrain);
    } catch (error) {
        console.error('Error updating terrain:', error);
        res.status(500).json({ error: 'Failed to update terrain' });
    }
});

// DELETE /api/terrains/:id - Delete terrain
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        await prisma.terrain.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting terrain:', error);
        res.status(500).json({ error: 'Failed to delete terrain' });
    }
});

// POST /api/terrains/:id/link-parcel - Link a parcel to terrain
router.post('/:id/link-parcel', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { parcelId } = req.body;

        const parcel = await prisma.parcel.update({
            where: { id: parcelId },
            data: { terrainId: id },
        });

        res.json({ success: true, parcel });
    } catch (error) {
        console.error('Error linking parcel:', error);
        res.status(500).json({ error: 'Failed to link parcel' });
    }
});

export default router;
