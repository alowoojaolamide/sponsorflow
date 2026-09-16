"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const TOTAL_STEPS = 10;

const STEP_TITLES = [
  "Welcome",
  "Basic Info",
  "Professional Background",
  "Skills",
  "Key Projects",
  "Sponsorship & Legal",
  "Fintech Positioning",
  "Healthcare Positioning",
  "Your Story",
  "Review & Confirm",
];

const INDUSTRIES = ["fintech", "healthcare", "saas", "marketplace", "ecommerce", "other"];
const DESIGN_SKILLS = [
  "User Research",
  "Wireframing",
  "Prototyping",
  "Visual Design",
  "Interaction Design",
  "Design Systems",
  "Usability Testing",
  "Information Architecture",
];
const TOOLS = ["Figma", "Sketch", "Adobe XD", "Miro", "Notion", "Framer", "Principle", "InVision"];

type Project = {
  project_name: string;
  company_name: string;
  year: string;
  description: string;
  role: string;
  industry: string;
  impact: string;
};

type RawProject = {
  project_name: string;
  company_name: string | null;
  year: number | null;
  description: string | null;
  role: string | null;
  industry: string | null;
  impact: string | null;
};

/** Converts a project as returned by the API (nullable fields, numeric year) into the wizard's form-shaped Project (empty strings, string year). Shared by the initial profile-load fetch and the resume-autofill merge, which both receive this same shape. */
function normalizeProject(p: RawProject): Project {
  return {
    project_name: p.project_name ?? "",
    company_name: p.company_name ?? "",
    year: p.year?.toString() ?? "",
    description: p.description ?? "",
    role: p.role ?? "",
    industry: p.industry ?? "",
    impact: p.impact ?? "",
  };
}

type WizardState = {
  location: string;
  years_experience: string;
  target_job_title: string;
  linkedin_url: string;
  portfolio_url: string;
  industries: string[];
  industry_years: Record<string, string>;
  design_skills: string[];
  tools: string[];
  other_skills: string;
  projects: Project[];
  requires_sponsorship: boolean;
  target_salary_gbp: string;
  availability: string;
  remote_preference: string;
  fintech_experience: string;
  fintech_problems: string;
  fintech_motivation: string;
  healthcare_experience: string;
  healthcare_problems: string;
  healthcare_motivation: string;
  professional_summary: string;
  unique_thing: string;
  writing_tone: string;
  example_phrases: string;
};

const emptyProject: Project = {
  project_name: "",
  company_name: "",
  year: "",
  description: "",
  role: "",
  industry: "",
  impact: "",
};

const initialState: WizardState = {
  location: "",
  years_experience: "",
  target_job_title: "",
  linkedin_url: "",
  portfolio_url: "",
  industries: [],
  industry_years: {},
  design_skills: [],
  tools: [],
  other_skills: "",
  projects: [{ ...emptyProject }],
  requires_sponsorship: true,
  target_salary_gbp: "",
  availability: "",
  remote_preference: "",
  fintech_experience: "",
  fintech_problems: "",
  fintech_motivation: "",
  healthcare_experience: "",
  healthcare_problems: "",
  healthcare_motivation: "",
  professional_summary: "",
  unique_thing: "",
  writing_tone: "Professional and Warm",
  example_phrases: "",
};

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

type AutofillResult = {
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

export function OnboardingWizard({ step }: { step: number }) {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        const p = data.profile;
        if (p) {
          const fintech = data.industries.find((i: { industry: string }) => i.industry === "fintech");
          const healthcare = data.industries.find((i: { industry: string }) => i.industry === "healthcare");
          setState((s) => ({
            ...s,
            location: p.location ?? "",
            years_experience: p.years_experience?.toString() ?? "",
            target_job_title: p.target_job_title ?? "",
            linkedin_url: p.linkedin_url ?? "",
            portfolio_url: p.portfolio_url ?? "",
            industries: data.industries.map((i: { industry: string }) => i.industry),
            industry_years: Object.fromEntries(
              data.industries.map((i: { industry: string; years_experience: number | null }) => [
                i.industry,
                i.years_experience?.toString() ?? "",
              ])
            ),
            design_skills: data.skills
              .filter((sk: { skill_category: string }) => sk.skill_category === "design")
              .map((sk: { skill_name: string }) => sk.skill_name),
            tools: data.skills
              .filter((sk: { skill_category: string }) => sk.skill_category === "tools")
              .map((sk: { skill_name: string }) => sk.skill_name),
            other_skills: data.skills
              .filter((sk: { skill_category: string }) => sk.skill_category === "other")
              .map((sk: { skill_name: string }) => sk.skill_name)
              .join(", "),
            projects: data.projects.length > 0 ? data.projects.map(normalizeProject) : [{ ...emptyProject }],
            requires_sponsorship: p.requires_sponsorship ?? true,
            target_salary_gbp: p.target_salary_gbp?.toString() ?? "",
            availability: p.availability ?? "",
            remote_preference: p.remote_preference ?? "",
            fintech_experience: fintech?.experience_description ?? "",
            fintech_problems: fintech?.problems_solved ?? "",
            fintech_motivation: fintech?.motivation ?? "",
            healthcare_experience: healthcare?.experience_description ?? "",
            healthcare_problems: healthcare?.problems_solved ?? "",
            healthcare_motivation: healthcare?.motivation ?? "",
            professional_summary: p.professional_summary ?? "",
            unique_thing: p.unique_thing ?? "",
            writing_tone: p.writing_tone ?? "Professional and Warm",
            example_phrases: p.example_phrases ?? "",
          }));
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  function set<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function mergeAutofillResult(result: AutofillResult) {
    setState((s) => {
      const fintech = result.industries.find((i) => i.industry === "fintech");
      const healthcare = result.industries.find((i) => i.industry === "healthcare");
      const extractedDesign = result.skills.design.filter((sk) => DESIGN_SKILLS.includes(sk));
      const extractedTools = result.skills.tools.filter((sk) => TOOLS.includes(sk));
      const leftover = [
        ...result.skills.design.filter((sk) => !DESIGN_SKILLS.includes(sk)),
        ...result.skills.tools.filter((sk) => !TOOLS.includes(sk)),
        ...result.skills.other,
      ];

      return {
        ...s,
        location: result.profile.location ?? s.location,
        years_experience: result.profile.years_experience?.toString() ?? s.years_experience,
        target_job_title: result.profile.target_job_title ?? s.target_job_title,
        linkedin_url: result.profile.linkedin_url ?? s.linkedin_url,
        portfolio_url: result.profile.portfolio_url ?? s.portfolio_url,
        professional_summary: result.profile.professional_summary ?? s.professional_summary,
        unique_thing: result.profile.unique_thing ?? s.unique_thing,
        industries: Array.from(new Set([...s.industries, ...result.industries.map((i) => i.industry)])),
        industry_years: {
          ...s.industry_years,
          ...Object.fromEntries(
            result.industries
              .filter((i) => i.years_experience != null)
              .map((i) => [i.industry, String(i.years_experience)])
          ),
        },
        design_skills: Array.from(new Set([...s.design_skills, ...extractedDesign])),
        tools: Array.from(new Set([...s.tools, ...extractedTools])),
        other_skills: [s.other_skills, leftover.join(", ")].filter(Boolean).join(", "),
        projects: result.projects.length > 0 ? result.projects.map(normalizeProject) : s.projects,
        fintech_experience: fintech?.experience_description ?? s.fintech_experience,
        fintech_problems: fintech?.problems_solved ?? s.fintech_problems,
        healthcare_experience: healthcare?.experience_description ?? s.healthcare_experience,
        healthcare_problems: healthcare?.problems_solved ?? s.healthcare_problems,
      };
    });
  }

  function validate(): string | null {
    switch (step) {
      case 2:
        if (!state.location || !state.years_experience || !state.target_job_title) {
          return "Location, years of experience, and target job title are required.";
        }
        break;
      case 3:
        if (state.industries.length === 0) return "Select at least one industry.";
        break;
      case 4:
        if (state.design_skills.length < 3) return "Select at least 3 design skills.";
        break;
      case 5:
        if (state.projects.filter((p) => p.project_name.trim()).length === 0) {
          return "Add at least one project.";
        }
        break;
      case 6:
        if (!state.target_salary_gbp || !state.availability) {
          return "Target salary and availability are required.";
        }
        break;
      case 9:
        if (!state.professional_summary) return "Professional summary is required.";
        break;
    }
    return null;
  }

  function buildIndustryPayload() {
    // Fintech and healthcare each get a dedicated onboarding step (7 & 8)
    // capturing deeper positioning, independent of whether the industry was
    // also ticked in step 3's background-industries list.
    const specialPositioning: Record<string, { experience: string; problems: string; motivation: string }> = {
      fintech: {
        experience: state.fintech_experience,
        problems: state.fintech_problems,
        motivation: state.fintech_motivation,
      },
      healthcare: {
        experience: state.healthcare_experience,
        problems: state.healthcare_problems,
        motivation: state.healthcare_motivation,
      },
    };

    const base = state.industries.map((name) => {
      const special = specialPositioning[name];
      return {
        industry: name,
        years_experience: state.industry_years[name] ? Number(state.industry_years[name]) : undefined,
        experience_description: special?.experience || undefined,
        problems_solved: special?.problems || undefined,
        motivation: special?.motivation || undefined,
      };
    });

    // Ensure fintech/healthcare positioning is saved even if not selected as a background industry.
    const extras = Object.entries(specialPositioning)
      .filter(([name, p]) => !state.industries.includes(name) && (p.experience || p.problems || p.motivation))
      .map(([name, p]) => ({
        industry: name,
        years_experience: undefined,
        experience_description: p.experience || undefined,
        problems_solved: p.problems || undefined,
        motivation: p.motivation || undefined,
      }));

    return [...base, ...extras];
  }

  async function save(isComplete = false) {
    setSaveStatus("saving");

    const otherSkills = state.other_skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      profile: {
        location: state.location || null,
        years_experience: state.years_experience ? Number(state.years_experience) : null,
        target_job_title: state.target_job_title || null,
        linkedin_url: state.linkedin_url || null,
        portfolio_url: state.portfolio_url || null,
        requires_sponsorship: state.requires_sponsorship,
        target_salary_gbp: state.target_salary_gbp ? Number(state.target_salary_gbp) : null,
        availability: state.availability || null,
        remote_preference: state.remote_preference || null,
        professional_summary: state.professional_summary || null,
        unique_thing: state.unique_thing || null,
        writing_tone: state.writing_tone || null,
        example_phrases: state.example_phrases || null,
      },
      industries: buildIndustryPayload(),
      skills: [
        ...state.design_skills.map((s) => ({ skill_name: s, skill_category: "design" })),
        ...state.tools.map((s) => ({ skill_name: s, skill_category: "tools" })),
        ...otherSkills.map((s) => ({ skill_name: s, skill_category: "other" })),
      ],
      projects: state.projects
        .filter((p) => p.project_name.trim())
        .map((p) => ({
          project_name: p.project_name,
          company_name: p.company_name || undefined,
          year: p.year ? Number(p.year) : undefined,
          description: p.description || undefined,
          role: p.role || undefined,
          industry: p.industry || undefined,
          impact: p.impact || undefined,
        })),
      complete: isComplete,
    };

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to save");
    }

    setSaveStatus("saved");
  }

  async function handleNext() {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      if (step === TOTAL_STEPS) {
        await save(true);
        router.push("/dashboard");
        return;
      }
      await save(false);
      router.push(`/onboarding/step-${step + 1}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  function handleBack() {
    if (step > 1) router.push(`/onboarding/step-${step - 1}`);
  }

  async function jumpToStep(target: number) {
    if (target === step) return;
    setError(null);
    try {
      await save(false);
      router.push(`/onboarding/step-${target}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    }
  }

  if (!loaded) {
    return <div className="text-center text-sm text-shade-50 py-20">Loading your profile...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between text-xs text-shade-50 mb-2">
          <span>
            Step {step} / {TOTAL_STEPS} — {STEP_TITLES[step - 1]}
          </span>
          {saveStatus === "saving" && <span>Saving...</span>}
          {saveStatus === "saved" && <span className="text-emerald-600">✓ Saved</span>}
        </div>
        <div className="flex items-center gap-1.5">
          {STEP_TITLES.map((title, i) => {
            const n = i + 1;
            const isCurrent = n === step;
            const isDone = n < step;
            return (
              <button
                key={n}
                type="button"
                title={title}
                aria-label={`Jump to step ${n}: ${title}`}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => jumpToStep(n)}
                className={`h-1.5 flex-1 rounded-pill transition-all ${
                  isCurrent
                    ? "bg-primary"
                    : isDone
                    ? "bg-primary/50 hover:bg-primary/70"
                    : "bg-hairline-light hover:bg-shade-30"
                }`}
              />
            );
          })}
        </div>
      </div>

      {step === 1 && <AutofillPanel onResult={mergeAutofillResult} />}

      <Card className="p-8">
        {error && (
          <div className="p-3 mb-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300">
            {error}
          </div>
        )}

        <StepContent step={step} state={state} set={set} />
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline-light" onClick={handleBack} disabled={step === 1}>
          Back
        </Button>
        <Button variant="primary" onClick={handleNext}>
          {step === TOTAL_STEPS ? "Complete Setup" : "Next"}
        </Button>
      </div>
    </div>
  );
}

function AutofillPanel({ onResult }: { onResult: (result: AutofillResult) => void }) {
  const [open, setOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleAutofill() {
    setError(null);
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append("resume", resumeFile);
      if (portfolioUrl) formData.append("portfolio_url", portfolioUrl);
      if (linkedinText) formData.append("linkedin_text", linkedinText);

      const res = await fetch("/api/profile/autofill", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Autofill failed");

      onResult(data);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Autofill failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6 border-primary/30 bg-aloe-10/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink">Skip the typing — autofill from your CV</p>
            <p className="text-xs text-shade-50 mt-0.5">
              Upload your resume (and optionally a portfolio link or LinkedIn summary) and AI will
              pre-fill your background, skills, and projects below. You still review and edit every
              step before saving — nothing is invented that isn&apos;t in your documents.
            </p>
          </div>
        </div>
        <Button type="button" variant="outline-light" size="sm" onClick={() => setOpen((o) => !o)}>
          {open ? "Close" : "Try it"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 space-y-3 border-t border-hairline-light pt-4">
          {error && (
            <div className="p-2.5 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 dark:bg-red-950/40 dark:border-red-800/60 dark:text-red-300">
              {error}
            </div>
          )}
          {success && !error && (
            <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800/60 dark:text-emerald-300">
              Profile pre-filled. Click Next to review each step.
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Resume / CV (PDF or DOCX)</label>
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </div>

          <Input
            label="Portfolio URL (optional)"
            placeholder="https://yourportfolio.com"
            value={portfolioUrl}
            onChange={(e) => setPortfolioUrl(e.target.value)}
          />

          <TextArea
            label="Paste your LinkedIn 'About' section (optional)"
            value={linkedinText}
            onChange={setLinkedinText}
            rows={4}
          />

          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={isSubmitting || (!resumeFile && !portfolioUrl && !linkedinText)}
            onClick={handleAutofill}
          >
            {isSubmitting ? "Reading your documents..." : "Autofill My Profile"}
          </Button>
        </div>
      )}
    </Card>
  );
}

function StepContent({
  step,
  state,
  set,
}: {
  step: number;
  state: WizardState;
  set: <K extends keyof WizardState>(key: K, value: WizardState[K]) => void;
}) {
  function updateProject(idx: number, patch: Partial<Project>) {
    set("projects", state.projects.map((p, i) => (i === idx ? { ...p, ...patch } : p)));
  }

  switch (step) {
    case 1:
      return (
        <div className="text-center space-y-4 py-6">
          <CardTitle className="text-2xl">Welcome to SponsorFlow!</CardTitle>
          <p className="text-sm text-shade-50 max-w-md mx-auto">
            Over the next 10 steps we&apos;ll capture your background, skills, projects, and
            positioning so every outreach email is personalized with your real experience — never
            invented claims.
          </p>
        </div>
      );

    case 2:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Basic Info</CardTitle></CardHeader>
          <Input label="Location" placeholder="London, UK" value={state.location} onChange={(e) => set("location", e.target.value)} />
          <Input label="Years of Experience" type="number" min={0} value={state.years_experience} onChange={(e) => set("years_experience", e.target.value)} />
          <Input label="Target Job Title" placeholder="Senior Product Designer" value={state.target_job_title} onChange={(e) => set("target_job_title", e.target.value)} />
          <Input label="LinkedIn URL (optional)" value={state.linkedin_url} onChange={(e) => set("linkedin_url", e.target.value)} />
          <Input label="Portfolio URL (optional)" value={state.portfolio_url} onChange={(e) => set("portfolio_url", e.target.value)} />
        </div>
      );

    case 3:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Professional Background</CardTitle></CardHeader>
          <p className="text-sm text-shade-50">Which industries have you worked in?</p>
          <div className="grid grid-cols-2 gap-3">
            {INDUSTRIES.map((ind) => (
              <label key={ind} className="flex items-center gap-2 text-sm capitalize">
                <input
                  type="checkbox"
                  checked={state.industries.includes(ind)}
                  onChange={() => set("industries", toggle(state.industries, ind))}
                />
                {ind}
              </label>
            ))}
          </div>
          {state.industries.map((ind) => (
            <Input
              key={ind}
              label={`Years in ${ind}`}
              type="number"
              min={0}
              value={state.industry_years[ind] ?? ""}
              onChange={(e) => set("industry_years", { ...state.industry_years, [ind]: e.target.value })}
            />
          ))}
        </div>
      );

    case 4:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Skills</CardTitle></CardHeader>
          <p className="text-sm text-shade-50">Design skills (select at least 3)</p>
          <div className="grid grid-cols-2 gap-3">
            {DESIGN_SKILLS.map((skill) => (
              <label key={skill} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.design_skills.includes(skill)}
                  onChange={() => set("design_skills", toggle(state.design_skills, skill))}
                />
                {skill}
              </label>
            ))}
          </div>
          <p className="text-sm text-shade-50 pt-2">Tools</p>
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map((tool) => (
              <label key={tool} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={state.tools.includes(tool)}
                  onChange={() => set("tools", toggle(state.tools, tool))}
                />
                {tool}
              </label>
            ))}
          </div>
          <Input label="Other skills (comma-separated)" value={state.other_skills} onChange={(e) => set("other_skills", e.target.value)} />
        </div>
      );

    case 5:
      return (
        <div className="space-y-6">
          <CardHeader className="px-0"><CardTitle>Key Projects</CardTitle></CardHeader>
          {state.projects.map((proj, idx) => (
            <div key={idx} className="p-4 rounded-md border border-hairline-light space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-shade-50 uppercase">Project {idx + 1}</span>
                {state.projects.length > 1 && (
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() => set("projects", state.projects.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </button>
                )}
              </div>
              <Input label="Project Name" value={proj.project_name} onChange={(e) => updateProject(idx, { project_name: e.target.value })} />
              <Input label="Company" value={proj.company_name} onChange={(e) => updateProject(idx, { company_name: e.target.value })} />
              <Input label="Year" type="number" value={proj.year} onChange={(e) => updateProject(idx, { year: e.target.value })} />
              <Input label="Role" value={proj.role} onChange={(e) => updateProject(idx, { role: e.target.value })} />
              <Input label="Industry" value={proj.industry} onChange={(e) => updateProject(idx, { industry: e.target.value })} />
              <Input label="Description" value={proj.description} onChange={(e) => updateProject(idx, { description: e.target.value })} />
              <Input label="Impact (with metrics)" value={proj.impact} onChange={(e) => updateProject(idx, { impact: e.target.value })} />
            </div>
          ))}
          <Button type="button" variant="outline-light" size="sm" onClick={() => set("projects", [...state.projects, { ...emptyProject }])}>
            + Add Project
          </Button>
        </div>
      );

    case 6:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Sponsorship & Legal</CardTitle></CardHeader>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Do you require UK Skilled Worker sponsorship?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={state.requires_sponsorship === true} onChange={() => set("requires_sponsorship", true)} /> Yes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={state.requires_sponsorship === false} onChange={() => set("requires_sponsorship", false)} /> No
              </label>
            </div>
          </div>
          <Input label="Target Annual Salary (GBP)" type="number" value={state.target_salary_gbp} onChange={(e) => set("target_salary_gbp", e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Availability</label>
            <select className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5" value={state.availability} onChange={(e) => set("availability", e.target.value)}>
              <option value="">Select...</option>
              <option value="immediate">Immediately</option>
              <option value="2_weeks">2 weeks notice</option>
              <option value="1_month">1 month notice</option>
              <option value="3_months">3 months notice</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Remote Preference</label>
            <select className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5" value={state.remote_preference} onChange={(e) => set("remote_preference", e.target.value)}>
              <option value="">Select...</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
              <option value="flexible">Flexible</option>
            </select>
          </div>
        </div>
      );

    case 7:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Fintech Positioning</CardTitle></CardHeader>
          <TextArea label="Your fintech experience" value={state.fintech_experience} onChange={(v) => set("fintech_experience", v)} />
          <TextArea label="Problems you've solved" value={state.fintech_problems} onChange={(v) => set("fintech_problems", v)} />
          <TextArea label="What draws you to fintech" value={state.fintech_motivation} onChange={(v) => set("fintech_motivation", v)} />
          <a href="/api/profile/template" className="text-sm text-primary underline underline-offset-4 inline-block">
            Download Personalization Template (DOCX)
          </a>
        </div>
      );

    case 8:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Healthcare Positioning</CardTitle></CardHeader>
          <TextArea label="Your healthcare experience" value={state.healthcare_experience} onChange={(v) => set("healthcare_experience", v)} />
          <TextArea label="Problems you've solved" value={state.healthcare_problems} onChange={(v) => set("healthcare_problems", v)} />
          <TextArea label="What draws you to healthcare" value={state.healthcare_motivation} onChange={(v) => set("healthcare_motivation", v)} />
        </div>
      );

    case 9:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Your Story</CardTitle></CardHeader>
          <TextArea label="Professional summary" value={state.professional_summary} onChange={(v) => set("professional_summary", v)} rows={4} />
          <TextArea label="One thing not on your resume" value={state.unique_thing} onChange={(v) => set("unique_thing", v)} />
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Writing tone</label>
            <select className="w-full min-h-[44px] rounded-md border border-hairline-light bg-canvas-light px-3.5" value={state.writing_tone} onChange={(e) => set("writing_tone", e.target.value)}>
              <option>Direct</option>
              <option>Professional and Warm</option>
              <option>Formal</option>
            </select>
          </div>
          <Input label="Example phrases (comma-separated)" value={state.example_phrases} onChange={(e) => set("example_phrases", e.target.value)} />
        </div>
      );

    case 10:
      return (
        <div className="space-y-4">
          <CardHeader className="px-0"><CardTitle>Review & Confirm</CardTitle></CardHeader>
          <ReviewRow label="Location" value={state.location} />
          <ReviewRow label="Target Role" value={state.target_job_title} />
          <ReviewRow label="Industries" value={state.industries.join(", ") || "—"} />
          <ReviewRow label="Design Skills" value={state.design_skills.join(", ") || "—"} />
          <ReviewRow label="Projects" value={state.projects.filter((p) => p.project_name).map((p) => p.project_name).join(", ") || "—"} />
          <ReviewRow label="Sponsorship Required" value={state.requires_sponsorship ? "Yes" : "No"} />
          <ReviewRow label="Target Salary" value={state.target_salary_gbp ? `£${state.target_salary_gbp}` : "—"} />
          <ReviewRow label="Summary" value={state.professional_summary || "—"} />
          <p className="text-sm text-shade-50 pt-2">
            Click &quot;Complete Setup&quot; to finish onboarding and go to your dashboard.
          </p>
        </div>
      );

    default:
      return null;
  }
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="w-full space-y-1.5">
      <label className="block text-sm font-medium text-ink">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex w-full rounded-md border border-hairline-light bg-canvas-light px-3.5 py-2.5 text-base text-ink placeholder:text-shade-40 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b border-hairline-light last:border-0">
      <span className="text-xs font-semibold text-shade-40 uppercase">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
