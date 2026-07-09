"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";

interface TimelineDay {
  date: string;
  count: number;
}

interface PlatformTotals {
  leetcode: number;
  gfg: number;
  hackerrank: number;
  codingninjas: number;
}

interface LiveStatsPayload {
  activeDays: number;
  maxStreak: number;
  leetcodeBreakdown: { solved: number; easy: number; medium: number; hard: number };
  timeline: TimelineDay[];
  totalProblems: number;
  platformTotals: PlatformTotals | null;
  codolioAvailable: boolean;
  error?: boolean;
  message?: string;
}

// Official brand logos via Simple Icons' free CDN — no hosting needed.
// https://cdn.simpleicons.org/:slug renders the brand's real logo as an SVG.
const PLATFORM_LOGOS = [
  { key: "leetcode", label: "LeetCode", slug: "leetcode" },
  { key: "gfg", label: "GeeksforGeeks", slug: "geeksforgeeks" },
  { key: "hackerrank", label: "HackerRank", slug: "hackerrank" },
  { key: "codingninjas", label: "Coding Ninjas", slug: "codingninjas" },
] as const;

export default function CodingStats() {
  const [liveData, setLiveData] = useState<LiveStatsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  // Hover Tooltip tracking references
  const [hoveredDay, setHoveredDay] = useState<TimelineDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });

  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollTrackRef = useRef<HTMLDivElement>(null);

  // 🛠️ CONFIGURATION METRICS (Updated with your custom values)
  const MANUAL_STATS = {
    leetcodeRating: 1504,
    codechefRating: 1742,
  };

  useEffect(() => {
    async function fetchLeetCodeData() {
      try {
        const res = await fetch("/api/leetcode");
        const data = await res.json();
        setLiveData(data);
      } catch (err) {
        console.error("Error setting dynamic timeline blocks:", err);
        setLiveData({
          activeDays: 0,
          maxStreak: 0,
          leetcodeBreakdown: { solved: 0, easy: 0, medium: 0, hard: 0 },
          timeline: [],
          totalProblems: 0,
          platformTotals: null,
          codolioAvailable: false,
          error: true,
          message: "Could not reach the stats API.",
        });
      } finally {
        setLoading(false);
      }
    }
    fetchLeetCodeData();
  }, []);

  const handleMouseMove = (e: React.MouseEvent, day: TimelineDay) => {
    if (!sectionRef.current) return;
    const sectionBounds = sectionRef.current.getBoundingClientRect();
    const elementBounds = e.currentTarget.getBoundingClientRect();

    setTooltipPos({
      left: elementBounds.left - sectionBounds.left + elementBounds.width / 2,
      top: elementBounds.top - sectionBounds.top - 46,
    });
    setHoveredDay(day);
  };

  const executeTrackScroll = (direction: "left" | "right") => {
    if (!scrollTrackRef.current) return;
    // Step size tuned perfectly to slide full month columns
    const step = direction === "left" ? -260 : 260;
    scrollTrackRef.current.scrollBy({ left: step, behavior: "smooth" });
  };

  if (loading || !liveData) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-xs tracking-widest text-neutral-500 uppercase font-mono">
        Fetching live calendar timelines from LeetCode...
      </div>
    );
  }

  // Surface real fetch/API failures instead of silently rendering zeros
  if (liveData.error) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center text-xs tracking-widest text-rose-500 uppercase font-mono">
        Couldn&apos;t load live LeetCode stats{liveData.message ? `: ${liveData.message}` : ""}.
        <br />
        Try refreshing in a bit.
      </div>
    );
  }

  // Segment linear history days array maps into clean, structured month buckets
  const monthsMap: { [key: string]: TimelineDay[] } = {};
  liveData.timeline.forEach((day) => {
    const dObj = new Date(day.date);
    const label = dObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    if (!monthsMap[label]) monthsMap[label] = [];
    monthsMap[label].push(day);
  });

  // Extract keys and slice to display exactly 6 months at a time horizontally
  const activeMonthKeys = Object.keys(monthsMap).slice(-10);

  return (
    <section ref={sectionRef} id="coding-profiles" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 text-left text-neutral-800 dark:text-neutral-200 relative bg-transparent select-none">

      {/* Floating Hover Tooltip Module */}
      {hoveredDay && (
        <div
          style={{ left: `${tooltipPos.left}px`, top: `${tooltipPos.top}px` }}
          className="absolute z-50 pointer-events-none -translate-x-1/2 rounded-md bg-neutral-900 dark:bg-neutral-950 text-neutral-100 px-2.5 py-1.5 text-[11px] font-semibold border border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col items-center leading-none whitespace-nowrap"
        >
          <span>{hoveredDay.count} submissions</span>
          <span className="text-[10px] text-neutral-400 font-mono mt-1">
            {new Date(hoveredDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-neutral-900 dark:border-t-neutral-950" />
        </div>
      )}

      {/* Header labels */}
      <div className="mb-10">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Stats</p>
        <h2 className="font-sans text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">Coding Profiles</h2>
      </div>

      {/* 1. TOP PERFORMANCE DASHBOARD ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Total Problems — sourced from Codolio's cross-platform aggregate */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 backdrop-blur-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Total Problems</span>
          <span className="text-3xl font-black text-neutral-900 dark:text-white font-mono">{liveData.totalProblems}</span>
          <div className="flex gap-1.5 mt-2.5 items-center" title={liveData.codolioAvailable ? "Live from Codolio" : "Codolio unavailable — showing LeetCode only"}>
            {PLATFORM_LOGOS.map((p) => (
              <img
                key={p.key}
                src={`https://cdn.simpleicons.org/${p.slug}`}
                alt={p.label}
                title={p.label}
                className="w-3.5 h-3.5 opacity-80 hover:opacity-100 transition-opacity"
              />
            ))}
          </div>
          {!liveData.codolioAvailable && (
            <span className="mt-1 text-[8px] font-bold text-neutral-400 dark:text-neutral-600 uppercase tracking-wider">
              LeetCode only
            </span>
          )}
        </div>

        {/* Active Days */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 backdrop-blur-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Active Days</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{liveData.activeDays}</span>
        </div>

        {/* Max Streak */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 backdrop-blur-sm p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1">Max Streak</span>
          <span className="text-3xl font-black text-orange-600 dark:text-orange-400 font-mono flex items-center gap-1.5 justify-center">
            {liveData.maxStreak} <span className="text-lg">🔥</span>
          </span>
        </div>

        {/* Contest Ratings */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 backdrop-blur-sm p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest mb-1.5">Contest Ratings</span>
          <div className="w-full flex justify-around items-baseline mt-0.5">
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">{MANUAL_STATS.leetcodeRating}</span>
              <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">LeetCode</span>
            </div>
            <div className="h-6 w-px bg-neutral-200 dark:bg-neutral-800" />
            <div className="flex flex-col items-center">
              <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono">{MANUAL_STATS.codechefRating}</span>
              <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">CodeChef</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1b. PER-PLATFORM BREAKDOWN ROW (only renders once Codolio data is live) */}
      {liveData.codolioAvailable && liveData.platformTotals && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {PLATFORM_LOGOS.map((p) => (
            <div
              key={p.key}
              className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/20 px-3 py-2.5 flex items-center gap-2.5"
            >
              <img src={`https://cdn.simpleicons.org/${p.slug}`} alt={p.label} className="w-4 h-4 shrink-0" />
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-black text-neutral-900 dark:text-white font-mono">
                  {liveData.platformTotals![p.key]}
                </span>
                <span className="text-[8px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                  {p.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. MAIN SUBMISSION CHARTS TIERS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">

        {/* Left Side: LeetCode Difficulty Solved Counters */}
        <div className="md:col-span-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/30 backdrop-blur-sm p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="font-sans text-sm font-black tracking-wider text-neutral-700 dark:text-neutral-200 uppercase flex items-center gap-2">
              <img src="https://cdn.simpleicons.org/leetcode" alt="LeetCode" className="w-4 h-4" />
              LeetCode
            </h3>
            <a href="https://leetcode.com/u/p_t626/" target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 inline-flex items-center gap-0.5 transition-colors">
              Profile <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>

          <div className="my-6 text-center">
            <span className="block text-4xl font-black text-neutral-900 dark:text-white font-mono leading-none mb-1">{liveData.leetcodeBreakdown.solved}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Problems Solved</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold font-mono">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl py-2">
              <span className="block text-emerald-600 dark:text-emerald-400 text-sm">{liveData.leetcodeBreakdown.easy}</span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase">Easy</span>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl py-2">
              <span className="block text-amber-600 dark:text-amber-400 text-sm">{liveData.leetcodeBreakdown.medium}</span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase">Med</span>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl py-2">
              <span className="block text-rose-600 dark:text-rose-400 text-sm">{liveData.leetcodeBreakdown.hard}</span>
              <span className="text-[9px] text-neutral-400 dark:text-neutral-500 uppercase">Hard</span>
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable LeetCode Submission Grid */}
        <div className="md:col-span-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-950/30 backdrop-blur-sm p-5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-sans text-sm font-bold tracking-wide text-neutral-700 dark:text-neutral-200">Submission Activity</h3>
            <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-200 dark:bg-neutral-800" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-900/30 dark:bg-emerald-950" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-600/60 dark:bg-emerald-700" />
              <div className="w-2.5 h-2.5 rounded-[2px] bg-emerald-500" />
              <span>More</span>
            </div>
          </div>

          {/* Chronological Month Flex Track Container (Limited to 6 structural months) */}
          <div
            ref={scrollTrackRef}
            className="flex gap-2 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          >
            {activeMonthKeys.map((month) => (
              <div key={month} className="flex flex-col gap-2 min-w-[70px] snap-start text-center">
                <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-wider uppercase">{month}</span>
                <div className="grid grid-cols-4 gap-[3px] mx-auto w-max">
                  {monthsMap[month].map((day, dIdx) => {
                    const count = day.count;
                    let nodeColor = "bg-neutral-200 dark:bg-neutral-800/60";
                    if (count > 0 && count <= 1) nodeColor = "bg-emerald-300/80 dark:bg-emerald-950";
                    if (count > 1 && count <= 3) nodeColor = "bg-emerald-400/90 dark:bg-emerald-700";
                    if (count > 3) nodeColor = "bg-emerald-500";

                    return (
                      <div
                        key={dIdx}
                        onMouseMove={(e) => handleMouseMove(e, day)}
                        onMouseLeave={() => setHoveredDay(null)}
                        className={`w-3.5 h-3.5 rounded-[2px] border border-transparent cursor-crosshair transition-all duration-150 hover:scale-125 hover:z-10 ${nodeColor}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer Complete Profile Link */}
      <div className="mt-8 text-center">
        <a href="https://codolio.com/profile/p_t626" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors group">
          View complete profile on Codolio
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </a>
      </div>

    </section>
  );
}