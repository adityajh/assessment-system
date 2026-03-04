# Changelog

All notable changes to the Let's Entreprise Assessment System are documented here.

Format: `## [YYYY-MM-DD] — Description`

## [2026-03-04] — Dashboard Reorganization & UI Branding

- **Dashboard Swap:** Promoted the high-fidelity layout (formerly "Report Card") to the primary **Student Dashboard** view (`/dashboard/[studentId]`).
- **Legacy Preservation:** Migrated the original student dashboard to the Playground as **Dashboard Version 1** (`/admin/playground/v1/[studentId]`).
- **Unified Branding:** Renamed all instances of "Report Card" to **"Student Dashboard"** across the UI, metadata, and page headers.
- **Admin Side-Nav Restructuring:** Reorganized sidebar into logical segments: **Import**, **Assessments**, **Tools**, and **System**.
- **PDF Export Optimization:** Added global print styles to the Admin Layout to automatically hide the sidebar and top navigation when exporting dashboards to PDF.
- **Enhanced Navigation:** Refined the "Back" button to be dynamic: it correctly leads from a student's dashboard back to the student list, and from the student list back to the application homepage.
- **Playground Links:** Added quick-access buttons in the Playground to toggle between the live Student Dashboard and the Legacy Version 1.

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
