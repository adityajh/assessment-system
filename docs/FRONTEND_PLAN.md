# Frontend Plan — Let's Entreprise Assessment System

> **Last Updated:** 2026-02-24  
> **Status:** Planning Phase  
> **Repo:** `/Users/adityajhunjhunwala/Documents/Antigravity/AssessmentSystem`

---

## Overview

This document outlines the plan for building **two frontend applications** that sit on top of the Supabase database:

| App | Purpose | Primary Users |
|-----|---------|---------------|
| **App 1 — Admin Panel** | Manage & edit the database (students, scores, notes, imports) | Mentors / Admins |
| **App 2 — Student Dashboard** | View a rich, visual per-student assessment report | Mentors reviewing a student / Students themselves |

Both apps will share a single **Next.js** project (using the App Router), hosted under two route groups:
- `/admin/**` — the database management panel
- `/dashboard/[studentId]` — the student dashboard viewer

---

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | **Next.js 14** (App Router) | SSR for dashboard generation, API routes for data import |
| Styling | **Vanilla CSS + CSS Modules** | Maximum control, no bloat |
| Database | **Supabase** (Postgres + JS client) | Already defined schema |
| Charts | **Recharts** | Lightweight, composable, works well with React |
| Spreadsheet parsing | **xlsx (SheetJS)** | For Excel import in the admin panel |
| Auth | **Supabase Auth** | Mentor login; students can get a read-only link |
| PDF Export | **@react-pdf/renderer** or `html2canvas` + `jspdf` | For generating printable student reports |

---

## App 1 — Admin Panel (`/admin`)

### Goal
Give mentors a clean interface to:
1. View and edit all database tables
2. Bulk-import data from Excel files
3. Add/edit mentor notes per student
4. Validate and fix data quality issues (name mismatches, duplicate entries, missing scores)

---

### 1.1 Navigation Structure

```
/admin
├── /students          → Student roster management
├── /projects          → Project/module management
├── /assessments       → Score browser & editor
│   ├── /mentor        → Mentor assessment scores
│   └── /self          → Self-assessment scores
├── /peer-feedback     → Peer feedback table
├── /term-tracking     → CBP / Conflexion / BOW tracker
├── /notes             → Mentor notes manager
├── /import            → Excel import wizard
└── /settings          → Domain/parameter config
```

---

### 1.2 Page-by-Page Breakdown

#### `/admin/students` — Student Roster

**Purpose:** Manage the canonical student list.

**UI Elements:**
- Table: `#`, `Canonical Name`, `Student Number`, `Status (Active/Inactive)`, `Known Aliases`, `Actions`
- Inline editing of any row
- Toggle student active/inactive (e.g., mark Madhur inactive)
- Add alias button (opens a small modal to add a name variant)
- "Add New Student" button → modal with form
- Search/filter by name or status

**Database operations:**
- `SELECT * FROM students ORDER BY student_number`
- `UPDATE students SET ... WHERE id = ?`
- `INSERT INTO students ...`

---

#### `/admin/projects` — Project Management

**Purpose:** Define the project sequence and metadata.

**UI Elements:**
- Ordered list of projects showing: `Sequence Label`, `Project Name`, `Internal Name`, `Type`, `Concurrent Group`, `Parent Project`
- Drag-to-reorder (sequence management)
- Edit modal for each project
- Visual indicator for concurrent projects (Seq 2a/2b shown side-by-side)

**Database operations:**
- `SELECT * FROM projects ORDER BY sequence, sequence_label`
- `UPDATE projects SET ... WHERE id = ?`

---

#### `/admin/assessments/mentor` — Mentor Score Browser

**Purpose:** View and edit all mentor assessment scores in a spreadsheet-like UI.

**UI Elements:**
- **Filter bar:** Student, Project, Domain — all dropdowns
- **Grid view:** Rows = students, Columns = 24 readiness parameters
  - Cells show the `normalized_score`, hoverable to reveal `raw_score` and `source_file`
  - Click a cell to edit inline; shows raw scale and normalized preview
- **Domain grouping:** Column headers grouped under the 6 domain names with colour coding
- **Empty cell indicator:** Grey = no data; Yellow = score present; Red = score looks like an outlier (>2σ from cohort mean)
- Export visible data as CSV

**Database operations:**
- `SELECT ... FROM assessments JOIN ... WHERE assessment_type = 'mentor'`
- `UPDATE assessments SET raw_score=?, normalized_score=? WHERE id = ?`

---

#### `/admin/assessments/self` — Self-Assessment Score Browser

**Purpose:** Same grid as mentor, but for self-assessments. Shows question text on hover.

**UI Elements:**
- Same grid as mentor view
- Tooltip on each cell shows the original question text (from `self_assessment_questions`)
- Different colour scheme (teal vs blue) to distinguish from mentor scores
- Scale indicator per cell (shows whether it was 1-5 or 1-10 originally)

---

#### `/admin/peer-feedback` — Peer Feedback Table

**Purpose:** View the raw peer feedback data; check for anomalies.

**UI Elements:**
- **Matrix view:** Rows = Recipients, Columns = Givers — cell shows average across the 5 metrics, or "-" if no feedback
- **Click a cell** → expands to show all 5 metric scores for that pair
- **Filter by project** (Kickstart, Legacy, Marketing, SDP)
- **Flag outliers:** Highlight cells where any metric is 1 (potential issue)
- Table view alternative: flat list of all feedback rows
- Edit individual feedback entries

**Database operations:**
- `SELECT ... FROM peer_feedback JOIN ...`

---

#### `/admin/term-tracking` — CBP / Conflexion / BOW

**Purpose:** Track and edit the three term-level metrics per student.

**UI Elements:**
- Simple table: `Student`, `CBP`, `Conflexion`, `BOW Score` — all inline editable
- Visual bars showing progress (e.g., CBP 2/3, BOW 12/15)
- Total counts at the bottom

---

#### `/admin/notes` — Mentor Notes

**Purpose:** Write and manage mentor notes for students.

**UI Elements:**
- Left panel: student list (click to select)
- Right panel: note feed for selected student
  - Grouped by project (with "General" section at top)
  - Each note: text, type badge (strength / improvement / general), author, date
  - Add note button → inline text editor (rich text optional)
  - Edit / delete notes
- Filter: by project, by note type

---

#### `/admin/import` — Excel Import Wizard

**Purpose:** The most critical admin feature. Allows mentors to upload Excel files and have the system parse, validate, and load data into the database.

**Phase 1 — File Upload & Parse:**
- Drag-and-drop upload zone (accepts `.xlsx`)
- Auto-detect file type (Assessment Matrix / Peer Feedback / Self-Assessment / Term Report)
- Preview the parsed data in a table before committing
- Show detected sheet names and allow the user to select which sheet to import

**Phase 2 — Name Matching:**
- Side-by-side table: `Name Found in File` | `→ Matched to Student` | `Confidence`
- Exact matches shown in green, fuzzy matches in yellow (user must confirm), unmatched shown in red
- Manual override: dropdown to pick the correct canonical student

**Phase 3 — Score Preview:**
- Show a full preview of the scores that will be imported
- Highlight cells that would overwrite existing data
- Option to skip duplicates or overwrite

**Phase 4 — Commit:**
- Shows a summary: "X scores to insert, Y to update, Z skipped"
- Confirm button → runs the import
- Import log shows success/failure per row

**Backend:** Next.js API route `/api/import` handles the parsing and upsert logic using `xlsx` and Supabase server client.

---

#### `/admin/settings` — Domain & Parameter Config

**Purpose:** View (and rarely edit) the readiness domains and parameters — the assessment framework itself.

**UI Elements:**
- Accordion list of 6 domains, each expanding to show 4 parameters
- Each parameter: name, description, param_number
- Edit button (admin-only — rare operation)
- View self-assessment question mappings per project

---

### 1.3 Admin Panel Design System

- **Colour palette:**  
  - Background: `#0f1117` (near-black)  
  - Surface: `#1a1d27`  
  - Border: `#2a2d3e`  
  - Primary accent: `#6366f1` (indigo)  
  - Success: `#22c55e` | Warning: `#f59e0b` | Danger: `#ef4444`  
  - Text: `#f1f5f9` (primary), `#94a3b8` (muted)

- **Typography:** Inter (Google Fonts)
- **Layout:** Fixed left sidebar nav + main content area with a top bar showing breadcrumb + user info
- **Tables:** Dense, spreadsheet-style with alternating row shading
- **Modals:** Slide-in sheet from right (not centered modal) for edit forms

---

## App 2 — Student Dashboard (`/dashboard/[studentId]`)

### Goal
Generate a beautiful, information-rich, **per-student report** that shows:
1. Readiness scores across all projects, broken down by mentor vs self-assessment
2. Peer feedback summary
3. Term tracking (CBP, Conflexion, BOW)
4. Mentor notes
5. Progression over time (across projects)

The dashboard must be **printable / exportable as PDF** and **shareable via a unique link**.

---

### 2.1 Page Structure

```
/dashboard
├── /                  → Student selection grid (admin only)
└── /[studentId]       → Full student dashboard
    ├── #overview      → Header + summary stats
    ├── #readiness     → Radar chart + domain score table
    ├── #progression   → Line chart across projects over time
    ├── #peer-feedback → Peer feedback section
    ├── #term          → CBP / Conflexion / BOW
    └── #notes         → Mentor notes feed
```

---

### 2.2 Dashboard Sections

#### Section 1: Header / Student Identity
- Student name (large, prominent)
- Cohort year (Year 1 — 2025–26)
- Profile avatar placeholder (initials-based coloured circle)
- Quick stats row: total projects assessed, avg overall readiness score, peer feedback count
- "Export PDF" button | "Share Link" button

---

#### Section 2: Readiness Overview — Radar Chart
The **centrepiece** of the dashboard.

- **Radar/Spider chart** with 6 axes (one per readiness domain)
- Shows **three overlapping polygons:**
  1. Mentor average across all projects (dark indigo fill)
  2. Self-assessment average (teal fill, semi-transparent)  
  3. Cohort average (dashed grey line — for benchmarking)
- Below the chart: **Domain Score Cards** — 6 cards, one per domain, showing:
  - Domain name + icon
  - Mentor avg score (out of 10)
  - Self avg score (out of 10)
  - Delta (Δ) between mentor and self (green if aligned, orange if gap > 1.5)
  - Small sparkline showing score across projects

---

#### Section 3: Project-by-Project Breakdown
- **Tab selector** or horizontal scroll for each project: Kickstart → Marketing/Legacy → Business X-Ray → Accounts → SDP
- Each project panel shows:
  - A **grouped bar chart**: X-axis = 6 domains; for each domain, two bars (Mentor, Self)
  - Scores that are `null` / not assessed shown as greyed out with label "Not Assessed"
  - Below the chart: a table of all 24 parameters with mentor score, self score, and delta

---

#### Section 4: Readiness Progression Over Time
- **Line chart** with X-axis = project sequence (Kickstart → SDP)
- **6 lines**, one per readiness domain (colour-coded to match domain)
- Toggle buttons to show/hide mentor scores vs self-assessment scores
- Tooltip on each point shows the exact score and project name

---

#### Section 5: Peer Feedback
- **Section header:** "How Your Peers See You"
- Sub-tabs for each project (Kickstart, Legacy/Marketing, SDP)
- For the selected project:
  - 5 metric scores displayed as **horizontal progress bars** (avg out of 5):
    - Quality of Work
    - Initiative & Ownership
    - Communication
    - Collaboration
    - Growth Mindset
  - "Based on N peer ratings" label
  - Overall peer average (large number display)
- **Comparison across projects:** Small grouped bar chart showing all 5 metrics across all projects side-by-side

---

#### Section 6: Term Tracking
- 3 stat cards side by side:
  1. **CBP Sessions** — e.g. "2 / 3 completed" with a progress arc
  2. **Conflexion** — e.g. "1 / 2 completed" with a progress arc
  3. **Body of Work** — e.g. "12.5 credits" with a large number display

---

#### Section 7: Mentor Notes
- Feed-style list of notes, ordered by date (newest first)
- Each note tagged with: project name (or "General"), note type badge (Strength 💪 / Growth Area 🌱 / Observation 👁), mentor name, date
- Collapsible by project
- Notes can be hidden from PDF export if marked "internal"

---

### 2.3 Dashboard Selection Page (`/dashboard`)
For mentors to quickly navigate between students.

- **Grid of 17 student cards**, each showing:
  - Student name + number
  - Colour-coded readiness score (overall avg as coloured ring)
  - Last updated timestamp
  - "View Dashboard" button
- Sort by name / by overall score / by last updated
- Cohort aggregate view toggle (shows radar chart for the whole cohort)

---

### 2.4 Dashboard Design System

- **Colour palette:**  
  - Background: `#f8fafc` (light grey-white)  
  - Section cards: `#ffffff` with `box-shadow: 0 1px 3px rgba(0,0,0,0.08)`  
  - Domain colours (consistent across all charts):  
    - Commercial: `#f59e0b` (amber)  
    - Entrepreneurial: `#10b981` (emerald)  
    - Marketing: `#ec4899` (pink)  
    - Innovation: `#8b5cf6` (violet)  
    - Operational: `#3b82f6` (blue)  
    - Professional: `#14b8a6` (teal)  
  - Mentor scores: `#6366f1` (indigo)  
  - Self scores: `#06b6d4` (cyan)  
  - Cohort benchmark: `#94a3b8` (slate)

- **Typography:** Inter (headings) + Roboto Mono (scores/numbers)
- **Layout:** Single-column scroll with sticky section nav (sidebar on wide screens)
- **Print/PDF:** Separate `@media print` stylesheet that linearises the layout and removes interactive elements

---

## 3. Build Phases

### Phase 1 — Foundation (Week 1)
- [ ] Initialise Next.js 14 project in `/frontend`
- [ ] Configure Supabase client (server + browser)
- [ ] Build shared design system (CSS variables, typography, component primitives)
- [ ] Set up route structure and layout shells for both admin and dashboard
- [ ] Implement Supabase Auth (mentor login)

### Phase 2 — Admin Core (Week 2)
- [ ] `/admin/students` — full CRUD
- [ ] `/admin/projects` — view + edit
- [ ] `/admin/term-tracking` — inline edit table
- [ ] `/admin/notes` — note feed + editor
- [ ] `/admin/assessments/mentor` — score grid (read-only first)

### Phase 3 — Import Wizard (Week 3)
- [ ] Build `/admin/import` step 1-4 (upload → parse → match → commit)
- [ ] Implement server-side `xlsx` parsing in API route
- [ ] Fuzzy name matching logic (Levenshtein or similar)
- [ ] Upsert logic for all 4 data source types

### Phase 4 — Dashboard (Week 4)
- [ ] `/dashboard` student selection grid
- [ ] `/dashboard/[studentId]` — all 7 sections
- [ ] Radar chart (Recharts)
- [ ] Progression line chart
- [ ] Peer feedback bars
- [ ] Domain score cards + sparklines

### Phase 5 — Polish & Export (Week 5)
- [ ] PDF export (`html2canvas` + `jsPDF` or `@react-pdf/renderer`)
- [ ] Shareable read-only dashboard links
- [ ] Cohort aggregate view
- [ ] Admin score editing (inline edit in grid)
- [ ] Self-assessment score browser
- [ ] Peer feedback matrix view

---

## 4. Folder Structure

```
frontend/
├── app/
│   ├── layout.tsx                  # Root layout + font loading
│   ├── page.tsx                    # Landing / redirect
│   ├── admin/
│   │   ├── layout.tsx              # Admin sidebar layout
│   │   ├── page.tsx                # Admin home (redirect → /admin/students)
│   │   ├── students/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   └── page.tsx
│   │   ├── assessments/
│   │   │   ├── mentor/page.tsx
│   │   │   └── self/page.tsx
│   │   ├── peer-feedback/
│   │   │   └── page.tsx
│   │   ├── term-tracking/
│   │   │   └── page.tsx
│   │   ├── notes/
│   │   │   └── page.tsx
│   │   ├── import/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   └── dashboard/
│       ├── layout.tsx              # Dashboard layout (minimal chrome)
│       ├── page.tsx                # Student selection grid
│       └── [studentId]/
│           └── page.tsx            # Full student dashboard
├── components/
│   ├── admin/                      # Admin-only components
│   │   ├── ScoreGrid.tsx
│   │   ├── ImportWizard.tsx
│   │   ├── NoteEditor.tsx
│   │   ├── PeerMatrix.tsx
│   │   └── StudentForm.tsx
│   ├── dashboard/                  # Dashboard-only components
│   │   ├── RadarChart.tsx
│   │   ├── ProgressionChart.tsx
│   │   ├── PeerFeedbackBars.tsx
│   │   ├── DomainScoreCard.tsx
│   │   ├── TermTrackingCard.tsx
│   │   └── StudentHeader.tsx
│   └── shared/                     # Used in both
│       ├── Sidebar.tsx
│       ├── DataTable.tsx
│       ├── Modal.tsx
│       ├── Badge.tsx
│       └── LoadingSpinner.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser Supabase client
│   │   ├── server.ts               # Server Supabase client
│   │   └── queries/                # Query functions per entity
│   │       ├── students.ts
│   │       ├── assessments.ts
│   │       ├── peer-feedback.ts
│   │       └── dashboard.ts
│   ├── import/
│   │   ├── parseExcel.ts           # xlsx parsing utilities
│   │   ├── matchNames.ts           # Fuzzy name matcher
│   │   └── importers/              # One importer per data source type
│   │       ├── assessmentMatrix.ts
│   │       ├── selfAssessment.ts
│   │       ├── peerFeedback.ts
│   │       └── termReport.ts
│   └── utils/
│       ├── normalize.ts            # Score normalization (1-5 → 1-10)
│       └── formatters.ts
├── styles/
│   ├── globals.css                 # Design tokens + resets
│   ├── admin.css                   # Admin panel styles
│   └── dashboard.css               # Dashboard styles
└── api/
    └── import/
        └── route.ts                # POST endpoint for Excel upload
```

---

## 5. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Single Next.js app vs two apps | **Single app, two route groups** | Shared auth, shared Supabase client, shared components |
| Score normalization location | **At import time** (store `normalized_score` in DB) | Dashboard queries are simpler; no on-the-fly math |
| Name matching | **Server-side at import time** | Correctness > speed; human-reviewed before commit |
| PDF generation | **html2canvas + jsPDF** | No separate rendering server needed |
| Chart library | **Recharts** | Best React integration; supports Radar, Line, Bar |
| Styling | **Vanilla CSS (CSS Modules)** | No framework lock-in; matches team preference |
| Auth guard | **Admin panel gated; Dashboard read-only by default** | Mentors login to edit; shareable links for dashboards |

---

*This plan will be updated as implementation progresses. Each phase should result in a commit.*
