import Anthropic from "@anthropic-ai/sdk";

export type ReplyClassification = {
  classification: "positive" | "interested" | "rejection" | "question" | "other";
  confidence: number;
  summary: string;
};

function realKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && !key.startsWith("sk-ant-api03-...") && key !== "your-anthropic-api-key" ? key : null;
}

export async function classifyReply(replyBody: string): Promise<ReplyClassification> {
  const key = realKey();
  if (!key) {
    // Without Claude configured, fall back to "other" rather than blocking ingestion.
    return { classification: "other", confidence: 0, summary: "AI classification not configured." };
  }

  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `Classify this email reply to a job outreach email. Respond with ONLY valid JSON, no markdown fences:
{"classification": "positive"|"interested"|"rejection"|"question"|"other", "confidence": 0-100, "summary": "one short sentence"}

REPLY:
${replyBody}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return { classification: "other", confidence: 0, summary: "Could not parse classification." };
  }
}
