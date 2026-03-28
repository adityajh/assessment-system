# Project Roadmap — Next Steps

> **Last Updated:** 2026-03-28
> **Related:** [VISION.md](./VISION.md) | [CHANGELOG.md](./CHANGELOG.md)

---

### Step 1 — Fix data import bugs ✅ *Shipped*
Import edge cases (scale mismatches, duplicate rows, unmatched names) have been addressed iteratively. The Import Wizard shows validation warnings before commit. The import API applies smart date extraction for mentor notes and falls back gracefully to the session date.

### Step 2 — Student dashboard v1 (mentor view) ✅ *Shipped*
The full student analysis dashboard is live at `/dashboard/[studentId]`. Includes:
- **Relative Engagement Stack** (dot plot, cohort-positioned)
- **Learning Trajectory** (line chart over time)
- **Self-Awareness Gap Bar** (mentor vs self per parameter)
- **Program Mastery Profile** (consolidated domain heatmap, mentor scores only)
- **Peer Rating Deviation Chart** (vs cohort average, across projects)
- **Qualitative Mentor Feedback** feed with dates
- **Actionable Mission Plan** (persistent, editable, saved to DB)
- **Top 2 Strongest Domains & Top 2 Growth Domains**
- **PDF/Print Export** with proper layout

### Step 3 — Program Dashboard ✅ *Shipped*
Cohort-level analytics live at `/admin/program-dashboard`. Includes:
- **Engagement Zone analysis** — all active students positioned across Syncing / Connecting / Engaging / Leading zones
- **Student comparison table** with sorting and filtering
- Colour-coded zone system consistent with the Student Dashboard dot plot

### Step 4 — Iterate on dashboard visualisations 🔄 *In Progress*
- Engagement Stack, Gap Bar, and Peer Deviation charts are live and receiving feedback.
- Next: drill-downs into individual parameters, and mobile-responsive layout improvements.

### Step 5 — Client Assessments
Add support for industry partners to assess students on specific projects. Includes:
- Updating Import Wizard to capture Client Name and Company Name for each upload.
- Storing `client_name` and `company_name` in `assessment_logs`.
- Adding a dedicated score browser for Client Assessments in the Admin sidebar.

### Step 6 — Project Reports
Create specialized student reports for single projects:
- New dashboard view at `/dashboard/[id]/project/[pid]`.
- Comparison bar chart (6 domains) for Self vs Mentor vs Client assessments.
- Listing of project-specific mentor notes and peer feedback summary.
- Dedicated Print/Export PDF support.

### Step 7 — Attendance via Jibble
Add `attendance` as a new data type in the Import Wizard with a defined CSV format (Phase 2a — manual Jibble CSV export). Surface attendance KPIs on the Student Dashboard. Phase 2b: direct Jibble API sync on a schedule.

### Step 8 — Year 2 & Year 3 rollout
Extend the system for the next cohort year. Year 2 project sequences added via Admin UI (no code changes). Student timelines show multi-year growth trajectories. Cohort promotion: students move from Year 1 → Year 2 without losing data.

### Step 9 — Multi-cohort admin support
Ensure all queries and UI views are cohort-aware. Add cohort selector to the admin panel. Build a bulk student upload flow for onboarding new cohorts.

### Step 10 — Authentication & role-based access
Implement Supabase Auth with roles: `admin`, `mentor`, `student`, `viewer`. Gate the admin panel. Student dashboard restricted to the student's own data. Parent/client access via scoped invite links.

### Step 11 — Programme-level analytics
Build `/admin/analytics` with aggregate cohort views: domain heatmap (all students × 6 domains), score distributions, cohort averages for benchmarking, peer feedback participation rates. Exportable as PDF/CSV.

### Step 12 — Daily Diary integration (BoW)
Connect to the Daily Diary system students use for Book of Work logging. Replace/supplement manual BoW CSV uploads. Surface BoW activity on the Student Dashboard timeline.

### Step 13 — Client / employer view (Platform)
Finalize scoped, read-only student profile for SDP industry partners across all projects.

---

*For the full phased vision, see [VISION.md](./VISION.md).*
