-- Add topic tags to learning_resources and classify all seeded resources.

ALTER TABLE learning_resources
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- ── Seed tags for the 30 resources added in migration 039 ────────────────────

-- ── Videos ───────────────────────────────────────────────────────────────────

UPDATE learning_resources SET tags = ARRAY['llms']
  WHERE url = 'https://www.youtube.com/watch?v=7xTGNNLPyMI';

UPDATE learning_resources SET tags = ARRAY['ai-tools', 'prompting']
  WHERE url = 'https://cursor.directory/learn' AND type = 'video';

UPDATE learning_resources SET tags = ARRAY['agents']
  WHERE url = 'https://www.youtube.com/watch?v=nU2mKHnM2uE';

-- ── Courses ───────────────────────────────────────────────────────────────────

UPDATE learning_resources SET tags = ARRAY['security', 'llms']
  WHERE url = 'https://learn.snyk.io/learning-paths/owasp-top-10-llm/';

UPDATE learning_resources SET tags = ARRAY['agents', 'llms']
  WHERE url = 'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/';

UPDATE learning_resources SET tags = ARRAY['agents']
  WHERE url = 'https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/';

UPDATE learning_resources SET tags = ARRAY['agents']
  WHERE url = 'https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/';

UPDATE learning_resources SET tags = ARRAY['security', 'llms']
  WHERE url = 'https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/';

-- ── Tutorials & Texts — Coding Safely with AI ────────────────────────────────

UPDATE learning_resources SET tags = ARRAY['security', 'ai-tools']
  WHERE url = 'https://snyk.io/blog/build-fast-stay-secure-guardrails-for-ai-coding-assistants/';

UPDATE learning_resources SET tags = ARRAY['ai-tools', 'prompting']
  WHERE url = 'https://docs.anthropic.com/en/docs/claude-code/best-practices';

UPDATE learning_resources SET tags = ARRAY['ai-tools']
  WHERE url = 'https://cursor.directory/learn' AND type = 'tutorial';

UPDATE learning_resources SET tags = ARRAY['ai-tools', 'prompting']
  WHERE url = 'https://www.humanlayer.dev/blog/writing-a-good-claude-md';

UPDATE learning_resources SET tags = ARRAY['ai-tools', 'prompting']
  WHERE url = 'https://medium.com/elementor-engineers/cursor-rules-best-practices-for-developers-16a438a4935c';

UPDATE learning_resources SET tags = ARRAY['security']
  WHERE url = 'https://apiiro.com/blog/ai-generated-code-security/';

UPDATE learning_resources SET tags = ARRAY['ai-tools', 'prompting']
  WHERE url = 'https://www.agentrulegen.com/guides/cursor-rules-guide';

UPDATE learning_resources SET tags = ARRAY['security', 'agents']
  WHERE url = 'https://genai.owasp.org';

UPDATE learning_resources SET tags = ARRAY['ai-tools']
  WHERE url = 'https://docs.anthropic.com/en/docs/mcp';

UPDATE learning_resources SET tags = ARRAY['security', 'privacy']
  WHERE url = 'https://www.anthropic.com/research';

UPDATE learning_resources SET tags = ARRAY['ai-tools']
  WHERE url = 'https://support.claude.ai/hc/en-us/categories/claude-for-teams';

-- ── Tutorials & Texts — Running AI Locally ───────────────────────────────────

UPDATE learning_resources SET tags = ARRAY['local-ai', 'llms']
  WHERE url = 'https://www.freecodecamp.org/news/run-and-customize-llms-locally-with-ollama';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'llms']
  WHERE url = 'https://www.datacamp.com/tutorial/run-llms-locally-tutorial';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'llms']
  WHERE url LIKE '%rosgluk/local-llm-hosting%';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'ai-tools']
  WHERE url = 'https://horosin.com/how-to-set-up-free-local-coding-ai-assistant-for-vs-code';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'ai-tools']
  WHERE url = 'https://docs.cline.bot/running-models-locally/overview';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'ai-tools']
  WHERE url = 'https://padron.sh/blog/ai-coding-assistant-local-setup/';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'ai-tools']
  WHERE url = 'https://docs.continue.dev';

UPDATE learning_resources SET tags = ARRAY['local-ai']
  WHERE url = 'https://tabby.tabbyml.com';

UPDATE learning_resources SET tags = ARRAY['local-ai', 'privacy']
  WHERE url LIKE '%isaca.org%data-sovereignty%';

UPDATE learning_resources SET tags = ARRAY['llms', 'local-ai']
  WHERE url LIKE '%hbr.org%small-language-models%';

UPDATE learning_resources SET tags = ARRAY['llms', 'local-ai']
  WHERE url LIKE '%machinelearningmastery.com%small-language-models%';
