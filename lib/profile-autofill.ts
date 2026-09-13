import { callClaude, parseClaudeJson, isClaudeConfigured } from "@/lib/claude-client";

export { isClaudeConfigured as isAutofillConfigured };

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

export async function autofillProfileFromDocuments(
  resumeText: string,
  portfolioText: string,
  linkedinText: string
): Promise<AutofillResult> {
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

  const raw = await callClaude(prompt, 2000);

  try {
    return parseClaudeJson<AutofillResult>(raw);
  } catch {
    throw new Error("Could not parse the extracted profile. Try again or fill the form manually.");
  }
}
