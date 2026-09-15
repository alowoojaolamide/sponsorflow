import type { Tables } from "@/types/database";
import { callAI, parseAIJson, isAIConfigured } from "@/lib/ai-client";
import type { JobPitch } from "@/lib/ai-email";

export { isAIConfigured };

export type LinkedInDraft = {
  connection_note: string;
  message: string;
  positioning_angle: string;
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

function buildPrompt(
  profile: Tables<"user_profiles">,
  positioning: Tables<"user_industries"> | null,
  project: Tables<"user_projects"> | null,
  company: Tables<"companies">,
  job: JobPitch | null
) {
  return `You are writing two LinkedIn outreach messages from a job candidate to someone at a company, for UK Skilled Worker visa sponsorship outreach. The candidate will copy-paste these manually — you are not sending anything.

CANDIDATE DATA:
- Professional summary: ${profile.professional_summary ?? "Not provided"}
- Target role: ${profile.target_job_title ?? "Not provided"}
- ${positioning ? `${positioning.industry} experience: ${positioning.experience_description ?? "Not provided"}` : "No industry-specific positioning provided"}
- Key achievement: ${project ? `${project.project_name} — ${project.impact ?? project.description ?? ""}` : "Not provided"}
- Unique thing about candidate: ${profile.unique_thing ?? "Not provided"}
- Tone: ${profile.writing_tone ?? "Professional and warm"}

COMPANY DATA:
- Name: ${company.company_name}
- Industry: ${company.industry ?? "Unknown"}
- Personalization hook: ${company.personalization_hook ?? "None provided — reference the company's public product/mission generically"}

${job ? `SPECIFIC OPEN ROLE BEING PITCHED FOR:
- Title: ${job.title}
${job.description ? `- Description: ${job.description}` : ""}
Reference this role naturally in the longer message.` : "No specific open role was given — express general interest in working there."}

Write TWO separate pieces of text:
1. "connection_note": a LinkedIn connection request note. HARD LIMIT 300 characters (LinkedIn's own cap). No greeting fluff, get straight to the specific reason for connecting.
2. "message": a longer LinkedIn message/InMail to send after connecting, or directly if messaging is already open. 60-120 words. Same rules as a cold email: use only the candidate's real experience, reference the company's specific product/challenge, no corporate clichés ("passionate", "dynamic", "innovative"), end by inviting a quick chat.

RULES:
1. Use ONLY the candidate's actual experience given above — never invent claims, metrics, or projects.
2. Sign off the message with the candidate's first name only (use "Candidate" if no name is available). The connection note does not need a sign-off (too short).
3. Do not use hashtags or emojis.

Respond with ONLY valid JSON, no markdown fences, in this exact shape:
{"connection_note": "...", "message": "...", "positioning_angle": "..."}`;
}

export async function generateLinkedInMessage(
  profile: Tables<"user_profiles">,
  industries: Tables<"user_industries">[],
  projects: Tables<"user_projects">[],
  company: Tables<"companies">,
  job: JobPitch | null = null
): Promise<LinkedInDraft> {
  const positioning = pickPositioning(company.industry, industries);
  const project = projects[0] ?? null;
  const prompt = buildPrompt(profile, positioning, project, company, job);

  const raw = await callAI(prompt, 500);

  let parsed: LinkedInDraft;
  try {
    parsed = parseAIJson<LinkedInDraft>(raw);
  } catch {
    throw new Error("The AI returned an unparseable response. Try regenerating.");
  }

  return {
    connection_note: parsed.connection_note,
    message: parsed.message,
    positioning_angle: parsed.positioning_angle ?? positioning?.industry ?? "general",
  };
}
