import { NextRequest, NextResponse } from "next/server";
import { isValidSignature } from "@/lib/instagram/api";
import {
  handleComment,
  handleMessaging,
  type CommentValue,
  type MessagingEvent,
} from "@/lib/instagram/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WebhookBody = {
  object?: string;
  entry?: {
    id: string; // your IG professional account id
    changes?: { field: string; value: CommentValue }[];
    messaging?: MessagingEvent[];
  }[];
};

/** Webhook verification handshake (Meta calls this once when you subscribe). */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const expected = (process.env.IG_VERIFY_TOKEN ?? "").trim();
  const given = (p.get("hub.verify_token") ?? "").trim();
  if (p.get("hub.mode") === "subscribe" && expected && given === expected) {
    return new NextResponse(p.get("hub.challenge") ?? "", { status: 200 });
  }
  console.warn("[instagram] webhook verification failed", {
    mode: p.get("hub.mode"),
    tokenConfigured: Boolean(expected),
    tokenLengths: [given.length, expected.length],
  });
  return new NextResponse("Forbidden", { status: 403 });
}

/** Comment + DM events land here. Subscribe to: comments, messages, messaging_postbacks. */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!isValidSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let body: WebhookBody;
  try {
    body = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  // One line per incoming event, visible in the host's runtime logs.
  for (const entry of body.entry ?? []) {
    for (const ch of entry.changes ?? []) {
      console.log(
        `[instagram] in: ${ch.field} from @${ch.value?.from?.username ?? "?"} on ${ch.value?.media?.media_product_type ?? "?"}${ch.value?.parent_id ? " (thread reply)" : ""}`
      );
    }
    for (const m of entry.messaging ?? []) {
      const kind = m.postback ? "button tap" : m.message?.reply_to?.story ? "story reply" : m.message?.is_echo ? "own message" : "dm";
      console.log(`[instagram] in: ${kind} from ${m.sender?.id}`);
    }
  }

  const jobs: Promise<void>[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field === "comments") jobs.push(handleComment(entry.id, change.value));
    }
    for (const m of entry.messaging ?? []) jobs.push(handleMessaging(entry.id, m));
  }

  // Finish the work before responding — serverless functions may freeze after the response.
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === "rejected") console.error("[instagram]", r.reason);
  return NextResponse.json({ ok: true });
}
