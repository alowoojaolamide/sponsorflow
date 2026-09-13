import { callClaude, parseClaudeJson, isClaudeConfigured } from "@/lib/claude-client";

export type ReplyClassification = {
  classification: "positive" | "interested" | "rejection" | "question" | "other";
  confidence: number;
  summary: string;
};

export async function classifyReply(replyBody: string): Promise<ReplyClassification> {
  if (!isClaudeConfigured()) {
    // Without Claude configured, fall back to "other" rather than blocking ingestion.
    return { classification: "other", confidence: 0, summary: "AI classification not configured." };
  }

  const prompt = `Classify this email reply to a job outreach email. Respond with ONLY valid JSON, no markdown fences:
{"classification": "positive"|"interested"|"rejection"|"question"|"other", "confidence": 0-100, "summary": "one short sentence"}

REPLY:
${replyBody}`;

  try {
    const raw = await callClaude(prompt, 300);
    return parseClaudeJson<ReplyClassification>(raw);
  } catch {
    return { classification: "other", confidence: 0, summary: "Could not parse classification." };
  }
}
