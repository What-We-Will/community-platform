-- Tech Jobs for Good listings are general social-impact jobs,
-- not specifically within the TWC/community network.
UPDATE public.job_postings
SET is_community_network = false
WHERE company IN (
  'Center for Tech and Civic Life',
  'Scale to Win',
  'Carina',
  'Chef Ann Foundation',
  'Protect Democracy',
  'SkillUp Coalition',
  'Coforma',
  'DSPolitical',
  'Change Research',
  'Earthjustice',
  'Maisha Meds',
  'MissionWired',
  'YES',
  'EnergyHub',
  'Kalderos'
)
AND posted_by IS NULL;
