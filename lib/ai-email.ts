import type { Tables } from "@/types/database";
import { callClaude, parseClaudeJson, isClaudeConfigured } from "@/lib/claude-client";

export { isClaudeConfigured };

export type EmailDraft = {
  subject: string;
  body: string;
  positioning_angle: string;
  confidence: number;
};

function pickPositioning(
  companyIndustry: string | null,
  industries: Tables<"user_industries">[]
): Tables<"user_industries"> | null {
  if (companyIndustry) {
    const normalized = companyIndustry.toLowerCase();
    const match = industries.find((i) => normalized.includes(i.industry.toLowerCase()));
    if (match) return match;
  }
  return industries[0] ?? null;
}

export type JobPitch = {
  title: string;
  url?: string | null;
  description?: string | null;
};

function buildPrompt(
  profile: Tables<"user_profiles">,
  positioning: Tables<"user_industries"> | null,
  project: Tables<"user_projects"> | null,
  company: Tables<"companies">,
  job: JobPitch | null
) {
  return `You are writing a personalized cold email from a job candidate to a company, for UK Skilled Worker visa sponsorship outreach.

CANDIDATE DATA:
- Professional summary: ${profile.professional_summary ?? "Not provided"}
- Target role: ${profile.target_job_title ?? "Not provided"}
- ${positioning ? `${positioning.industry} experience: ${positioning.experience_description ?? "Not provided"}` : "No industry-specific positioning provided"}
- Problems solved: ${positioning?.problems_solved ?? "Not provided"}
- Motivation: ${positioning?.motivation ?? "Not provided"}
- Key achievement: ${project ? `${project.project_name} — ${project.impact ?? project.description ?? ""}` : "Not provided"}
- Unique thing about candidate: ${profile.unique_thing ?? "Not provided"}
- Tone: ${profile.writing_tone ?? "Professional and warm"}

COMPANY DATA:
- Name: ${company.company_name}
- Industry: ${company.industry ?? "Unknown"}
- Website: ${company.website ?? "Unknown"}
- Personalization hook: ${company.personalization_hook ?? "None provided — research the company's public product/mission and reference it generically"}

${job ? `SPECIFIC OPEN ROLE BEING PITCHED FOR:
- Title: ${job.title}
${job.description ? `- Description: ${job.description}` : ""}
This is a real, currently-open role at this company. Reference it explicitly and connect the candidate's actual experience directly to what this specific role needs — this should read as "I saw you're hiring for X and here's why I'd be a strong fit", not a generic cold intro.` : "No specific open role was given — write a general expression of interest in working there, without claiming a specific role exists."}

RULES:
1. Use ONLY the candidate's actual experience given above — never invent claims, metrics, or projects.
2. Reference the company's specific product/challenge using the personalization hook.
3. Connect the candidate's real experience to the company's likely need${job ? " and to the specific role above" : ""}.
4. Keep the body length between 70 and 150 words.
5. Tone: warm, direct, not corporate. No clichés like "passionate", "dynamic", "innovative".
6. End the body with a line: [Portfolio] [LinkedIn] [CV]
7. Sign off with the candidate's first name only (use "Candidate" if no name is available).
8. ${job ? `Reference the role title "${job.title}" in the subject line.` : "Do not use a generic subject line — make it specific to the company."}

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"subject": "...", "body": "...", "positioning_angle": "...", "confidence": 0-100}`;
}

export async function generateEmailDraft(
  profile: Tables<"user_profiles">,
  industries: Tables<"user_industries">[],
  projects: Tables<"user_projects">[],
  company: Tables<"companies">,
  job: JobPitch | null = null
): Promise<EmailDraft> {
  const positioning = pickPositioning(company.industry, industries);
  const project = projects[0] ?? null;
  const prompt = buildPrompt(profile, positioning, project, company, job);

  const raw = await callClaude(prompt, 600);

  let parsed: EmailDraft;
  try {
    parsed = parseClaudeJson<EmailDraft>(raw);
  } catch {
    throw new Error("Claude returned an unparseable response. Try regenerating.");
  }

  return {
    subject: parsed.subject,
    body: parsed.body,
    positioning_angle: parsed.positioning_angle ?? positioning?.industry ?? "general",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 70,
  };
}
