-- Seed: "Running AI Locally" featured learning path

DO $$
DECLARE
  path_id  UUID;
  owner_id UUID;
BEGIN
  SELECT id INTO owner_id FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF owner_id IS NULL THEN
    SELECT id INTO owner_id FROM profiles ORDER BY created_at LIMIT 1;
  END IF;

  INSERT INTO learning_paths (title, description, is_starred, created_by)
  VALUES (
    'Running AI Locally',
    'A curated track covering local LLM setup with Ollama and LM Studio, building a private AI coding assistant stack with Continue and Cline, self-hosted deployment with Tabby and vLLM, and the case for small language models — including data sovereignty and privacy considerations.',
    true,
    owner_id
  )
  RETURNING id INTO path_id;

  INSERT INTO learning_path_items (path_id, title, url, description, position) VALUES

  (path_id,
   'How to Run and Customize LLMs Locally with Ollama — freeCodeCamp',
   'https://www.freecodecamp.org/news/run-and-customize-llms-locally-with-ollama',
   'The best single free written tutorial for Ollama. Covers what Ollama is, its mental model (like an app store for models), installation and setup, the pull/run command pattern, and the Modelfile system — Ollama''s most powerful feature for defining model behavior without retraining or fine-tuning. Free · freeCodeCamp',
   1),

  (path_id,
   'Run LLMs Locally: 6 Methods — DataCamp',
   'https://www.datacamp.com/tutorial/run-llms-locally-tutorial',
   'Covers six different tools side by side: Ollama, LM Studio, vLLM, llama.cpp, Jan, and llamafile — with guidance on when to use each. Key distinction: choose vLLM for production APIs serving many concurrent users; use Ollama for local development. Free · DataCamp',
   2),

  (path_id,
   'Local LLM Hosting Complete Guide 2025 — Medium',
   'https://medium.com/@rosgluk/local-llm-hosting-complete-2025-guide-ollama-vllm-localai-jan-lm-studio-more-f98136ce7e4a',
   'In-depth 2025 comparison of Ollama, vLLM, LocalAI, Jan, and LM Studio — covering API maturity, tool calling support, hardware optimization, and model variety. On machines without dedicated GPUs, LM Studio often outperforms Ollama due to Vulkan offloading capabilities. Free · Medium',
   3),

  (path_id,
   'How to Set Up a Free Local Coding AI Assistant for VS Code — Horosin.com',
   'https://horosin.com/how-to-set-up-free-local-coding-ai-assistant-for-vs-code',
   'The best practical walkthrough for the full local stack. Covers installing LM Studio, downloading Qwen2.5 Coder at the right quantization level, enabling the local server with correct context window settings, and connecting both Continue (chat/completions) and Cline (agentic tasks) as VS Code extensions — tested on real Apple Silicon hardware. Free · Karol Horosin',
   4),

  (path_id,
   'Cline — Official GitHub & Local Models Docs',
   'https://docs.cline.bot/running-models-locally/overview',
   'Cline is an open-source autonomous coding agent for VS Code with Plan and Act modes — creates and edits files, executes terminal commands, monitors compiler errors, and uses MCP tools. Supports local models through LM Studio and Ollama, tracks token usage and API costs in real time. Qwen3 Coder 30B is the recommended local model as of 2025. Free & open source · Cline',
   5),

  (path_id,
   'How to Build a Local AI Coding Assistant Stack — Padron.sh',
   'https://padron.sh/blog/ai-coding-assistant-local-setup/',
   'Comprehensive guide for the full VS Code + Continue/Cline + Qwen3 local stack. Covers Continue for chat and completion, Cline for autonomous file editing and commands, and Goose for advanced agentic tasks that can run tests and install packages. Includes hardware requirements by model size. Free · Padron.sh',
   6),

  (path_id,
   'Continue.dev — Official Docs & Quickstart',
   'https://docs.continue.dev',
   'One of the most popular open-source coding assistants with over 20,000 GitHub stars. Model-agnostic — connect it to any LLM, whether a local model like Llama, Mistral, or CodeLlama, or cloud providers like OpenAI and Anthropic. Lets teams start with cloud models and migrate to self-hosted options as needs evolve. VS Code and JetBrains extension. Free & open source · Continue',
   7),

  (path_id,
   'Tabby — Self-Hosted AI Coding Server (Official Docs)',
   'https://tabby.tabbyml.com',
   'Targets on-premises deployments in regulated environments. Hosts its own model (or integrates others), supports VS Code and JetBrains, includes team workspace management, monitoring, analytics, and fine-tuning on organization-specific code patterns. Architecture supports everything from single-developer installations to large-scale enterprise deployments with load balancing. Free (self-hosted open source), paid enterprise tier available · Tabby',
   8),

  (path_id,
   'Data Sovereignty in the Age of Generative AI — ISACA Journal (2025)',
   'https://www.isaca.org/resources/isaca-journal/issues/2025/volume-5/data-sovereignty-in-the-age-of-generative-ai',
   'ISACA Journal article covering data sovereignty implications of generative AI — why local and self-hosted models matter for organizations subject to data residency requirements, regulatory compliance, and privacy obligations. Essential reading for understanding the organizational case for running AI locally. Free · ISACA',
   9),

  (path_id,
   'The Case for Using Small Language Models — Harvard Business Review (2025)',
   'https://hbr.org/2025/09/the-case-for-using-small-language-models',
   'Written by MIT and Harvard postdoctoral researchers. Argues that SLMs enable deployment on edge devices for real-time decision-making without cloud dependency, consume less energy, can be fine-tuned for specific domains, and offer greater control, privacy, and transparency — supporting secure data processing and regulatory compliance. Accessible for both technical and non-technical audiences. Harvard Business Review',
   10),

  (path_id,
   'Introduction to Small Language Models: The Complete Guide — Machine Learning Mastery (2026)',
   'https://machinelearningmastery.com/introduction-to-small-language-models-the-complete-guide-for-2026/',
   'Comprehensive, free, hands-on guide to small language models — updated February 2026. Covers SLM architecture, training, deployment, fine-tuning, and practical use cases where smaller models outperform larger ones. Ideal companion to the HBR article for developers who want to go deeper. Free · Machine Learning Mastery',
   11);

END $$;
