import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { extractTextFromFile, extractTextFromUrl } from "@/lib/document-extract";
import { autofillProfileFromDocuments, isAutofillConfigured } from "@/lib/profile-autofill";
import { checkAndConsumeAiCall } from "@/lib/rate-limit";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  if (!isAutofillConfigured()) {
    return NextResponse.json(
      { error: "Profile autofill is not configured yet (OPENAI_API_KEY missing)." },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const resumeFile = formData.get("resume");
    const portfolioUrl = (formData.get("portfolio_url") as string | null) || "";
    const linkedinText = (formData.get("linkedin_text") as string | null) || "";

    if (!resumeFile && !portfolioUrl && !linkedinText) {
      return NextResponse.json(
        { error: "Provide at least a resume file, a portfolio URL, or pasted LinkedIn text." },
        { status: 400 }
      );
    }

    const [resumeText, portfolioText] = await Promise.all([
      resumeFile && typeof resumeFile !== "string" ? extractTextFromFile(resumeFile) : Promise.resolve(""),
      portfolioUrl ? extractTextFromUrl(portfolioUrl) : Promise.resolve(""),
    ]);

    if (!resumeText && !portfolioText && !linkedinText) {
      return NextResponse.json(
        { error: "Couldn't read any text from what was provided. Try a different file or paste text directly." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseRouteClient();
    const aiLimit = await checkAndConsumeAiCall(supabase, user.id);
    if (!aiLimit.allowed) {
      return NextResponse.json({ error: aiLimit.reason, code: "ai_cap_reached" }, { status: 429 });
    }

    const result = await autofillProfileFromDocuments(resumeText, portfolioText, linkedinText);
    if (!result.profile) {
      throw new Error("Could not parse the extracted profile. Try again or fill the form manually.");
    }
    if (portfolioUrl && !result.profile.portfolio_url) {
      result.profile.portfolio_url = portfolioUrl;
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
