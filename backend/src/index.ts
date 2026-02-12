import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Routes
// Routes
import parcelsRouter from './routes/parcels.js';
import uploadRouter from './routes/upload.js';
import detectRouter from './routes/detect.js';
import n8nRouter from './routes/n8n.js';
import terrainsRouter from './routes/terrains.js';
import customersRouter from './routes/customers.js';
import contractsRouter from './routes/contracts.js';
import documentsRouter from './routes/documents.js';

dotenv.config();

// Standard Prisma instantiation
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use('/uploads', express.static('uploads'));

// Make prisma available to routes
app.locals.prisma = prisma;

// ===========================================
// API Routes
// ===========================================

// Original parcel manager routes
app.use('/api/parcels', parcelsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/detect', detectRouter);

// N8N integration routes
app.use('/api/n8n', n8nRouter);

// Aradimon entity routes
app.use('/api/terrains', terrainsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/documents', documentsRouter);

// ===========================================
// Health & Info Endpoints
// ===========================================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: {
            parcelManager: true,
            n8nIntegration: true,
            aradimonEntities: true,
        }
    });
});

// API info
app.get('/api', (req, res) => {
    res.json({
        name: 'Monaradi API',
        version: '2.0.0',
        description: 'Land Parcel Management System with n8n Integration',
        endpoints: {
            parcels: '/api/parcels',
            upload: '/api/upload',
            detect: '/api/detect',
            n8n: '/api/n8n',
            terrains: '/api/terrains',
            customers: '/api/customers',
            contracts: '/api/contracts',

            documents: '/api/documents',
        },
        n8nWebhooks: {
            imageUpload: 'POST /api/n8n/webhook/image-upload',
            processDetection: 'POST /api/n8n/webhook/process-detection',
            saveDocument: 'POST /api/n8n/webhook/save-document',
            triggerDetect: 'POST /api/n8n/trigger/detect',
            pendingQueue: 'GET /api/n8n/queue/pending',
            updateStatus: 'PUT /api/n8n/queue/:id/status',
            workflowLogs: 'GET /api/n8n/workflow-logs',
        },
    });
});

// ===========================================
// Error Handler
// ===========================================

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// ===========================================
// Server Startup
// ===========================================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     MONARADI API SERVER                      ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running on http://localhost:${PORT}                  ║
║                                                              ║
║  📦 Features:                                                ║
║     • Land Parcel Detection (AI-powered)                     ║
║     • N8N Workflow Integration                               ║
║     • Aradimon Entity Management                             ║
║                                                              ║
║  🔗 N8N Webhook URL: http://localhost:${PORT}/api/n8n           ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n⏹️  Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️  SIGTERM received, shutting down...');
    await prisma.$disconnect();
    process.exit(0);
});
