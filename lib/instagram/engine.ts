import { DEFAULT_STORY_DM, TOP_LEVEL_ONLY } from "./config";
import {
  getUsername,
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
 *  reel comment ─► public reply + DM [Send me the link]
 *  story reply  ─►                 DM [Send me the link]
 *                                   │ tap
 *                                   ▼
 *                 follow-gate on? ──no──► delivery DM [Open link]
 *                                   │yes
 *                   follows? ───────┴─yes─► delivery DM [Open link]
 *                                   │no
 *                                   ▼
 *        "Follow first 🙏" [I followed ✅] ──tap──► delivery DM (no second check)
 */

const PAYLOAD_PREFIX = "IGAUTO:";
/** Added to the "I followed ✅" button: the person says they followed, so deliver directly. */
const FOLLOWED_SUFFIX = ":followed";

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
  message?: {
    mid: string;
    text?: string;
    is_echo?: boolean;
    quick_reply?: { payload: string };
    /** Present when the message is a reply to one of your stories. */
    reply_to?: { story?: { id?: string; url?: string }; mid?: string };
  };
  postback?: { mid?: string; title?: string; payload?: string };
};

const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
type Kind = "reel" | "post" | "story";

/**
 * Fills {username} and {type} (reel / post / story). For post comments, the word "reel" in
 * messages written for reels is switched to "post" so one automation reads right for both.
 */
const fill = (tpl: string, username?: string, kind: Kind = "reel") => {
  let out = tpl.replaceAll("{username}", username || "there").replaceAll("{type}", kind);
  if (kind === "post") out = out.replace(/\breel(s?)\b/g, "post$1").replace(/\bReel(s?)\b/g, "Post$1");
  return out;
};
const btnTitle = (t: string) => t.slice(0, 20);

/**
 * Instagram web/desktop doesn't show button messages, so every button DM also says what to
 * type instead. Any typed reply continues the flow. Skipped if the text already mentions it.
 */
const withHint = (text: string, hint: string) =>
  /reply\s+["“]?(yes|done)/i.test(text) ? text : `${text}\n\n${hint}`;

function keywordsMatch(a: Automation, text?: string) {
  if (!a.keywords.length) return true;
  const t = (text ?? "").toLowerCase();
  return a.keywords.some((k) => k.trim() && t.includes(k.trim().toLowerCase()));
}

function matchesComment(a: Automation, c: CommentValue, kind: Kind) {
  if (!a.enabled) return false;
  if (kind === "post" && a.posts === false) return false;
  if (a.mediaIds.length && !a.mediaIds.includes(c.media?.id ?? "")) return false;
  return keywordsMatch(a, c.text);
}

/** Story replies use automations that aren't tied to specific reels and have stories on. */
function matchesStory(a: Automation, text?: string) {
  if (!a.enabled || a.stories === false || a.mediaIds.length) return false;
  return keywordsMatch(a, text);
}

async function overDmLimit(automation: Automation, username?: string) {
  if ((await hitHourly("dm")) <= MAX_DMS_PER_HOUR) return false;
  await logEvent({
    event: "rate_limited",
    automationId: automation.id,
    username,
    text: `Over ${MAX_DMS_PER_HOUR} DMs this hour — skipped to protect the account`,
  });
  return true;
}

/** First DM with the "Send me the link" button. Returns the recipient's messaging ID. */
async function sendOpeningDm(
  automation: Automation,
  recipient: { comment_id: string } | { id: string },
  username: string | undefined,
  ownAccountId: string,
  template = automation.openingDm,
  kind: Kind = "reel"
) {
  const text = withHint(fill(template, username, kind), `Don't see a button? Just reply "YES" 👇`);
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
    // Fallback if buttons are rejected: plain text, the user replies to continue.
    console.warn("[instagram] button DM failed, falling back to text", e);
    res = await sendText(recipient, text, ownAccountId);
  }
  return res.recipient_id;
}

async function logErrors(results: PromiseSettledResult<unknown>[], automation: Automation, username?: string) {
  for (const r of results) {
    if (r.status === "rejected") {
      console.error("[instagram]", r.reason);
      await logEvent({
        event: "error",
        automationId: automation.id,
        username,
        text: String(r.reason).slice(0, 300),
      });
    }
  }
}

/** Records why an event was ignored, in the dashboard log and in the host's runtime logs. */
async function skip(reason: string, username?: string, text?: string) {
  console.log(`[instagram] skipped${username ? ` @${username}` : ""}: ${reason}`);
  await logEvent({ event: "skipped", username, text: `${reason}${text ? ` — "${text.slice(0, 60)}"` : ""}` });
}

// ---------------------------------------------------------------- reel and post comments

export async function handleComment(ownAccountId: string, c: CommentValue) {
  const username = c.from?.username;

  if (!c.from || c.from.id === ownAccountId) return; // our own replies → avoid loops
  if (process.env.IG_USERNAME && username === process.env.IG_USERNAME) return;
  // Reels and normal posts (FEED). Ads and anything else are skipped.
  const productType = c.media?.media_product_type;
  if (productType && productType !== "REELS" && productType !== "FEED") {
    return skip(`comment on ${productType.toLowerCase()} (only reels and posts)`, username, c.text);
  }
  const kind: Kind = productType === "FEED" ? "post" : "reel";
  if (TOP_LEVEL_ONLY && c.parent_id) return skip("reply inside a comment thread", username, c.text);

  const automation = (await getAutomations()).find((a) => matchesComment(a, c, kind));
  if (!automation) {
    return skip(`no automation matches this ${kind} comment (check enabled, keywords, picked ${kind}s)`, username, c.text);
  }
  if (!(await claimOnce(`comment:${c.id}`))) return; // Meta re-sent the same event

  await logEvent({ event: "comment", automationId: automation.id, username, text: c.text });

  // Quiet mode: once over the public-reply cap, keep sending DMs but stop replying publicly.
  const publicAllowed =
    automation.publicReplies.length > 0 &&
    (await hitHourly("public")) <= MAX_PUBLIC_REPLIES_PER_HOUR;

  if (await overDmLimit(automation, username)) return;

  const tasks: Promise<void>[] = [];
  if (publicAllowed) {
    tasks.push(
      replyToComment(c.id, fill(pick(automation.publicReplies), username, kind)).then(() =>
        logEvent({ event: "public_reply", automationId: automation.id, username })
      )
    );
  }
  tasks.push(
    (async () => {
      const igsid = await sendOpeningDm(
        automation,
        { comment_id: c.id },
        username,
        ownAccountId,
        automation.openingDm,
        kind
      );
      // Remember which automation this user is in, so a tap OR any reply continues the flow.
      await setPending(igsid ?? c.from!.id, { automationId: automation.id, username });
      await logEvent({ event: "opening_dm", automationId: automation.id, username });
    })()
  );

  await logErrors(await Promise.allSettled(tasks), automation, username);
}

// ---------------------------------------------------------------- story replies

async function handleStoryReply(ownAccountId: string, m: MessagingEvent) {
  const userId = m.sender.id;
  const story = m.message!.reply_to!.story!;
  const text = m.message?.text;

  const automation = (await getAutomations()).find((a) => matchesStory(a, text));
  if (!automation) {
    return skip("no automation has story replies on (or keywords didn't match)", undefined, text);
  }

  // Once per person per story, so a chatty reply thread doesn't restart the flow.
  const storyKey = story.id ?? story.url ?? "story";
  if (!(await claimOnce(`story:${storyKey}:${userId}`, 2 * 24 * 3600))) {
    return skip("already got the flow for this story", await getUsername(userId), text);
  }

  const username = await getUsername(userId);
  if (process.env.IG_USERNAME && username === process.env.IG_USERNAME) return;

  await logEvent({ event: "story_reply", automationId: automation.id, username, text });
  if (await overDmLimit(automation, username)) return;

  const results = await Promise.allSettled([
    (async () => {
      await sendOpeningDm(
        automation,
        { id: userId },
        username,
        ownAccountId,
        automation.storyOpeningDm?.trim() || DEFAULT_STORY_DM,
        "story"
      );
      await setPending(userId, { automationId: automation.id, username });
      await logEvent({ event: "opening_dm", automationId: automation.id, username });
    })(),
  ]);
  await logErrors(results, automation, username);
}

// ---------------------------------------------------------------- DMs and button taps

export async function handleMessaging(ownAccountId: string, m: MessagingEvent) {
  const userId = m.sender?.id;
  if (!userId || userId === ownAccountId || m.message?.is_echo) return;

  const eventId = m.postback?.mid ?? m.message?.mid ?? `${userId}:${m.timestamp}`;
  if (!(await claimOnce(`msg:${eventId}`))) return;

  const payload = m.postback?.payload ?? m.message?.quick_reply?.payload;

  // A reply to one of your stories starts a new flow.
  if (!payload && m.message?.reply_to?.story) {
    await handleStoryReply(ownAccountId, m);
    return;
  }

  // Which automation? Prefer the button payload, else whatever conversation is pending.
  const pending = await getPending(userId);
  let automationId: string | undefined;
  let saysFollowed = false;
  if (payload?.startsWith(PAYLOAD_PREFIX)) {
    const rest = payload.slice(PAYLOAD_PREFIX.length);
    saysFollowed = rest.endsWith(FOLLOWED_SUFFIX);
    automationId = saysFollowed ? rest.slice(0, -FOLLOWED_SUFFIX.length) : rest;
  } else if (pending) {
    automationId = pending.automationId;
    // Typed reply after being asked to follow counts as "I followed".
    saysFollowed = pending.stage === "asked_follow";
  }
  if (!automationId) return; // a normal DM unrelated to an automation — leave it for you
  const username = pending?.username;

  const automation = (await getAutomations()).find((a) => a.id === automationId);
  if (!automation) return;

  await logEvent({ event: "click", automationId, username, text: m.postback?.title ?? m.message?.text });

  try {
    // Follow is checked once, on the first tap. After "I followed ✅" the link is sent directly.
    if (automation.followGate && !saysFollowed && !(await userFollowsMe(userId))) {
      await sendButtons(
        { id: userId },
        withHint(fill(automation.notFollowingDm, username), `Don't see a button? Reply "DONE" after following 👇`),
        [
          {
            type: "postback",
            title: btnTitle(automation.notFollowingButton),
            payload: PAYLOAD_PREFIX + automation.id + FOLLOWED_SUFFIX,
          },
        ],
        ownAccountId
      );
      await setPending(userId, { automationId: automation.id, username, stage: "asked_follow" });
      await logEvent({ event: "not_following", automationId, username });
      return;
    }

    // Plain text with the URL: shows on phone, web and desktop, with a link preview card.
    const text = fill(automation.deliveryDm, username);
    const url = automation.deliveryLinkUrl?.trim();
    await sendText({ id: userId }, url ? `${text}\n\n${url}` : text, ownAccountId);
    await clearPending(userId);
    await logEvent({ event: "delivered", automationId, username });
  } catch (e) {
    console.error("[instagram] messaging", e);
    await logEvent({ event: "error", automationId, username, text: String(e).slice(0, 300) });
  }
}
