import type { Topic } from "@/lib/topics";

export function buildDigestPrompt(input: { date: string; topics: Topic[] }) {
  const topicList = input.topics.join(", ");

  return `You are a sharp tech news analyst. Today is ${input.date}.\n\nSearch the web and find the 5-7 most important tech news stories published in the last 24 hours on the following topics: ${topicList}.\n\nFor each story, return a JSON object with these exact fields:\n- headline: string - journalistic, punchy, max 12 words\n- category: string - must be one of: ${topicList}\n- summary: string - 2-3 sentences: what happened AND why it matters\n- importance: integer 1-5 - (5 = affects millions/changes industry, 1 = minor)\n- signal: string - ONE key insight starting with a verb, max 20 words\n- source: string - publication or website name\n\nRules:\n- Only include stories from the last 24-48 hours. No older news.\n- Deduplicate: if two sources cover the same story, pick the most authoritative.\n- Rank by importance (highest first).\n- Do NOT fabricate. Only include real, verifiable stories found via web search.\n\nReturn ONLY a valid JSON array. No markdown fences, no preamble, no explanation. Example: [{\"headline\":\"...\",\"category\":\"...\",\"summary\":\"...\",\"importance\":4,\"signal\":\"...\",\"source\":\"...\"}]`;
}
