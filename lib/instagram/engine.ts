import { REELS_ONLY, TOP_LEVEL_ONLY } from "./config";
import {
  replyToComment,
  sendButtons,
  sendText,
  userFollowsMe,
} from "./api";
import {
  claimOnce,
  hitHourly,
  clearPending,
  getAutomations,
  getPending,
  logEvent,
  setPending,
} from "./store";
import type { Automation } from "./types";

/*
 * ManyChat-style flow:
 *
 *  comment ─► public reply + DM "Tap below 👇" [Send me the link]
 *                                   │ tap (postback) or any reply
 *                                   ▼
 *                       follow-gate on? ──no──► delivery DM [Open link]
 *                                   │yes
 *                         follows? ─┴─yes─► delivery DM [Open link]
 *                                   │no
 *                                   ▼
 *                 "Follow first 🙏" [I followed ✅] ──tap──► (check again)
 */

const PAYLOAD_PREFIX = "IGAUTO:";

/**
 * Safety limits per hour. Meta allows ~200 automated DMs/hour per account; repeated public
 * replies are what Instagram's spam filter notices first. Override with env vars if needed.
 */
const MAX_DMS_PER_HOUR = Number(process.env.IG_MAX_DMS_PER_HOUR) || 150;
const MAX_PUBLIC_REPLIES_PER_HOUR = Number(process.env.IG_MAX_PUBLIC_REPLIES_PER_HOUR) || 50;

export type CommentValue = {
  id: string;
  text?: string;
  parent_id?: string;
  from?: { id: string; username?: string };
  media?: { id: string; media_product_type?: string };
};

export type MessagingEvent = {
  sender: { id: string };
  recipient: { id: string };
  timestamp?: number;
  message?: { mid: string; text?: string; is_echo?: boolean; quick_reply?: { payload: string } };
  postback?: { mid?: string; title?: string; payload?: string };
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const fill = (tpl: string, username?: string) =>
  tpl.replaceAll("{username}", username || "there");
const btnTitle = (t: string) => t.slice(0, 20);

function matches(a: Automation, c: CommentValue) {
  if (!a.enabled) return false;
  if (a.mediaIds.length && !a.mediaIds.includes(c.media?.id ?? "")) return false;
  if (a.keywords.length) {
    const text = (c.text ?? "").toLowerCase();
    if (!a.keywords.some((k) => k.trim() && text.includes(k.trim().toLowerCase()))) return false;
  }
  return true;
}

export async function handleComment(ownAccountId: string, c: CommentValue) {
  const username = c.from?.username;

  if (!c.from || c.from.id === ownAccountId) return; // our own replies → avoid loops
  if (process.env.IG_USERNAME && username === process.env.IG_USERNAME) return;
  if (REELS_ONLY && c.media?.media_product_type && c.media.media_product_type !== "REELS") return;
  if (TOP_LEVEL_ONLY && c.parent_id) return;

  const automation = (await getAutomations()).find((a) => matches(a, c));
  if (!automation) return;
  if (!(await claimOnce(`comment:${c.id}`))) return;

  await logEvent({ event: "comment", automationId: automation.id, username, text: c.text });

  const tasks: Promise<void>[] = [];

  // Quiet mode: once over the public-reply cap, keep sending DMs but stop replying publicly.
  const publicAllowed =
    automation.publicReplies.length > 0 &&
    (await hitHourly("public")) <= MAX_PUBLIC_REPLIES_PER_HOUR;

  // Speed limit: new conversations beyond the hourly DM cap are skipped (and logged).
  if ((await hitHourly("dm")) > MAX_DMS_PER_HOUR) {
    await logEvent({
      event: "rate_limited",
      automationId: automation.id,
      username,
      text: `Over ${MAX_DMS_PER_HOUR} DMs this hour — skipped to protect the account`,
    });
    return;
  }

  if (publicAllowed) {
    tasks.push(
      replyToComment(c.id, fill(pick(automation.publicReplies), username)).then(() =>
        logEvent({ event: "public_reply", automationId: automation.id, username })
      )
    );
  }

  tasks.push(
    (async () => {
      const text = fill(automation.openingDm, username);
      const recipient = { comment_id: c.id };
      let res: { recipient_id?: string };
      try {
        res = await sendButtons(
          recipient,
          text,
          [
            {
              type: "postback",
              title: btnTitle(automation.openingButton),
              payload: PAYLOAD_PREFIX + automation.id,
            },
          ],
          ownAccountId
        );
      } catch (e) {
        // Fallback if buttons are rejected for private replies: plain text, user replies to continue.
        console.warn("[instagram] button private reply failed, falling back to text", e);
        res = await sendText(recipient, `${text}\n\n(Reply "YES" to get it)`, ownAccountId);
      }
      // Remember which automation this user is in, so a tap OR any reply continues the flow.
      const igsid = res.recipient_id ?? c.from!.id;
      await setPending(igsid, { automationId: automation.id, username });
      await logEvent({ event: "opening_dm", automationId: automation.id, username });
    })()
  );

  const results = await Promise.allSettled(tasks);
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[instagram]", c.id, r.reason);
      await logEvent({
        event: "error",
        automationId: automation.id,
        username,
        text: String(r.reason).slice(0, 300),
      });
    }
  }
}

export async function handleMessaging(ownAccountId: string, m: MessagingEvent) {
  const userId = m.sender?.id;
  if (!userId || userId === ownAccountId || m.message?.is_echo) return;

  const eventId = m.postback?.mid ?? m.message?.mid ?? `${userId}:${m.timestamp}`;
  if (!(await claimOnce(`msg:${eventId}`))) return;

  // Which automation? Prefer the button payload, else whatever conversation is pending.
  const payload = m.postback?.payload ?? m.message?.quick_reply?.payload;
  const pending = await getPending(userId);
  const automationId = payload?.startsWith(PAYLOAD_PREFIX)
    ? payload.slice(PAYLOAD_PREFIX.length)
    : pending?.automationId;
  if (!automationId) return; // a normal DM unrelated to an automation — leave it for you
  const username = pending?.username;

  const automation = (await getAutomations()).find((a) => a.id === automationId);
  if (!automation) return;

  await logEvent({ event: "click", automationId, username, text: m.postback?.title ?? m.message?.text });

  try {
    if (automation.followGate && !(await userFollowsMe(userId))) {
      await sendButtons(
        { id: userId },
        fill(automation.notFollowingDm, username),
        [
          {
            type: "postback",
            title: btnTitle(automation.notFollowingButton),
            payload: PAYLOAD_PREFIX + automation.id,
          },
        ],
        ownAccountId
      );
      await logEvent({ event: "not_following", automationId, username });
      return;
    }

    const text = fill(automation.deliveryDm, username);
    if (automation.deliveryLinkUrl) {
      await sendButtons(
        { id: userId },
        text,
        [
          {
            type: "web_url",
            title: btnTitle(automation.deliveryLinkTitle || "Open link"),
            url: automation.deliveryLinkUrl,
          },
        ],
        ownAccountId
      );
    } else {
      await sendText({ id: userId }, text, ownAccountId);
    }
    await clearPending(userId);
    await logEvent({ event: "delivered", automationId, username });
  } catch (e) {
    console.error("[instagram] messaging", e);
    await logEvent({ event: "error", automationId, username, text: String(e).slice(0, 300) });
  }
}
