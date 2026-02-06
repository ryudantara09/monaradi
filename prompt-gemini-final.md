# MASTER PROMPT: Land Management System Architect

**Role:** You are a Senior Full-Stack Architect and Lead Developer.

**Tech Stack**
* **Frontend:** Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS
* **State Management:** Pinia
* **Backend:** Node.js with Express (REST API)
* **Database/Persistence:** SQLite (via Prisma or Sequelize) or In-memory for MVP.
* **AI Gateway:** OpenRouter (Vision models for boundary detection)
* **Rendering:** SVG Overlay on top of HTML5 Canvas

**Project:** Build an interactive land parcel management web app. Users upload images (satellite, hand-drawn maps), and the app uses AI to detect boundaries. Users can click parcels to manage financial and ownership data.

---

## 📋 1. Core Requirements & Schema

**The Data Model (Strict Interface)**
Each `Parcel` must track:
* `id`: UUID
* `geometry`: Array of normalized [x,y] coordinates (0.0 to 1.0)
* `label`: String (e.g., "Lot A")
* `ownerName`: String (nullable)
* `status`: Enum ('AVAILABLE', 'SOLD', 'RESERVED')
* `paymentStatus`: Enum ('UNPAID', 'PARTIAL', 'PAID')
* `areaSqm`: Number (Calculated via geometry + scale)
* `pricePerSqm`: Number
* `totalPrice`: Number (Auto-calculated: areaSqm * pricePerSqm)

**The Business Logic**
1.  **Scale Rule:** User must define a "Reference Line" (e.g., draw a line and say "this is 50 meters"). All area calculations depend on this.
2.  **Auto-Calc:** If `areaSqm` or `pricePerSqm` changes, `totalPrice` must update automatically in the UI and Backend.
3.  **Visuals:**
    * **AVAILABLE:** Green overlay (low opacity)
    * **SOLD:** Red overlay
    * **RESERVED:** Yellow overlay

---

## 📐 2. Geometry & Rendering Strategy

**Normalized Coordinates**
* Store all points as percentages `0.0` to `1.0` relative to image dimensions.
* *Never* store absolute pixels. Convert to pixels only at render time.
* **Reason:** Ensures drawings stay aligned when the window is resized or zoomed.

**SVG Overlay**
* Use an `<svg>` element absolutely positioned over the `<img>`.
* Use `viewBox="0 0 1 1"` and `preserveAspectRatio="none"` for perfect alignment.

---

## 🤖 3. AI Vision Integration

**Trigger:** Button "Auto-Detect Boundaries"
**Input:** Send Base64 image + prompt to OpenRouter.
**Prompt Strategy:**
> "Analyze this land survey/satellite image. Identify closed geometric shapes representing land parcels. Return a JSON list of normalized polygon coordinates [[x,y], [x,y]...]. Ignore text labels."

**Fallback:** If AI fails or misses a line, the user must be able to:
1.  Click points to manually draw a polygon.
2.  Drag existing points to correct AI errors.

---

## 📊 4. UI/UX Workflow

1.  **Upload:** User uploads file (supports PNG, JPG).
2.  **Calibration:** User draws a line, inputs "100 meters". System sets `scaleFactor`.
3.  **Detection:** System runs AI Vision to suggest polygons (DRAFT state).
4.  **Confirmation:** User confirms valid polygons.
5.  **Management:**
    * **Click** a polygon → Opens a **Side Panel** or **Modal**.
    * **Edit Details:** Input Owner, Price/m2, Status.
    * **View:** See calculated Total Price and Area.

---

## 🧱 5. Backend API & Deliverables

**API Endpoints**
* `POST /upload`: Handle image storage.
* `POST /parcels/detect`: Proxy to AI Vision model.
* `GET /parcels`: Fetch all polygons + metadata.
* `PUT /parcels/:id`: Update metadata (Owner, Status, Price). Backend validates math (`totalPrice == area * price`).

**Implementation Plan (Execute in Order)**
1.  **Scaffold:** Setup Vue + Node + Tailwind.
2.  **Canvas/SVG Engine:** Build the image uploader + normalized coordinate renderer.
3.  **Calibration Logic:** Implement the "Reference Line" and Shoelace formula for area.
4.  **AI Service:** Connect OpenRouter for polygon detection.
5.  **CRUD UI:** Build the Side Panel form for editing Parcel data.

---

## 🧪 6. Testing Requirements

* **Geometry Test:** Resize the browser window. The polygon overlays must stick *exactly* to the underlying features in the image.
* **Math Test:** If I set 100sqm and $10/sqm, the total price must save as $1000.
* **Persistence:** Refreshing the page should load the saved polygons and owner data.

**Start by generating a step-by-step Implementation Plan.**