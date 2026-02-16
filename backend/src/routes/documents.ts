import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/documents';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

// GET /api/documents - Fetch all documents
router.get('/', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { linked, type } = req.query;

        const where: any = {};
        if (linked !== undefined) {
            where.isLinked = linked === 'true';
        }
        if (type) {
            where.type = type;
        }

        const documents = await prisma.document.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                terrains: { include: { terrain: true } },
                customers: { include: { customer: true } },
                contracts: { include: { contract: true } },
                parcels: { include: { parcel: true } },
            },
        });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// GET /api/documents/:id - Fetch single document
router.get('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                terrains: { include: { terrain: true } },
                customers: { include: { customer: true } },
                contracts: { include: { contract: true } },
                parcels: { include: { parcel: true } },
            },
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json(document);
    } catch (error) {
        console.error('Error fetching document:', error);
        res.status(500).json({ error: 'Failed to fetch document' });
    }
});

// GET /api/documents/:id/download - Download document file
router.get('/:id/download', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (!document) {
            return res.status(404).json({ error: 'Document not found' });
        }

        // If we have file data in DB, send it
        if (document.fileData) {
            res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
            return res.send(document.fileData);
        }

        // If we have a file path, send the file
        if (document.filePath && fs.existsSync(document.filePath)) {
            return res.download(document.filePath, document.name);
        }

        res.status(404).json({ error: 'File not found' });
    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({ error: 'Failed to download document' });
    }
});

// POST /api/documents - Upload new document
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { name, type, terrainId, customerId, contractId, parcelId, storeInDb } = req.body;

        if (!req.file && !name) {
            return res.status(400).json({ error: 'Document name is required when no file is uploaded' });
        }

        // Read file data if storing in DB
        let fileData: Buffer | undefined;
        if (req.file && storeInDb === 'true') {
            fileData = fs.readFileSync(req.file.path);
        }

        const document = await prisma.document.create({
            data: {
                name: name || req.file?.originalname || 'Document sans nom',
                filePath: req.file?.path,
                fileData: fileData as any,
                mimeType: req.file?.mimetype,
                type: type || 'other',
                sizeBytes: req.file?.size,
                uploadedAt: req.file ? new Date() : undefined,
                isLinked: !!(terrainId || customerId || contractId || parcelId),
            },
        });

        // Link to entities if provided
        if (terrainId) {
            await prisma.terrainDocument.create({
                data: { terrainId, documentId: document.id },
            });
        }
        if (customerId) {
            await prisma.customerDocument.create({
                data: { customerId, documentId: document.id },
            });
        }
        if (contractId) {
            await prisma.contractDocument.create({
                data: { contractId, documentId: document.id },
            });
        }
        if (parcelId) {
            await prisma.parcelDocument.create({
                data: { parcelId, documentId: document.id },
            });
        }

        res.status(201).json(document);
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ error: 'Failed to upload document' });
    }
});

// PUT /api/documents/:id - Update document metadata
router.put('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { name, type } = req.body;

        const document = await prisma.document.update({
            where: { id },
            data: { name, type },
        });

        res.json(document);
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ error: 'Failed to update document' });
    }
});

// DELETE /api/documents/:id - Delete document
router.delete('/:id', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;

        const document = await prisma.document.findUnique({
            where: { id },
        });

        if (document?.filePath && fs.existsSync(document.filePath)) {
            fs.unlinkSync(document.filePath);
        }

        await prisma.document.delete({ where: { id } });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
});

// POST /api/documents/:id/link - Link document to an entity
router.post('/:id/link', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { entityType, entityId } = req.body;

        if (!entityId) {
            return res.status(400).json({ error: 'entityId is required' });
        }

        switch (entityType) {
            case 'terrain':
                await prisma.terrainDocument.upsert({
                    where: { terrainId_documentId: { terrainId: entityId, documentId: id } },
                    create: { terrainId: entityId, documentId: id },
                    update: {},
                });
                break;
            case 'customer':
                await prisma.customerDocument.upsert({
                    where: { customerId_documentId: { customerId: entityId, documentId: id } },
                    create: { customerId: entityId, documentId: id },
                    update: {},
                });
                break;
            case 'contract':
                await prisma.contractDocument.upsert({
                    where: { contractId_documentId: { contractId: entityId, documentId: id } },
                    create: { contractId: entityId, documentId: id },
                    update: {},
                });
                break;
            case 'parcel':
                await prisma.parcelDocument.upsert({
                    where: { parcelId_documentId: { parcelId: entityId, documentId: id } },
                    create: { parcelId: entityId, documentId: id },
                    update: {},
                });
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity type' });
        }

        await prisma.document.update({
            where: { id },
            data: { isLinked: true },
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error linking document:', error);
        res.status(500).json({ error: 'Failed to link document' });
    }
});

// DELETE /api/documents/:id/link - Unlink document from an entity
router.delete('/:id/link', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { entityType, entityId } = req.body;

        switch (entityType) {
            case 'terrain':
                await prisma.terrainDocument.delete({
                    where: { terrainId_documentId: { terrainId: entityId, documentId: id } },
                });
                break;
            case 'customer':
                await prisma.customerDocument.delete({
                    where: { customerId_documentId: { customerId: entityId, documentId: id } },
                });
                break;
            case 'contract':
                await prisma.contractDocument.delete({
                    where: { contractId_documentId: { contractId: entityId, documentId: id } },
                });
                break;
            case 'parcel':
                await prisma.parcelDocument.delete({
                    where: { parcelId_documentId: { parcelId: entityId, documentId: id } },
                });
                break;
            default:
                return res.status(400).json({ error: 'Invalid entity type' });
        }

        // Check if document is still linked to anything
        const document = await prisma.document.findUnique({
            where: { id },
            include: {
                terrains: true,
                customers: true,
                contracts: true,
                parcels: true,
            },
        });

        if (document) {
            const isStillLinked =
                document.terrains.length > 0 ||
                document.customers.length > 0 ||
                document.contracts.length > 0 ||
                document.parcels.length > 0;

            await prisma.document.update({
                where: { id },
                data: { isLinked: isStillLinked },
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Error unlinking document:', error);
        res.status(500).json({ error: 'Failed to unlink document' });
    }
});

export default router;
