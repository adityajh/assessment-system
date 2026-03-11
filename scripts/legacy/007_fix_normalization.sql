-- ============================================================
-- 007: Fix Score Normalization & Add Peer Feedback Scoring
-- ============================================================
-- Run in Supabase SQL Editor

-- STEP 1: Fix self-assessment scores where normalized_score > 10
-- The formula should be: (raw_score / raw_scale_max) * 10
-- But some rows were incorrectly stored as raw_score * (10 / 5) = doubled
UPDATE assessments
SET normalized_score = ROUND((raw_score / raw_scale_max::numeric) * 10, 2)
WHERE assessment_type = 'self'
  AND normalized_score > 10
  AND raw_scale_max IS NOT NULL
  AND raw_scale_max > 0;

-- STEP 2: Also normalize ALL self-assessment scores consistently
-- (recalculate all to ensure they are correctly on a 1-10 scale)
UPDATE assessments
SET normalized_score = ROUND((raw_score / raw_scale_max::numeric) * 10, 2)
WHERE assessment_type = 'self'
  AND raw_scale_max IS NOT NULL
  AND raw_scale_max > 0;

-- STEP 3: Add normalized_avg column to peer_feedback (average of 5 dimensions on 1-10 scale)
ALTER TABLE peer_feedback
ADD COLUMN IF NOT EXISTS normalized_avg NUMERIC(4,2)
GENERATED ALWAYS AS (
    ROUND(
        (quality_of_work + initiative_ownership + communication + collaboration + growth_mindset)::numeric
        / 5.0,
    2)
) STORED;

-- STEP 4: Verify the fix
SELECT
    assessment_type,
    COUNT(*) as total,
    MIN(normalized_score) as min_norm,
    MAX(normalized_score) as max_norm,
    COUNT(CASE WHEN normalized_score > 10 THEN 1 END) as still_out_of_range
FROM assessments
GROUP BY assessment_type;

SELECT 'Peer feedback normalized avg sample' as info, normalized_avg, quality_of_work, collaboration
FROM peer_feedback LIMIT 5;
