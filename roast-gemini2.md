That prompter has style—I'll give him that. He took the technical "meat" of our architecture and wrapped it in a "Director’s Cut" suit that is much harder for an AI agent to ignore. The use of **Hard Rules**, **Non-Negotiables**, and the **Source of Truth** logic is exactly how you pin down a coding agent.

I have taken that "Director's Cut," added one final polish regarding **Container Aspect Ratio** (to ensure the SVG and Canvas never drift even by a pixel), and formatted it perfectly for you.

---

### 🗺️ The Architecture at a Glance

Before you drop this into your agent, visualize the "Layer Cake" this prompt builds:

---

### 🏆 THE FINAL MASTER PROMPT (AGENT-READY)

**Role**
You are a Senior Full-Stack Architect and Lead Developer.

**Task**
Design and implement a production-ready web application for managing land/terrain parcels based on uploaded images, using SVG overlays and AI-assisted boundary detection via OpenRouter.

**System Priority:** Geometric correctness, backend-enforced integrity, and explicit user control.

---

## 1. Tech Stack (Non-Negotiable)

* **Frontend:** Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS.
* **State:** Pinia (Management of UI modes and Parcel Life-cycle).
* **Backend:** Node.js (Express).
* **AI Gateway:** OpenRouter (Vision models like Gemini 2.0 Flash or Llama 3.2 Vision).
* **Rendering Layer:** * `Canvas` → Static base image.
* `SVG` → Interactive parcel overlays using `viewBox="0 0 1 1"` with `preserveAspectRatio="none"`.


* **Persistence:** LocalStorage/In-memory for MVP (No complex GIS databases).

---

## 2. Geometry & The "Source of Truth"

### 📏 Normalized Coordinates

* All geometry (points/polygons) MUST be stored as normalized values ( to ).
* Conversion to pixel space happens **only at render time**.
* The SVG container must exactly overlay the Canvas and match the image's aspect ratio to prevent coordinate drift.

### 📐 Scale & Calculation

* **The Scale Line:** User draws a reference line and inputs its real-world length (e.g., "50m").
* **Backend Enforcement:** While the frontend provides instant area feedback, the **Backend MUST recompute** the area () using the Shoelace Formula before saving. **Never trust the area value sent by the client.**

---

## 3. Parcel Life-cycle (State Machine)

Every parcel must exist in one of these three states:

1. **DRAFT (AI Suggestion):** * Visual: Dashed stroke.
* Behavior: Not saved to DB, non-persistent, user must "Accept" to promote.


2. **ACTIVE (User Confirmed):** * Visual: Solid stroke.
* Behavior: Persisted to DB, fully editable, area validated.


3. **LOCKED (Sold/Finalized):** * Visual: Solid muted color.
* Behavior: Metadata and Geometry are Read-Only.



---

## 4. AI & Vision Protocol (Strict Distrust)

* **Trigger:** Backend sends Base64 image + Aspect Ratio + Vision Prompt.
* **AI Contract:** Force the LLM to return **JSON Only**:
`{ "parcels": [ { "id": string, "polygon": [[x,y], ...], "confidence": number } ] }`
* **Failure Handling:** If JSON is malformed or coordinates are invalid, return a `422 Unprocessable Entity` and default the UI to "Manual Mode."

---

## 5. UI/UX & Interaction Rules

* **Layering:** The SVG must be perfectly synced with the Canvas base.
* **Selection:** Implement "Small-on-Top" priority—if polygons overlap, the smaller one (child) gets click priority.
* **Manual Tools:** Point-and-click to add vertices; draggable vertices for refinement.

---

## 6. Required Deliverables

1. **Modular Structure:** `/client` (Vue/Pinia) and `/server` (Express/Services).
2. **Coordinate Utility:** A `GeometryService` (TS) shared/replicated for `normalizeToPixel` and `pixelToNormalize`.
3. **SVG Component:** A robust Vue component handling polygon rendering, vertex dragging, and state-based styling.
4. **OpenRouter Service:** A clean abstraction to swap vision models via `.env`.

---

## 7. Definition of Done

The system is successful if:

* I upload a map, draw a scale line, and get AI suggestions.
* I can refine AI drafts, save them, and see the **Backend-validated** area.
* I can resize the window and the polygons remain surgically pinned to the terrain.
