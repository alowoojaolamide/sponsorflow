import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

function realKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  return key && key !== "your-openai-api-key" ? key : null;
}

export function isAIConfigured(): boolean {
  return !!realKey();
}

/** Shared by every OpenAI-calling feature so the "is it configured" check and client construction only happen in one place. */
export function getOpenAIClient(): OpenAI {
  const key = realKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  return new OpenAI({ apiKey: key });
}

/**
 * Maps an OpenAI SDK error to a friendly, user-facing Error message. Shared
 * so every caller (chat completions here, the Responses API + web_search
 * tool in lib/company-research.ts) gives the same message for the same
 * underlying failure (rejected key, no credit balance, rate limit) instead
 * of each hand-rolling its own status-code branching.
 */
export function mapOpenAIError(err: unknown): Error {
  if (err instanceof OpenAI.APIError) {
    if (err.status === 401) return new Error("OpenAI API key was rejected. Check OPENAI_API_KEY.");
    if (err.status === 429) {
      return new Error(
        /quota/i.test(err.message)
          ? "Your OpenAI account has no credit balance. Add billing at platform.openai.com to enable this feature."
          : "OpenAI rate limit hit. Try again shortly."
      );
    }
    if (err.status === 400 && /insufficient_quota|billing/i.test(err.message)) {
      return new Error("Your OpenAI account has no credit balance. Add billing at platform.openai.com to enable this feature.");
    }
    return new Error(`OpenAI request failed (${err.status}).`);
  }
  return err instanceof Error ? err : new Error("OpenAI request failed.");
}

/** Sends a single-turn prompt to the model and returns the raw text response. */
export async function callAI(prompt: string, maxTokens: number): Promise<string> {
  const client = getOpenAIClient();

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    throw mapOpenAIError(err);
  }
}

/**
 * Parses the first JSON object found in a model text response. Pass
 * `validate` to also reject a syntactically-valid response that's missing
 * fields the caller actually needs (the model returning `{}` instead of
 * the documented shape) — without one, callers only find out downstream
 * via an unguarded property access.
 */
export function parseAIJson<T>(raw: string, validate?: (obj: unknown) => obj is T): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  if (validate && !validate(parsed)) {
    throw new Error("AI response did not match the expected shape.");
  }
  return parsed as T;
}
