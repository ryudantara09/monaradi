## 🔥 High-Quality Prompt for Your Coding Agent

> **Role & Goal**
>
> You are a senior full-stack engineer and technical architect.
> Your task is to design and implement a web application for managing land/terrain parcels based on uploaded images, with interactive overlays and AI-assisted processing.
>
> The app must be production-ready, modular, and extensible.

---

### 🧱 Tech Stack (Mandatory)

* **Frontend**: Vue 3 (Composition API), TypeScript
* **Backend**: Node.js with Express (or NestJS if justified)
* **LLM Usage**: Used for image understanding / segmentation assistance and metadata extraction
* **Image Handling**: Canvas / SVG overlays
* **Data Storage**: Start with in-memory or SQLite; design so PostgreSQL can be added later

---

### 🎯 Core Features

#### 1. Image Upload

* User can upload an image of land/terrain:

  * Hand-drawn map
  * Satellite image
  * Google Maps screenshot
* Supported formats: PNG, JPG, JPEG
* Image is stored and displayed as the base layer

---

#### 2. Land Parcel Detection & Overlay

* The app must support **two modes**:

  1. **Manual mode**

     * User can draw polygon shapes over the image to define land parcels
  2. **AI-assisted mode**

     * Use an LLM (and/or vision model) to:

       * Detect parcel boundaries if lines exist
       * Or suggest parcel segmentation if the land is not divided
* Each parcel is represented as:

  * Polygon coordinates
  * Unique ID
* Parcels are rendered as an **overlay layer** (SVG or Canvas) on top of the original image

---

#### 3. Interactive Click & Selection

* When the user clicks on a parcel:

  * The parcel is highlighted
  * A details panel opens showing parcel data
* Hover effects should visually distinguish parcels

---

#### 4. Parcel Properties (Editable)

Each land parcel must support the following properties:

* Owner name
* Area (m²)

  * Auto-calculated from polygon if possible
* Price per m²
* Total price (auto-calculated)
* Paid status (boolean)
* Sold status (boolean)
* Notes / custom metadata (extensible)

Changes must update in real time.

---

#### 5. State Management

* Frontend maintains:

  * Image state
  * Parcel geometries
  * Selected parcel
* Backend stores:

  * Images
  * Parcel definitions
  * Parcel metadata

---

### 🤖 LLM Responsibilities

The LLM should be used for:

* Assisting with parcel boundary detection from images
* Interpreting hand-drawn maps
* Suggesting polygon coordinates or masks
* (Optional) Extracting text labels from images

The LLM **must not** be responsible for UI logic or persistence.

---

### 🧩 Architecture Requirements

* Clear separation of concerns:

  * Image rendering
  * Overlay drawing
  * Parcel data
  * AI processing
* Reusable components:

  * ImageViewer
  * ParcelOverlay
  * ParcelEditor
* API endpoints clearly documented
* Types/interfaces defined for:

  * Parcel
  * Polygon
  * ImageAsset

---

### 🧪 Deliverables

You must produce:

1. Folder structure (frontend + backend)
2. Backend API design
3. Vue component structure
4. Core logic for:

   * Image upload
   * Polygon drawing
   * Parcel selection
5. Example LLM prompt(s) used for parcel detection
6. Clear comments explaining non-obvious logic

---

### 🚫 Constraints

* Do NOT over-engineer authentication
* Do NOT hardcode UI styles
* Do NOT assume perfect AI results — allow manual correction
* Favor clarity and extensibility over cleverness

---

### ✅ Success Criteria

The app is successful if:

* A user can upload an image
* See an overlay of parcels
* Click any parcel
* View and edit its properties
* Trust that the system can scale to real land management use cases

