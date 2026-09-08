import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, terms_accepted } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!terms_accepted) {
      return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
    }

    // Prompt 3 will wire up full Supabase Auth & Bcrypt password hashing
    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      user_id: "pending-verification",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
