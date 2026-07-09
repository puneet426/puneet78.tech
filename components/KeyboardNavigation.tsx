"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Keyboard, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ShortcutItem {
  key: string;
  title: string;
  description: string;
  type: "page" | "action" | "section";
  target: string;
}

const SHORTCUTS_DATA: ShortcutItem[] = [
  { key: "k", title: "Search", description: "Open the global command search", type: "action", target: "MODAL" },
  { key: "/", title: "Keymap Guide", description: "Open the keyboard shortcuts guide modal", type: "action", target: "MODAL" },
  { key: "h", title: "Home", description: "Go to the home page", type: "page", target: "/" },
  { key: "p", title: "Projects", description: "Open the projects section page", type: "page", target: "/projects" },
  { key: "b", title: "Blog", description: "Open the self-hosted personal blog archive", type: "page", target: "/blog" },
  { key: "c", title: "Contact", description: "Open the interactive contact form page", type: "page", target: "/contact" },
  { key: "m", title: "Keymap Page", description: "View the full keymap guide directory", type: "page", target: "/keymap" },
  { key: "1", title: "Hero Section", description: "Jump to hero section on home", type: "section", target: "/#hero" },
  { key: "2", title: "Social Section", description: "Jump to social links section", type: "section", target: "/#social" },
  { key: "3", title: "Tech Stack Section", description: "Jump to technology section", type: "section", target: "/#tech" },
  { key: "4", title: "Experience Section", description: "Jump to experience section", type: "section", target: "/#experience" },
  { key: "5", title: "Projects Section", description: "Jump to projects section", type: "section", target: "/#projects" },
  { key: "9", title: "Education Section", description: "Jump to education section", type: "section", target: "/#education" },
];

export default function KeyboardNavigation() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 🛠️ NEW: Listen for clicking triggers dispatched from Nav.tsx
    const handleToggleEvent = () => {
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("toggle-search", handleToggleEvent);

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      
      const isInputActive = 
        activeEl && (
          activeEl.tagName === "INPUT" || 
          activeEl.tagName === "TEXTAREA" || 
          activeEl.hasAttribute("contenteditable") ||
          activeEl.closest("[data-keyboard-bypass]")
        );

      if (isInputActive) {
        if (e.key === "Escape" && isOpen) {
          setIsOpen(false);
        }
        return; 
      }

      const lowKey = e.key.toLowerCase();

      if (lowKey === "t") {
        e.preventDefault();
        const isDark = document.documentElement.classList.contains("dark");
        const nextTheme = isDark ? "light" : "dark";
        
        localStorage.setItem("theme", nextTheme);
        document.documentElement.style.colorScheme = nextTheme;

        if (nextTheme === "dark") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }

        window.dispatchEvent(new Event("storage"));
        return;
      }

      if (lowKey === "k" || lowKey === "/") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        return;
      }

      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }

      const matched = SHORTCUTS_DATA.find((s) => s.key === lowKey && s.type !== "action");
      if (matched) {
        e.preventDefault();
        router.push(matched.target);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("toggle-search", handleToggleEvent); // Clean up
    };
  }, [isOpen, router]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  const filteredShortcuts = SHORTCUTS_DATA.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleItemSelect = (target: string) => {
    setIsOpen(false);
    if (target !== "MODAL") {
      router.push(target);
    }
  };

  return (
    <>
      {/* STICKY BOTTOM RIGHT TOGGLE CORNER BUTTON */}
      <div className="fixed bottom-6 right-6 z-40 select-none">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-neutral-200/80 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/90 text-neutral-800 dark:text-neutral-200 shadow-md backdrop-blur-md hover:border-neutral-300 dark:hover:border-neutral-700 transition-all text-xs font-bold uppercase tracking-wider group"
        >
          <Keyboard className="w-4 h-4 text-indigo-500 transition-transform group-hover:scale-110" />
          <span>Shortcuts</span>
          <span className="hidden sm:inline-block bg-neutral-100 dark:bg-neutral-800 text-neutral-400 font-mono text-[10px] px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 ml-1">
            /
          </span>
        </button>
      </div>

      {/* SEARCHABLE SEARCH COMMAND PALETTE OVERLAY MODAL */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              className="relative w-full max-w-xl rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#0d0d0d] shadow-2xl overflow-hidden flex flex-col"
              data-keyboard-bypass="true"
            >
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-neutral-100 dark:border-neutral-900">
                <Search className="w-4 h-4 text-neutral-400 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.stopPropagation()} 
                  placeholder="Type a command or search shortcuts..."
                  className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 outline-none"
                />
                <span className="text-[10px] font-mono bg-neutral-100 dark:bg-neutral-900 px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-800 text-neutral-400">
                  {filteredShortcuts.length} results
                </span>
                <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[340px] overflow-y-auto p-2 space-y-1 scrollbar-none">
                {filteredShortcuts.length > 0 ? (
                  filteredShortcuts.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleItemSelect(item.target)}
                      className="w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group hover:bg-neutral-50 dark:hover:bg-neutral-900/60"
                    >
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500">
                          {item.description}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-950 text-neutral-500 border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
                        {item.key}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-10 text-neutral-400 font-mono text-xs tracking-wide">
                    No shortcut entries match your query
                  </div>
                )}
              </div>

              <div className="bg-neutral-50 dark:bg-neutral-950/80 px-4 py-2.5 border-t border-neutral-100 dark:border-neutral-900 flex justify-between items-center text-[10px] font-bold text-neutral-400 tracking-wide font-mono">
                <span>Press a key to navigate instantly</span>
                <span onClick={() => handleItemSelect("/keymap")} className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Open full page view ↗
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}