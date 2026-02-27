-- 009_update_self_assessment_questions.sql

-- Drop the previous strict constraint
ALTER TABLE self_assessment_questions DROP CONSTRAINT IF EXISTS self_assessment_questions_project_id_question_order_key;
ALTER TABLE self_assessment_questions DROP CONSTRAINT IF EXISTS self_assessment_questions_project_id_parameter_id_key;

-- Add an assessment_log_id foreign key so questions belong to specific import events
ALTER TABLE self_assessment_questions ADD COLUMN IF NOT EXISTS assessment_log_id UUID REFERENCES assessment_logs(id) ON DELETE CASCADE;

-- Add a new unique constraint on assessment_log_id and parameter_id 
-- This allows each unique import event to have its own historical snapshot 
-- of the questions asked without overwriting previous assessment events!
ALTER TABLE self_assessment_questions ADD CONSTRAINT self_assessment_questions_log_id_parameter_id_key UNIQUE (assessment_log_id, parameter_id);
