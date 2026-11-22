import crypto from "crypto";

/**
 * Works with both Meta setups:
 *
 *  - Unified login (new apps, Facebook Login for Business + system user token):
 *      IG_API_HOST=graph.facebook.com
 *      IG_ACCOUNT_ID=<your Instagram account ID, e.g. 17841456940409493>
 *  - Instagram login (older apps): leave IG_API_HOST unset (graph.instagram.com).
 *
 * IG_MESSAGING_ID: the ID that sends DMs. Defaults to IG_ACCOUNT_ID; set it to your
 * Facebook Page ID if Meta requires Page-based messaging for your app.
 */
const HOST = process.env.IG_GRAPH_BASE || `https://${process.env.IG_API_HOST || "graph.instagram.com"}`;
const GRAPH = `${HOST}/${process.env.IG_GRAPH_VERSION || "v23.0"}`;
const ACCOUNT = process.env.IG_ACCOUNT_ID || "me";
const SENDER = process.env.IG_MESSAGING_ID || ACCOUNT;

function token(): string {
  const t = process.env.IG_ACCESS_TOKEN;
  if (!t) throw new Error("IG_ACCESS_TOKEN is not set");
  return t;
}

async function call<T = Record<string, unknown>>(
  path: string,
  init: { method?: "GET" | "POST"; body?: unknown } = {}
): Promise<T> {
  const res = await fetch(`${GRAPH}${path}`, {
    method: init.method ?? "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Instagram API ${path} failed (${res.status}): ${JSON.stringify(json)}`);
  return json as T;
}

type Recipient = { id: string } | { comment_id: string };
type Button =
  | { type: "postback"; title: string; payload: string }
  | { type: "web_url"; title: string; url: string };

/** Public reply under a comment. */
export function replyToComment(commentId: string, message: string) {
  return call(`/${commentId}/replies`, { body: { message } });
}

export function sendText(recipient: Recipient, text: string) {
  return call<{ recipient_id?: string }>(`/${SENDER}/messages`, {
    body: { recipient, message: { text } },
  });
}

/** DM with up to 3 buttons (button template). Text max 640 chars, title max 20 chars. */
export function sendButtons(recipient: Recipient, text: string, buttons: Button[]) {
  return call<{ recipient_id?: string }>(`/${SENDER}/messages`, {
    body: {
      recipient,
      message: {
        attachment: {
          type: "template",
          payload: { template_type: "button", text: text.slice(0, 640), buttons },
        },
      },
    },
  });
}

/** Does this user (Instagram-scoped id) follow your account? */
export async function userFollowsMe(igsid: string): Promise<boolean> {
  const r = await call<{ is_user_follow_business?: boolean }>(
    `/${igsid}?fields=is_user_follow_business`,
    { method: "GET" }
  );
  return r.is_user_follow_business === true;
}

export type Media = {
  id: string;
  caption?: string;
  media_product_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink?: string;
  timestamp?: string;
};

export async function listRecentMedia(limit = 30): Promise<Media[]> {
  const r = await call<{ data: Media[] }>(
    `/${ACCOUNT}/media?fields=id,caption,media_product_type,thumbnail_url,media_url,permalink,timestamp&limit=${limit}`,
    { method: "GET" }
  );
  return r.data;
}

/** Verifies Meta's X-Hub-Signature-256 header against the raw request body. */
export function isValidSignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.IG_APP_SECRET;
  if (!secret) {
    console.warn("[instagram] IG_APP_SECRET not set — skipping signature check");
    return true;
  }
  if (!header?.startsWith("sha256=")) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const given = header.slice("sha256=".length);
  return (
    given.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected))
  );
}
