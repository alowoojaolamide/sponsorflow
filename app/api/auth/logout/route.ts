import { NextResponse } from "next/server";
import { logoutUser } from "@/lib/auth";

export async function POST() {
  const { error } = await logoutUser();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
