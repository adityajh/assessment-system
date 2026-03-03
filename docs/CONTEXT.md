# Assessment System — Architecture Context

> **Program:** Let's Entreprise — Year 1
> **Last Updated:** 2026-03-02
> **Purpose:** Reference document for the system's data model, assessment framework, and import architecture.

---

## 1. System Overview

The Year 1 Assessment System is a **Next.js web application** backed by **Supabase (Postgres)**. It gives mentors a structured way to import and analyse multi-dimensional student assessment data, and gives students (and mentors) a visual per-student readiness dashboard.

### Architecture at a Glance

```
┌──────────────────────────────────────────────┐
│              ADMIN PANEL (/admin)            │
│                                              │
│  Import Wizard ──► Supabase Database         │
│  Assessment Logs                             │
│  Score Browsers (Mentor / Self / Peer)       │
│  Student & Project Management                │
│  Mentor Notes                                │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│         STUDENT DASHBOARD (/dashboard)       │
│                                              │
│  Per-student readiness profile               │
│  Progression over time (multi-project)       │
│  Peer feedback summary                       │
│  Term tracking (CBP / Conflexion / BOW)      │
│  Mentor notes feed                           │
└──────────────────────────────────────────────┘
```

### Data Flow

```
Excel / CSV File
      │
      ▼
Import Wizard (Admin UI)
  ├── File type auto-detected from filename keyword
  ├── Data parsed + previewed in browser
  ├── Name fuzzy-matched to student roster
  ├── Raw score range entered manually (for normalization)
  └── Committed → Supabase tables
             │
             ├── assessments (mentor / self scores)
             ├── peer_feedback
             ├── term_tracking
             ├── mentor_notes
             └── assessment_logs (audit trail)
```

---

## 2. Data Sources & Types

The system ingests **four types** of assessment data. All uploads go through the Import Wizard.

| Type | Filename Keyword | Target Table | Scale |
|------|-----------------|--------------|-------|
| **Mentor Assessment** | *(default)* | `assessments` (type='mentor') | 1–10 |
| **Self Assessment** | `Self` | `assessments` (type='self') | 1–5 or 1–10 |
| **Peer Feedback** | `Peer` | `peer_feedback` | 1–5 |
| **Term Report** | `Term` | `term_tracking` | Counts/credits |
| **Mentor Notes** | `Notes` | `mentor_notes` | Qualitative text |

> All scored data is **normalized to a 1–10 scale** at import time. The raw score range (min/max) is entered manually in the wizard per upload.

---

## 3. Project Sequence

Year 1 students go through a defined sequence of project modules. Each is assessed independently.

| Seq | Project | Groups Assessed | Has Mentor | Has Self | Has Peer |
|-----|---------|-----------------|------------|----------|----------|
| 1 | **Kickstart** | All (17) | ✅ | ❌ | ✅ |
| 2a | **Marketing** (Murder Mystery) | M-group (11) | ✅ | ❌ | ✅ |
| 2b | **Legacy** | L-group (6) | ✅ | ❌ | ✅ |
| 3 | **Business X-Ray** | All (17) | ✅ | ✅ | ❌ |
| 4 | **Accounts** | All (17) | ✅ | ✅ | ❌ |
| 5 | **SDP** (Service Design) | All (17) | ✅ | ✅ | ✅ |
| 6 | **Moonshine / SIDR** (Client) | All (17) | ❌ | ❌ | ❌ |

> **Seq 2 is concurrent:** The cohort split into M-group (Marketing) and L-group (Legacy). From Seq 3 onwards, all students are assessed together.

> **Moonshine/SIDR** are SDP client sub-projects; they have assessment *framework* metadata in `assessment_frameworks` but no scored data yet.

---

## 4. Assessment Framework — 6 Readiness Domains

Each student is evaluated across **6 domains**, each with **4 sub-parameters** (24 parameters total, with shorthand codes C1–P4). The framework is used uniformly across Mentor and Self assessments — scores are tied to a specific parameter via its `code`.

### Domains & Parameters

| Code | Domain | Parameter |
|------|--------|-----------|
| C1 | **Commercial** | Financial Literacy & Analysis |
| C2 | **Commercial** | Budgeting & Forecasting |
| C3 | **Commercial** | Accounting & Compliance |
| C4 | **Commercial** | Negotiation & Vendor Management |
| E1 | **Entrepreneurial** | Market Research & Opportunity Recognition |
| E2 | **Entrepreneurial** | Business Model & Lean Execution |
| E3 | **Entrepreneurial** | Sales & Outreach |
| E4 | **Entrepreneurial** | Networking & Pitching |
| M1 | **Marketing** | Content & Communication |
| M2 | **Marketing** | Sales Enablement |
| M3 | **Marketing** | Marketing Strategy & Execution |
| M4 | **Marketing** | Analysis & Optimization |
| I1 | **Innovation** | Ideation & Creativity |
| I2 | **Innovation** | Customer-Centered Insights |
| I3 | **Innovation** | Prototyping & Agile Development |
| I4 | **Innovation** | Business & System Mapping |
| O1 | **Operational** | Planning & Collaboration |
| O2 | **Operational** | Problem-Solving & Risk Management |
| O3 | **Operational** | Process & Project Management |
| O4 | **Operational** | Documentation & Reporting |
| P1 | **Professional** | Career Planning & Awareness |
| P2 | **Professional** | Professional Conduct & Ethics |
| P3 | **Professional** | Continuous Growth & Reflection |
| P4 | **Professional** | Networking & Presence |

> Not every project exercises every domain (e.g., Marketing Readiness is not scored in SDP). Null/unscored parameters are expected and by design.

---

## 5. Score Normalization

All scores are normalized to a **1–10 scale** at import time and stored as `normalized_score` in the `assessments` table alongside the raw value.

| Source | Raw Scale | Normalized to |
|--------|-----------|---------------|
| Mentor Assessment | 1–10 (typically) | 1–10 |
| Self Assessment | 1–4, 1–5, 1–10 | 1–10 |
| Peer Feedback | 1–5 | 1–10 |
| Term Report | Counts / credits | Stored as-is (Not normalized) |

**Formula (Linear Min-Max Interpolation):** 
`normalized = (raw - min) / (max - min) * 9 + 1`

> **Note:** The `min` and `max` values are stored in the `assessments` table row directly, or in the `assessment_logs.mapping_config` JSON block (for Peer Feedback). They are configured manually during the Import Wizard flow.
---

## 6. Student Roster

17 active students in the Year 1 cohort. Each student has a `canonical_name` and an `aliases` array in the `students` table to handle name variation across import files. The Import Wizard uses fuzzy matching against these aliases before committing data.

> One student (`Madhur Kalantri`) left the programme and is marked `is_active = FALSE` in the database. His data is ignored.

---

*For the database schema, see [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md).*
*For import file formatting rules, see [`DATA_IMPORT_RULES.md`](./DATA_IMPORT_RULES.md).*
*For a history of changes, see [`CHANGELOG.md`](./CHANGELOG.md).*
