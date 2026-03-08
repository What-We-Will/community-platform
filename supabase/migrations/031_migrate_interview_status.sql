-- Migrate existing 'interview' rows to 'first_interview'
UPDATE job_applications
SET status = 'first_interview'
WHERE status = 'interview';
