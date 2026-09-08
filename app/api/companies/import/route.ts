import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { getCurrentUser } from "@/lib/auth";
import { getExistingNormalizedNames } from "@/lib/db";
import { parseCSV } from "@/lib/csv-parser";

type DuplicateStrategy = "skip" | "replace" | "merge";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const campaignTag = (formData.get("campaign_tag") as string | null) || null;
    const strategy = ((formData.get("duplicate_strategy") as string | null) || "skip") as DuplicateStrategy;

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "A CSV file is required" }, { status: 400 });
    }

    const text = await file.text();
    const { companies, unrecognized_columns } = parseCSV(text);

    if (companies.length === 0) {
      return NextResponse.json({ error: "No valid company rows found in the file" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const existing = await getExistingNormalizedNames(supabase, user.id);

    const { data: importRow, error: importError } = await supabase
      .from("company_imports")
      .insert({
        user_id: user.id,
        file_name: (file as File).name || "upload.csv",
        file_size: (file as File).size ?? null,
        companies_found: companies.length,
        status: "processing",
      })
      .select("*")
      .single();

    if (importError || !importRow) {
      return NextResponse.json({ error: importError?.message ?? "Failed to start import" }, { status: 500 });
    }

    const duplicateList: string[] = [];
    const toInsert = [];
    const toUpdate = [];

    for (const company of companies) {
      const isDuplicate = existing.has(company.normalized_name);
      if (isDuplicate) {
        duplicateList.push(company.company_name);
        if (strategy === "skip") continue;
        if (strategy === "replace" || strategy === "merge") {
          toUpdate.push(company);
          continue;
        }
      }
      toInsert.push(company);
      existing.add(company.normalized_name); // guard against dupes within the same file
    }

    let imported = 0;

    if (toInsert.length > 0) {
      const { data, error } = await supabase
        .from("companies")
        .insert(
          toInsert.map((c) => ({
            user_id: user.id,
            company_name: c.company_name,
            website: c.website,
            industry: c.industry,
            career_page: c.career_page,
            personalization_hook: c.personalization_hook,
            sponsor_status: c.sponsor_status,
            import_id: importRow.id,
            campaign_tag: campaignTag,
          }))
        )
        .select("id");
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      imported += data?.length ?? 0;
    }

    for (const c of toUpdate) {
      const { error } = await supabase
        .from("companies")
        .update({
          website: c.website ?? undefined,
          industry: c.industry ?? undefined,
          career_page: c.career_page ?? undefined,
          personalization_hook: c.personalization_hook ?? undefined,
          sponsor_status: c.sponsor_status ?? undefined,
          campaign_tag: campaignTag ?? undefined,
          import_id: importRow.id,
        })
        .eq("user_id", user.id)
        .eq("normalized_name", c.normalized_name);
      if (!error) imported++;
    }

    await supabase
      .from("company_imports")
      .update({
        companies_duplicates: duplicateList.length,
        companies_imported: imported,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", importRow.id);

    return NextResponse.json({
      import_id: importRow.id,
      total: companies.length,
      imported,
      duplicates: duplicateList.length,
      duplicate_list: duplicateList,
      unrecognized_columns,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
