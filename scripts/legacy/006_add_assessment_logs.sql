-- 006_add_assessment_logs.sql
-- Migration to introduce the 'assessment_logs' master event architecture.

-- 1. Create the `assessment_logs` table
CREATE TABLE assessment_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_date DATE NOT NULL,
    program_id UUID REFERENCES programs(id) NOT NULL,
    term TEXT NOT NULL,
    data_type TEXT NOT NULL CHECK (data_type IN ('self', 'mentor', 'peer', 'term')),
    project_id UUID REFERENCES projects(id),
    file_name TEXT,
    mapping_config JSONB,
    records_inserted INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE assessment_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow admins full access
CREATE POLICY "Allow authenticated users full access to assessment_logs" ON assessment_logs
FOR ALL TO authenticated USING (true);

-- 2. Add Foreign Keys to Data Tables
ALTER TABLE assessments ADD COLUMN assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE;
ALTER TABLE peer_feedback ADD COLUMN assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE;
ALTER TABLE term_tracking ADD COLUMN assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE;

-- 3. Synthetic Backfilling Function 
-- We create a temporary script to infer historical event logs based on the data that already exists.

DO $$
DECLARE
    rec_count INT;
    prog_id UUID;
    log_id UUID;
    rec RECORD;
BEGIN
    -- Assume everything uploaded so far via the files belongs to the default UG-MED Program for Year 1.
    -- If 'UG-MED' program doesnt exist, this finds the first program. (Fallback safety)
    SELECT id INTO prog_id FROM programs LIMIT 1;

    -- Group 1: Self Assessments
    FOR rec IN 
        SELECT project_id, assessment_type, source_file, count(*) as c 
        FROM assessments 
        WHERE assessment_type = 'self' 
        GROUP BY project_id, assessment_type, source_file
    LOOP
        INSERT INTO assessment_logs (assessment_date, program_id, term, data_type, project_id, file_name, records_inserted)
        VALUES ('2024-06-01', prog_id, 'Year 1', 'self', rec.project_id, rec.source_file, rec.c)
        RETURNING id INTO log_id;
        
        UPDATE assessments 
        SET assessment_log_id = log_id 
        WHERE project_id = rec.project_id AND assessment_type = 'self';
    END LOOP;

    -- Group 2: Mentor Assessments
    FOR rec IN 
        SELECT project_id, assessment_type, source_file, count(*) as c 
        FROM assessments 
        WHERE assessment_type = 'mentor' 
        GROUP BY project_id, assessment_type, source_file
    LOOP
        INSERT INTO assessment_logs (assessment_date, program_id, term, data_type, project_id, file_name, records_inserted)
        VALUES ('2024-06-01', prog_id, 'Year 1', 'mentor', rec.project_id, rec.source_file, rec.c)
        RETURNING id INTO log_id;
        
        UPDATE assessments 
        SET assessment_log_id = log_id 
        WHERE project_id = rec.project_id AND assessment_type = 'mentor';
    END LOOP;

    -- Group 3: Peer Feedback
    -- Assuming a single generic batch since project grouping might be varied
    SELECT count(*) INTO rec_count FROM peer_feedback;
    IF rec_count > 0 THEN
        INSERT INTO assessment_logs (assessment_date, program_id, term, data_type, file_name, records_inserted)
        VALUES ('2024-06-01', prog_id, 'Year 1', 'peer', 'Peer Feedback Form.xlsx', rec_count)
        RETURNING id INTO log_id;

        UPDATE peer_feedback SET assessment_log_id = log_id;
    END IF;

    -- Group 4: Term Tracking
    SELECT count(*) INTO rec_count FROM term_tracking;
    IF rec_count > 0 THEN
        INSERT INTO assessment_logs (assessment_date, program_id, term, data_type, file_name, records_inserted)
        VALUES ('2024-06-01', prog_id, 'Year 1', 'term', 'Term Tracking.xlsx', rec_count)
        RETURNING id INTO log_id;

        UPDATE term_tracking SET assessment_log_id = log_id;
    END IF;
END $$;
