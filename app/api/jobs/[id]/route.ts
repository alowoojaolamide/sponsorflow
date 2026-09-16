import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";
import { requireUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

const VALID_STATUSES = ["new", "pitched", "applied", "dismissed"];

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  try {
    const { status } = await req.json();
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createSupabaseRouteClient();
    const { data, error } = await supabase
      .from("job_postings")
      .update({ status })
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, job: data });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
