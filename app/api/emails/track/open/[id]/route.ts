import { createSupabaseRouteClient } from "@/lib/supabase-server";

// 1x1 transparent GIF.
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
  "base64"
);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createSupabaseRouteClient();
    await supabase.rpc("record_email_open", { p_email_id: params.id });
  } catch {
    // Never let tracking failures surface to the recipient's email client.
  }

  return new Response(new Uint8Array(PIXEL), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Content-Length": String(PIXEL.length),
    },
  });
}
