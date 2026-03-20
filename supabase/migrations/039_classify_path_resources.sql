-- Populate learning_resources from path items so each resource is
-- discoverable in its dedicated tab (Courses / Videos / Tutorials & Texts).

DO $$
DECLARE
  owner_id UUID;
BEGIN
  SELECT id INTO owner_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF owner_id IS NULL THEN
    SELECT id INTO owner_id FROM profiles ORDER BY created_at LIMIT 1;
  END IF;

  IF owner_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO learning_resources (type, title, url, description, added_by) VALUES

  -- ── VIDEOS ───────────────────────────────────────────────────────────────────

  ('video',
   'Deep Dive into LLMs Like ChatGPT — Andrej Karpathy',
   'https://www.youtube.com/watch?v=7xTGNNLPyMI',
   'A 3.5-hour general-audience deep dive into the full training stack of LLMs — pretraining, tokenization, Transformer architecture, SFT, hallucinations, tool use, and RLHF including DeepSeek-R1. No math required. Learn what makes "thinking" models different and how to prompt more effectively. Free · YouTube',
   owner_id),

  ('video',
   'Cursor Rules Updated — New .cursor/rules System',
   'https://cursor.directory/learn',
   'Covers Cursor''s upgraded rule system: instead of a single .cursorrules file, write multiple rules inside .cursor/rules — scoped per directory, per file type, or always-applied. Free · Cursor Directory / YouTube',
   owner_id),

  ('video',
   'Build AI Agents with n8n',
   'https://www.youtube.com/watch?v=nU2mKHnM2uE',
   'An 8-hour YouTube course on building multi-agent automation workflows using drag-and-drop tools — practical, no-code-required approach to orchestrating agent pipelines. Free · NetHerk / YouTube',
   owner_id),

  -- ── COURSES ──────────────────────────────────────────────────────────────────

  ('course',
   'Snyk Learn: OWASP Top 10 for LLMs & GenAI',
   'https://learn.snyk.io/learning-paths/owasp-top-10-llm/',
   'Free self-paced interactive learning path covering all 10 OWASP LLM risks — prompt injection, insecure output handling, training data poisoning, model denial of service, system prompt leakage, excessive agency, and more — with practical defense strategies. Certificate included. Free · Snyk Learn',
   owner_id),

  ('course',
   'AI Agents in LangGraph — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/',
   'Taught by LangChain founder Harrison Chase and Tavily founder Rotem Weiss. Covers building an agent from scratch in Python, then rebuilding it with LangGraph, agentic search, state management, and reflection loops. Free · DeepLearning.AI',
   owner_id),

  ('course',
   'Long-Term Agentic Memory with LangGraph — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/',
   'Covers building an agent with persistent long-term memory, creating a personal email agent with writing, scheduling, and memory tools — including how to add facts to memory and optimize system prompts over time. Free · DeepLearning.AI',
   owner_id),

  ('course',
   'Functions, Tools and Agents with LangChain — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/',
   'Covers LangChain Expression Language (LCEL), function calling, tool selection, routing, and building conversational agents. Ideal bridge between prompt engineering and full agent development. Free · DeepLearning.AI',
   owner_id),

  ('course',
   'Red Teaming LLM Applications — DeepLearning.AI',
   'https://www.deeplearning.ai/short-courses/red-teaming-llm-applications/',
   'Hands-on course where you attack chatbot applications using prompt injections to understand security failures. Covers fundamental LLM vulnerabilities, manual and automated red-teaming methods, and a full red-team assessment using the open-source Giskard library. Basic Python recommended. Free · DeepLearning.AI',
   owner_id),

  -- ── TUTORIALS & TEXTS — Coding Safely with AI ────────────────────────────────

  ('tutorial',
   'Build Fast, Stay Secure: Guardrails for AI Coding Assistants — Snyk',
   'https://snyk.io/blog/build-fast-stay-secure-guardrails-for-ai-coding-assistants/',
   'Covers the four types of AI security guardrails, using Snyk''s MCP server to scan code as Claude Code or Cursor generates it in real time, and building an org policy where AI coding tool access is contingent on local security scanning. Free · Snyk Blog',
   owner_id),

  ('tutorial',
   'Claude Code Best Practices — Official Anthropic Docs',
   'https://docs.anthropic.com/en/docs/claude-code/best-practices',
   'Official best practices covering CLAUDE.md setup, subagent delegation, context compaction with /compact, the over-specified CLAUDE.md anti-pattern (too long = ignored), scoping investigations narrowly, and the spec-first workflow before any implementation. Free · Anthropic Docs',
   owner_id),

  ('tutorial',
   'Cursor Directory — Learn Videos & Resources',
   'https://cursor.directory/learn',
   'A curated collection of videos and tutorials from the Cursor community — deep dives into MCP servers, the Fusion Model, .cursor/rules setup, and advanced agent workflows from working developers. Free · Cursor Directory',
   owner_id),

  ('tutorial',
   'Writing a Good CLAUDE.md — HumanLayer Blog',
   'https://www.humanlayer.dev/blog/writing-a-good-claude-md',
   'One of the most rigorous CLAUDE.md guides available. Covers the WHAT/WHY/HOW structure, explains that LLMs can only follow ~150–200 instructions consistently, and that Claude Code''s system prompt already uses ~50 — so keep CLAUDE.md short. Also covers Stop hooks, auto-formatters, and Slash Commands for better results. Free · HumanLayer',
   owner_id),

  ('tutorial',
   'Cursor Rules Best Practices — Elementor Engineers',
   'https://medium.com/elementor-engineers/cursor-rules-best-practices-for-developers-16a438a4935c',
   'Documents a weeks-long process of refining .cursor/rules into a reliable teammate-like agent. Covers writing rules in "martial arts" tone — short, direct, no fluff — token economy in Always Apply mode, and the Periodic Rule Reinforcement trick to prevent rules from being ignored in long conversations. Free · Medium',
   owner_id),

  ('tutorial',
   'AI-Generated Code Security Risks — Apiiro',
   'https://apiiro.com/blog/ai-generated-code-security/',
   'Covers the most common vulnerability patterns AI tools introduce — hardcoded secrets, SQL injection, path traversal — and a practical technique: after generating code, prompt the AI with "What are the security flaws in this?" and "Add inline comments explaining your security decisions" before accepting it. Free · Apiiro Blog',
   owner_id),

  ('tutorial',
   'The Complete Cursor Rules Guide 2026 — Agent Rules Builder',
   'https://www.agentrulegen.com/guides/cursor-rules-guide',
   'Comprehensive reference covering the full .mdc frontmatter system, folder structure (base.mdc, frontend.mdc, api.mdc, personal.mdc), and rules for Next.js 15 App Router, Server Components, and Tailwind v4. Includes how to gitignore personal-only rules while committing shared ones. Free · Agentrulegen',
   owner_id),

  ('tutorial',
   'OWASP Agentic Security Initiative Guide (February 2025)',
   'https://genai.owasp.org',
   'OWASP''s first guide specifically for agentic AI systems — covers single-agent and multi-agent threat models, tool misuse, privilege compromise, communication poisoning, rogue agents, and cascading failures. Intended for builders and defenders of agentic applications. Free · OWASP',
   owner_id),

  ('tutorial',
   'MCP Quickstart & Official Docs — Anthropic',
   'https://docs.anthropic.com/en/docs/mcp',
   'The official written guide to the Model Context Protocol — how to connect Claude to external services, build MCP servers and clients, and manage context safely. Free · Anthropic Docs',
   owner_id),

  ('tutorial',
   'Anthropic Model Safety & Responsible Scaling',
   'https://www.anthropic.com/research',
   'Anthropic''s research pages covering responsible scaling policies, safety benchmarks, and guidelines for deploying Claude in production and team settings. Essential reading before managing agents at scale. Free · Anthropic',
   owner_id),

  ('tutorial',
   'Claude Teams Documentation — Anthropic',
   'https://support.claude.ai/hc/en-us/categories/claude-for-teams',
   'Official support documentation for Claude Teams — covering admin controls, shared project management, permissions, and deploying Claude safely across an organization. Free · Anthropic Support',
   owner_id),

  -- ── TUTORIALS & TEXTS — Running AI Locally ───────────────────────────────────

  ('tutorial',
   'How to Run and Customize LLMs Locally with Ollama — freeCodeCamp',
   'https://www.freecodecamp.org/news/run-and-customize-llms-locally-with-ollama',
   'The best single free written tutorial for Ollama. Covers the Ollama mental model, installation, the pull/run command pattern, and the Modelfile system — Ollama''s most powerful feature for defining model behavior without retraining or fine-tuning. Free · freeCodeCamp',
   owner_id),

  ('tutorial',
   'Run LLMs Locally: 6 Methods — DataCamp',
   'https://www.datacamp.com/tutorial/run-llms-locally-tutorial',
   'Covers six different tools side by side: Ollama, LM Studio, vLLM, llama.cpp, Jan, and llamafile — with guidance on when to use each. Key distinction: choose vLLM for production APIs serving many concurrent users; use Ollama for local development. Free · DataCamp',
   owner_id),

  ('tutorial',
   'Local LLM Hosting Complete Guide 2025 — Medium',
   'https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a',
   'In-depth 2025 comparison of Ollama, vLLM, LocalAI, Jan, and LM Studio — covering API maturity, tool calling support, hardware optimization, and model variety. On machines without dedicated GPUs, LM Studio often outperforms Ollama due to Vulkan offloading. Free · Medium',
   owner_id),

  ('tutorial',
   'How to Set Up a Free Local Coding AI Assistant for VS Code — Horosin.com',
   'https://horosin.com/how-to-set-up-free-local-coding-ai-assistant-for-vs-code',
   'The best practical walkthrough for the full local stack. Covers installing LM Studio, downloading Qwen2.5 Coder at the right quantization level, enabling the local server with correct context window settings, and connecting Continue and Cline as VS Code extensions — tested on real Apple Silicon hardware. Free · Karol Horosin',
   owner_id),

  ('tutorial',
   'Cline — Official Docs: Running Models Locally',
   'https://docs.cline.bot/running-models-locally/overview',
   'Cline is an open-source autonomous coding agent for VS Code with Plan and Act modes. Supports local models through LM Studio and Ollama, tracks token usage and API costs in real time. Qwen3 Coder 30B is the recommended local model as of 2025. Free & open source · Cline',
   owner_id),

  ('tutorial',
   'How to Build a Local AI Coding Assistant Stack — Padron.sh',
   'https://padron.sh/blog/ai-coding-assistant-local-setup/',
   'Comprehensive guide for the full VS Code + Continue/Cline + Qwen3 local stack. Covers Continue for chat and completion, Cline for autonomous file editing and commands, and Goose for advanced agentic tasks. Includes hardware requirements by model size. Free · Padron.sh',
   owner_id),

  ('tutorial',
   'Continue.dev — Official Docs & Quickstart',
   'https://docs.continue.dev',
   'One of the most popular open-source coding assistants with over 20,000 GitHub stars. Model-agnostic — connect to any LLM, whether a local model like Llama, Mistral, or CodeLlama, or cloud providers like OpenAI and Anthropic. VS Code and JetBrains extension. Free & open source · Continue',
   owner_id),

  ('tutorial',
   'Tabby — Self-Hosted AI Coding Server',
   'https://tabby.tabbyml.com',
   'Targets on-premises deployments in regulated environments. Hosts its own model (or integrates others), supports VS Code and JetBrains, includes team workspace management, monitoring, analytics, and fine-tuning on organization-specific code patterns. Free (self-hosted open source), paid enterprise tier · Tabby',
   owner_id),

  ('tutorial',
   'Data Sovereignty in the Age of Generative AI — ISACA Journal (2025)',
   'https://www.isaca.org/resources/isaca-journal/issues/2025/volume-5/data-sovereignty-in-the-age-of-generative-ai',
   'ISACA Journal article covering data sovereignty implications of generative AI — why local and self-hosted models matter for organizations subject to data residency requirements, regulatory compliance, and privacy obligations. Free · ISACA',
   owner_id),

  ('tutorial',
   'The Case for Using Small Language Models — Harvard Business Review (2025)',
   'https://hbr.org/2025/09/the-case-for-using-small-language-models',
   'Written by MIT and Harvard postdoctoral researchers. Argues that SLMs enable deployment on edge devices without cloud dependency, consume less energy, can be fine-tuned for specific domains, and offer greater control, privacy, and transparency — supporting secure data processing and regulatory compliance. Harvard Business Review',
   owner_id),

  ('tutorial',
   'Introduction to Small Language Models: The Complete Guide 2026 — ML Mastery',
   'https://machinelearningmastery.com/introduction-to-small-language-models-the-complete-guide-for-2026/',
   'Comprehensive, free, hands-on guide to small language models — updated February 2026. Covers SLM architecture, training, deployment, fine-tuning, and practical use cases where smaller models outperform larger ones. Free · Machine Learning Mastery',
   owner_id);

END $$;
