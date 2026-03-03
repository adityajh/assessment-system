# Supabase Database Schema — Let's Entreprise Assessment System

> **Last Updated:** 2026-03-02
> **Purpose:** Definitive reference for the database architecture of the Assessment System.

---

## 1. Self-Assessment Question Mapping

Question → readiness parameter mappings are **not hardcoded** in this document. They are stored dynamically in the `self_assessment_questions` table, which links each upload's question text to the appropriate `readiness_parameters` row.

This allows different projects to have different question sets, and the Import Wizard to accept any compliant self-assessment file without code changes.

> See [`DATA_IMPORT_RULES.md`](./DATA_IMPORT_RULES.md) for the required `Question` / `Prompt` column format.

---

## 2. Supabase Database Schema

### 2.1 Entity-Relationship Overview

```
┌──────────┐      ┌──────────────┐      ┌─────────────────────┐
│ students │──┐   │   projects   │──┐   │  readiness_domains  │
└──────────┘  │   └──────────────┘  │   └─────────────────────┘
              │                     │              │
              │                     │              │
              │   ┌─────────────────────────────────────┐
              │   │       readiness_parameters          │
              │   │  (FK → readiness_domains)            │
              │   └─────────────────────────────────────┘
              │                     │              │
     ┌────────┴─────────────────────┴──────────────┘
     │
     ▼
┌─────────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│    assessments      │    │   peer_feedback     │    │  term_tracking   │
│ (student × project  │    │ (recipient × giver  │    │ (student level)  │
│  × parameter × type)│    │  × project)         │    │                  │
└─────────────────────┘    └─────────────────────┘    └──────────────────┘
            │                         │                        │
            ▼                         ▼                        ▼
     ┌────────────────────────────────────────────────────────────┐
     │                      assessment_logs                       │
     │      (Master Import Event: type × program × project)       │
     └────────────────────────────────────────────────────────────┘

┌─────────────────────┐    ┌─────────────────────────────┐
│   mentor_notes      │    │  self_assessment_questions   │
│ (student × project) │    │  (question → parameter map)  │
└─────────────────────┘    └─────────────────────────────┘

┌──────────────────────────┐
│  assessment_frameworks   │
│ (project × parameter     │
│  assessability metadata) │
└──────────────────────────┘
```

### 2.2 Table Definitions

#### `programs`
The programs run by the school (e.g. UG-MED).

```sql
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### `students`
The canonical student roster.

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number INT NOT NULL UNIQUE,
    canonical_name TEXT NOT NULL UNIQUE,
    aliases TEXT[] DEFAULT '{}',      -- all known name variations for matching
    program_id UUID REFERENCES programs(id),
    cohort TEXT,                      -- e.g. '2025'
    is_active BOOLEAN DEFAULT TRUE,   -- FALSE for students like Madhur who left
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Example data:
-- (1, 'Aadi Gujar', ARRAY['Adi Gujar M', 'Aadi Gujar'], TRUE)
-- (18, 'Madhur Kalantri', ARRAY['Madhur Kalantri'], FALSE)
```

---

#### `projects`
All project modules in sequence.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,              -- 'Kickstart', 'Marketing', 'Legacy', etc.
    internal_name TEXT,                      -- 'Murder Mystery' for Marketing
    sequence INT NOT NULL,                   -- 1, 2, 2, 3, 4, 5, 6
    sequence_label TEXT NOT NULL,            -- '1', '2a', '2b', '3', '4', '5', '6'
    is_concurrent BOOLEAN DEFAULT FALSE,     -- TRUE for Marketing & Legacy
    concurrent_group TEXT,                   -- 'M' or 'L' (NULL if not concurrent)
    project_type TEXT NOT NULL DEFAULT 'standard',  -- 'standard' or 'client'
    parent_project_id UUID REFERENCES projects(id), -- Moonshine/SIDR → SDP
    program_id UUID REFERENCES programs(id),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### `readiness_domains`
The 6 readiness domains.

```sql
CREATE TABLE readiness_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- 'Commercial Readiness', etc.
    short_name TEXT NOT NULL UNIQUE,    -- 'commercial', 'entrepreneurial', etc.
    display_order INT NOT NULL          -- 1-6
);
```

---

#### `readiness_parameters`
The 24 sub-parameters (4 per domain).

```sql
CREATE TABLE readiness_parameters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES readiness_domains(id),
    name TEXT NOT NULL,                 -- 'Financial Literacy & Analysis'
    code TEXT,                          -- 'C1', 'E2', 'M4', etc.
    description TEXT,                   -- 'Uses ratios, percentages, breakeven logic'
    param_number INT NOT NULL,          -- 1-4 within the domain
    UNIQUE(domain_id, param_number)
);
```

---

#### `assessment_logs` (NEW - Phase 9)
Master table tracking discrete data import events, allowing tracebacks of bulk assessment data.

```sql
CREATE TABLE assessment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_date DATE NOT NULL,
    program_id UUID REFERENCES programs(id) NOT NULL,
    term TEXT NOT NULL,
    cohort TEXT,
    data_type TEXT NOT NULL CHECK (data_type IN ('self', 'mentor', 'peer', 'term', 'mentor_notes')),
    project_id UUID REFERENCES projects(id),
    file_name TEXT,
    mapping_config JSONB,             -- Stores raw_scale_max, question mappings, etc.
    records_inserted INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now() -- Used as "Upload Date" in UI
);
```

---

#### `assessments`
The core data table. Stores every individual score: mentor OR self, per student × project × parameter. Links to `assessment_logs` for auditability.

```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    parameter_id UUID NOT NULL REFERENCES readiness_parameters(id),
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('mentor', 'self')),
    assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE,
    assessment_framework_id UUID REFERENCES assessment_frameworks(id),
    self_assessment_question_id UUID REFERENCES self_assessment_questions(id),
    raw_score NUMERIC,                  -- original score as entered
    raw_scale_min INT,                  -- 1 (default)
    raw_scale_max INT,                  -- Captured from Import Wizard input
    normalized_score NUMERIC,           -- normalized to 1-10 scale
    source_file TEXT,                   -- which Excel file this came from (legacy)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, project_id, parameter_id, assessment_type)
);

-- Normalization formula: normalized = (raw - raw_min) / (raw_max - raw_min) * 9 + 1
-- Implementation detail: raw_max is retrieved from the associated assessment_log's mapping_config or the assessment row itself.
-- Performance Note: Frontend queries for mentor/self assessments are currently limited to 5000 rows to ensure full visibility as data scales.
```

---

#### `peer_feedback`
Individual peer-to-peer feedback entries. Links to `assessment_logs` for auditability.

```sql
CREATE TABLE peer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES students(id),
    giver_id UUID NOT NULL REFERENCES students(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE,
    quality_of_work INT CHECK (quality_of_work BETWEEN 1 AND 5),
    initiative_ownership INT CHECK (initiative_ownership BETWEEN 1 AND 5),
    communication INT CHECK (communication BETWEEN 1 AND 5),
    collaboration INT CHECK (collaboration BETWEEN 1 AND 5),
    growth_mindset INT CHECK (growth_mindset BETWEEN 1 AND 5),
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(recipient_id, giver_id, project_id)
);
```

---

#### `term_tracking`
CBP, Conflexion, BOW per student. Links to `assessment_logs` for auditability.

```sql
CREATE TABLE term_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE,
    cbp_count INT DEFAULT 0,
    conflexion_count INT DEFAULT 0,
    bow_score NUMERIC DEFAULT 0.0,
    term TEXT DEFAULT 'Year 1',         -- for future multi-year support
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, term, assessment_log_id)
);
```

---

#### `mentor_notes`
Free-text notes from mentors, optionally tied to a project.

```sql
CREATE TABLE mentor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    project_id UUID REFERENCES projects(id),   -- NULL = general note, not project-specific
    note_text TEXT NOT NULL,
    note_type TEXT DEFAULT 'general',           -- 'general', 'strength', 'improvement', etc.
    created_by TEXT,                             -- mentor name
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

#### `self_assessment_questions`
Maps verbose form questions to readiness parameters (the mapping from Section 1).

```sql
CREATE TABLE self_assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    question_order INT NOT NULL,
    question_text TEXT NOT NULL,
    parameter_id UUID NOT NULL REFERENCES readiness_parameters(id),
    rating_scale_min INT NOT NULL DEFAULT 1,
    rating_scale_max INT NOT NULL,               -- 5 or 10
    is_open_ended BOOLEAN DEFAULT FALSE,         -- TRUE for text questions
    assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE,
    UNIQUE(assessment_log_id, parameter_id)
);
```

---

#### `assessment_frameworks`
Rich metadata from SDP/Accounts/Client tabs: what CAN be assessed per project and how.

```sql
CREATE TABLE assessment_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id),
    parameter_id UUID NOT NULL REFERENCES readiness_parameters(id),
    assessability_status TEXT,          -- 'Assessed', 'Partially Assessed', 'Not Assessed'
    evidence_description TEXT,          -- what evidence is used
    assessment_logic TEXT,              -- why / why not
    self_evaluation_question TEXT,      -- question posed to students
    client_evaluation_question TEXT,    -- question posed to client (Moonshine/SIDR)
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, parameter_id)
);
```

---

### 2.3 Database Views (for Dashboard Queries)

These views pre-compute the aggregations needed by the dashboard.

#### `v_domain_scores` — Domain-level scores per student × project × type

```sql
CREATE VIEW v_domain_scores AS
SELECT
    a.student_id,
    s.canonical_name AS student_name,
    a.project_id,
    p.name AS project_name,
    p.sequence,
    p.sequence_label,
    a.assessment_type,
    rd.name AS domain_name,
    rd.short_name AS domain_short,
    rd.display_order,
    ROUND(AVG(a.normalized_score), 2) AS domain_score,
    COUNT(a.normalized_score) AS params_scored
FROM assessments a
JOIN students s ON s.id = a.student_id
JOIN projects p ON p.id = a.project_id
JOIN readiness_parameters rp ON rp.id = a.parameter_id
JOIN readiness_domains rd ON rd.id = rp.domain_id
WHERE a.normalized_score IS NOT NULL
GROUP BY a.student_id, s.canonical_name, a.project_id, p.name, p.sequence,
         p.sequence_label, a.assessment_type, rd.name, rd.short_name, rd.display_order;
```

#### `v_peer_feedback_summary` — Averaged peer feedback per student × project

```sql
CREATE VIEW v_peer_feedback_summary AS
SELECT
    pf.recipient_id AS student_id,
    s.canonical_name AS student_name,
    pf.project_id,
    p.name AS project_name,
    p.sequence,
    COUNT(*) AS feedback_count,
    ROUND(AVG(pf.quality_of_work), 2) AS avg_quality_of_work,
    ROUND(AVG(pf.initiative_ownership), 2) AS avg_initiative_ownership,
    ROUND(AVG(pf.communication), 2) AS avg_communication,
    ROUND(AVG(pf.collaboration), 2) AS avg_collaboration,
    ROUND(AVG(pf.growth_mindset), 2) AS avg_growth_mindset,
    ROUND(AVG(
        (pf.quality_of_work + pf.initiative_ownership + pf.communication +
         pf.collaboration + pf.growth_mindset)::NUMERIC / 5
    ), 2) AS avg_overall
FROM peer_feedback pf
JOIN students s ON s.id = pf.recipient_id
JOIN projects p ON p.id = pf.project_id
GROUP BY pf.recipient_id, s.canonical_name, pf.project_id, p.name, p.sequence;
```

#### `v_student_dashboard` — Full student profile for the dashboard

```sql
CREATE VIEW v_student_dashboard AS
SELECT
    s.id AS student_id,
    s.student_number,
    s.canonical_name,
    t.cbp_count,
    t.conflexion_count,
    t.bow_score
FROM students s
LEFT JOIN term_tracking t ON t.student_id = s.id
WHERE s.is_active = TRUE;
```

---

## 3. How Dashboard Elements Map to Schema

| Dashboard Element | Source Table(s) | Query Pattern |
|-------------------|----------------|---------------|
| **1. Self + Mentor assessment (project × domain)** | `assessments` → `v_domain_scores` | Filter by `student_id`, group by `project`, `domain`, `assessment_type` |
| **2. Project-wise peer feedback** | `peer_feedback` → `v_peer_feedback_summary` | Filter by `student_id` (as recipient), group by `project` |
| **3. Industry project assessments (self + mentor)** | `assessments` (where project = Moonshine/SIDR) + `assessment_frameworks` | Filter by `student_id` + `project_type = 'client'` |
| **4. CBP count** | `term_tracking` | Direct lookup by `student_id` |
| **5. Conflexion count** | `term_tracking` | Direct lookup by `student_id` |
| **6. BOW score** | `term_tracking` | Direct lookup by `student_id` |
| **7. Note from mentors** | `mentor_notes` | Filter by `student_id`, optionally by `project_id` |

---

## 4. Data Import Strategy

When the automated tool ingests input Excel sheets, here's how each maps to the schema:

| Input Source | Target Table | Transform Notes |
|-------------|-------------|-----------------|
| Assessment Matrix (all project tabs) | `assessments` (type='mentor') | Strip M/L suffixes from names → match via `students.aliases` |
| Business X-Ray Responses | `assessments` (type='self') | Use question mapping → `readiness_parameters`; normalize 1–5 → 1–10 |
| Accounting Self-Assessment | `assessments` (type='self') | Use question mapping → `readiness_parameters`; already on 1–10 scale |
| Peer Feedback (metrics tab) | `peer_feedback` | Trim project name whitespace; match names via `students.aliases` |
| Term Report | `term_tracking` | Direct mapping |
| Moonshine/SIDR Client tabs | `assessment_frameworks` | Metadata only (no student scores yet) |
| SDP/Accounts "Assessable?" columns | `assessment_frameworks` | Enriches framework metadata |

---

## 5. Row-Level Security (RLS) — Suggested

```sql
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE term_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;

-- For now: allow all authenticated users to read everything
-- (tighten later if student-specific access is needed)
CREATE POLICY "Allow authenticated read" ON students
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON assessments
    FOR SELECT TO authenticated USING (true);

-- Mentors can insert/update notes
CREATE POLICY "Mentors can manage notes" ON mentor_notes
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

*This schema is designed to be extensible for future years, additional projects, and new assessment types.*
