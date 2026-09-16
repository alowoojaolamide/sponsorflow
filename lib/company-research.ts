import OpenAI from "openai";
import { getOpenAIClient, mapOpenAIError, isAIConfigured } from "@/lib/ai-client";

export { isAIConfigured as isResearchConfigured };

export type CompanyResearchResult = {
  website: string | null;
  personalization_hook: string | null;
  found: boolean;
};

function buildPrompt(companyName: string, industryHint: string | null): string {
  return `Find the official website for this UK company: "${companyName}"${
    industryHint ? ` (industry: ${industryHint})` : ""
  }.

This name comes from a UK company/visa-sponsor list, so it is likely a real,
currently-operating UK-registered company. Search the web to confirm. If you
cannot confidently identify a real, currently active company matching this
exact name, respond with found: false rather than guessing — a wrong website
is worse than no website.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"website": "https://..." or null, "personalization_hook": "one sentence about what the company does or its product/mission, for use in a cold outreach email" or null, "found": true or false}`;
}

/** Looks up a company's official website + a short positioning hook via AI web search. */
export async function researchCompany(
  companyName: string,
  industryHint: string | null = null
): Promise<CompanyResearchResult> {
  const client = getOpenAIClient();

  try {
    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: buildPrompt(companyName, industryHint),
      tools: [{ type: "web_search", search_context_size: "low" }],
    });

    const raw = response.output_text ?? "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as Partial<CompanyResearchResult>;

    return {
      website: parsed.website ?? null,
      personalization_hook: parsed.personalization_hook ?? null,
      found: !!parsed.found && !!parsed.website,
    };
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      throw mapOpenAIError(err);
    }
    // A response that isn't valid JSON (e.g. the model explained instead of
    // answering) shouldn't crash a batch run — treat it as "not found".
    return { website: null, personalization_hook: null, found: false };
  }
}
