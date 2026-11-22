import { NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/instagram/auth";
import { getLogs, getStats, hasPersistentStore } from "@/lib/instagram/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return unauthorized();
  const [logs, stats] = await Promise.all([getLogs(), getStats()]);
  return NextResponse.json({
    logs,
    stats,
    health: {
      persistentStore: hasPersistentStore,
      accessToken: Boolean(process.env.IG_ACCESS_TOKEN),
      appSecret: Boolean(process.env.IG_APP_SECRET),
      verifyToken: Boolean(process.env.IG_VERIFY_TOKEN),
    },
  });
}
