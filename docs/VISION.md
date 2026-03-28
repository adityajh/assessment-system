# Project Vision & Roadmap

> **System:** Let's Entreprise Assessment System
> **Programme:** India's first working BBA — a 3-year undergraduate programme where work is the curriculum.
> **Date:** 2026-03-28

---

## Where We Are Today

The Assessment System is live and serving **Year 1** of Let's Entreprise. It has:
- A **Supabase database** modelling 6 readiness domains × 24 parameters, with support for mentor assessments, self-assessments, peer feedback, term tracking, and mentor notes.
- An **Import Wizard** for non-technical staff to upload Excel data with fuzzy name matching, configurable score normalization, and full audit logging.
- An **Admin Panel** for managing students, projects, scores, and import logs.
- A **Student Dashboard** — live at `/dashboard/[studentId]` — with readiness profiles, peer feedback, growth trajectory, mentor notes, and PDF export.
- A **Program Dashboard** — live at `/admin/program-dashboard` — showing cohort-level engagement zone analysis across all active students.

*For near-term execution steps, see [`ROADMAP.md`](./ROADMAP.md). For a history of what's been built, see [`CHANGELOG.md`](./CHANGELOG.md).*

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

## Phase 1 — Foundation & Analytics ✅

> **Goal:** Build the core data infrastructure and ship mentor-facing dashboards.

- Supabase schema: 6 readiness domains × 24 parameters, all core tables live
- Import Wizard: Excel upload, auto-detection, fuzzy name matching, score normalization, audit trail
- Admin Panel: students, projects, score browsers, import logs
- Student Dashboard: readiness profile, peer feedback, self vs. mentor gap, domain trajectory, PDF export
- Program Dashboard: cohort engagement zone analysis (Syncing / Connecting / Engaging / Leading)

---

## Phase 2 — Scale & Industry Integration ⬜

> **Goal:** Extend the system for industry projects, detailed project reporting, and multi-year growth.

### 🤝 Client Assessment & Project Reports
- **Client Assessment**: Support for industry partners to assess students on specific projects. Includes capturing Client Name and Company Name during upload.
- **Project Report**: Exportable PDF report focused on a single project, comparing Self, Mentor, and Client assessments (6-domain bar chart). Surfaces project-specific mentor notes and peer feedback.
- **Admin UI**: Dedicated score browser for Client Assessments.

### 📋 Attendance via Jibble
- **Phase 2a**: New `attendance` data type in Import Wizard — CSV export from Jibble uploaded manually.
- **Phase 2b**: Direct Jibble API sync — automated attendance pull on a schedule.
- Surface attendance KPIs on the Student Dashboard and Admin views.

### 🏫 Year 2 & Year 3 Rollout
- Same 6 domains / 24 parameters accumulate longitudinally — student dashboard shows a **3-year growth trajectory**.
- Multi-cohort support: students move from Year 1 → Year 2 without losing data.
- Year 2 project sequences configured via Admin UI (no code changes).

---

## Phase 3 — Access & Security ⬜

> **Goal:** Transition from open access to secure, role-based interaction.

- **Authentication & Role-Based Access**: Supabase Auth with 4 roles: `admin`, `mentor`, `student`, `viewer` (parent / client).
- **Student self-view**: Students see only their own data.
- **Viewer / Parent access**: Read-only access via scoped invite links for external stakeholders.

---

## Phase 4 — Platform Maturity & Intelligence ⬜

> **Goal:** Deep analytics, external data integrations, and institutional durability.

### 🔗 Daily Diary Integration (BoW)
- Connect to the **Daily Diary** system students use for Book of Work logging.
- Pull BoW entries to replace or supplement manual BoW CSV uploads in the Import Wizard.
- Surface BoW activity on the Student Dashboard timeline.

### 📈 Programme-Level Analytics
- `/admin/analytics` — aggregate cohort views: domain heatmap (all students × 6 domains), score distributions, cohort averages.
- Exportable reports for programme reviews and accreditation.

### 🏛️ Institutional Durability
- Mobile-responsive layout for students/parents.
- Push notifications for new assessments.
- Graduated students preserved as alumni records.
- Audit trail with rollback capability.

---

## Architecture Principles

| Principle | What It Means |
|-----------|--------------|
| **Config over code** | Adding projects, cohorts, or parameters should never require a code deployment. |
| **Data over features** | The database is the product. Get the data model right; UI can always be rebuilt. |
| **Non-technical first** | Every feature must be usable by programme staff who don't write code. |
| **Longitudinal by default** | Every score is timestamped and linked to a student, project, and cohort — enabling 3-year trajectory views from day one. |
| **Audience-aware** | Mentors, students, parents, and clients see different things. Design for the viewer, not the data. |

---

*For a history of what's been built, see [`CHANGELOG.md`](./CHANGELOG.md).*
*For the database schema, see [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md).*
*For near-term step-by-step execution, see [`ROADMAP.md`](./ROADMAP.md).*
