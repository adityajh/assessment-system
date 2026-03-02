# Project Roadmap — March to May 2026

> **Last Updated:** 2026-03-02
> **Derived from:** [VISION.md](./VISION.md)

---

## March 2026 — Stabilise & Ship Dashboards

> **Theme:** Fix what's broken, ship what students and mentors can see.

### Week 1 (Mar 3–9) — Import Bug Fixes
- [ ] Audit all known import edge cases (scale mismatches, duplicate rows, unmatched names).
- [ ] Add pre-commit validation warnings in Import Wizard ("3 students unmatched — review before saving").
- [ ] Improve error messages for failed imports (clear, actionable text).
- [ ] Test: Re-import all existing datasets cleanly with no errors.

### Week 2 (Mar 10–16) — Student Dashboard v1 Design
- [ ] Define the dashboard layout and sections (readiness overview, project breakdown, peer feedback, term tracking, notes).
- [ ] Design the dashboard for **mentor use** first (they review students during 1:1 coaching).
- [ ] Wireframe / mockup the key views.
- [ ] Identify which data queries are needed (likely `v_domain_scores`, `v_peer_feedback_summary`).

### Week 3 (Mar 17–23) — Student Dashboard v1 Build
- [ ] Implement the dashboard page at `/dashboard/[studentId]`.
- [ ] Build core chart components (readiness bar chart, progression line chart, peer feedback bars).
- [ ] Wire real data from Supabase views.
- [ ] Shareable read-only link per student (no auth, just a URL).

### Week 4 (Mar 24–30) — Polish & Cleanup
- [ ] Test dashboard with real student data across all projects.
- [ ] Iterate on visualisation design based on self-review.
- [ ] Clean up legacy files: remove unused Python scripts, `docs/duplicate_mappings.md`, `docs/dashboard_chart_recommendations.md`.
- [ ] **Milestone:** Dashboard v1 live on Vercel and shareable with mentors.

---

## April 2026 — Multi-Cohort & Access Control

> **Theme:** Make the system work for more than one group of students, and lock it down.

### Week 1–2 (Apr 1–13) — Authentication & Roles
- [ ] Implement Supabase Auth (email/password or magic link).
- [ ] Define 3 roles: `admin` (full access), `mentor` (dashboard + import), `student` (own dashboard only).
- [ ] Gate the admin panel behind auth.
- [ ] Student dashboard: Accessible via auth or shareable invite link.
- [ ] Basic role management UI in admin settings.

### Week 3 (Apr 14–20) — Multi-Cohort Data Model
- [ ] Ensure the `cohort` field is consistently used across all tables and queries.
- [ ] Add cohort selector to the admin panel (global filter).
- [ ] Import Wizard: Cohort selection as a required field.
- [ ] Admin UI: Bulk student upload for onboarding a new cohort.

### Week 4 (Apr 21–27) — Attendance Integration (v1)
- [ ] Design attendance data model (`student_attendance`: student × date × status, or student × project × attendance_score).
- [ ] Add `attendance` as a new data type in the Import Wizard.
- [ ] Define CSV format rules in `DATA_IMPORT_RULES.md`.
- [ ] Surface basic attendance KPIs on the student dashboard (e.g., attendance rate %).

### End of April Milestone
- [ ] System supports authenticated access with role-based views.
- [ ] A second cohort can be onboarded without code changes.
- [ ] Attendance data can be imported and displayed.

---

## May 2026 — Analytics & Audience-Specific Views

> **Theme:** From individual dashboards to programme intelligence, and views for parents and clients.

### Week 1–2 (May 1–11) — Programme Analytics Dashboard
- [ ] Build `/admin/analytics` — cohort-level aggregate views:
  - Domain heatmap: All students × 6 domains (colour-coded by score band).
  - Score distribution histograms per domain.
  - Cohort averages for benchmarking against individual students.
  - Peer feedback participation rates and outlier detection.
- [ ] Filterable by cohort, project, and assessment type.
- [ ] Export: Downloadable PDF/CSV report for programme reviews.

### Week 3 (May 12–18) — Parent & Client Views
- [ ] Parent view: Simplified, non-technical summary — milestones reached, attendance, high-level readiness scores. Accessible via invite link.
- [ ] Client/employer view: Project-scoped student profile — relevant readiness scores + peer feedback for a specific project. Shareable as a PDF or link.
- [ ] Both views are read-only, no admin UI visible.

### Week 4 (May 19–25) — Dashboard Iteration & Feedback
- [ ] Collect feedback from mentors and students on dashboard v1.
- [ ] Iterate on visualisations: drill-downs, better tooltips, mobile responsiveness.
- [ ] Add interactive filters: project selector, domain selector, time range.
- [ ] Performance review: Optimise slow queries, add DB indexes if needed.

### End of May Milestone
- [ ] Programme director can view cohort-level analytics and export reports.
- [ ] Parents can see a simplified progress summary for their child.
- [ ] Industry partners can review student profiles for project evaluations.
- [ ] Dashboard has been iterated on with real user feedback.

---

## Risk & Dependencies

| Risk | Mitigation |
|------|-----------|
| Import bugs block dashboard rollout | Prioritise import fixes in Week 1; dashboard can use existing clean data |
| Auth adds complexity to every route | Implement auth as middleware, not per-page |
| Attendance system doesn't exist yet | Start with CSV upload; automate later |
| Dashboard design needs iteration | Ship v1 fast, iterate in May based on feedback |
| Scale (50 students × 3 cohorts) | Current architecture handles this; monitor query performance |

---

*This roadmap will be updated monthly. For the longer-term vision, see [`VISION.md`](./VISION.md). For a log of completed work, see [`CHANGELOG.md`](./CHANGELOG.md).*
