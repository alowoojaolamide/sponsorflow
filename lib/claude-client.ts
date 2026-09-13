import Anthropic from "@anthropic-ai/sdk";

function realKey(): string | null {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && !key.startsWith("sk-ant-api03-...") && key !== "your-anthropic-api-key" ? key : null;
}

export function isClaudeConfigured(): boolean {
  return !!realKey();
}

/** Sends a single-turn prompt to Claude and returns the raw text response. */
export async function callClaude(prompt: string, maxTokens: number): Promise<string> {
  const key = realKey();
  if (!key) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const client = new Anthropic({ apiKey: key });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text : "";
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 401) throw new Error("Anthropic API key was rejected. Check ANTHROPIC_API_KEY.");
      if (err.status === 400 && /credit balance/i.test(err.message)) {
        throw new Error("Your Anthropic account has no credit balance. Add billing at console.anthropic.com to enable this feature.");
      }
      if (err.status === 429) throw new Error("Anthropic rate limit hit. Try again shortly.");
      throw new Error(`Claude request failed (${err.status}).`);
    }
    throw err;
  }
}

/** Parses the first JSON object found in a Claude text response. */
export function parseClaudeJson<T>(raw: string): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw) as T;
}
