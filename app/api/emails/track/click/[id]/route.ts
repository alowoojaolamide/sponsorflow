import { NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/lib/supabase-server";

function isSafeRedirectTarget(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("url");

  if (!destination || !isSafeRedirectTarget(destination)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const supabase = createSupabaseRouteClient();
    await supabase.rpc("record_email_click", { p_email_id: params.id, p_link: destination });
  } catch {
    // Never block the redirect on a tracking failure.
  }

  return NextResponse.redirect(destination);
}
