-- Fix RLS Policies for the Data Importer
-- Allow anon and authenticated roles to INSERT and SELECT records in assessment-related tables

DO $$
BEGIN
    -- 1. assessment_logs
    ALTER TABLE assessment_logs ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_logs' AND policyname = 'Allow anon insert logs') THEN
        CREATE POLICY "Allow anon insert logs" ON assessment_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_logs' AND policyname = 'Allow anon select logs') THEN
        CREATE POLICY "Allow anon select logs" ON assessment_logs FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- 2. assessments
    ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Allow anon insert assessments') THEN
        CREATE POLICY "Allow anon insert assessments" ON assessments FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Allow anon select assessments') THEN
        CREATE POLICY "Allow anon select assessments" ON assessments FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- 3. peer_feedback
    ALTER TABLE peer_feedback ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'peer_feedback' AND policyname = 'Allow anon insert peer') THEN
        CREATE POLICY "Allow anon insert peer" ON peer_feedback FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'peer_feedback' AND policyname = 'Allow anon select peer') THEN
        CREATE POLICY "Allow anon select peer" ON peer_feedback FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- 4. term_tracking
    ALTER TABLE term_tracking ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'term_tracking' AND policyname = 'Allow anon insert term') THEN
        CREATE POLICY "Allow anon insert term" ON term_tracking FOR INSERT TO anon, authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'term_tracking' AND policyname = 'Allow anon select term') THEN
        CREATE POLICY "Allow anon select term" ON term_tracking FOR SELECT TO anon, authenticated USING (true);
    END IF;
END $$;
