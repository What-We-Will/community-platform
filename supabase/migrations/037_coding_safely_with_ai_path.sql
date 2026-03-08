-- Seed: "Coding Safely with AI" featured learning path

DO $$
DECLARE
  path_id  UUID;
  owner_id UUID;
BEGIN
  -- Use the first admin user; fall back to any user if none exists yet
  SELECT id INTO owner_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF owner_id IS NULL THEN
    SELECT id INTO owner_id FROM profiles ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO learning_paths (title, description, is_starred, created_by)
  VALUES (
    'Coding Safely with AI',
    'A curated track covering LLMs, AI coding assistants, Cursor/Claude Code setup, security guardrails, agentic systems, and responsible AI development practices. Suitable for all skill levels.',
    true,
    owner_id
  )
  RETURNING id INTO path_id;

  INSERT INTO learning_path_items (path_id, title, url, description, position) VALUES

  (path_id,
   'Deep Dive into LLMs Like ChatGPT — Andrej Karpathy',
   'https://www.youtube.com/watch?v=7xTGNNLPyMI',
   'A 3.5-hour general-audience deep dive into the full training stack of LLMs — pretraining, tokenization, the Transformer architecture, SFT, hallucinations, tool use, and RLHF including DeepSeek-R1. No math required. Learn what makes "thinking" models different and how to prompt more effectively. Free · YouTube',
   1),

  (path_id,
   'Build Fast, Stay Secure: Guardrails for AI Coding Assistants — Snyk',
   'https://snyk.io/blog/build-fast-stay-secure-guardrails-for-ai-coding-assistants/',
   'Covers the four types of AI security guardrails, how to use Snyk''s MCP server to scan code as Claude Code or Cursor generates it in real time, and how to build an org policy where AI coding tool access is contingent on local security scanning. Free · Snyk Blog',
   2),

  (path_id,
   'Claude Code Best Practices — Official Docs',
   'https://docs.anthropic.com/en/docs/claude-code/best-practices',
   'Official best practices covering CLAUDE.md setup, subagent delegation, context compaction with /compact, the over-specified CLAUDE.md anti-pattern (too long = ignored), scoping investigations narrowly, and the spec-first workflow before any implementation. Free · Anthropic Docs',
   3),

  (path_id,
   'Cursor Directory — Learn Videos',
   'https://cursor.directory/learn',
   'A curated collection of videos and tutorials from the Cursor community — deep dives into MCP servers, the Fusion Model, .cursor/rules setup, and advanced agent workflows from working developers. Free · Cursor Directory',
   4),

  (path_id,
   'Cursor Rules Updated — New .cursor/rules System',
   'https://cursor.directory/learn',
   'Covers Cursor''s upgraded rule system: instead of a single .cursorrules file, write multiple rules inside .cursor/rules — scoped per directory, per file type, or always-applied. Free · Cursor Directory / YouTube',
   5),

  (path_id,
   'Writing a Good CLAUDE.md — HumanLayer Blog',
   'https://www.humanlayer.dev/blog/writing-a-good-claude-md',
   'One of the most rigorous CLAUDE.md guides available. Covers the WHAT/WHY/HOW structure, explains that LLMs can only follow ~150–200 instructions consistently, and that Claude Code''s system prompt already uses ~50 — so keep CLAUDE.md short. Also covers Stop hooks, auto-formatters, and Slash Commands for better results. Free · HumanLayer',
   6),

  (path_id,
   'Cursor Rules Best Practices — Elementor Engineers',
   'https://medium.com/elementor-engineers/cursor-rules-best-practices-for-developers-16a438a4935c',
   'Documents a weeks-long process of refining .cursor/rules into a reliable teammate-like agent. Covers writing rules in "martial arts" tone — short, direct, no fluff — token economy in Always Apply mode, and the Periodic Rule Reinforcement trick to prevent rules from being ignored in long conversations. Free · Medium',
   7),

  (path_id,
   'AI-Generated Code Security Risks — Apiiro',
   'https://apiiro.com/blog/ai-generated-code-security/',
   'Covers the most common vulnerability patterns AI tools introduce — hardcoded secrets, SQL injection, path traversal — and a practical technique: after generating code, prompt the AI with "What are the security flaws in this?" and "Add inline comments explaining your security decisions" before accepting it. Free · Apiiro Blog',
   8),

  (path_id,
   'Snyk Learn: OWASP Top 10 for LLMs & GenAI — Interactive Course',
   'https://learn.snyk.io/learning-paths/owasp-top-10-llm/',
   'Free self-paced interactive learning path covering all 10 OWASP LLM risks — prompt injection, insecure output handling, training data poisoning, model denial of service, system prompt leakage, excessive agency, and more — with practical defense strategies. Certificate included. Free · Snyk Learn',
   9),

  (path_id,
   'The Complete Cursor Rules Guide 2026 — Agent Rules Builder',
   'https://www.agentrulegen.com/guides/cursor-rules-guide',
   'Comprehensive reference covering the full .mdc frontmatter system, folder structure (base.mdc, frontend.mdc, api.mdc, personal.mdc), and rules for Next.js 15 App Router, Server Components, and Tailwind v4. Includes how to gitignore personal-only rules while committing shared ones. Free · Agentrulegen',
   10),

  (path_id,
   'AI Agents in LangGraph — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/',
   'Taught by LangChain founder Harrison Chase and Tavily founder Rotem Weiss. Covers building an agent from scratch in Python, then rebuilding it with LangGraph, agentic search, state management, and reflection loops. Free · DeepLearning.AI',
   11),

  (path_id,
   'Long-Term Agentic Memory with LangGraph — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/',
   'Covers building an agent with persistent long-term memory, creating a personal email agent with writing, scheduling, and memory tools — including how to add facts to memory and optimize system prompts over time. Free · DeepLearning.AI',
   12),

  (path_id,
   'Functions, Tools and Agents with LangChain — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/',
   'Covers LangChain Expression Language (LCEL), function calling, tool selection, routing, and building conversational agents. Ideal bridge between prompt engineering and full agent development. Free · DeepLearning.AI',
   13),

  (path_id,
   'Build AI Agents with n8n — YouTube',
   'https://www.youtube.com/watch?v=nU2mKHnM2uE',
   'An 8-hour YouTube course on building multi-agent automation workflows using drag-and-drop tools — practical, no-code-required approach to orchestrating agent pipelines. Free · NetHerk / YouTube',
   14),

  (path_id,
   'OWASP Agentic Security Initiative Guide (February 2025)',
   'https://genai.owasp.org',
   'OWASP''s first guide specifically for agentic AI systems — covers single-agent and multi-agent threat models, tool misuse, privilege compromise, communication poisoning, rogue agents, and cascading failures. Intended for builders and defenders of agentic applications. Free · OWASP',
   15),

  (path_id,
   'Red Teaming LLM Applications — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/',
   'Hands-on course where you attack chatbot applications using prompt injections to understand security failures. Covers fundamental LLM vulnerabilities, manual and automated red-teaming methods, and a full red-team assessment using the open-source Giskard library. Basic Python recommended. Free · DeepLearning.AI',
   16),

  (path_id,
   'MCP Quickstart & Official Docs — Anthropic',
   'https://docs.anthropic.com/en/docs/mcp',
   'The official written guide to the Model Context Protocol — how to connect Claude to external services, build MCP servers and clients, and manage context safely. Free · Anthropic Docs',
   17),

  (path_id,
   'Anthropic Model Safety & Responsible Scaling',
   'https://www.anthropic.com/research',
   'Anthropic''s research pages covering responsible scaling policies, safety benchmarks, and guidelines for deploying Claude in production and team settings. Essential reading before managing agents at scale. Free · Anthropic',
   18),

  (path_id,
   'Claude Teams Documentation — Anthropic',
   'https://support.claude.ai/hc/en-us/categories/claude-for-teams',
   'Official support documentation for Claude Teams — covering admin controls, shared project management, permissions, and deploying Claude safely across an organization. Free · Anthropic Support',
   19);

END $$;
