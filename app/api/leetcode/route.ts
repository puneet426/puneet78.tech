import { NextResponse } from "next/server";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Aliases because different sources spell these platforms differently.
// Codolio's own API historically calls Coding Ninjas' judge "codestudio"
// (its old name) rather than "codingninjas".
const PLATFORM_ALIASES: Record<string, string[]> = {
  leetcode: ["leetcode"],
  gfg: ["gfg", "geeksforgeeks"],
  hackerrank: ["hackerrank"],
  codingninjas: ["codestudio", "codingninjas"],
};

interface PlatformTotals {
  [key: string]: number; // leetcode, gfg, hackerrank, codingninjas -> solved count
}

// Depth-first search for a key literally named "platformProfiles" whose
// value is an array of objects that look like Codolio platform entries
// (each has a "platform" string field). Confirmed shape from a real
// response: entries look like { platform: "leetcode", totalQuestionStats: {...} }.
function findPlatformProfilesArray(node: any, depth = 0): any[] | null {
  if (!node || typeof node !== "object" || depth > 6) return null;

  if (Array.isArray(node)) {
    if (node.length > 0 && node[0] && typeof node[0] === "object" && "platform" in node[0]) {
      return node;
    }
    for (const item of node) {
      const found = findPlatformProfilesArray(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === "platformProfiles" && Array.isArray(value)) {
      return value as any[];
    }
    const found = findPlatformProfilesArray(value, depth + 1);
    if (found) return found;
  }

  return null;
}

async function fetchLeetCodeDirect(username: string) {
  const res = await fetch(
    `https://leetcode-api-faisalshohag.vercel.app/${username}`,
    { next: { revalidate: 900 } } // 15 minutes
  );

  if (!res.ok) throw new Error(`LeetCode proxy returned ${res.status}`);

  const data = await res.json();

  const easy = data.easySolved || 0;
  const medium = data.mediumSolved || 0;
  const hard = data.hardSolved || 0;

  const submissionCalendar: Record<string, number> = data.submissionCalendar || {};

  const activeEntries = Object.entries(submissionCalendar)
    .map(([timestamp, count]) => {
      const ms = Number(timestamp) * 1000;
      return {
        dayStartMs: Math.floor(ms / ONE_DAY_MS) * ONE_DAY_MS,
        count: Number(count) || 0,
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((a, b) => a.dayStartMs - b.dayStartMs);

  const activeDays = activeEntries.length;

  let maxStreak = 0;
  let currentStreak = 0;
  let prevDayStartMs: number | null = null;

  for (const entry of activeEntries) {
    if (prevDayStartMs !== null && entry.dayStartMs - prevDayStartMs === ONE_DAY_MS) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
    if (currentStreak > maxStreak) maxStreak = currentStreak;
    prevDayStartMs = entry.dayStartMs;
  }

  const timelineMap: Record<string, number> = {};
  Object.entries(submissionCalendar).forEach(([timestamp, count]) => {
    const date = new Date(Number(timestamp) * 1000).toISOString().split("T")[0];
    timelineMap[date] = Number(count) || 0;
  });

  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1);
  const endDate = new Date(today);

  const timeline = [];
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    timeline.push({ date: key, count: timelineMap[key] ?? 0 });
  }

  return {
    activeDays,
    maxStreak,
    leetcodeBreakdown: { solved: easy + medium + hard, easy, medium, hard },
    timeline,
  };
}

// Codolio aggregates whatever platforms you've connected on your Codolio
// profile. Requires a Bearer session token (see CODOLIO_TOKEN in .env.local) —
// this is NOT a stable public API, the token will expire eventually.
async function fetchCodolioTotals(): Promise<{
  grandTotal: number;
  platformTotals: PlatformTotals;
} | null> {
  const token = process.env.CODOLIO_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch("https://api.codolio.com/user", {
      headers: {
        authorization: `Bearer ${token}`,
        accept: "*/*",
        referer: "https://codolio.com/",
      },
      next: { revalidate: 900 },
    });

    if (!res.ok) throw new Error(`Codolio API returned ${res.status}`);

    const json = await res.json();

    // Codolio nests `platformProfiles` a couple of levels deep and the exact
    // depth isn't officially documented, so we search for it rather than
    // hardcoding a path that could silently break if their response shape
    // shifts slightly.
    const platforms = findPlatformProfilesArray(json) || [];

    const platformTotals: PlatformTotals = {
      leetcode: 0,
      gfg: 0,
      hackerrank: 0,
      codingninjas: 0,
    };

    let grandTotal = 0;

    for (const p of platforms) {
      const platformKey = String(p?.platform || "").toLowerCase();
      if (platformKey === "tuf") continue; // avoid double counting, per Codolio convention

      const stats = p?.totalQuestionStats;
      const total = Number(stats?.totalQuestionCounts) || 0;
      grandTotal += total;

      for (const [ourKey, aliases] of Object.entries(PLATFORM_ALIASES)) {
        if (aliases.includes(platformKey)) {
          platformTotals[ourKey] += total;
        }
      }
    }

    return { grandTotal, platformTotals };
  } catch (error) {
    console.error("Codolio fetch failed (token may have expired):", error);
    return null;
  }
}

export async function GET() {
  const username = "p_t626";

  try {
    const leetcodeData = await fetchLeetCodeDirect(username);
    const codolio = await fetchCodolioTotals();

    return NextResponse.json({
      ...leetcodeData,
      // Falls back to the LeetCode-only count if Codolio isn't reachable
      // (missing/expired token, network issue, etc).
      totalProblems: codolio?.grandTotal ?? leetcodeData.leetcodeBreakdown.solved,
      platformTotals: codolio?.platformTotals ?? null,
      codolioAvailable: Boolean(codolio),
    });
  } catch (error: any) {
    console.error("LeetCode API Error:", error);

    return NextResponse.json(
      {
        error: true,
        message: error?.message || "Failed to fetch coding stats",
        activeDays: 0,
        maxStreak: 0,
        leetcodeBreakdown: { solved: 0, easy: 0, medium: 0, hard: 0 },
        timeline: [],
        totalProblems: 0,
        platformTotals: null,
        codolioAvailable: false,
      },
      { status: 502 }
    );
  }
}
