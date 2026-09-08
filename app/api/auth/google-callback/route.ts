import { NextResponse } from "next/server";
import { exchangeOAuthCode } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
    }

    const { user, error } = await exchangeOAuthCode(code);

    if (error || !user) {
      return NextResponse.json(
        { error: error?.message ?? "Google sign-in failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user_id: user.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
