import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    emails_sent_today: 0,
    daily_limit: 20,
    open_rate: 0,
    reply_rate: 0,
    interviews_scheduled: 0,
  });
}
