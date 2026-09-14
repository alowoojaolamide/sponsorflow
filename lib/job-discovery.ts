import { extractTextFromUrl } from "@/lib/document-extract";
import { callClaude, parseClaudeJson, isClaudeConfigured } from "@/lib/claude-client";

export type DiscoveredJob = {
  source: "greenhouse" | "lever" | "career_page";
  external_id: string;
  title: string;
  url: string | null;
  location: string | null;
  description: string | null;
};

const DEFAULT_KEYWORDS = [
  "product designer",
  "product design",
  "ux designer",
  "ui designer",
  "ux/ui",
  "user experience designer",
  "interaction designer",
  "visual designer",
  "design lead",
  "principal designer",
  "senior designer",
  "staff designer",
];

export function isRelevantTitle(title: string, extraKeywords: string[] = []): boolean {
  const t = title.toLowerCase();
  return [...DEFAULT_KEYWORDS, ...extraKeywords.map((k) => k.toLowerCase())].some((k) => t.includes(k));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\b(limited|ltd|llc|inc|plc|corp|corporation|group|technologies|tech|solutions|uk)\b/gi, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugCandidates(companyName: string, website: string | null): string[] {
  const candidates = new Set<string>();
  candidates.add(slugify(companyName));
  candidates.add(companyName.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  if (website) {
    const domain = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/.]/)[0];
    if (domain) candidates.add(slugify(domain));
  }
  return Array.from(candidates).filter((s) => s.length > 1);
}

async function tryGreenhouse(slug: string): Promise<DiscoveredJob[] | null> {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SponsorFlowBot/1.0)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.jobs)) return null;
    return data.jobs.map((j: { id: number; title: string; absolute_url: string; location?: { name?: string } }) => ({
      source: "greenhouse" as const,
      external_id: String(j.id),
      title: j.title,
      url: j.absolute_url,
      location: j.location?.name ?? null,
      description: null,
    }));
  } catch {
    return null;
  }
}

async function tryLever(slug: string): Promise<DiscoveredJob[] | null> {
  try {
    const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SponsorFlowBot/1.0)" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data.map((j: { id: string; text: string; hostedUrl: string; categories?: { location?: string } }) => ({
      source: "lever" as const,
      external_id: j.id,
      title: j.text,
      url: j.hostedUrl,
      location: j.categories?.location ?? null,
      description: null,
    }));
  } catch {
    return null;
  }
}

/** Scans a company's own career page for an embedded Greenhouse/Lever board link. */
async function findAtsSlugFromCareerPage(url: string): Promise<{ source: "greenhouse" | "lever"; slug: string } | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (compatible; SponsorFlowBot/1.0)" } });
    if (!res.ok) return null;
    const html = await res.text();

    const ghMatch = html.match(/(?:job-boards|boards)\.greenhouse\.io\/([a-z0-9-]+)/i);
    if (ghMatch) return { source: "greenhouse", slug: ghMatch[1] };

    const leverMatch = html.match(/jobs\.lever\.co\/([a-z0-9-]+)/i);
    if (leverMatch) return { source: "lever", slug: leverMatch[1] };

    return null;
  } catch {
    return null;
  }
}

async function extractJobsFromCareerPageWithAI(url: string): Promise<DiscoveredJob[]> {
  if (!isClaudeConfigured()) return [];

  const text = await extractTextFromUrl(url);
  if (!text) return [];

  const prompt = `Below is the visible text of a company careers page. List ONLY real, currently-open roles related to product design, UX, or UI design that are ACTUALLY PRESENT in this text. Do not invent roles. If there are none, return an empty array.

CAREERS PAGE TEXT:
${text}

Respond with ONLY valid JSON, no markdown fences:
{"jobs": [{"title": "...", "location": "..."|null}]}`;

  try {
    const raw = await callClaude(prompt, 800);
    const parsed = parseClaudeJson<{ jobs: { title: string; location: string | null }[] }>(raw);
    return (parsed.jobs ?? []).map((j) => ({
      source: "career_page" as const,
      external_id: `${url}::${j.title}`,
      title: j.title,
      url,
      location: j.location,
      description: null,
    }));
  } catch {
    return [];
  }
}

export async function discoverJobsForCompany(
  companyName: string,
  website: string | null,
  careerPage: string | null,
  extraKeywords: string[] = []
): Promise<DiscoveredJob[]> {
  const candidates = slugCandidates(companyName, website);

  for (const slug of candidates) {
    const gh = await tryGreenhouse(slug);
    if (gh) return gh.filter((j) => isRelevantTitle(j.title, extraKeywords));

    const lever = await tryLever(slug);
    if (lever) return lever.filter((j) => isRelevantTitle(j.title, extraKeywords));
  }

  if (careerPage) {
    const found = await findAtsSlugFromCareerPage(careerPage);
    if (found) {
      const jobs = found.source === "greenhouse" ? await tryGreenhouse(found.slug) : await tryLever(found.slug);
      if (jobs) return jobs.filter((j) => isRelevantTitle(j.title, extraKeywords));
    }

    // Last resort: AI extraction directly from the page's visible text.
    const aiJobs = await extractJobsFromCareerPageWithAI(careerPage);
    return aiJobs.filter((j) => isRelevantTitle(j.title, extraKeywords));
  }

  return [];
}
