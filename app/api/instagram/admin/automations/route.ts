import { NextRequest, NextResponse } from "next/server";
import { isAdmin, unauthorized } from "@/lib/instagram/auth";
import { getAutomations, saveAutomations } from "@/lib/instagram/store";
import type { Automation } from "@/lib/instagram/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isAdmin()) return unauthorized();
  return NextResponse.json({ automations: await getAutomations() });
}

const str = (v: unknown, max = 1000) => String(v ?? "").slice(0, max);
const list = (v: unknown, max = 200) =>
  (Array.isArray(v) ? v : []).map((x) => str(x, max).trim()).filter(Boolean);

function sanitize(a: Partial<Automation>, i: number): Automation {
  return {
    id: str(a.id, 40).replace(/[^a-zA-Z0-9_-]/g, "") || `auto${Date.now()}${i}`,
    name: str(a.name, 80) || "Untitled automation",
    enabled: Boolean(a.enabled),
    mediaIds: list(a.mediaIds, 40),
    keywords: list(a.keywords, 50),
    stories: a.stories !== false,
    posts: a.posts !== false,
    storyOpeningDm: str(a.storyOpeningDm, 640),
    publicReplies: list(a.publicReplies, 300),
    openingDm: str(a.openingDm, 640),
    openingButton: str(a.openingButton, 20) || "Send me the link",
    followGate: Boolean(a.followGate),
    notFollowingDm: str(a.notFollowingDm, 640),
    notFollowingButton: str(a.notFollowingButton, 20) || "I followed ✅",
    deliveryDm: str(a.deliveryDm, 640),
    deliveryLinkTitle: str(a.deliveryLinkTitle, 20),
    deliveryLinkUrl: /^https?:\/\//.test(str(a.deliveryLinkUrl)) ? str(a.deliveryLinkUrl, 500) : "",
  };
}

export async function PUT(req: NextRequest) {
  if (!isAdmin()) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!Array.isArray(body?.automations)) {
    return NextResponse.json({ error: "automations[] required" }, { status: 400 });
  }
  const clean = (body.automations as Partial<Automation>[]).slice(0, 50).map(sanitize);
  await saveAutomations(clean);
  return NextResponse.json({ automations: clean });
}
