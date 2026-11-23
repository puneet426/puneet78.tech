export type Automation = {
  id: string;
  name: string;
  enabled: boolean;
  /** Reel/post media IDs this applies to. Empty = every reel. */
  mediaIds: string[];
  /** Comment must contain one of these (case-insensitive). Empty = any comment. */
  keywords: string[];

  /**
   * Also run on replies to your stories (every current and future story). Only applies to
   * automations not tied to specific reels. Missing = true.
   */
  stories?: boolean;
  /** First DM for story replies. Missing/empty = DEFAULT_STORY_DM. */
  storyOpeningDm?: string;

  /** Public reply under the comment. One variant is picked at random. Empty = no public reply. */
  publicReplies: string[];

  /** First DM (sent as a private reply to the comment) with a button. */
  openingDm: string;
  openingButton: string;

  /** Require the user to follow you before delivering. */
  followGate: boolean;
  notFollowingDm: string;
  notFollowingButton: string;

  /** Final DM: what they actually get (link, notes, code...). */
  deliveryDm: string;
  /** Optional URL button shown with the delivery DM. */
  deliveryLinkTitle: string;
  deliveryLinkUrl: string;
};

export type LogEvent =
  | "comment"
  | "story_reply"
  | "public_reply"
  | "opening_dm"
  | "click"
  | "not_following"
  | "delivered"
  | "rate_limited"
  | "error";

export type LogEntry = {
  at: number;
  event: LogEvent;
  automationId?: string;
  username?: string;
  text?: string;
};

export type Stats = Record<string, Partial<Record<LogEvent, number>>>;
