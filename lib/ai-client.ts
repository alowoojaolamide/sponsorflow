import OpenAI from "openai";

const MODEL = "gpt-4o-mini";

function realKey(): string | null {
  const key = process.env.OPENAI_API_KEY;
  return key && key !== "your-openai-api-key" ? key : null;
}

export function isAIConfigured(): boolean {
  return !!realKey();
}

/** Sends a single-turn prompt to the model and returns the raw text response. */
export async function callAI(prompt: string, maxTokens: number): Promise<string> {
  const key = realKey();
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const client = new OpenAI({ apiKey: key });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });
    return completion.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) throw new Error("OpenAI API key was rejected. Check OPENAI_API_KEY.");
      if (err.status === 429) {
        throw new Error(
          /quota/i.test(err.message)
            ? "Your OpenAI account has no credit balance. Add billing at platform.openai.com to enable this feature."
            : "OpenAI rate limit hit. Try again shortly."
        );
      }
      if (err.status === 400 && /insufficient_quota|billing/i.test(err.message)) {
        throw new Error("Your OpenAI account has no credit balance. Add billing at platform.openai.com to enable this feature.");
      }
      throw new Error(`OpenAI request failed (${err.status}).`);
    }
    throw err;
  }
}

/** Parses the first JSON object found in a model text response. */
export function parseAIJson<T>(raw: string): T {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  return JSON.parse(jsonMatch ? jsonMatch[0] : raw) as T;
}
