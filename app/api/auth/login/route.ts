import { NextResponse } from "next/server";
import { loginUser } from "@/lib/auth";
import { handleApiError } from "@/lib/api-helpers";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { user, session, error } = await loginUser(email, password);

    if (error || !session || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user_id: user.id,
      expires_at: session.expires_at,
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
