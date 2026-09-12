import Anthropic from "@anthropic-ai/sdk";

export type AutofillResult = {
  profile: {
    location: string | null;
    years_experience: number | null;
    target_job_title: string | null;
    linkedin_url: string | null;
    portfolio_url: string | null;
    professional_summary: string | null;
    unique_thing: string | null;
  };
  industries: {
    industry: string;
    years_experience: number | null;
    experience_description: string | null;
    problems_solved: string | null;
    motivation: string | null;
  }[];
  skills: { design: string[]; tools: string[]; other: string[] };
  projects: {
    project_name: string;
    company_name: string | null;
    year: number | null;
    role: string | null;
    industry: string | null;
    description: string | null;
    impact: string | null;
  }[];
};

function realKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && !key.startsWith("sk-ant-api03-...") && key !== "your-anthropic-api-key" ? key : null;
}

export function isAutofillConfigured(): boolean {
  return !!realKey();
}

export async function autofillProfileFromDocuments(
  resumeText: string,
  portfolioText: string,
  linkedinText: string
): Promise<AutofillResult> {
  const key = realKey();
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add a real key to .env.local to enable profile autofill."
    );
  }

  const prompt = `You are extracting structured career profile data from a candidate's resume/CV, portfolio site, and LinkedIn summary, to pre-fill a job-outreach onboarding form. Use ONLY information actually present in the text below — never invent employers, dates, metrics, or achievements that aren't there. Leave a field null/empty if it isn't clearly stated.

RESUME/CV TEXT:
${resumeText || "(not provided)"}

PORTFOLIO SITE TEXT:
${portfolioText || "(not provided)"}

LINKEDIN SUMMARY TEXT:
${linkedinText || "(not provided)"}

Extract and respond with ONLY valid JSON, no markdown fences, in this exact shape:
{
  "profile": {
    "location": string|null,
    "years_experience": number|null,
    "target_job_title": string|null,
    "linkedin_url": string|null,
    "portfolio_url": string|null,
    "professional_summary": string|null (2-3 sentences, written in first person, based only on the text given),
    "unique_thing": string|null (one memorable detail if the text suggests one, else null)
  },
  "industries": [
    { "industry": "fintech"|"healthcare"|"saas"|"marketplace"|"ecommerce"|"other" (only include industries actually evidenced in the text),
      "years_experience": number|null,
      "experience_description": string|null,
      "problems_solved": string|null,
      "motivation": null
    }
  ],
  "skills": { "design": string[], "tools": string[], "other": string[] },
  "projects": [
    { "project_name": string, "company_name": string|null, "year": number|null, "role": string|null, "industry": string|null, "description": string|null, "impact": string|null (include metrics only if stated) }
  ]
}`;

  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    throw new Error("Could not parse the extracted profile. Try again or fill the form manually.");
  }
}
