import type { Automation } from "./types";

/**
 * Default automations — used until you save your own from the /admin/instagram dashboard.
 * Automations are checked top to bottom; the first match wins, so put specific
 * (per-reel / keyword) automations above the catch-all.
 *
 * Placeholders: {username}
 */
export const defaultAutomations: Automation[] = [
  {
    id: "default",
    name: "Every comment on every reel",
    enabled: true,
    mediaIds: [],
    keywords: [],
    stories: true,
    posts: true,
    askFirst: false,
    storyOpeningDm:
      "Hey {username}! 👋 Thanks for replying to my story. Tap the button below and I'll send it over 👇",
    publicReplies: [
      "Thanks @{username}! Check your DMs 📩",
      "Appreciate it @{username} 🙌 Sent you a DM!",
      "@{username} glad you liked it! DM'd you 🚀",
    ],
    openingDm:
      "Hey {username}! 👋 Thanks for commenting on my reel. Tap the button below and I'll send it over 👇",
    openingButton: "Send me the link",
    followGate: true,
    notFollowingDm:
      "Almost there {username}! 🙏 This is for my followers only. Follow @codewith.pt and then tap the button below 👇",
    notFollowingButton: "I followed ✅",
    deliveryDm:
      'Here you go {username} 🎉\n\nAll the CS core topics asked in interviews, in one PDF 📚\n\n👇 Tap below to get yours.\n\nNeed a portfolio or website for your brand? Reply "WEBSITE" 💻',
    deliveryLinkTitle: "Open link",
    deliveryLinkUrl: "https://puneet.occazi.in",
  },
];

/** Used for story replies when an automation has no story message of its own. */
export const DEFAULT_STORY_DM =
  "Hey {username}! 👋 Thanks for replying to my story. Tap the button below and I'll send it over 👇";

/** Ignore replies inside comment threads, respond to top-level comments only. */
export const TOP_LEVEL_ONLY = true;
