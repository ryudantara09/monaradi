# N8N Integration for Monaradi

This directory contains the n8n workflow automation setup for the Monaradi Land Parcel Management System.

## 🚀 Quick Start

### 1. Start n8n

```bash
cd n8n-compose
docker-compose up -d
```

This will start:
- **n8n** on `http://localhost:5678`
- **PostgreSQL** for n8n's database

### 2. Access n8n

Open `http://localhost:5678` in your browser to access the n8n editor.

### 3. Configure Environment Variables

In n8n, go to **Settings → Variables** and add:

| Variable | Value |
|----------|-------|
| `MONARADI_API_URL` | `http://host.docker.internal:3000/api` |
| `WEBHOOK_URL` | `http://localhost:5678` |

### 4. Import Workflows

Import the example workflows from the `workflows/` directory:

1. Click **Workflows** → **Import from File**
2. Select a workflow JSON file
3. Activate the workflow

---

## 📦 Available Webhooks

The Monaradi backend provides these endpoints for n8n integration:

### Image Processing

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/n8n/webhook/image-upload` | POST | Queue image for AI processing |
| `/api/n8n/trigger/detect` | POST | Trigger AI boundary detection |
| `/api/n8n/webhook/process-detection` | POST | Receive detection results |
| `/api/n8n/queue/pending` | GET | Get pending queue items |
| `/api/n8n/queue/:id/status` | PUT | Update queue item status |

### Document Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/n8n/webhook/save-document` | POST | Save document to database |

### Logs

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/n8n/workflow-logs` | GET | Get workflow execution logs |

---

## 🔄 Example Workflows

### 1. Image Upload & Detection (`image-upload-detection.json`)

This workflow:
1. Receives an image via webhook
2. Queues it for processing in the Monaradi backend
3. Triggers AI detection
4. Returns the results

**Webhook URL:** `http://localhost:5678/webhook/monaradi/upload-image`

**Example request:**
```bash
curl -X POST http://localhost:5678/webhook/monaradi/upload-image \
  -H "Content-Type: application/json" \
  -d '{
    "imageBase64": "data:image/png;base64,iVBORw0KGgo...",
    "projectName": "My Land Survey"
  }'
```

### 2. Document Management (`document-management.json`)

This workflow:
1. Receives a document via webhook
2. Saves it to the Monaradi database
3. Links it to entities (terrain, customer, contract)

**Webhook URL:** `http://localhost:5678/webhook/monaradi/upload-document`

**Example request:**
```bash
curl -X POST http://localhost:5678/webhook/monaradi/upload-document \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Contract.pdf",
    "fileBase64": "JVBERi0xLjQK...",
    "mimeType": "application/pdf",
    "type": "contract_photo",
    "terrainId": "uuid-here"
  }'
```

---

## 🔧 Configuration

### Environment Variables (`.env`)

```env
# N8N Settings
N8N_HOST=localhost
N8N_PORT=5678
N8N_PROTOCOL=http

# Database
POSTGRES_USER=n8n
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=n8n

# Monaradi API
MONARADI_API_URL=http://host.docker.internal:3000/api

# Timezone
GENERIC_TIMEZONE=Europe/Paris
```

### Production Setup

For production, enable authentication:

```env
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=your_secure_password
```

---

## 🔗 Integration Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Frontend App   │────▶│  Monaradi API   │────▶│    Database     │
│  (Vue.js)       │     │  (Express)      │     │   (SQLite)      │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 │ Webhooks
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │      N8N        │
                        │   (Workflows)   │
                        │                 │
                        └─────────────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
              ┌──────────┐ ┌──────────┐ ┌──────────┐
              │ External │ │  Email   │ │  Cloud   │
              │   APIs   │ │ Service  │ │ Storage  │
              └──────────┘ └──────────┘ └──────────┘
```

---

## 📝 Creating Custom Workflows

### Basic HTTP Request to Monaradi

```json
{
  "parameters": {
    "method": "POST",
    "url": "={{$env.MONARADI_API_URL}}/n8n/webhook/image-upload",
    "sendBody": true,
    "bodyParameters": {
      "parameters": [
        { "name": "imageBase64", "value": "={{$json.imageData}}" },
        { "name": "projectName", "value": "={{$json.name}}" }
      ]
    }
  },
  "type": "n8n-nodes-base.httpRequest"
}
```

### Headers for Request Tracking

Add these headers to track which workflow/execution called your API:

```json
{
  "headerParameters": {
    "parameters": [
      { "name": "X-N8N-Workflow-ID", "value": "={{$workflow.id}}" },
      { "name": "X-N8N-Workflow-Name", "value": "={{$workflow.name}}" },
      { "name": "X-N8N-Execution-ID", "value": "={{$execution.id}}" }
    ]
  }
}
```

---

## 🛠️ Troubleshooting

### n8n can't reach Monaradi API

Make sure you're using `host.docker.internal` to reach the host machine:
```env
MONARADI_API_URL=http://host.docker.internal:3000/api
```

### Webhook not receiving requests

1. Make sure the workflow is **activated** (toggle at top of workflow)
2. Check the webhook path matches your request URL
3. Verify n8n is running: `docker-compose ps`

### Database connection issues

Check PostgreSQL is healthy:
```bash
docker-compose logs postgres
```

### View n8n logs

```bash
docker-compose logs -f n8n
```

---

## 📚 Resources

- [n8n Documentation](https://docs.n8n.io/)
- [n8n Workflow Templates](https://n8n.io/workflows/)
- [n8n Community Forum](https://community.n8n.io/)
