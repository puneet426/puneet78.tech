"use client";

import React from "react";
import { motion } from "framer-motion";

interface KeymapRow {
  title: string;
  description: string;
  keyLabel: string;
}

const GLOBAL_SHORTCUTS: KeymapRow[] = [
  { title: "Search", description: "Open the global command search modal stack", keyLabel: "K" },
  { title: "Theme Toggle", description: "Switch dynamically between dark and light themes", keyLabel: "T" },
  { title: "Home", description: "Return back to the main landing index viewport", keyLabel: "H" },
  { title: "Projects", description: "Navigate directly to your engineering projects page", keyLabel: "P" },
  { title: "Contact", description: "Open up your dedicated communication channels", keyLabel: "C" },
  { title: "Keymap Guide", description: "Bring up the shortcut dashboard system layout", keyLabel: "/" },
];

const SECTION_SHORTCUTS: KeymapRow[] = [
  { title: "Hero Section", description: "Jump directly up to header introductory frames", keyLabel: "1" },
  { title: "Social Section", description: "Scroll over onto connected external community paths", keyLabel: "2" },
  { title: "Tech Stack Section", description: "Animate focal coordinates down to skills matrices", keyLabel: "3" },
  { title: "Experience Section", description: "Slide window position to institutional history stack", keyLabel: "4" },
  { title: "Projects Section", description: "Focal window moves down into showcase project carousels", keyLabel: "5" },
  { title: "Education Section", description: "Jump directly to structural university milestone tracks", keyLabel: "9" },
];

export default function KeymapGuidePage() {
  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left select-none text-neutral-800 dark:text-neutral-200">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-12"
      >
        {/* Page Titles Line Layout */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
            Navigation Guide
          </p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white uppercase mb-3">
            Keyboard Keymap
          </h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Use these hotkeys to bounce instantly across pages and scroll home segments quickly without any modifiers or combination configurations needed.
          </p>
        </div>

        {/* 1. GLOBAL HOTKEYS TIERS CONTAINER */}
        <div className="space-y-4">
          <h3 className="text-md font-bold tracking-tight text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-900 pb-2">
            Global Shortcuts
          </h3>
          <div className="space-y-2">
            {GLOBAL_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.keyLabel}
                className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-white dark:hover:bg-neutral-900/30 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm dark:shadow-none"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{shortcut.title}</h4>
                  <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{shortcut.description}</p>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  {shortcut.keyLabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 2. SECTION NAV SHORTCUTS TIERS CONTAINER */}
        <div className="space-y-4">
          <h3 className="text-md font-bold tracking-tight text-neutral-900 dark:text-white border-b border-neutral-200 dark:border-neutral-900 pb-2">
            Home Section Shortcuts
          </h3>
          <div className="space-y-2">
            {SECTION_SHORTCUTS.map((shortcut) => (
              <div
                key={shortcut.keyLabel}
                className="flex items-center justify-between p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/10 hover:bg-white dark:hover:bg-neutral-900/30 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all shadow-sm dark:shadow-none"
              >
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{shortcut.title}</h4>
                  <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">{shortcut.description}</p>
                </div>
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-white dark:bg-neutral-950 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                  {shortcut.keyLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}