import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/instagram/auth";
import { listRecentMedia } from "@/lib/instagram/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Your recent reels, so the dashboard can attach automations to specific ones. */
export async function GET() {
  if (!isAdmin()) return unauthorized();
  try {
    return NextResponse.json({ media: await listRecentMedia() });
  } catch (e) {
    return NextResponse.json({ media: [], error: String(e) }, { status: 200 });
  }
}
