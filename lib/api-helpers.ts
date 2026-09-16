import { NextResponse } from "next/server";

/**
 * The `catch (err: unknown) { return NextResponse.json({ error: ... }, { status: 500 }) }`
 * block repeated at the bottom of nearly every API route, collapsed to one
 * call: `catch (err: unknown) { return handleApiError(err); }`
 */
export function handleApiError(err: unknown): NextResponse {
  return NextResponse.json(
    { error: err instanceof Error ? err.message : "Internal Server Error" },
    { status: 500 }
  );
}
