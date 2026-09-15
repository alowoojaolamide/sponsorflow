import { callAI, parseAIJson, isAIConfigured } from "@/lib/ai-client";

export type ReplyClassification = {
  classification: "positive" | "interested" | "rejection" | "question" | "other";
  confidence: number;
  summary: string;
};

export async function classifyReply(replyBody: string): Promise<ReplyClassification> {
  if (!isAIConfigured()) {
    // Without the AI provider configured, fall back to "other" rather than blocking ingestion.
    return { classification: "other", confidence: 0, summary: "AI classification not configured." };
  }

  const prompt = `Classify this email reply to a job outreach email. Respond with ONLY valid JSON, no markdown fences:
{"classification": "positive"|"interested"|"rejection"|"question"|"other", "confidence": 0-100, "summary": "one short sentence"}

REPLY:
${replyBody}`;

  try {
    const raw = await callAI(prompt, 300);
    return parseAIJson<ReplyClassification>(raw);
  } catch {
    return { classification: "other", confidence: 0, summary: "Could not parse classification." };
  }
}
