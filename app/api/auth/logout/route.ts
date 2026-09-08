import { NextResponse } from "next/server";

export async function POST() {
  // Clear session cookies in Prompt 3
  return NextResponse.json({ success: true });
}
