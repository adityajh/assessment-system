# Project Roadmap — Next 10 Steps

> **Last Updated:** 2026-03-02
> **Related:** [VISION.md](./VISION.md) | [CHANGELOG.md](./CHANGELOG.md)

---

### Step 1 — Fix data import bugs
Audit and resolve all known import edge cases: scale mismatches, duplicate rows, unmatched student names. Add pre-commit validation warnings so the user can catch and fix issues before data is saved.

### Step 2 — Student dashboard v1 (mentor view)
Design and ship the student dashboard for mentor use during 1:1 coaching sessions. Core sections: readiness overview, project breakdown, peer feedback, term tracking, mentor notes. Shareable via URL — no login required.

### Step 3 — Iterate on dashboard visualisations
Collect feedback from mentors using the dashboard. Refine chart design, improve tooltips, drill-downs, and mobile responsiveness based on real use.

### Step 4 — Student & parent views
Create simplified read-only views for students (own data only) and parents (milestones, attendance, high-level scores). Accessible via invite links.

### Step 5 — Authentication & role-based access
Implement Supabase Auth with roles: `admin`, `mentor`, `student`, `viewer`. Gate the admin panel. Student dashboard restricted to the student's own data. Parent/client access via scoped invite links.

### Step 6 — Attendance data import (CSV)
Design the attendance data model. Add `attendance` as a new data type in the Import Wizard with a defined CSV format. Surface attendance KPIs on the student dashboard.

### Step 7 — Multi-cohort support
Ensure all data, queries, and UI views are cohort-aware. Add cohort selector to the admin panel. Import Wizard requires cohort selection. Build a bulk student upload flow for onboarding new cohorts.

### Step 8 — Programme-level analytics
Build `/admin/analytics` with aggregate cohort views: domain heatmap (all students × 6 domains), score distributions, cohort averages for benchmarking, peer feedback participation rates. Exportable as PDF/CSV.

### Step 9 — Client / employer view
Scoped, read-only student profile for industry partners reviewing students on specific projects. Shows relevant readiness scores and peer feedback. Shareable as a link or PDF.

### Step 10 — Year 2 rollout
Extend the system for the next cohort year. Add Year 2 project sequences via the admin UI (no code changes). Student timelines show 2-year growth trajectories. Test cohort promotion: students move from Year 1 to Year 2 without losing data.

---

*For the full long-term vision, see [VISION.md](./VISION.md).*
