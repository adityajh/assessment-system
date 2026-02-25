# Supabase Database Schema — Let's Entreprise Assessment System

> **Last Updated:** 2026-02-24  
> **Purpose:** Database structure for the per-student assessment dashboard and the automated input-to-dashboard tool.

---

## 1. Self-Assessment Question → Readiness Domain Mapping (DRAFT — For Review)

Before designing the schema, here is the proposed mapping of self-assessment questions to readiness domains and sub-parameters. **Please review and confirm/adjust before we finalize.**

### 1.1 Business X-Ray Self-Assessment (20 questions, Scale 1–5)

| Q# | Question (shortened) | → Readiness Domain | → Sub-Parameter |
|----|---------------------|-------------------|----------------|
| 1  | How confidently can I calculate and interpret key financial metrics like break-even, cost structure, and ROI? | **Commercial** | Financial Literacy & Analysis |
| 2  | How accurately was I able to estimate revenues, costs, and financial risks using field data and assumptions? | **Commercial** | Budgeting & Forecasting |
| 3  | How effectively did I communicate with owners/staff to gather accurate operational and financial information? | **Commercial** | Negotiation & Vendor Management |
| 4  | How well was I able to identify customer needs, frustrations, and emerging opportunities? | **Entrepreneurial** | Market Research & Opportunity Recognition |
| 5  | How clearly can I map and explain the business model (BMC) and identify what drives value? | **Entrepreneurial** | Business Model & Lean Execution |
| 6  | How confidently and clearly was I able to present insights and defend my analysis during the pitch? | **Entrepreneurial** | Networking & Pitching |
| 7  | How clearly and persuasively did I communicate complex insights in my slides, visuals, and presentation? | **Marketing** | Content & Communication |
| 8  | How well do I understand the target customers, competitive landscape, and external forces? | **Marketing** | Marketing Strategy & Execution |
| 9  | How effectively could I identify inefficiencies, risks, or optimization opportunities in the business? | **Marketing** | Analysis & Optimization |
| 10 | How creatively was I able to uncover deeper patterns or hidden levers affecting the business? | **Innovation** | Ideation & Creativity |
| 11 | How well did I understand customer behavior and translate it into meaningful insights? | **Innovation** | Customer-Centered Insights |
| 12 | How accurately and completely was I able to map the business system using strategy frameworks? | **Innovation** | Business & System Mapping |
| 13 | How effectively did I plan tasks and collaborate with my team to complete all project requirements? | **Operational** | Planning & Collaboration |
| 14 | How well was I able to identify key risks and explain business vulnerabilities? | **Operational** | Problem-Solving & Risk Management |
| 15 | How effectively did I analyze business processes and manage my workflow? | **Operational** | Process & Project Management |
| 16 | How thorough and well-organized was my documentation across all frameworks and deliverables? | **Operational** | Documentation & Reporting |
| 17 | How well can I explain the different roles, functions, and systems that make a business run? | **Commercial** | Accounting & Compliance |
| 18 | How professionally did I conduct myself during field visits, interviews, and team interactions? | **Professional** | Professional Conduct & Ethics |
| 19 | How deeply did I reflect on my learnings and apply feedback throughout the project? | **Professional** | Continuous Growth & Reflection |
| 20 | How confidently did I build rapport and ask meaningful questions to people involved in the business? | **Professional** | Networking & Presence |

**Summary by domain:**
- Commercial Readiness: Q1, Q2, Q3, Q17 (4 questions)
- Entrepreneurial Readiness: Q4, Q5, Q6 (3 questions)
- Marketing Readiness: Q7, Q8, Q9 (3 questions)
- Innovation Readiness: Q10, Q11, Q12 (3 questions)
- Operational Readiness: Q13, Q14, Q15, Q16 (4 questions)
- Professional Readiness: Q18, Q19, Q20 (3 questions)

> **Note:** Entrepreneurial is missing "Sales & Outreach" mapping. Marketing is missing "Sales Enablement" mapping. Professional is missing "Career Planning & Awareness" mapping. Innovation is missing "Prototyping & Agile Development". This is expected — the Business X-Ray project doesn't exercise every sub-parameter.

---

### 1.2 Accounting Project Self-Assessment (9 scored questions, Scale 1–10)

| Q# | Question (shortened) | → Readiness Domain | → Sub-Parameter |
|----|---------------------|-------------------|----------------|
| 1  | I can interpret financial statements and explain what they reveal about a business's health and performance. | **Commercial** | Financial Literacy & Analysis |
| 2  | I correctly applied accounting principles to record transactions and prepare financial statements. | **Commercial** | Accounting & Compliance |
| 3  | I understand how different business activities connect and reflect across financial statements as one system. | **Commercial** | Financial Literacy & Analysis |
| 4  | I identified accounting entries and recorded them with accuracy. | **Commercial** | Accounting & Compliance |
| 5  | I followed a structured process to complete accounting tasks. | **Operational** | Process & Project Management |
| 6  | I clearly documented my work and communicated accounting outcomes through statements and presentations. | **Operational** | Documentation & Reporting |
| 7  | I demonstrated honesty, responsibility, and professionalism while completing accounting work. | **Professional** | Professional Conduct & Ethics |
| 8  | I steadily improved my approach and applied my learning as the project progressed. | **Professional** | Continuous Growth & Reflection |
| 9  | I engaged professionally with mentors and asked meaningful questions during sessions. | **Professional** | Networking & Presence |

**Summary by domain:**
- Commercial Readiness: Q1, Q2, Q3, Q4 (4 questions)
- Operational Readiness: Q5, Q6 (2 questions)
- Professional Readiness: Q7, Q8, Q9 (3 questions)
- Entrepreneurial, Marketing, Innovation: Not assessed (expected — Accounts project focuses on commercial/operational/professional skills)

> **Note:** Q10 ("What is one specific skill or insight you gained?") is open-ended text — not scored. Can be stored as a qualitative note.

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
    description TEXT,                   -- 'Uses ratios, percentages, breakeven logic'
    param_number INT NOT NULL,          -- 1-4 within the domain
    UNIQUE(domain_id, param_number)
);
```

---

#### `assessments`
The core data table. Stores every individual score: mentor OR self, per student × project × parameter.

```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    project_id UUID NOT NULL REFERENCES projects(id),
    parameter_id UUID NOT NULL REFERENCES readiness_parameters(id),
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('mentor', 'self')),
    assessment_framework_id UUID REFERENCES assessment_frameworks(id),
    self_assessment_question_id UUID REFERENCES self_assessment_questions(id),
    raw_score NUMERIC,                  -- original score as entered
    raw_scale_min INT,                  -- 1 (for all scales)
    raw_scale_max INT,                  -- 5 or 10 depending on source
    normalized_score NUMERIC,           -- normalized to 1-10 scale
    source_file TEXT,                   -- which Excel file this came from
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, project_id, parameter_id, assessment_type)
);

-- Normalization formula: normalized = (raw - raw_min) / (raw_max - raw_min) * 9 + 1
-- This maps any scale to 1-10.
-- Example: Business X-Ray score of 4 (on 1-5 scale) → (4-1)/(5-1)*9+1 = 7.75
```

---

#### `peer_feedback`
Individual peer-to-peer feedback entries.

```sql
CREATE TABLE peer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES students(id),
    giver_id UUID NOT NULL REFERENCES students(id),
    project_id UUID NOT NULL REFERENCES projects(id),
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
CBP, Conflexion, BOW per student.

```sql
CREATE TABLE term_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    cbp_count INT DEFAULT 0,
    conflexion_count INT DEFAULT 0,
    bow_score NUMERIC DEFAULT 0.0,
    term TEXT DEFAULT 'Year 1',         -- for future multi-year support
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, term)
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
    UNIQUE(project_id, question_order)
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
