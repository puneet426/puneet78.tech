"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Automation, LogEntry, LogEvent, Stats } from "@/lib/instagram/types";

type Media = {
  id: string;
  caption?: string;
  media_product_type?: string;
  thumbnail_url?: string;
  media_url?: string;
  permalink?: string;
};

type Health = { persistentStore: boolean; accessToken: boolean; appSecret: boolean; verifyToken: boolean };

const FUNNEL: { key: LogEvent; label: string }[] = [
  { key: "comment", label: "Comments + story replies" },
  { key: "opening_dm", label: "DMs sent" },
  { key: "click", label: "Button taps" },
  { key: "not_following", label: "Asked to follow" },
  { key: "delivered", label: "Delivered" },
];

const EVENT_LABEL: Record<LogEvent, string> = {
  comment: "💬 Commented",
  story_reply: "📖 Story reply",
  public_reply: "↩️ Public reply",
  opening_dm: "📩 DM sent",
  click: "👆 Tapped / replied",
  not_following: "🔒 Not following",
  delivered: "✅ Delivered",
  rate_limited: "⏸️ Hourly limit",
  skipped: "⏭️ Skipped",
  error: "⚠️ Error",
};

const blankAutomation = (): Automation => ({
  id: `auto${Date.now().toString(36)}`,
  name: "New automation",
  enabled: true,
  mediaIds: [],
  keywords: [],
  stories: true,
  posts: true,
  askFirst: false,
  storyOpeningDm: "Hey {username}! 👋 Thanks for replying to my story. Tap below and I'll send it over 👇",
  publicReplies: ["Thanks @{username}! Check your DMs 📩"],
  openingDm: "Hey {username}! 👋 Tap below and I'll send it over 👇",
  openingButton: "Send me the link",
  followGate: true,
  notFollowingDm: "Almost there {username}! 🙏 Follow me first, then tap below 👇",
  notFollowingButton: "I followed ✅",
  deliveryDm: "Here you go {username} 🎉",
  deliveryLinkTitle: "Open link",
  deliveryLinkUrl: "https://puneet.occazi.in",
});

const card = "rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 p-5";
const input =
  "w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#9c93ff]";
const btn = "rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50";
const btnPrimary = `${btn} bg-[#9c93ff] text-neutral-950 hover:brightness-110`;
const btnGhost = `${btn} border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800`;

export default function InstagramAdmin() {
  const [session, setSession] = useState<{ loggedIn: boolean; configured: boolean } | null>(null);

  const refreshSession = useCallback(async () => {
    const r = await fetch("/api/instagram/admin/session", { cache: "no-store" });
    setSession(await r.json());
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 font-content">
      <h1 className="text-3xl font-semibold">Instagram Automations</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Comment → public reply → DM with button → follow check → deliver.
      </p>
      <div className="mt-8">
        {!session ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : !session.configured ? (
          <div className={card}>
            Set the <code>ADMIN_PASSWORD</code> environment variable and redeploy to enable this dashboard.
          </div>
        ) : !session.loggedIn ? (
          <Login onDone={refreshSession} />
        ) : (
          <Dashboard onLogout={refreshSession} />
        )}
      </div>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  return (
    <form
      className={`${card} max-w-sm space-y-3`}
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/instagram/admin/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pw }),
        });
        if (r.ok) onDone();
        else setErr("Wrong password");
      }}
    >
      <label className="block text-sm font-medium">Admin password</label>
      <input className={input} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
      {err && <p className="text-sm text-red-500">{err}</p>}
      <button className={btnPrimary} type="submit">
        Log in
      </button>
    </form>
  );
}

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Stats>({});
  const [health, setHealth] = useState<Health | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [mediaError, setMediaError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState("");

  const loadActivity = useCallback(async () => {
    const r = await fetch("/api/instagram/admin/activity", { cache: "no-store" });
    if (!r.ok) return;
    const j = await r.json();
    setLogs(j.logs);
    setStats(j.stats);
    setHealth(j.health);
  }, []);

  useEffect(() => {
    fetch("/api/instagram/admin/automations", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setAutomations(j.automations ?? []));
    fetch("/api/instagram/admin/media", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        setMedia(j.media ?? []);
        if (j.error) setMediaError("Couldn't load your reels and posts — check IG_ACCESS_TOKEN.");
      });
    loadActivity();
    const t = setInterval(loadActivity, 15000);
    return () => clearInterval(t);
  }, [loadActivity]);

  const totals = useMemo(() => {
    const t: Partial<Record<LogEvent, number>> = {};
    for (const s of Object.values(stats))
      for (const [k, v] of Object.entries(s)) t[k as LogEvent] = (t[k as LogEvent] ?? 0) + (v ?? 0);
    return t;
  }, [stats]);

  const update = (id: string, patch: Partial<Automation>) => {
    setAutomations((list) => list.map((a) => (a.id === id ? { ...a, ...patch } : a)));
    setDirty(true);
  };

  const move = (i: number, d: -1 | 1) => {
    setAutomations((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    const r = await fetch("/api/instagram/admin/automations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ automations }),
    });
    setSaving(false);
    if (r.ok) {
      setAutomations((await r.json()).automations);
      setDirty(false);
      setMsg("Saved ✓");
      setTimeout(() => setMsg(""), 2500);
    } else setMsg("Save failed");
  };

  const nameFor = (id?: string) => automations.find((a) => a.id === id)?.name ?? id ?? "—";

  return (
    <div className="space-y-8">
      {health && (!health.persistentStore || !health.accessToken || !health.appSecret || !health.verifyToken) && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm space-y-1">
          <p className="font-medium">Setup incomplete</p>
          {!health.accessToken && <p>• IG_ACCESS_TOKEN is missing</p>}
          {!health.appSecret && <p>• IG_APP_SECRET is missing</p>}
          {!health.verifyToken && <p>• IG_VERIFY_TOKEN is missing</p>}
          {!health.persistentStore && (
            <p>• No Redis connected: saved automations and logs will be lost. Add Upstash Redis in Vercel.</p>
          )}
        </div>
      )}

      {/* Funnel */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {FUNNEL.map((f) => (
          <div key={f.key} className={card}>
            <div className="text-2xl font-semibold tabular-nums">
              {(totals[f.key] ?? 0) + (f.key === "comment" ? totals.story_reply ?? 0 : 0)}
            </div>
            <div className="text-xs text-neutral-500">{f.label}</div>
          </div>
        ))}
      </section>

      {/* Automations */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-xl font-semibold">Automations</h2>
          {msg && <span className="text-sm text-neutral-500">{msg}</span>}
          <button
            className={btnGhost}
            onClick={() => {
              const a = blankAutomation();
              setAutomations((l) => [a, ...l]);
              setEditing(a.id);
              setDirty(true);
            }}
          >
            + New
          </button>
          <button className={btnPrimary} disabled={!dirty || saving} onClick={save}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
        <p className="text-xs text-neutral-500">
          Checked top to bottom, first match wins. Keep the catch-all (nothing picked, no keywords) at the bottom.
        </p>

        {automations.map((a, i) => {
          const s = stats[a.id] ?? {};
          return (
            <div key={a.id} className={card}>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={a.enabled}
                    onChange={(e) => update(a.id, { enabled: e.target.checked })}
                  />
                  <span className="font-medium">{a.name}</span>
                </label>
                <span className="text-xs text-neutral-500">
                  {a.mediaIds.length
                    ? `${a.mediaIds.length} picked`
                    : a.posts !== false
                    ? "All reels + posts"
                    : "All reels"}{" "}
                  ·{" "}
                  {a.keywords.length ? `keywords: ${a.keywords.join(", ")}` : "any comment"}
                  {!a.mediaIds.length && a.stories !== false ? " · 📖 stories" : ""}
                  {a.askFirst ? " · 👆 tap first" : " · 🔗 link right away"}
                  {a.askFirst && a.followGate ? " · 🔒 follow check" : ""}
                </span>
                <span className="ml-auto text-xs tabular-nums text-neutral-500">
                  {s.comment ?? 0} → {s.click ?? 0} → {s.delivered ?? 0} delivered
                </span>
                <button className="text-xs" onClick={() => move(i, -1)} aria-label="Move up">
                  ▲
                </button>
                <button className="text-xs" onClick={() => move(i, 1)} aria-label="Move down">
                  ▼
                </button>
                <button className={btnGhost} onClick={() => setEditing(editing === a.id ? null : a.id)}>
                  {editing === a.id ? "Close" : "Edit"}
                </button>
              </div>

              {editing === a.id && (
                <Editor
                  a={a}
                  media={media}
                  mediaError={mediaError}
                  onChange={(p) => update(a.id, p)}
                  onDelete={() => {
                    if (!confirm(`Delete "${a.name}"?`)) return;
                    setAutomations((l) => l.filter((x) => x.id !== a.id));
                    setDirty(true);
                  }}
                />
              )}
            </div>
          );
        })}
      </section>

      {/* Activity */}
      <section className="space-y-3">
        <div className="flex items-center">
          <h2 className="mr-auto text-xl font-semibold">Activity</h2>
          <button className={btnGhost} onClick={loadActivity}>
            Refresh
          </button>
        </div>
        <div className={`${card} max-h-[480px] overflow-auto p-0`}>
          {logs.length === 0 ? (
            <p className="p-5 text-sm text-neutral-500">No activity yet. Comment on a reel to test.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {logs.map((l, i) => (
                  <tr key={i} className="border-b border-neutral-200 dark:border-neutral-800 last:border-0">
                    <td className="whitespace-nowrap px-4 py-2 text-xs text-neutral-500">
                      {new Date(l.at).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2">{EVENT_LABEL[l.event]}</td>
                    <td className="px-2 py-2">{l.username ? `@${l.username}` : ""}</td>
                    <td className="px-2 py-2 text-xs text-neutral-500">{nameFor(l.automationId)}</td>
                    <td className="max-w-[260px] truncate px-4 py-2 text-xs" title={l.text}>
                      {l.text}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <button
        className={btnGhost}
        onClick={async () => {
          await fetch("/api/instagram/admin/session", { method: "DELETE" });
          onLogout();
        }}
      >
        Log out
      </button>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-neutral-500">{hint}</span>}
    </label>
  );
}

function Editor({
  a,
  media,
  mediaError,
  onChange,
  onDelete,
}: {
  a: Automation;
  media: Media[];
  mediaError: string;
  onChange: (p: Partial<Automation>) => void;
  onDelete: () => void;
}) {
  const lines = (v: string) => v.split("\n");
  const toggleMedia = (id: string) =>
    onChange({ mediaIds: a.mediaIds.includes(id) ? a.mediaIds.filter((x) => x !== id) : [...a.mediaIds, id] });
  const reels = media.filter((m) => m.media_product_type === "REELS" || m.media_product_type === "FEED");

  return (
    <div className="mt-5 grid gap-5 md:grid-cols-2">
      <div className="space-y-4">
        <Field label="Name">
          <input className={input} value={a.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>

        <Field label="Trigger keywords" hint="Comma separated. Leave empty to reply to ANY comment.">
          <input
            className={input}
            value={a.keywords.join(", ")}
            placeholder="link, notes, code"
            onChange={(e) => onChange({ keywords: e.target.value.split(",").map((s) => s.trim()) })}
          />
        </Field>

        <Field label="Reels and posts" hint="Pick none to apply to all of them.">
          {mediaError && <p className="text-xs text-amber-600">{mediaError}</p>}
          <div className="grid max-h-56 grid-cols-4 gap-2 overflow-auto">
            {reels.map((m) => (
              <button
                key={m.id}
                type="button"
                title={m.caption}
                onClick={() => toggleMedia(m.id)}
                className={`relative aspect-[9/16] overflow-hidden rounded-md border-2 ${
                  a.mediaIds.includes(m.id) ? "border-[#9c93ff]" : "border-transparent opacity-70"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.thumbnail_url || m.media_url} alt="" className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">
                  {m.media_product_type === "FEED" ? "Post" : "Reel"}
                </span>
                {a.mediaIds.includes(m.id) && (
                  <span className="absolute right-1 top-1 rounded bg-[#9c93ff] px-1 text-xs text-black">✓</span>
                )}
              </button>
            ))}
          </div>
          <input
            className={`${input} mt-2`}
            value={a.mediaIds.join(", ")}
            placeholder="or paste media IDs, comma separated"
            onChange={(e) => onChange({ mediaIds: e.target.value.split(",").map((s) => s.trim()) })}
          />
        </Field>

        <Field label="Public replies" hint="One per line, picked at random. {username} = commenter. Empty = no public reply.">
          <textarea
            className={input}
            rows={4}
            value={a.publicReplies.join("\n")}
            onChange={(e) => onChange({ publicReplies: lines(e.target.value) })}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <label className="flex items-start gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="mt-1"
            checked={a.posts !== false}
            onChange={(e) => onChange({ posts: e.target.checked })}
          />
          <span>
            🖼️ Also run on post comments (photos and carousels)
            <span className="block text-xs font-normal text-neutral-500">
              Same flow as reels. The word &quot;reel&quot; in your messages becomes &quot;post&quot; automatically,
              or use {"{type}"}.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 text-sm font-medium">
          <input
            type="checkbox"
            className="mt-1"
            checked={a.stories !== false}
            disabled={a.mediaIds.length > 0}
            onChange={(e) => onChange({ stories: e.target.checked })}
          />
          <span>
            📖 Also run on story replies (all current and future stories)
            <span className="block text-xs font-normal text-neutral-500">
              {a.mediaIds.length
                ? "Not available when specific reels or posts are picked."
                : "Anyone who replies to your story gets the same DM. No public reply."}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-2 rounded-lg border border-neutral-300 p-3 text-sm font-medium dark:border-neutral-700">
          <input
            type="checkbox"
            className="mt-1"
            checked={a.askFirst === true}
            onChange={(e) => onChange({ askFirst: e.target.checked })}
          />
          <span>
            👆 Ask them to tap &quot;Send me the link&quot; first
            <span className="block text-xs font-normal text-neutral-500">
              {a.askFirst
                ? "They get a DM with a button first; the link comes after they tap. Needed for the follow check."
                : "Off: everyone gets the link message with the Open link button right away. Turn on to use the follow check."}
            </span>
          </span>
        </label>

        {a.askFirst && (
          <div className="space-y-4 border-l-2 border-[#9c93ff] pl-4">
            <Field label="First DM (comments)">
              <textarea
                className={input}
                rows={3}
                value={a.openingDm}
                onChange={(e) => onChange({ openingDm: e.target.value })}
              />
            </Field>
            {a.stories !== false && !a.mediaIds.length && (
              <Field label="First DM (story replies)" hint="{username} = their handle.">
                <textarea
                  className={input}
                  rows={3}
                  value={a.storyOpeningDm ?? ""}
                  placeholder="Hey {username}! 👋 Thanks for replying to my story. Tap below and I'll send it over 👇"
                  onChange={(e) => onChange({ storyOpeningDm: e.target.value })}
                />
              </Field>
            )}
            <Field label="Button text" hint="Max 20 characters">
              <input
                className={input}
                maxLength={20}
                value={a.openingButton}
                onChange={(e) => onChange({ openingButton: e.target.value })}
              />
            </Field>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={a.followGate} onChange={(e) => onChange({ followGate: e.target.checked })} />
              🔒 Only deliver to followers (follow check)
            </label>

            {a.followGate && (
              <>
                <Field label="If not following">
                  <textarea
                    className={input}
                    rows={3}
                    value={a.notFollowingDm}
                    onChange={(e) => onChange({ notFollowingDm: e.target.value })}
                  />
                </Field>
                <Field label="'I followed' button text" hint="Max 20 characters. Tapping it sends the link, no second check.">
                  <input
                    className={input}
                    maxLength={20}
                    value={a.notFollowingButton}
                    onChange={(e) => onChange({ notFollowingButton: e.target.value })}
                  />
                </Field>
              </>
            )}
          </div>
        )}

        <Field label="Link message" hint="{username} = their handle.">
          <textarea
            className={input}
            rows={3}
            value={a.deliveryDm}
            onChange={(e) => onChange({ deliveryDm: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Button text">
            <input
              className={input}
              maxLength={20}
              value={a.deliveryLinkTitle}
              placeholder="Open link"
              onChange={(e) => onChange({ deliveryLinkTitle: e.target.value })}
            />
          </Field>
          <div className="col-span-2">
            <Field label="Link URL">
              <input
                className={input}
                value={a.deliveryLinkUrl}
                placeholder="https://…"
                onChange={(e) => onChange({ deliveryLinkUrl: e.target.value })}
              />
            </Field>
          </div>
        </div>

        <button className="text-sm text-red-500 hover:underline" onClick={onDelete}>
          Delete automation
        </button>
      </div>
    </div>
  );
}
