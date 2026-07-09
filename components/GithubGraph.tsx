"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface ContributionDay {
  count: number;
  date: string;
}

interface GitHubData {
  totalContributions: number;
  bestStreak: string;
  consistency: string;
  lastActive: string;
  days: ContributionDay[];
}

const MONTHS = ["JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL"];

export default function GithubGraph() {
  const [githubData, setGitHubData] = useState<GitHubData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Tooltip tracking hooks
  const [activeDay, setActiveDay] = useState<ContributionDay | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ left: 0, top: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/github");
        const data = await res.json();
        setGitHubData(data);
      } catch (err) {
        console.error("Error setting stats context lines:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  const handleMouseMove = (e: React.MouseEvent, day: ContributionDay) => {
    if (!containerRef.current) return;
    const containerBounds = containerRef.current.getBoundingClientRect();
    const elementBounds = e.currentTarget.getBoundingClientRect();

    // Align tooltips natively to container elements grid spaces bounds context
    setTooltipPos({
      left: elementBounds.left - containerBounds.left + elementBounds.width / 2,
      top: elementBounds.top - containerBounds.top - 42,
    });
    setActiveDay(day);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-12 text-center text-xs text-neutral-400">
        Loading real-time contribution statistics...
      </div>
    );
  }

  const daysArray = githubData?.days || [];

  return (
    <section id="github-activity" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-content text-left">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Section Header */}
        <div className="mb-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Open Source</p>
          <h2 className="font-displayXl text-5xl md:text-6xl uppercase text-neutral-950 dark:text-white">GitHub Activity</h2>
          <p className="mt-2 text-sm text-neutral-600 dark:text-muted-foreground">
            Minimal yearly contribution overview focused on consistency over vanity metrics.
          </p>
        </div>

        {/* Chart Container Panel */}
        <div 
          ref={containerRef} 
          className="w-full rounded-2xl border border-neutral-200 dark:border-neutral-800/60 bg-white/40 dark:bg-card/20 p-4 md:p-6 shadow-sm relative"
        >
          {/* Tooltip Overlay Markup (Screenshot 2026-07-06 195311.png) */}
          {activeDay && (
            <div 
              style={{ left: `${tooltipPos.left}px`, top: `${tooltipPos.top}px` }}
              className="absolute z-30 pointer-events-none -translate-x-1/2 rounded-md bg-neutral-900 text-white px-2.5 py-1.5 text-[11px] font-medium shadow-xl border border-neutral-800 flex flex-col items-center leading-tight whitespace-nowrap"
            >
              <span>{activeDay.count} contributions</span>
              <span className="text-[10px] text-neutral-400 font-mono">
                {new Date(activeDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              {/* Triangular dropdown arrow */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-neutral-900" />
            </div>
          )}
          
          {/* Top Label Month Alignment Headers */}
          <div className="w-full flex justify-between text-[10px] font-bold text-neutral-400 dark:text-neutral-500 tracking-widest px-1 mb-3 overflow-hidden select-none">
            {MONTHS.map((month, idx) => (
              <span key={idx} className="w-full text-center first:text-left last:text-right">
                {month}
              </span>
            ))}
          </div>

          {/* Grid Blocks Layout Map */}
          <div className="w-full overflow-x-auto pb-2 scrollbar-none">
            <div className="grid grid-flow-col grid-rows-7 gap-[3px] min-w-[740px] md:min-w-full">
              {daysArray.map((day, idx) => {
                const count = day.count;
                let bgStyle = "bg-neutral-100 dark:bg-neutral-900/60";
                if (count > 0 && count <= 2) bgStyle = "bg-emerald-900/40 dark:bg-emerald-950";
                if (count > 2 && count <= 5) bgStyle = "bg-emerald-700/60 dark:bg-emerald-800";
                if (count > 5 && count <= 8) bgStyle = "bg-emerald-500 dark:bg-emerald-600";
                if (count > 8) bgStyle = "bg-emerald-400 dark:bg-emerald-400";

                return (
                  <div
                    key={idx}
                    onMouseMove={(e) => handleMouseMove(e, day)}
                    onMouseLeave={() => setActiveDay(null)}
                    className={`aspect-square rounded-[2px] transition-all duration-150 hover:scale-125 hover:z-10 cursor-crosshair ${bgStyle}`}
                  />
                );
              })}
            </div>
          </div>

          {/* Scale Legend Footer Elements */}
          <div className="flex items-center justify-between text-[11px] font-medium text-neutral-400 dark:text-neutral-500 mt-4 pt-2 border-t border-neutral-100 dark:border-neutral-900/30 select-none">
            <span>Last 12 months</span>
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="h-2.5 w-2.5 rounded-[2px] bg-neutral-100 dark:bg-neutral-900/60" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-900/40 dark:bg-emerald-950" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-700/60 dark:bg-emerald-800" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500 dark:bg-emerald-600" />
              <div className="h-2.5 w-2.5 rounded-[2px] bg-emerald-400 dark:bg-emerald-400" />
              <span>More</span>
            </div>
          </div>
        </div>

        {/* Dynamic Analytics Info Row */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1 text-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-neutral-600 dark:text-neutral-400">
            <span>
              Total commits: <strong className="text-neutral-950 dark:text-white font-bold font-mono">{githubData?.totalContributions}</strong>
            </span>
            <span>
              Best streak: <strong className="text-neutral-950 dark:text-white font-bold font-mono">{githubData?.bestStreak}</strong>
            </span>
            <span>
              Consistency: <strong className="text-brand font-bold font-mono">{githubData?.consistency}</strong>
            </span>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-6 text-xs text-neutral-400 dark:text-neutral-500">
            <a 
              href="https://github.com/puneet426" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 font-semibold text-neutral-800 dark:text-neutral-200 hover:text-brand transition-colors group"
            >
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 496 512" className="h-4 w-4 text-neutral-950 dark:text-white transition-transform group-hover:scale-110" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z"></path>
              </svg>
              @puneet426
            </a>
            <span className="font-medium">Last active: {githubData?.lastActive}</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}