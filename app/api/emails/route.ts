import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    emails: [],
    pendingCount: 0,
  });
}

export async function POST(req: Request) {
  const data = await req.json();
  return NextResponse.json({ success: true, email: data });
}
