-- 011_backfill_log_scales.sql

UPDATE assessment_logs l
SET mapping_config = COALESCE(l.mapping_config, '{}'::jsonb) || jsonb_build_object('raw_scale_max', COALESCE(
  (
    SELECT MAX(raw_scale_max)
    FROM assessments a
    WHERE a.assessment_log_id = l.id
  ),
  5 -- Fallback to 5 if no assessments found
))
WHERE (l.data_type = 'mentor' OR l.data_type = 'self')
  AND (l.mapping_config->>'raw_scale_max' IS NULL);
