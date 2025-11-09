-- Temporarily disable RLS for testing (make tables public)
-- This allows the app to work without authentication

ALTER TABLE job_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE application_emails DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_mailboxes DISABLE ROW LEVEL SECURITY;

-- Keep scraped_jobs public (already has public SELECT policy)