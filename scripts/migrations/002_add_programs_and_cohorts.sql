-- 002_add_programs_and_cohorts.sql

-- 1. Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert the default program ('UG-MED')
INSERT INTO programs (name) VALUES ('UG-MED') ON CONFLICT (name) DO NOTHING;

-- 2. Update students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id),
ADD COLUMN IF NOT EXISTS cohort TEXT;

-- Set defaults for existing students
UPDATE students 
SET program_id = (SELECT id FROM programs WHERE name = 'UG-MED'),
    cohort = '2025'
WHERE program_id IS NULL;

-- 3. Update projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id),
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Set default program for existing projects
UPDATE projects 
SET program_id = (SELECT id FROM programs WHERE name = 'UG-MED')
WHERE program_id IS NULL;

-- 4. Update assessments table
ALTER TABLE assessments
ADD COLUMN IF NOT EXISTS assessment_framework_id UUID REFERENCES assessment_frameworks(id),
ADD COLUMN IF NOT EXISTS self_assessment_question_id UUID REFERENCES self_assessment_questions(id);
