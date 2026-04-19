export const ALLOWED_TOPICS = [
  "AI & LLMs",
  "Startup Funding",
  "Big Tech",
  "Developer Tools",
  "Crypto & Web3",
  "Policy & Regulation",
  "Hardware & Chips",
  "Layoffs & Hiring",
] as const;

export type Topic = (typeof ALLOWED_TOPICS)[number];

export const TOPIC_QUERY_MAP: Record<Topic, string[]> = {
  "AI & LLMs": [
    "AI model release today",
    "LLM announcement",
    "OpenAI Google AI news",
  ],
  "Startup Funding": [
    "startup funding round today",
    "Series A B C announcement tech",
    "VC investment tech",
  ],
  "Big Tech": [
    "Apple Google Microsoft Meta Amazon news today",
    "big tech earnings layoffs",
  ],
  "Developer Tools": [
    "developer tool launch",
    "open source release",
    "API update developer news",
  ],
  "Crypto & Web3": [
    "crypto news today",
    "blockchain web3 funding",
    "DeFi protocol launch",
  ],
  "Policy & Regulation": [
    "tech regulation news",
    "AI policy government",
    "antitrust tech",
  ],
  "Hardware & Chips": [
    "semiconductor chip news",
    "NVIDIA AMD Apple Silicon",
    "hardware launch",
  ],
  "Layoffs & Hiring": [
    "tech layoffs today",
    "hiring freeze tech",
    "tech jobs news",
  ],
};
