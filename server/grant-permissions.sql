-- Grant Permissions
-- Run this in the Supabase SQL Editor

-- 1. Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant access to all tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 3. Grant access to sequences (for auto-increment IDs if any)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. Try to reload the schema cache (this notifies the API)
NOTIFY pgrst, 'reload config';
