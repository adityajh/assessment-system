# Changelog

All notable changes to the Let's Entreprise Assessment System are documented here.

Format: `## [YYYY-MM-DD] — Description`

---

## [2026-03-31] — General Mentor Notes, Import Fixes & Data Corrections

### Import Wizard: General Mentor Notes
- **Optional Project Association:** Mentor Notes can now be imported without being tied to a specific project, creating "General Guidance" notes not associated with any module.
- **UI:** When "Mentor Notes" is detected, the project dropdown label updates to "Associated Project (Optional)" and defaults to "-- General / Not project-specific --".
- **Validation:** The mandatory project check is relaxed for the `mentor_notes` type only (all other assessment types still require project selection).

### Import Wizard: Excel Serial Date Fix
- **Bug Fixed:** Mentor Notes with a `Date` column containing raw Excel serial numbers (e.g., `46107`) were crashing the import with a Postgres timezone displacement error (`+046107-01-01`).
- **Fix:** The import API now detects all-digit date strings and converts them correctly from Excel serial number to calendar date using the standard epoch formula (`(serial - 25569) * 86400 * 1000`).
- **Safety Guard:** A year bounds check (`2000 < year < 2100`) ensures no out-of-range dates are sent to Postgres; rows with unparseable dates fall back to the session's Assessment Date.

### Dashboards: General Notes Display
- **Project Reports:** Now fetch both project-specific notes **and** general notes (`project_id = NULL`) for each student in one query. Each note in the Mentor Guidance section displays a labeled tag (project name or "General Guidance") to make context clear.

### Learning Trajectory: Correct Label for Concurrent-Module Students
- **Bug Fixed:** For students doing one of two concurrent modules at the same sequence number (e.g., Moonshine `6a` / SIDR `6b`), the chart always displayed "Moonshine" (alphabetically first) regardless of which project the student actually participated in.
- **Fix:** The trajectory chart now resolves the phase label from the student's actual assessment data, falling back to alphabetical order only if no data exists for that phase.

### Data Corrections (Direct Database)
- **Kickstart Self-Assessments Deleted:** Removed self-assessment records for **Jasper Jovi Dias** and **Moiz Lakdawala** for the Kickstart project. Both students joined the program late and did not participate in Kickstart. Their assessed project count now correctly reflects 5/6.

---

## [2026-03-11] — Codebase Reorganization

- **Repository Cleanup:** Reorganized 68 files from the flat `scripts/` root into structured subdirectories:
    - `scripts/migrations/` — Active, numbered schema migrations.
    - `scripts/seeds/` — SQL data seeding files for initial data population.
    - `scripts/utilities/` — All one-off Python/JS audit, check, import, and fix scripts.
    - `scripts/legacy/` — Old SQL patches, mapping docs, and `headers.json`.
- **Data Folder Structure:** Reorganized the `data/` folder:
    - `data/assets/` — Brand logos (`Let's-Enterprise-Final-Logo_LightMode.png`, `Let's-Enterprise-Final-Logo_PNG.png`).
    - `data/templates/` — Golden Template Excel files.
    - `data/raw/` — All raw response files, `to_import/`, and `Self Assessments/`.
- **Root Cleanup:** Moved all temporary Python/JS scripts (`audit_data.py`, `fix_view.py`, `diagnose_db.js`, etc.) from the project root into `scripts/utilities/`.
- **`.gitignore` Updates:** Added `.DS_Store` and `scripts/venv/` to `.gitignore`. Removed all `.DS_Store` files from the repo.

---

## [2026-03-11] — Dashboard Consolidation & Logo Scaling

- **Unified Student Dashboard:** Removed the redundant admin-specific student dashboard (`/admin/student/[studentId]`). All student analysis links — including those from the Program Dashboard table — now route to the single unified `/dashboard/[studentId]`.
- **Logo Scaling (2×):** Increased brand logo sizes for a bolder, more premium presence:
    - Admin Sidebar: `logo-dark.png` increased from `40px` → `80px`.
    - Student Dashboard header: `logo-light.png` increased from `40px` → `80px` (100px on print/PDF).

---

## [2026-03-11] — Actionable Mission Persistence & Date Handling

- **Schema Migration (`003_add_note_date.sql`):**
    - Added `date DATE DEFAULT CURRENT_DATE` column to `mentor_notes` to support independent date tracking per note.
    - Added `note_type TEXT DEFAULT 'general'` column to `mentor_notes` to distinguish between `'general'` mentor feedback and `'mission'` entries.
    - Created index `idx_mentor_notes_student_type` on `(student_id, note_type)` for faster dashboard filtering.
- **Mission Persistence:**
    - User-created "Actionable Mission Plans" are now saved to the `mentor_notes` table with `note_type = 'mission'`.
    - The student dashboard retrieves the most recent mission on load and pre-populates the mission UI.
    - The "Save Plan" button triggers a Supabase insert with the current date.
    - A **"Last updated"** timestamp is displayed beneath the mission plan header when a saved mission exists.
    - The edit button now displays a pencil icon (`✎`) for clearer affordance.
- **Smart Date Handling for Notes:**
    - **Uploaded Mentor Notes:** The import API (`/api/import/save`) now extracts a "Date" column from uploaded spreadsheets. If found, the row date is used. If not, it falls back to the `assessment_date` of the upload session.
    - **Dashboard Missions:** Always stamped with the current date when saved.
- **Dashboard UI Updates:**
    - Qualitative mentor notes in the dashboard feed now show a small "Date" tag next to the project name.
    - `MentorNote` TypeScript type updated to include `date` and `note_type` properties.

---

## [2026-03-11] — Student Dashboard Advanced Sections & UI Polish

- **Engagement Stack (Dot Plot):** Student's relative cohort position is displayed visually on a 0–100 scale horizontal scatter chart, divided into **Syncing / Connecting / Engaging / Leading** zones. Student dot is highlighted in indigo.
- **Self-Awareness Gap Bar:** Replaced legacy Gap chart with a horizontal diverging bar layout showing the gap between Self Assessment (white dot) and Mentor Assessment (indigo dot) per readiness parameter.
- **Peer Rating Deviation Chart:** Replaced the Radar chart with a grouped bar chart showing each student's deviation from the cohort average per peer feedback parameter, across projects.
- **Program Mastery Heatmap:** Replaced legacy heatmap with a domain-averaged consolidated version. Color scale updated to bolder shades (Novice / Developing / Competent / Advanced).
- **Actionable Focus Section:**
    - **Top 2 Strongest Domains** card (emerald).
    - **Top 2 Domains for Growth** card (rose).
    - Actionable Mission Plan card restyled: white background with gradient top-border (Indigo → Emerald), replacing previous dark purple aesthetic.
- **Brand Identity:**
    - `logo-light.png` integrated into the Student Dashboard report header (replacing plain text).
    - `logo-dark.png` integrated into the Admin Sidebar (replacing plain text).
- **PDF Print Improvements:** All dashboard sections include `print:break-inside-avoid` and proper print colour overrides for clean PDF export.

---

## [2026-03-06] — Metric Tracking Refactor & Playground Enhancements

- **Metric Tracking Architecture:**
    - Replaced the column-based `term_tracking` table with a more flexible row-based `metric_tracking` table linked to a `metrics` lookup table.
    - This allows for tracking of diverse metrics (CBP, Conflexion, BoW) tied to specific import events (`assessment_logs`).
    - Added "Target Metric" selection to the Import Wizard for uploading Term Reports.
- **Metrics UI Enhancements:**
    - Refactored the "Metrics & Tracking" admin page to filter "Dataset Overrides" by metric type.
    - Updated logic to pull real-time student scores from the consolidated `metric_tracking` schema.
- **Navigation Consolidation:**
    - Unified the dashboard header UI into a single `DashboardLayout` component.
    - Implemented dynamic header titles and standardized the "Print / Export PDF" button.
- **Playground Additions & Data Engineering:**
    - Added new visualizations: **Engagement Stack (Dot Plot)**, **Self vs. Mentor Scatter**, and **Peer Rating Across Projects (Stacked Bar)**.
    - **Engagement Stack:** Implemented dynamic Cohort Z-Score calculation and jittering to represent relative engagement (0-100 scale footprint).
    - Refined the Engagement Stack UI with premium vertical gradients, subsurface tracking rails, and glassmorphism tooltips.
    - **Actionable Mission Card:** Reorganized the "Strengths" tab, moving the Domain analysis and Mission Card into a dedicated "Actionable Mission" focus UI.
    - Improved readability by adjusting chart container heights and fixing UI spacing typos.

---

## [2026-03-05] — Scale Up & Data Optimization
- **Backend Query Refinement:**
    - Refactored dashboard views (`v_student_dashboard`) and helper queries to fetch aggregated metrics efficiently.

---

## [2026-03-04] — Dashboard Reorganization & UI Branding

---

## [2026-03-03] — Scalability Refactor & On-Demand Data

- **Fetch-on-Demand Architecture:** Migrated Mentor and Self-Assessment pages from global fetching (which hit a 1,000-row Supabase limit) to reactive, log-specific fetching. This allows the system to scale to infinite records.
- **Loading States:** Added `<LoadingSpinner />` to assessment grids for better UX during on-demand data retrieval.
- **Peer Feedback Selector Fix**: Implemented strict project filtering for assessment events. Added an **"Unassigned / Legacy"** project category to prevent unlinked import logs (like "Legacy peer.xlsx") from appearing under specific projects.
- **Unified Normalization:** Standardized Mentor, Self, and Peer assessment normalization to use Linear (Min-Max) Interpolation.
- **Dynamic Score Toggle:** Created a centralized `<ScoreDisplayToggle />` component.
- **Vercel Build Stability**: Fixed TypeScript `never` type inference errors on the Student Dashboard caused by the empty initial assessment state.

---

## [2026-03-02] — Architecture doc restructure & CHANGELOG created

- Rewrote `CONTEXT.md` — removed planning artifacts, alias tables, raw file inventories, and resolved Q&A log. Now a concise architecture reference.
- Stripped `SUPABASE_SCHEMA.md` Section 1 (question→domain mapping tables — now managed in the `self_assessment_questions` DB table).
- Created this `CHANGELOG.md`.

---

## [2026-02-28] — Documentation cleanup

- Deleted legacy files: `STATUS.md`, `docs/summary.md`, `docs/FRONTEND_PLAN.md`.
- Updated `README.md` to reflect current project structure and Import Wizard workflow.
- Updated `DATA_IMPORT_RULES.md` with file naming nomenclature (Self/Peer/Term/Notes keywords) and manual Raw Score Range requirement.
- Updated `SUPABASE_SCHEMA.md` with `cohort` column addition to `assessment_logs` and mapping config notes.

---

## [2026-02-27] — Assessment Logs table refinements

- Trimmed Upload Date display format to `"27 Feb, 13:57"` (concise).
- Narrowed Upload Date, Type, and Project columns for better table density.
- Fixed Action buttons visibility: changed table container from `overflow-hidden` to `overflow-x-auto` to restore Delete and View Map buttons.

---

## [2026-02-27] — Import Guidelines in UI (replaced golden templates)

- Removed Excel golden template download buttons from the Import Wizard.
- Replaced with in-app Import Guidelines & Nomenclature section covering all 4 assessment types and file naming rules.

---

## [2026-02-26] — Import Wizard: Manual Raw Score Range

- Added manual Min/Max raw score range input fields to the Import Wizard.
- Normalization is now explicitly controlled per upload, not inferred from file type.

---

## [2026-02-26] — Assessment Logs view

- Built `/admin/assessment-logs` page with full audit trail of all import events.
- Columns: Assessment Date, Upload Date, Type, Cohort/Term, Project, File Name, Raw Scale, Records, Actions.
- Delete action cascades to all associated data (assessments, peer_feedback, etc.) via DB foreign key.

---

## [2026-02-25] — Dashboard chart enhancements

- Refactored radar chart into a **Diverging Bar** chart comparing Mentor vs Self scores.
- Added component playground at `/admin/playground` with: Dynamic Trajectory, KPI Dashboard, Group Matrix Heatmap, Radial Peer Rating, Chronological Grouped Bars.
- Applied global decimal formatting limits across all chart types.
- Fixed Self vs Mentor grouped bar chronological ordering.

---

## [2026-02-24] — Admin UI polish & extended data views

- Redesigned admin sidebar: links → stacked button style.
- Built out missing admin grids: `/admin/assessments/self`, `/admin/peer-feedback`, `/admin/term-tracking`.
- Fixed topbar heading title-case formatting.
- Fixed `.dash-card` flex layout to give `ResponsiveContainer` valid height for chart rendering.
- Wired real CBP/Conflexion/BOW and Peer Feedback data into the student dashboard (replaced placeholders).
- Fixed TypeScript null error in `PeerFeedbackClientPage` blocking Vercel build.

---

## [2026-02-24] — Import Wizard

- Built multi-step Excel/CSV import wizard at `/admin/import`:
  - Step 1: File upload + auto type detection
  - Step 2: Column mapping confirmation
  - Step 3: Data preview
  - Step 4: Commit to database
- Implemented fuzzy name matching against `students.aliases`.

---

## [2026-02-24] — Initial build

- Supabase schema designed and deployed: `programs`, `students`, `projects`, `readiness_domains`, `readiness_parameters`, `assessments`, `peer_feedback`, `term_tracking`, `mentor_notes`, `self_assessment_questions`, `assessment_frameworks`, `assessment_logs`.
- Python ETL scripts used for initial data load from 5 source Excel files (now superseded by Import Wizard).
- Next.js 15 frontend scaffolded and deployed to Vercel.
- Admin Panel: Students, Projects, Mentor Scores, Self Scores, Peer Feedback, Term Tracking, Notes.
- Student Dashboard: Per-student readiness profile with Recharts visualisations and PDF export.
