"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpRight, Search } from "lucide-react";
import { profile } from "@/lib/data";

type Item = {
  label: string;
  hint: string;
  action: () => void;
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(
    () => [
      { label: "Go to About", hint: "section", action: () => scrollTo("about") },
      { label: "Go to Experience", hint: "section", action: () => scrollTo("experience") },
      { label: "Go to Projects", hint: "section", action: () => scrollTo("projects") },
      { label: "Go to Stack", hint: "section", action: () => scrollTo("skills") },
      { label: "Go to GitHub activity", hint: "section", action: () => scrollTo("github") },
      { label: "Go to Setup", hint: "section", action: () => scrollTo("gear") },
      { label: "Go to Education", hint: "section", action: () => scrollTo("education") },
      { label: "Go to Writing", hint: "section", action: () => scrollTo("blog") },
      { label: "Go to Contact", hint: "section", action: () => scrollTo("contact") },
      {
        label: "Email me",
        hint: "mailto",
        action: () => (window.location.href = `mailto:${profile.email}`),
      },
      ...profile.social.map((s) => ({
        label: `Open ${s.label}`,
        hint: "external",
        action: () => window.open(s.href, "_blank"),
      })),
    ],
    []
  );

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    close();
  }

  function close() {
    setOpen(false);
    setQuery("");
    setHighlight(0);
  }

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  function onInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      filtered[highlight]?.action();
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/50 hover:text-ink"
        aria-label="Open command menu"
      >
        <Search size={14} />
        <span className="hidden sm:inline">Search</span>
        <kbd className="hidden rounded border border-line bg-panel2 px-1.5 py-0.5 font-mono text-[10px] text-faint sm:inline">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-24 backdrop-blur-sm"
          onClick={close}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-panel shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-line px-4 py-3">
              <Search size={16} className="text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setHighlight(0);
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Type a command or search…"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
              />
              <kbd className="rounded border border-line px-1.5 py-0.5 font-mono text-[10px] text-faint">
                esc
              </kbd>
            </div>

            <ul className="max-h-72 overflow-y-auto py-2">
              {filtered.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-faint">
                  No results
                </li>
              )}
              {filtered.map((item, i) => (
                <li key={item.label}>
                  <button
                    onClick={item.action}
                    onMouseEnter={() => setHighlight(i)}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                      i === highlight ? "bg-panel2 text-ink" : "text-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.label}
                      {item.hint === "external" && <ArrowUpRight size={13} />}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wide text-faint">
                      {item.hint}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
