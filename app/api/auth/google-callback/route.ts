import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
    }

    // Prompt 4 will handle OAuth 2.0 exchange with Google & Supabase session creation
    return NextResponse.json({
      success: true,
      token: "demo-google-token",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
