import Anthropic from "@anthropic-ai/sdk";
import type { Tables } from "@/types/database";

export type EmailDraft = {
  subject: string;
  body: string;
  positioning_angle: string;
  confidence: number;
};

function realKey() {
  const key = process.env.ANTHROPIC_API_KEY;
  return key && !key.startsWith("sk-ant-api03-...") && key !== "your-anthropic-api-key" ? key : null;
}

export function isClaudeConfigured(): boolean {
  return !!realKey();
}

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

function buildPrompt(
  profile: Tables<"user_profiles">,
  positioning: Tables<"user_industries"> | null,
  project: Tables<"user_projects"> | null,
  company: Tables<"companies">
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

RULES:
1. Use ONLY the candidate's actual experience given above — never invent claims, metrics, or projects.
2. Reference the company's specific product/challenge using the personalization hook.
3. Connect the candidate's real experience to the company's likely need.
4. Keep the body length between 70 and 150 words.
5. Tone: warm, direct, not corporate. No clichés like "passionate", "dynamic", "innovative".
6. End the body with a line: [Portfolio] [LinkedIn] [CV]
7. Sign off with the candidate's first name only (use "Candidate" if no name is available).
8. Do not use a generic subject line — make it specific to the company and role.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"subject": "...", "body": "...", "positioning_angle": "...", "confidence": 0-100}`;
}

export async function generateEmailDraft(
  profile: Tables<"user_profiles">,
  industries: Tables<"user_industries">[],
  projects: Tables<"user_projects">[],
  company: Tables<"companies">
): Promise<EmailDraft> {
  const key = realKey();
  if (!key) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add a real key to .env.local to enable AI email generation."
    );
  }

  const positioning = pickPositioning(company.industry, industries);
  const project = projects[0] ?? null;
  const prompt = buildPrompt(profile, positioning, project, company);

  const client = new Anthropic({ apiKey: key });
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  const raw = textBlock && "text" in textBlock ? textBlock.text : "";

  let parsed: EmailDraft;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
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
