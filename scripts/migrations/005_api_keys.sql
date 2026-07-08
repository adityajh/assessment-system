-- Migration 005: Add api_keys table for external system integration

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    created_by TEXT,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- For now, all authenticated users (mentors/admins) can manage API keys
CREATE POLICY "Allow authenticated full access on api_keys" ON api_keys
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
