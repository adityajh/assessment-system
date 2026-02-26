-- scripts/009_fix_rls_for_delete_and_update.sql

DO $$
BEGIN
    -- 1. assessment_logs
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_logs' AND policyname = 'Allow anon delete logs') THEN
        CREATE POLICY "Allow anon delete logs" ON assessment_logs FOR DELETE TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_logs' AND policyname = 'Allow anon update logs') THEN
        CREATE POLICY "Allow anon update logs" ON assessment_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 2. assessments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Allow anon delete assessments') THEN
        CREATE POLICY "Allow anon delete assessments" ON assessments FOR DELETE TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Allow anon update assessments') THEN
        CREATE POLICY "Allow anon update assessments" ON assessments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 3. peer_feedback
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'peer_feedback' AND policyname = 'Allow anon delete peer') THEN
        CREATE POLICY "Allow anon delete peer" ON peer_feedback FOR DELETE TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'peer_feedback' AND policyname = 'Allow anon update peer') THEN
        CREATE POLICY "Allow anon update peer" ON peer_feedback FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

    -- 4. term_tracking
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'term_tracking' AND policyname = 'Allow anon delete term') THEN
        CREATE POLICY "Allow anon delete term" ON term_tracking FOR DELETE TO anon, authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'term_tracking' AND policyname = 'Allow anon update term') THEN
        CREATE POLICY "Allow anon update term" ON term_tracking FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
    END IF;

END $$;
