-- ============================================================
-- LET'S ENTREPRISE — ASSESSMENT SYSTEM SCHEMA
-- Migration: 001_schema.sql
-- ============================================================

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE IF NOT EXISTS students (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_number  INT NOT NULL UNIQUE,
    canonical_name  TEXT NOT NULL UNIQUE,
    aliases         TEXT[] DEFAULT '{}',
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS projects (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL UNIQUE,
    internal_name       TEXT,
    sequence            INT NOT NULL,
    sequence_label      TEXT NOT NULL,
    is_concurrent       BOOLEAN DEFAULT FALSE,
    concurrent_group    TEXT,
    project_type        TEXT NOT NULL DEFAULT 'standard',
    parent_project_id   UUID REFERENCES projects(id),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS readiness_domains (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL UNIQUE,
    short_name      TEXT NOT NULL UNIQUE,
    display_order   INT NOT NULL
);

CREATE TABLE IF NOT EXISTS readiness_parameters (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id       UUID NOT NULL REFERENCES readiness_domains(id),
    name            TEXT NOT NULL,
    description     TEXT,
    param_number    INT NOT NULL,
    UNIQUE(domain_id, param_number)
);

CREATE TABLE IF NOT EXISTS assessments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id),
    project_id          UUID NOT NULL REFERENCES projects(id),
    parameter_id        UUID NOT NULL REFERENCES readiness_parameters(id),
    assessment_type     TEXT NOT NULL CHECK (assessment_type IN ('mentor', 'self')),
    raw_score           NUMERIC,
    raw_scale_min       INT DEFAULT 1,
    raw_scale_max       INT,
    normalized_score    NUMERIC,
    source_file         TEXT,
    created_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, project_id, parameter_id, assessment_type)
);

CREATE TABLE IF NOT EXISTS peer_feedback (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id         UUID NOT NULL REFERENCES students(id),
    giver_id             UUID NOT NULL REFERENCES students(id),
    project_id           UUID NOT NULL REFERENCES projects(id),
    quality_of_work      INT CHECK (quality_of_work BETWEEN 1 AND 5),
    initiative_ownership INT CHECK (initiative_ownership BETWEEN 1 AND 5),
    communication        INT CHECK (communication BETWEEN 1 AND 5),
    collaboration        INT CHECK (collaboration BETWEEN 1 AND 5),
    growth_mindset       INT CHECK (growth_mindset BETWEEN 1 AND 5),
    submitted_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT now(),
    UNIQUE(recipient_id, giver_id, project_id)
);

CREATE TABLE IF NOT EXISTS term_tracking (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL REFERENCES students(id),
    cbp_count           INT DEFAULT 0,
    conflexion_count    INT DEFAULT 0,
    bow_score           NUMERIC DEFAULT 0.0,
    term                TEXT DEFAULT 'Year 1',
    updated_at          TIMESTAMPTZ DEFAULT now(),
    UNIQUE(student_id, term)
);

CREATE TABLE IF NOT EXISTS mentor_notes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id  UUID NOT NULL REFERENCES students(id),
    project_id  UUID REFERENCES projects(id),
    note_text   TEXT NOT NULL,
    note_type   TEXT DEFAULT 'general',
    created_by  TEXT,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS self_assessment_questions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id          UUID NOT NULL REFERENCES projects(id),
    question_order      INT NOT NULL,
    question_text       TEXT NOT NULL,
    parameter_id        UUID NOT NULL REFERENCES readiness_parameters(id),
    rating_scale_min    INT NOT NULL DEFAULT 1,
    rating_scale_max    INT NOT NULL,
    is_open_ended       BOOLEAN DEFAULT FALSE,
    UNIQUE(project_id, question_order)
);

CREATE TABLE IF NOT EXISTS assessment_frameworks (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id                  UUID NOT NULL REFERENCES projects(id),
    parameter_id                UUID NOT NULL REFERENCES readiness_parameters(id),
    assessability_status        TEXT,
    evidence_description        TEXT,
    assessment_logic            TEXT,
    self_evaluation_question    TEXT,
    client_evaluation_question  TEXT,
    created_at                  TIMESTAMPTZ DEFAULT now(),
    UNIQUE(project_id, parameter_id)
);


-- ============================================================
-- VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_domain_scores AS
SELECT
    a.student_id,
    s.canonical_name                        AS student_name,
    a.project_id,
    p.name                                  AS project_name,
    p.sequence,
    p.sequence_label,
    a.assessment_type,
    rd.name                                 AS domain_name,
    rd.short_name                           AS domain_short,
    rd.display_order,
    ROUND(AVG(a.normalized_score), 2)       AS domain_score,
    COUNT(a.normalized_score)               AS params_scored
FROM assessments a
JOIN students s          ON s.id = a.student_id
JOIN projects p          ON p.id = a.project_id
JOIN readiness_parameters rp ON rp.id = a.parameter_id
JOIN readiness_domains rd    ON rd.id = rp.domain_id
WHERE a.normalized_score IS NOT NULL
GROUP BY
    a.student_id, s.canonical_name,
    a.project_id, p.name, p.sequence, p.sequence_label,
    a.assessment_type,
    rd.name, rd.short_name, rd.display_order;


CREATE OR REPLACE VIEW v_peer_feedback_summary AS
SELECT
    pf.recipient_id                 AS student_id,
    s.canonical_name                AS student_name,
    pf.project_id,
    p.name                          AS project_name,
    p.sequence,
    COUNT(*)                        AS feedback_count,
    ROUND(AVG(pf.quality_of_work), 2)       AS avg_quality_of_work,
    ROUND(AVG(pf.initiative_ownership), 2)  AS avg_initiative_ownership,
    ROUND(AVG(pf.communication), 2)         AS avg_communication,
    ROUND(AVG(pf.collaboration), 2)         AS avg_collaboration,
    ROUND(AVG(pf.growth_mindset), 2)        AS avg_growth_mindset,
    ROUND(AVG(
        (pf.quality_of_work + pf.initiative_ownership + pf.communication
         + pf.collaboration + pf.growth_mindset)::NUMERIC / 5
    ), 2)                           AS avg_overall
FROM peer_feedback pf
JOIN students s  ON s.id = pf.recipient_id
JOIN projects p  ON p.id = pf.project_id
GROUP BY pf.recipient_id, s.canonical_name, pf.project_id, p.name, p.sequence;


CREATE OR REPLACE VIEW v_student_dashboard AS
SELECT
    s.id                AS student_id,
    s.student_number,
    s.canonical_name,
    t.cbp_count,
    t.conflexion_count,
    t.bow_score
FROM students s
LEFT JOIN term_tracking t ON t.student_id = s.id AND t.term = 'Year 1'
WHERE s.is_active = TRUE;


-- ============================================================
-- SEED DATA — Reference tables
-- ============================================================

-- Projects (in confirmed sequence)
INSERT INTO projects (name, internal_name, sequence, sequence_label, is_concurrent, concurrent_group, project_type) VALUES
    ('Kickstart',      NULL,              1, '1',  FALSE, NULL, 'standard'),
    ('Marketing',      'Murder Mystery',  2, '2a', TRUE,  'M',  'standard'),
    ('Legacy',         NULL,              2, '2b', TRUE,  'L',  'standard'),
    ('Business X-Ray', NULL,              3, '3',  FALSE, NULL, 'standard'),
    ('Accounts',       NULL,              4, '4',  FALSE, NULL, 'standard'),
    ('SDP',            'Service Design Project', 5, '5', FALSE, NULL, 'standard')
ON CONFLICT (name) DO NOTHING;

-- Client projects (parented to SDP)
INSERT INTO projects (name, internal_name, sequence, sequence_label, is_concurrent, concurrent_group, project_type, parent_project_id)
SELECT 'Moonshine', NULL, 6, '6a', TRUE, NULL, 'client', id FROM projects WHERE name = 'SDP'
ON CONFLICT (name) DO NOTHING;

INSERT INTO projects (name, internal_name, sequence, sequence_label, is_concurrent, concurrent_group, project_type, parent_project_id)
SELECT 'SIDR', NULL, 6, '6b', TRUE, NULL, 'client', id FROM projects WHERE name = 'SDP'
ON CONFLICT (name) DO NOTHING;


-- Readiness Domains
INSERT INTO readiness_domains (name, short_name, display_order) VALUES
    ('Commercial Readiness',       'commercial',      1),
    ('Entrepreneurial Readiness',  'entrepreneurial', 2),
    ('Marketing Readiness',        'marketing',       3),
    ('Innovation Readiness',       'innovation',      4),
    ('Operational Readiness',      'operational',     5),
    ('Professional Readiness',     'professional',    6)
ON CONFLICT (name) DO NOTHING;


-- Readiness Parameters (24 total — 4 per domain)
DO $$
DECLARE
    comm_id UUID; entr_id UUID; mktg_id UUID;
    inno_id UUID; oper_id UUID; prof_id UUID;
BEGIN
    SELECT id INTO comm_id FROM readiness_domains WHERE short_name = 'commercial';
    SELECT id INTO entr_id FROM readiness_domains WHERE short_name = 'entrepreneurial';
    SELECT id INTO mktg_id FROM readiness_domains WHERE short_name = 'marketing';
    SELECT id INTO inno_id FROM readiness_domains WHERE short_name = 'innovation';
    SELECT id INTO oper_id FROM readiness_domains WHERE short_name = 'operational';
    SELECT id INTO prof_id FROM readiness_domains WHERE short_name = 'professional';

    INSERT INTO readiness_parameters (domain_id, name, description, param_number) VALUES
        -- Commercial
        (comm_id, 'Financial Literacy & Analysis',    'Uses ratios, percentages, breakeven logic',                         1),
        (comm_id, 'Budgeting & Forecasting',          'Prepares budgets, forecasts, business plans',                       2),
        (comm_id, 'Accounting & Compliance',          'Double-entry, balance sheets, contracts',                           3),
        (comm_id, 'Negotiation & Vendor Management',  'Research, negotiation, cost/value optimisation',                    4),
        -- Entrepreneurial
        (entr_id, 'Market Research & Opportunity Recognition', 'Studies industries, identifies customer needs, spots opportunities', 1),
        (entr_id, 'Business Model & Lean Execution',           'Applies lean start-up, uses strengths/resources, develops strategies', 2),
        (entr_id, 'Sales & Outreach',                          'Drives outreach, sales, and business development',          3),
        (entr_id, 'Networking & Pitching',                     'Builds connections, pitches persuasively, asks meaningful questions', 4),
        -- Marketing
        (mktg_id, 'Content & Communication',          'Creates persuasive copies, messaging plans, and brand communication', 1),
        (mktg_id, 'Sales Enablement',                 'Engages in outbound calls, prospecting, and targeting customers',   2),
        (mktg_id, 'Marketing Strategy & Execution',   'Designs lead generation, go-to-market strategies',                  3),
        (mktg_id, 'Analysis & Optimization',          'Runs analysis to refine marketing and sales funnel performance',    4),
        -- Innovation
        (inno_id, 'Ideation & Creativity',            'Applies brainstorming, mood boarding, and design briefs',           1),
        (inno_id, 'Customer-Centered Insights',       'Develops personas, conducts interviews, maps customer journeys',    2),
        (inno_id, 'Prototyping & Agile Development',  'Builds prototypes and applies agile methods',                       3),
        (inno_id, 'Business & System Mapping',        'Creates business model canvases and maps supply chains',            4),
        -- Operational
        (oper_id, 'Planning & Collaboration',         'Defines roles, plans teamwork, manages client expectations',        1),
        (oper_id, 'Problem-Solving & Risk Management','Anticipates challenges, creates contingency plans',                  2),
        (oper_id, 'Process & Project Management',     'Uses tools, flowcharts, and automation for efficiency',             3),
        (oper_id, 'Documentation & Reporting',        'Communicates progress, writes guides, ensures transparency',        4),
        -- Professional
        (prof_id, 'Career Planning & Awareness',      'Makes career decisions based on self-awareness',                    1),
        (prof_id, 'Professional Conduct & Ethics',    'Demonstrates professionalism, accountability, ethical behavior',    2),
        (prof_id, 'Continuous Growth & Reflection',   'Practices self-reflection, seeks improvement',                      3),
        (prof_id, 'Networking & Presence',            'Builds relationships, engages with mentors, maintains professional presence', 4)
    ON CONFLICT (domain_id, param_number) DO NOTHING;
END $$;


-- Students (17 active + 1 inactive)
INSERT INTO students (student_number, canonical_name, aliases, is_active) VALUES
    (1,  'Aadi Gujar',           ARRAY['Adi Gujar M', 'Aadi Gujar', 'Aadi Gujar'],                     TRUE),
    (2,  'Aditya Singhal',       ARRAY['Aditya Singhal L', 'Aditya Singhal ', 'Aditya Singhal'],        TRUE),
    (3,  'Adityaraj Shetty',     ARRAY['Adityaraj M', 'Adityaraj Shetty'],                              TRUE),
    (4,  'Advait Sureshbabu',    ARRAY['Advait M', 'Advait Sureshbabu ', 'Advait Sureshbabu'],          TRUE),
    (5,  'Ameya Kanchar',        ARRAY['Ameya M', 'Ameya Kanchar'],                                     TRUE),
    (6,  'Archit Gupta',         ARRAY['Archit L', 'Archit Gupta '],                                    TRUE),
    (7,  'Arha Doijode',         ARRAY['Arha M', 'Arha doijode', 'Arha Doijode'],                       TRUE),
    (8,  'Arnee Parmar',         ARRAY['Arnee L', 'Arnee Parmar', 'Arnee Dipakkumar Parmar'],           TRUE),
    (9,  'Diyansh Bafna',        ARRAY['Diyansh L', 'Diyansh', 'Diyansh Bafna'],                        TRUE),
    (10, 'Husain Nasikwala',     ARRAY['Hussain M', 'Husain Nasikwala ', 'Husain Nasikwala'],           TRUE),
    (11, 'Idris Dhariwala',      ARRAY['Idris L', 'idris dhariwala', 'Idris Dhariwala'],                TRUE),
    (12, 'Jasper Jovi Dias',     ARRAY['Jasper M', 'Jasper Jovi Dias', 'Jasper Dias'],                  TRUE),
    (13, 'Kunal Jeswani',        ARRAY['Kunal M', 'Kunal Jeswani'],                                     TRUE),
    (14, 'Moiz Lakdawala',       ARRAY['Moiz M', 'Moiz Lakdawala'],                                     TRUE),
    (15, 'Rudrasen Mahale',      ARRAY['Rudrasen M', 'Rudrasen', 'Rudrasen Mahale'],                    TRUE),
    (16, 'Saumyaa Gupta',        ARRAY['Saumyaa M', 'Saumyaa Gupta '],                                  TRUE),
    (17, 'Zainab Khandwawala',   ARRAY['Zainab L', 'Zainab Khandwawala'],                               TRUE),
    (18, 'Madhur Kalantri',      ARRAY['Madhur Kalantri'],                                              FALSE)
ON CONFLICT (student_number) DO NOTHING;
