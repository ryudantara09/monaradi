# 🔥 The Counter-Roast (Where he missed)

1. **The "Math in a Utility" Trap:** He tells the agent to put math in a "shared utility," but doesn't specify that the **Backend MUST validate it.** If the frontend calculates the area and the backend just saves it, a user could manipulate the  in the browser and "buy" land for pennies. A senior dev knows: *Trust the Frontend for UI; Trust the Backend for Truth.*
2. **The "Scary" Vibes:** He wants to "distrust the AI," but doesn't provide an **Error State**. If the AI fails or returns garbage, does the app crash? A senior prompt needs a "Fallback Mechanism."
3. **The SVG Performance Gap:** He sticks to SVG (which is fine), but doesn't mention **Layer Synchronization**. If you zoom or pan the image, the SVG needs to stay "pinned." Without a coordinate sync-hook, your parcels will drift like clouds.
4. **Database Over-engineering:** Mentioning PostGIS for an MVP is "resume-driven development." It’s a trap that makes agents write complex SQL you don't need yet.

---

## 🏆 THE FINAL "ULTIMATE" PROMPT

*Copy and paste this. It combines his strictness with actual senior-level system integrity.*

**Role:** Senior Full-Stack Architect & Lead Developer.
**Project:** "TerraMind" – An Interactive Land/Terrain Parcel Management System.

### 1. The Core Architecture (Non-Negotiable)

* **Frontend:** Vue 3 (Composition API), TypeScript, Tailwind CSS, Pinia.
* **Backend:** Node.js (Express) with a robust Service/Controller pattern.
* **Geometry Engine:** Coordinate math must be **dual-implemented**.
* `Shared/Utils`: For immediate UI feedback.
* `Server/Service`: For final validation before database persistence.


* **AI Gateway:** OpenRouter. Vision Model must be configurable via `.env`.

### 2. The "Source of Truth" (Geometry & Scaling)

* **Normalized Units:** All coordinates are stored as `0.0` to `1.0`.
* **The Scale Reference Line:**
* The user defines a "Reference Line" on the image.
* The system calculates the `ReferenceRatio` ().
* **Strict Rule:** The Backend must re-calculate all  areas on the fly before saving to the DB. Never trust the area value sent by the client.


* **Math:** Use the Shoelace Formula for area calculation.

### 3. State-Driven Interaction (The "Parcel Life Cycle")

A parcel must exist in one of these strictly defined states:

1. **DRAFT:** Temporary AI suggestion. **Visual:** Dashed line, blue. **Behavior:** Not saved to DB, cannot be "Sold."
2. **ACTIVE:** Confirmed by user. **Visual:** Solid line, primary color. **Behavior:** Editable, persists to DB.
3. **LOCKED:** Marked as "Sold." **Visual:** Solid line, red/gray. **Behavior:** Read-only metadata.

### 4. AI & Vision Protocol (Strict Distrust)

* **Input:** Send Base64 image + Aspect Ratio + "Detection Prompt" to OpenRouter.
* **Output Validation:** If the LLM returns invalid JSON or coordinates outside 0-1 range, the backend must return a graceful `422 Unprocessable Entity` error with a "Manual Mode" fallback.
* **Draft-Only Rule:** AI-detected polygons are **Client-Side Demos** only. They are converted to "Active" only upon explicit user `SAVE_PARCEL` action.

### 5. UI/UX Layering Rules

* **Canvas Layer:** Handles the base image. Must support "Contain" scaling.
* **SVG Layer:** Must use a `viewBox="0 0 1 1"` scaling strategy to ensure the parcels perfectly track the image regardless of screen resize.
* **Click Priority:** Implement a "Hit Detection" utility that prioritizes the smallest polygon (child) over the largest (parent) to avoid "Selection Traps."

### 6. Required Deliverables & Folder Structure

1. **Modular Structure:** `/src/api` (Services), `/src/components/canvas` (SVG/Canvas Logic), `/src/store` (Pinia).
2. **The Geometry Provider:** A TypeScript class specifically for coordinate conversions.
3. **The AI Prompt Template:** A specialized system prompt for vision models to ensure coordinate precision.
4. **CRUD Endpoints:** * `POST /upload` (Multer/Storage)
* `POST /analyze` (OpenRouter Vision)
* `POST /parcels` (With backend-side area validation)
* `PATCH /parcels/:id` (Metadata updates)



### 7. Success Criteria (Definition of Done)

1. I upload an image and draw a 10m scale line.
2. I click "Detect" and see dashed-blue "suggestions."
3. I click a suggestion, edit the "Owner" name, and click "Confirm."
4. The parcel turns solid and shows a mathematically correct  area.
5. If I resize my browser, the parcels stay exactly on their land boundaries.
