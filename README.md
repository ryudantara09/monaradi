# Monaradi - Land Parcel Management System

A comprehensive land parcel management system with AI-powered boundary detection, n8n workflow automation integration, and full entity management (Terrains, Customers, Contracts, Transactions, Documents).

## 🌟 Features

### Core Features
- 🗺️ **AI-Powered Boundary Detection** - Upload land survey images and automatically detect parcel boundaries using Google Gemini AI
- ✏️ **Manual Drawing Tools** - Draw and edit parcel boundaries manually with precision
- 📏 **Calibration System** - Set real-world scale for accurate area measurements
- 💰 **Pricing & Status Tracking** - Track parcel pricing, availability, and payment status

### Entity Management (from Aradimon)
- 🏔️ **Terrains** - Manage land parcels with location, area, and ownership history
- 👥 **Customers** - Track individuals and legal entities
- 📄 **Contracts** - Handle ownership, sale, purchase, and lease agreements
- 💳 **Transactions** - Record sales and purchases with financial details
- 📁 **Documents** - Store and link documents to any entity

### Automation
- 🔄 **N8N Integration** - Webhook-based workflow automation
- 📤 **Automated Image Processing** - Queue-based AI detection
- 📊 **Workflow Logging** - Track all automated processes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose (for n8n)
- pnpm, npm, or yarn

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Create database and tables
npx prisma db push

# Start development server
npm run dev
```

The API will be available at `http://localhost:3000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### 3. N8N Setup (Optional)

```bash
cd n8n-compose

# Start n8n with PostgreSQL
docker-compose up -d
```

N8N will be available at `http://localhost:5678`

See [n8n-compose/README.md](./n8n-compose/README.md) for detailed setup.

## 📁 Project Structure

```
monaradi/
├── backend/                 # Express API server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── parcels.ts      # Parcel CRUD
│   │   │   ├── detect.ts       # AI detection
│   │   │   ├── upload.ts       # File uploads
│   │   │   ├── n8n.ts          # N8N webhooks
│   │   │   ├── terrains.ts     # Terrain management
│   │   │   ├── customers.ts    # Customer management
│   │   │   ├── contracts.ts    # Contract management
│   │   │   ├── transactions.ts # Transaction management
│   │   │   └── documents.ts    # Document management
│   │   └── index.ts
│   └── prisma/
│       └── schema.prisma       # Database schema
├── frontend/                # Vue.js frontend
│   └── src/
│       ├── components/
│       └── stores/
├── n8n-compose/            # N8N Docker setup
│   ├── docker-compose.yml
│   ├── workflows/          # Example workflows
│   └── README.md
└── aradimon/               # Reference app (Electron/Capacitor)
```

## 🔧 API Endpoints

### Parcel Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parcels` | List all parcels |
| POST | `/api/parcels` | Create parcel |
| PUT | `/api/parcels/:id` | Update parcel |
| DELETE | `/api/parcels/:id` | Delete parcel |

### AI Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/detect` | Detect boundaries in image |
| POST | `/api/upload` | Upload land image |

### Entity Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/terrains` | Terrain CRUD |
| GET/POST | `/api/customers` | Customer CRUD |
| GET/POST | `/api/contracts` | Contract CRUD |
| GET/POST | `/api/transactions` | Transaction CRUD |
| GET/POST | `/api/documents` | Document CRUD |

### N8N Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/n8n/webhook/image-upload` | Queue image for processing |
| POST | `/api/n8n/trigger/detect` | Trigger AI detection |
| POST | `/api/n8n/webhook/save-document` | Save document |
| GET | `/api/n8n/queue/pending` | Get pending items |
| GET | `/api/n8n/workflow-logs` | Get workflow logs |

## 🗄️ Database Schema

The database uses SQLite with Prisma ORM. Key models:

- **Parcel** - Detected land parcels with geometry
- **Project** - Land survey projects with images
- **Terrain** - Land parcels with ownership info
- **Customer** - Individuals and legal entities
- **Contract** - Legal agreements
- **Transaction** - Financial transactions
- **Document** - Attached files
- **WorkflowLog** - N8N execution logs
- **ImageProcessingQueue** - Pending AI processing

## 🔄 N8N Workflow Integration

### Example: Automated Image Processing

1. External system sends image to n8n webhook
2. N8N calls Monaradi API to queue image
3. Monaradi processes with Google Gemini AI
4. Results stored in database
5. N8N notifies external system

### Example: Document Storage

1. Document uploaded via n8n webhook
2. File saved to database
3. Automatically linked to terrain/customer/contract
4. Confirmation sent back

See [n8n-compose/README.md](./n8n-compose/README.md) for workflow examples.

## 🔐 Environment Variables

### Backend (`.env`)

```env
DATABASE_URL="file:./dev.db"
PORT=3000
GOOGLE_AI_API=your_google_ai_api_key
N8N_WEBHOOK_URL=http://localhost:5678/webhook
```

### N8N (`n8n-compose/.env`)

```env
POSTGRES_USER=n8n
POSTGRES_PASSWORD=secure_password
MONARADI_API_URL=http://host.docker.internal:3000/api
```

## 🛠️ Development

### Run Tests

```bash
npm test
```

### Database Management

```bash
# View database in browser
cd backend && npx prisma studio

# Reset database
npx prisma db push --force-reset
```

### Build for Production

```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 📄 License

MIT License - see [LICENSE](./LICENSE)
