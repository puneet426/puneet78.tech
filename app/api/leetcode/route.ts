import { NextResponse } from "next/server";

export async function GET() {
  const username = "p_t626";

  try {
    const res = await fetch(
      `https://leetcode-api-faisalshohag.vercel.app/${username}`,
      {
        next: {
          revalidate: 900, // 15 minutes
        },
      }
    );

    if (!res.ok) {
      throw new Error(`LeetCode proxy returned ${res.status}`);
    }

    const data = await res.json();

    const activeDays = data.totalActiveDays || 0;
    const maxStreak = data.maxStreak || 0;

    const easy = data.easySolved || 0;
    const medium = data.mediumSolved || 0;
    const hard = data.hardSolved || 0;

    // Convert submissionCalendar timestamps into YYYY-MM-DD map
    const submissionCalendar = data.submissionCalendar || {};
    const timelineMap: Record<string, number> = {};

    Object.entries(submissionCalendar).forEach(([timestamp, count]) => {
      const date = new Date(Number(timestamp) * 1000)
        .toISOString()
        .split("T")[0];

      timelineMap[date] = Number(count);
    });

    // ===================================================
    // Generate the LAST 6 CALENDAR MONTHS
    // ===================================================

    const today = new Date();

    // First day of month (5 months ago)
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - 5,
      1
    );

    const endDate = new Date(today);

    const timeline = [];

    for (
      let d = new Date(startDate);
      d <= endDate;
      d.setDate(d.getDate() + 1)
    ) {
      const key = d.toISOString().split("T")[0];

      timeline.push({
        date: key,
        count: timelineMap[key] ?? 0,
      });
    }

    return NextResponse.json({
      activeDays,
      maxStreak,
      leetcodeBreakdown: {
        solved: easy + medium + hard,
        easy,
        medium,
        hard,
      },
      timeline,
    });
  } catch (error: any) {
    console.error("LeetCode API Error:", error);

    // ==============================
    // Fallback data
    // ==============================

    const today = new Date();

    const startDate = new Date(
      today.getFullYear(),
      today.getMonth() - 5,
      1
    );

    const timeline = [];

    for (
      let d = new Date(startDate);
      d <= today;
      d.setDate(d.getDate() + 1)
    ) {
      timeline.push({
        date: d.toISOString().split("T")[0],
        count: Math.random() > 0.65 ? Math.floor(Math.random() * 5) + 1 : 0,
      });
    }

    return NextResponse.json({
      activeDays: 178,
      maxStreak: 55,
      leetcodeBreakdown: {
        solved: 487,
        easy: 159,
        medium: 263,
        hard: 65,
      },
      timeline,
    });
  }
}