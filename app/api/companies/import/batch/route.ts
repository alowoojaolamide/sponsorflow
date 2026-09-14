import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getExistingNormalizedNamesAmong } from "@/lib/db";
import type { ParsedCompany } from "@/lib/csv-parser";

type DuplicateStrategy = "skip" | "replace" | "merge";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      import_id,
      companies,
      campaign_tag,
      duplicate_strategy,
    }: {
      import_id: string;
      companies: ParsedCompany[];
      campaign_tag: string | null;
      duplicate_strategy: DuplicateStrategy;
    } = await req.json();

    if (!import_id || !Array.isArray(companies) || companies.length === 0) {
      return NextResponse.json({ error: "import_id and a non-empty companies array are required" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();

    const { data: importRow } = await supabase
      .from("company_imports")
      .select("id")
      .eq("id", import_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!importRow) {
      return NextResponse.json({ error: "Import not found" }, { status: 404 });
    }

    const candidateNames = companies.map((c) => c.normalized_name);
    const existing = await getExistingNormalizedNamesAmong(supabase, user.id, candidateNames);

    // Build the write set: skip rows entirely for "skip" strategy when we
    // already know they exist; otherwise include them (upsert will update).
    // Within-batch repeats are deduped too — a single upsert() call can't
    // affect the same conflict target twice.
    const duplicateList: string[] = [];
    const rowsToWrite: ParsedCompany[] = [];
    const writtenNames = new Set<string>();

    for (const company of companies) {
      const existsInDb = existing.has(company.normalized_name);
      const alreadyQueued = writtenNames.has(company.normalized_name);

      if (existsInDb || alreadyQueued) {
        duplicateList.push(company.company_name);
      }
      if (alreadyQueued) continue;
      if (existsInDb && duplicate_strategy === "skip") continue;

      rowsToWrite.push(company);
      writtenNames.add(company.normalized_name);
    }

    let imported = 0;

    if (rowsToWrite.length > 0) {
      // ignoreDuplicates (ON CONFLICT DO NOTHING) for "skip" also acts as a
      // safety net against a same-name row landing in two concurrent
      // batches — Postgres resolves the conflict atomically either way,
      // rather than racing in application code.
      const { data, error } = await supabase
        .from("companies")
        .upsert(
          rowsToWrite.map((c) => ({
            user_id: user.id,
            company_name: c.company_name,
            website: c.website,
            industry: c.industry,
            career_page: c.career_page,
            personalization_hook: c.personalization_hook,
            sponsor_status: c.sponsor_status,
            import_id,
            campaign_tag: campaign_tag ?? null,
          })),
          { onConflict: "user_id,normalized_name", ignoreDuplicates: duplicate_strategy === "skip" }
        )
        .select("id");

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      imported = data?.length ?? 0;
    }

    return NextResponse.json({
      imported,
      duplicates: duplicateList.length,
      duplicate_list: duplicateList,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
