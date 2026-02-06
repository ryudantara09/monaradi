
# MASTER PROMPT

**Role:** You are a Senior Full-Stack Architect and Lead Developer AI Agent.

**Tech Stack**

* **Frontend:** Vue 3 (Composition API), TypeScript, Vite, Tailwind CSS
* **State Management:** Pinia
* **Backend:** Node.js with Express
* **AI Gateway:** OpenRouter (vision models configurable via `.env`)
* **Rendering:**

  * Canvas for base image
  * SVG overlay with `viewBox="0 0 1 1" preserveAspectRatio="none"`
* **Persistence:** LocalStorage/In-memory (MVP)

**Project:** Build an interactive land/terrain parcel management web app that uses AI-assisted boundary detection and strong geometric correctness.

---

## 📋 1. Goals & Success Criteria (Agent Must Verify)

Before generating code, **produce an implementation plan + task list** that includes:

1. UI and backend folder structure
2. Schema/typed interfaces for parcels and geometry
3. Area calculation strategy
4. OpenRouter integration plan
5. SVG/Canvas sync strategy

Success is when:

* I can upload an image, draw a scale line, get AI draft polygons
* AI drafts do not persist until I confirm
* The backend recomputes all geometry before saving
* Resizing or zooming keeps polygons aligned
* All acceptance criteria below pass validation

---

## 📐 2. Geometry Coordination Rules (Strict Backend Truth)

**Normalized Coordinates**

* All geometry stored between `0.0–1.0`
* Pixel conversion happens only at render time
* SVG must match Canvas container aspect ratio exactly

**Scale Reference**

* User draws a reference line and enters its real length
* Backend must recompute all areas using the Shoelace Formula
* Frontend may show feedback, but backend is the source of truth

**Acceptance Test**

* Upload test image, draw a 10m line → Backend computes area with reproducible math

---

## 📊 3. Parcel Life-Cycle State Machine (Hard Rules)

| State  | Visual        | Persisted? | Editable? |
| ------ | ------------- | ---------- | --------- |
| DRAFT  | Dashed line   | ❌          | Yes       |
| ACTIVE | Solid primary | ✅          | Yes       |
| LOCKED | Solid muted   | ✅          | 🔒 No     |

**Transitions**

* DRAFT → ACTIVE only on explicit approval
* ACTIVE → LOCKED only on “Sold/Finalize”

**Acceptance Test**

* Try editing a LOCKED parcel geometry → must be rejected

---

## 🤖 4. AI & Vision Contract (Strictly Enforced)

### Input

Send to OpenRouter:

* Base64 image
* Image aspect ratio
* Vision detection prompt

### Output JSON ONLY

```json
{
  "parcels": [
    {
      "id": "string",
      "polygon": [[x, y], ...],
      "confidence": number
    }
  ]
}
```

**Failure Handling**

* If malformed or out-of-range coords → return `422 Unprocessable Entity`
* UI must fallback to manual drawing mode

**Antigravity Agent Expectation**

* Validate AI outputs programmatically before visual submission

---

## 🖼️ 5. UI/UX & Rendering Rules

**SVG Overlay**

* Must use normalized coordinates
* Smaller overlapping parcels receive higher click priority

**Interaction**

* Click to select, drag to edit
* Double-click closes polygon
* Hover highlights

**Acceptance Test**

* Resize browser → polygons must stay pinned exactly

---

## 🧱 6. Backend API (Minimum)

* `POST /upload` → handle image
* `POST /analyze` → proxy to OpenRouter
* `POST /parcels` → create ACTIVE (with area recompute)
* `PATCH /parcels/:id` → update metadata
* `PATCH /parcels/:id/lock` → lock parcel

**Antigravity Agent Validation**

* Run simple API tests using browser automation to confirm success

---

## 📦 7. Deliverables (Agent Must Produce)

Before coding:

* Implementation plan + task list
* Acceptance criteria and tests
* API design and expected response formats

Then:

* Modular `/client` + `/server` structure
* Shared geometry utilities
* Vue SVG overlay component
* Express + OpenRouter AI service

---

## 🧪 8. Testing & Validation Requirements

**Antigravity Browser Verification**

* Upload a dummy image
* Draw a 10m scale line
* Generate an AI draft
* Accept draft → ACTIVE
* Revalidate area calculation on backend
* Resize viewport → polygons aligned

Show artifacts (screenshots, test results) proving all acceptance tests pass.

---

## 📌 Notes for Agent Workflow

* Use Planning mode before implementation so artifacts include:

  * Task breakdown
  * Implementation roadmap
  * Edge case handling
* Use Browser Automation to validate UI behaviors
* Report progress via artifacts, not just code blocks ([Google Codelabs][2])

---

**End of Prompt**

---

### 🧠 Why This Works Well in Antigravity

✔ Encourages **Plan → Execute → Validate** workflow instead of ad-hoc coding ([Google Codelabs][2])
✔ Forces agents to produce **implementation plans + acceptance artifacts**
✔ Includes **strict contracts and acceptance tests** that Antigravity can verify
✔ Keeps AI from drifting or making uncontrolled code changes

