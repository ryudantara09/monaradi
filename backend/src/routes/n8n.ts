import { Router } from 'express';
import type { PrismaClient } from '@prisma/client';

const router = Router();

/**
 * N8N Webhook Integration Routes
 * These endpoints are designed to be called by n8n workflows
 */

// POST /api/n8n/webhook/image-upload
// Receives image data from n8n workflow for processing
router.post('/webhook/image-upload', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            imageBase64,
            imagePath,
            projectName,
            webhookUrl,
            metadata
        } = req.body;

        // Create or get project
        let project = null;
        if (projectName) {
            project = await prisma.project.create({
                data: {
                    name: projectName || 'N8N Upload',
                    imagePath: imagePath || '/uploads/n8n-upload',
                    imageData: imageBase64 ? Buffer.from(imageBase64, 'base64') : undefined,
                },
            });
        }

        // Queue the image for AI processing
        const queueItem = await prisma.imageProcessingQueue.create({
            data: {
                projectId: project?.id,
                imageData: imageBase64 || imagePath,
                status: 'pending',
                webhookUrl: webhookUrl,
            },
        });

        // Log the workflow execution
        await prisma.workflowLog.create({
            data: {
                workflowId: req.headers['x-n8n-workflow-id'] as string || 'unknown',
                workflowName: req.headers['x-n8n-workflow-name'] as string,
                executionId: req.headers['x-n8n-execution-id'] as string,
                status: 'success',
                inputData: JSON.stringify({ projectName, hasImage: !!imageBase64 }),
                outputData: JSON.stringify({ queueItemId: queueItem.id, projectId: project?.id }),
            },
        });

        res.json({
            success: true,
            message: 'Image queued for processing',
            data: {
                queueItemId: queueItem.id,
                projectId: project?.id,
                status: 'pending',
            },
        });
    } catch (error) {
        console.error('[N8N Webhook] Error processing image upload:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process image upload',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/n8n/webhook/process-detection
// Receives detection results from n8n workflow (after AI processing)
router.post('/webhook/process-detection', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            queueItemId,
            projectId,
            polygons,
            confidence,
            vertices,
            parcels: parcelIndices,
        } = req.body;

        // Update queue item status
        if (queueItemId) {
            await prisma.imageProcessingQueue.update({
                where: { id: queueItemId },
                data: {
                    status: 'completed',
                    resultData: JSON.stringify({ polygons, confidence, vertices, parcelIndices }),
                    processedAt: new Date(),
                },
            });
        }

        // Process polygons and create parcels
        let createdParcels: any[] = [];

        if (polygons && Array.isArray(polygons)) {
            for (let i = 0; i < polygons.length; i++) {
                const polygon = polygons[i];
                if (polygon.length >= 3) {
                    const parcel = await prisma.parcel.create({
                        data: {
                            geometry: JSON.stringify(polygon),
                            label: `Parcel ${i + 1}`,
                            status: 'AVAILABLE',
                            paymentStatus: 'UNPAID',
                            areaSqm: 0,
                            pricePerSqm: 0,
                            totalPrice: 0,
                            projectId: projectId,
                        },
                    });
                    createdParcels.push(parcel);
                }
            }
        }

        // Handle topology format (vertices + indices)
        if (vertices && parcelIndices) {
            for (let i = 0; i < parcelIndices.length; i++) {
                const indices = parcelIndices[i];
                const polygon = indices.map((idx: number) => vertices[idx]);

                if (polygon.length >= 3) {
                    const parcel = await prisma.parcel.create({
                        data: {
                            geometry: JSON.stringify(polygon),
                            label: `Parcel ${createdParcels.length + 1}`,
                            status: 'AVAILABLE',
                            paymentStatus: 'UNPAID',
                            areaSqm: 0,
                            pricePerSqm: 0,
                            totalPrice: 0,
                            projectId: projectId,
                        },
                    });
                    createdParcels.push(parcel);
                }
            }
        }

        res.json({
            success: true,
            message: `Created ${createdParcels.length} parcels`,
            data: {
                parcelsCreated: createdParcels.length,
                parcelIds: createdParcels.map(p => p.id),
            },
        });
    } catch (error) {
        console.error('[N8N Webhook] Error processing detection:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to process detection results',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// POST /api/n8n/webhook/save-document
// Saves document metadata and binary data from n8n workflow
router.post('/webhook/save-document', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const {
            name,
            fileBase64,
            filePath,
            mimeType,
            type,
            terrainId,
            customerId,
            contractId,
            transactionId,
            googleDriveId,
        } = req.body;

        // Create document
        const document = await prisma.document.create({
            data: {
                name: name || 'Untitled Document',
                filePath: filePath,
                fileData: fileBase64 ? Buffer.from(fileBase64, 'base64') : undefined,
                mimeType: mimeType,
                type: type || 'other',
                sizeBytes: fileBase64 ? Buffer.from(fileBase64, 'base64').length : undefined,
                googleDriveId: googleDriveId,
                uploadedAt: new Date(),
                isLinked: !!(terrainId || customerId || contractId || transactionId),
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
        if (transactionId) {
            await prisma.transactionDocument.create({
                data: { transactionId, documentId: document.id },
            });
        }

        res.json({
            success: true,
            message: 'Document saved successfully',
            data: {
                documentId: document.id,
                name: document.name,
            },
        });
    } catch (error) {
        console.error('[N8N Webhook] Error saving document:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save document',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

// GET /api/n8n/queue/pending
// Returns pending image processing items for n8n to poll
router.get('/queue/pending', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;

        const pendingItems = await prisma.imageProcessingQueue.findMany({
            where: { status: 'pending' },
            orderBy: { createdAt: 'asc' },
            take: 10,
        });

        res.json({
            success: true,
            data: pendingItems,
        });
    } catch (error) {
        console.error('[N8N Queue] Error fetching pending items:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch pending items',
        });
    }
});

// PUT /api/n8n/queue/:id/status
// Updates queue item status
router.put('/queue/:id/status', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { id } = req.params;
        const { status, resultData, errorMessage } = req.body;

        const updated = await prisma.imageProcessingQueue.update({
            where: { id },
            data: {
                status,
                resultData: resultData ? JSON.stringify(resultData) : undefined,
                processedAt: status === 'completed' || status === 'failed' ? new Date() : undefined,
            },
        });

        res.json({
            success: true,
            data: updated,
        });
    } catch (error) {
        console.error('[N8N Queue] Error updating status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update status',
        });
    }
});

// GET /api/n8n/workflow-logs
// Returns recent workflow execution logs
router.get('/workflow-logs', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const limit = parseInt(req.query.limit as string) || 50;

        const logs = await prisma.workflowLog.findMany({
            orderBy: { startedAt: 'desc' },
            take: limit,
        });

        res.json({
            success: true,
            data: logs,
        });
    } catch (error) {
        console.error('[N8N Logs] Error fetching logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch workflow logs',
        });
    }
});

// POST /api/n8n/trigger/detect
// Triggers AI detection and sends results to n8n callback URL
router.post('/trigger/detect', async (req, res) => {
    try {
        const prisma: PrismaClient = req.app.locals.prisma;
        const { imageBase64, projectId, callbackUrl } = req.body;

        if (!imageBase64) {
            return res.status(400).json({
                success: false,
                error: 'No image data provided'
            });
        }

        // Queue for processing
        const queueItem = await prisma.imageProcessingQueue.create({
            data: {
                projectId,
                imageData: imageBase64,
                status: 'processing',
                webhookUrl: callbackUrl,
            },
        });

        // Perform detection (similar to detect.ts logic)
        const { GoogleGenAI } = await import('@google/genai');
        const apiKey = process.env.GOOGLE_AI_API;

        if (!apiKey) {
            await prisma.imageProcessingQueue.update({
                where: { id: queueItem.id },
                data: { status: 'failed' },
            });
            return res.status(400).json({
                success: false,
                error: 'Google AI API key not configured',
            });
        }

        // Extract base64 data
        let mimeType = 'image/jpeg';
        let base64Data = imageBase64;
        if (imageBase64.startsWith('data:')) {
            const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (matches) {
                mimeType = matches[1]!;
                base64Data = matches[2]!;
            }
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a cadastral mapping expert. Your goal is to extract the topology of the land parcels in this image.

## TOPOLOGY STRATEGY
Instead of tracing separate polygons, you must:
1. Identify all unique **Vertices** (corners/intersections) in the entire image.
2. Define each **Parcel** as a sequence of vertex indices. 
3. The end goal is to create a list masks for the lands/parcels.

## REQUIREMENTS
- **Vertices**: A list of [x, y] coordinates for every corner. (0,0 is top-left, 1,1 is bottom-right).
- **Parcels**: A list of lists, where each inner list contains the INDICES of the vertices that form the parcel (0-indexed).
- **Precision**: Use the visible grid dots to align your vertices.

## OUTPUT FORMAT
Return valid JSON only:
{
  "vertices": [[x,y], [x,y], ...],
  "parcels": [[idx1, idx2, idx3, ...], [idx1, ...], ...],
  "confidence": 0.95
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
            ],
        });

        const content = response.text;
        let result: any = {};

        if (content) {
            // Extract JSON from response
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```')) {
                const firstNewLine = jsonStr.indexOf('\n');
                if (firstNewLine !== -1) {
                    jsonStr = jsonStr.substring(firstNewLine + 1);
                }
            }
            if (jsonStr.endsWith('```')) {
                jsonStr = jsonStr.substring(0, jsonStr.length - 3);
            }
            result = JSON.parse(jsonStr.trim());
        }

        // Process results
        let polygons: number[][][] = [];
        if (result.vertices && result.parcels) {
            polygons = result.parcels.map((indices: number[]) =>
                indices.map((idx: number) => result.vertices[idx])
            );
        }

        // Update queue item
        await prisma.imageProcessingQueue.update({
            where: { id: queueItem.id },
            data: {
                status: 'completed',
                resultData: JSON.stringify({ polygons, confidence: result.confidence }),
                processedAt: new Date(),
            },
        });

        // Send to n8n callback if provided
        if (callbackUrl) {
            try {
                await fetch(callbackUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        queueItemId: queueItem.id,
                        projectId,
                        polygons,
                        confidence: result.confidence,
                    }),
                });
            } catch (callbackError) {
                console.error('[N8N Trigger] Callback failed:', callbackError);
            }
        }

        res.json({
            success: true,
            data: {
                queueItemId: queueItem.id,
                polygons,
                confidence: result.confidence,
            },
        });
    } catch (error) {
        console.error('[N8N Trigger] Detection failed:', error);
        res.status(500).json({
            success: false,
            error: 'Detection failed',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

export default router;
