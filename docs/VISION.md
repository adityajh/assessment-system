# Project Vision & Roadmap

> **System:** Let's Entreprise Assessment System
> **Programme:** India's first working BBA — a 3-year undergraduate programme where work is the curriculum.
> **Date:** 2026-03-02

---

## Where We Are Today

The Assessment System currently serves **Year 1** of Let's Entreprise. It has:
- A **Supabase database** modelling 6 readiness domains × 24 parameters, with support for mentor assessments, self-assessments, peer feedback, term tracking, and mentor notes.
- An **Import Wizard** that lets non-technical staff upload Excel/CSV data with fuzzy name matching and configurable score normalization.
- An **Admin Panel** for managing students, projects, scores, and import logs.
- A **Student Dashboard** (in progress) for per-student readiness visualisation.

**Current focus:** Ironing out data import bugs and rolling out student dashboards within the week.

---

## The Vision

The Assessment System becomes the **single source of truth for student growth** across the entire 3-year BBA — tracking every student from their first Kickstart project through to graduation, across every project, domain, and assessment type.

It serves **four audiences** with tailored views:

| Audience | What They See |
|----------|--------------|
| **Mentor** | Full student profile, cohort analytics, coaching tools, import capabilities |
| **Student** | Personal readiness dashboard, peer feedback, growth trajectory, reflections |
| **Parent** | Read-only summary of progress, term-level milestones, attendance |
| **Industry Partner / Client** | Project-specific student profiles for SDP client evaluations |

It must be **maintainable by non-technical programme staff** — no code deployments needed to add a new project, onboard a new cohort, or adjust the dashboard.

---

## Short-Term (This Week → End of March 2026)

> **Goal:** Stabilise the foundation and ship student-facing dashboards.

### 🔧 Data Import Stability
- [ ] Resolve remaining import bugs (scale detection, duplicate handling, edge cases).
- [ ] Add import validation warnings (e.g., "3 students not matched") before commit.
- [ ] Improve error messaging for failed imports.

### 📊 Student Dashboard v1
- [ ] Design and ship the student dashboard layout for mentor use.
- [ ] Core sections: Readiness overview, project-by-project breakdown, peer feedback, term tracking, mentor notes.
- [ ] Shareable read-only link per student (no auth needed for v1).

### 🧹 Housekeeping
- [ ] Clean up legacy Python scripts that are no longer needed.
- [ ] Review and remove `docs/duplicate_mappings.md` and `docs/dashboard_chart_recommendations.md` if superseded.

---

## Medium-Term (April – August 2026)

> **Goal:** Multi-audience access, attendance data, and programme-level analytics.

### 🔐 Authentication & Role-Based Access
- [ ] Implement Supabase Auth with 4 roles: `admin`, `mentor`, `student`, `viewer` (parent/client).
- [ ] **Admin / Mentor:** Full access to admin panel + all dashboards.
- [ ] **Student:** Access only to their own dashboard.
- [ ] **Viewer (Parent / Client):** Read-only access via shareable invite links scoped to specific students or projects.

### 🏫 Multi-Cohort Support
- [ ] Add `cohort` dimension to all queries (e.g., "Year 1 — 2025–26", "Year 1 — 2026–27").
- [ ] Admin UI: Cohort selector/filter across all views.
- [ ] Ensure the Import Wizard tags all data with the selected cohort.
- [ ] Onboarding flow: Bulk student upload for new cohorts.

### 📋 Attendance & Participation Integration
- [ ] Design a simple attendance data model (student × date × status, or student × project × metric).
- [ ] CSV upload path via Import Wizard (new data type: `attendance`).
- [ ] Surface attendance KPIs on the student dashboard and programme analytics.

### 📈 Programme-Level Analytics (Cohort Dashboard)
- [ ] `/admin/analytics` — Aggregate views across the entire cohort:
  - Domain heatmap: All students × 6 domains (colour-coded).
  - Distribution charts: Score distributions per domain.
  - Cohort averages vs. individual benchmarking.
  - Peer feedback health check: participation rates, outlier detection.
- [ ] Exportable reports for programme reviews and accreditation.

### 🎨 Dashboard Design Evolution
- [ ] Iterate on dashboard visualisations based on mentor + student feedback.
- [ ] Add interactive elements: domain drill-downs, project filters, time-range selectors.
- [ ] Parent-friendly simplified view (high-level milestones, not raw scores).
- [ ] Client/employer view: Project-specific student readiness profile (shareable PDF).

---

## Long-Term (September 2026 → 2027+)

> **Goal:** Full 3-year lifecycle, cross-year progression, and platform maturity.

### 🎓 Year 2 & Year 3 Rollout
- [ ] Extend the system to serve Year 2 and Year 3 students concurrently.
- [ ] Same 6 domains / 24 parameters across all years — scores accumulate longitudinally.
- [ ] Student progression: A student's dashboard shows a **3-year growth trajectory** across all projects and years.
- [ ] Year-specific project sequences: Each year has its own set of projects, independently configurable via the Admin Panel.
- [ ] Handle students moving between years (promotions, repeats, transfers).

### 🔄 Dynamic Project Configuration
- [ ] Admin UI for creating, reordering, and archiving projects — no code changes needed.
- [ ] Support for project types beyond "standard": client projects, internships, capstone.
- [ ] Configurable assessment frameworks per project (which parameters are assessed, which are N/A).

### 🔗 External System Integrations
- [ ] Attendance: Move from CSV upload to automated sync (API integration with attendance system, when ready).
- [ ] LMS / Google Workspace integration for assignment and participation data.
- [ ] Webhook or API endpoints for third-party systems to push data into the Assessment System.

### 📱 Accessibility & Distribution
- [ ] Mobile-responsive dashboard (students and parents primarily access via phone).
- [ ] Push notifications or email digests: "Your new assessment scores are available."
- [ ] Offline PDF report generation for parent-teacher meetings.

### 🏛️ Institutional Features
- [ ] Multi-programme support: Beyond the BBA, if Let's Entreprise launches additional programmes.
- [ ] Academic calendar awareness: Terms, semesters, breaks — contextual timestamps.
- [ ] Audit trail & data governance: Who uploaded what, when, with rollback capability.
- [ ] Archival: Graduated students' data preserved as alumni records.

---

## Architecture Principles

These guide every decision as the system evolves:

| Principle | What It Means |
|-----------|--------------|
| **Config over code** | Adding projects, cohorts, or parameters should never require a code deployment. |
| **Data over features** | The database is the product. Get the data model right; UI can always be rebuilt. |
| **Non-technical first** | Every feature must be usable by programme staff who don't write code. |
| **Longitudinal by default** | Every score is timestamped and linked to a student, project, and cohort — enabling 3-year trajectory views from day one. |
| **Audience-aware** | Mentors, students, parents, and clients see different things. Design for the viewer, not the data. |

---

*This document will be updated as priorities shift and new requirements emerge. For a history of what's already been built, see [`CHANGELOG.md`](./CHANGELOG.md).*
