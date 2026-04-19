export function extractJsonArray(raw: string): string | null {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    const cleaned = fenceMatch[1].trim();
    if (cleaned.startsWith("[") && cleaned.endsWith("]")) return cleaned;
  }

  const firstBracket = raw.indexOf("[");
  const lastBracket = raw.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return raw.slice(firstBracket, lastBracket + 1);
  }

  return null;
}
