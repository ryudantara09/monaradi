
## 🔥 The Roast (What’s Weak / Risky)

### 1️⃣ It’s dense but not *directive enough*

You describe *what exists* but not always *what must never happen*.

Agents love to:

* auto-persist AI output
* blur responsibilities between frontend & backend
* improvise geometry math

You partially guard against this, but not hard enough.

👉 Specs need **hard rules**, not vibes.

---

### 2️⃣ You mix *architecture* and *implementation details*

Example:

* You mention Shoelace Formula (good)
* But you don’t say **where** that logic lives or **who owns it**

Agents will:

* duplicate logic frontend + backend
* or put math inside Vue components (🤢)

---

### 3️⃣ AI section is under-scary

Right now the agent might still:

* trust AI output too much
* skip uncertainty handling
* treat confidence as decoration

You need to **actively distrust the AI in the spec**.

---

### 4️⃣ UX rules are implied, not enforced

You say:

> AI results are rendered as "Draft"

But you don’t say:

* visually distinct style is mandatory
* drafts are non-clickable or semi-clickable
* drafts are never persisted

Agents need **explicit UX contracts**.

---

### 5️⃣ Success criteria is missing

There’s no final “if these things work, you’re done” section.

Without that, agents tend to:

* keep building
* over-abstract
* or stop too early

---

## 🧠 What You Did Very Right (Credit Where Due)

* Normalized coordinates ✅
* Scale line for real-world area ✅ (this is *excellent*)
* SVG + Canvas layering ✅
* Provider-agnostic AI service ✅
* Click priority / z-index note ✅ (senior-level detail)

This is already better than 90% of specs people write.

---

## 🧬 Now: The Improved, Agent-Optimized Version

Below is a **cleaned, stricter, sharper rewrite**.
Same idea — but tighter, scarier, and harder for an agent to mess up.

You can replace your version with this.

---

# ✅ FINAL IMPROVED PROMPT

**Role**
You are a senior full-stack engineer and technical architect.

**Task**
Design and implement a production-ready web application for managing land/terrain parcels based on uploaded images, featuring interactive SVG overlays and AI-assisted boundary detection via OpenRouter.

The system must prioritize correctness, user control, and extensibility over AI automation.

---

## 1. Tech Stack (Non-Negotiable)

* **Frontend**: Vue 3 (Composition API), TypeScript, Vite
* **State Management**: Pinia (parcel data + UI mode state)
* **Backend**: Node.js (Express or NestJS if clearly justified)
* **LLM Gateway**: OpenRouter API

  * Vision-capable models (e.g., Gemini Flash, Llama Vision, Qwen VL)
* **Rendering**:

  * Canvas → base image (static)
  * SVG → parcel overlays (interactive)
* **Storage**:

  * MVP: In-memory or LocalStorage
  * Architecture must support PostgreSQL + PostGIS later

---

## 2. Core Geometry & Scaling Rules (Critical)

### Normalized Coordinates (Mandatory)

* All parcel geometry is stored using normalized coordinates (0.0–1.0)
* Conversion to pixel space happens **only at render time**
* Backend, frontend, and AI outputs must all use the same normalized format

### Real-World Scale

* User must be able to draw a **Scale Reference Line**
* User inputs real-world length (e.g., “100 meters”)
* System computes:

  * meters-per-pixel ratio
  * real-world area (m²) for all parcels
* Area must be calculated using a deterministic geometric method (e.g., Shoelace Formula)

Geometry math must live in a shared utility layer — **not inside UI components**.

---

## 3. Parcel Creation & Editing

### Manual Mode

* Click to add vertices
* Double-click to close polygon
* Vertices are draggable
* Polygon editing must feel immediate and precise

### AI-Assisted Mode

* Backend sends image to OpenRouter via an AI service abstraction
* AI returns **suggested** parcel polygons only
* AI results:

  * Rendered as **draft overlays**
  * Visually distinct (e.g., dashed stroke, reduced opacity)
  * Not persisted
  * Must be explicitly accepted or edited by the user

AI must never directly modify saved parcel data.

---

## 4. Parcel Data Model

Each parcel supports:

* Owner
* Area (m²) (auto-calculated)
* Price per unit
* Total price (auto-calculated)
* Paid (boolean)
* Sold (boolean)
* Notes
* AI confidence score (optional, informational only)

All derived fields must update reactively.

---

## 5. UI / UX Layering & Interaction

### Layer Stack

1. Canvas — static image
2. SVG — interactive parcel polygons
3. HTML — sidebar, controls, editors (Tailwind CSS)

### Interaction Rules

* Hover highlights parcels
* Click selects a parcel and opens editor
* Smaller or nested polygons must receive click priority
* Draft (AI) parcels must be clearly distinguishable from saved parcels

---

## 6. AI Integration Rules (Strict)

### AI Service Layer

* Implement a provider-agnostic `AIService`
* OpenRouter is the default gateway
* Support model swapping without changing app logic

### AI Output Contract (Strict JSON Only)

```json
{
  "parcels": [
    {
      "id": "parcel-1",
      "polygon": [[0.12, 0.34], [0.45, 0.33], [0.47, 0.61], [0.15, 0.60]],
      "confidence": 0.82
    }
  ]
}
```

* Include image aspect ratio in the prompt
* AI confidence is advisory only
* Assume AI output can be wrong or incomplete

---

## 7. Backend API (Minimum)

* `POST /api/upload` — image upload & reference
* `POST /api/ai/detect` — AI parcel suggestion
* `GET /api/parcels`
* `POST /api/parcels`
* `PUT /api/parcels/:id`

---

## 8. Required Deliverables

You must provide:

1. `/client` and `/server` project structure
2. Typed geometry & parcel interfaces
3. Coordinate utility:

   * `normalizeToPixel`
   * `pixelToNormalize`
4. SVG overlay component with:

   * polygon rendering
   * vertex dragging
   * selection handling
5. Area calculation logic using scale reference
6. Robust OpenRouter integration with error handling
7. Clear inline comments explaining non-obvious decisions

---

## 9. Constraints (Hard Rules)

* Never assume AI accuracy
* Never auto-persist AI results
* No hardcoded UI styles
* No geometry logic inside UI components
* Favor clarity and user control over automation

---

## 10. Success Criteria

The system is complete when a user can:

* Upload an image
* Define scale
* Create parcels manually
* Generate AI parcel suggestions
* Edit and approve parcels
* View accurate area and pricing data

