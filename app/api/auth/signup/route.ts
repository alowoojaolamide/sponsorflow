import { NextResponse } from "next/server";
import { signupUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, passwordConfirm, terms_accepted } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    if (passwordConfirm !== undefined && password !== passwordConfirm) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (!terms_accepted) {
      return NextResponse.json({ error: "Terms must be accepted" }, { status: 400 });
    }

    const { user, session, error } = await signupUser(email, password);

    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? "Signup failed" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: session
        ? "Account created and signed in."
        : "Verification email sent. Please check your inbox.",
      user_id: user.id,
      email_confirmation_required: !session,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
