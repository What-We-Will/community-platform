-- Add granular interview stages to the enum
-- (UPDATE migration in 031 after this commits)

ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'first_interview';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'second_interview';
ALTER TYPE application_status ADD VALUE IF NOT EXISTS 'third_interview';
