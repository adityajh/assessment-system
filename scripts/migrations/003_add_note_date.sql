-- Migration: Add date and note_type columns to mentor_notes
-- Objective: Support Actionable Missions and independent date tracking

ALTER TABLE mentor_notes 
ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS note_type TEXT DEFAULT 'general';

-- Index for faster filtering of student missions
CREATE INDEX IF NOT EXISTS idx_mentor_notes_student_type ON mentor_notes(student_id, note_type);

COMMENT ON COLUMN mentor_notes.date IS 'The manual date for the note or mission, separate from record creation time.';
COMMENT ON COLUMN mentor_notes.note_type IS 'Distinguishes between general mentor feedback and actionable missions.';
