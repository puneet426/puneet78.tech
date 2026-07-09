"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

interface NavProps {
  onToggleMinimal: () => void;
  onToggleMobileMenu: () => void;
}

export default function Nav({ onToggleMinimal, onToggleMobileMenu }: NavProps) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme =
      savedTheme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    
    setTheme(initialTheme);
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    document.documentElement.style.colorScheme = nextTheme;
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-neutral-200/50 dark:border-neutral-800/50 bg-white/80 dark:bg-black/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 transition-colors duration-300"
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4 md:px-0">
        
        {/* BRAND IDENTITY BANNER MODULE */}
        <div className="flex items-center">
          <Link href="/" className="flex cursor-pointer items-center gap-2 group">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative h-8 w-8 overflow-hidden rounded-full border border-neutral-200 dark:border-neutral-800 shadow-sm flex-shrink-0"
            >
              <Image 
                alt="Puneet Tiwari" 
                src="/profile.webp" 
                fill 
                sizes="32px"
                className="object-cover group-hover:scale-105 transition-transform duration-300" 
              />
            </motion.div>
            
            <div className="flex flex-col justify-center text-left">
              <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 leading-tight whitespace-nowrap">
                Puneet Tiwari
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight whitespace-nowrap">
                @puneet426
              </span>
            </div>
          </Link>
        </div>

        {/* NAVIGATION LINKS AND INTERACTION ROW */}
        <div className="flex items-center gap-1.5">
          
          <nav className="hidden md:flex items-center gap-1">
            <Link className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900" href="/projects">
              Projects
            </Link>
            <Link className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900" href="/blog">
              Blog
            </Link>
            <Link className="relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900" href="/contact">
              Contact
            </Link>
          </nav>

          {/* Search Trigger */}
          <button 
            data-keyboard-bypass="true"
            onClick={() => window.dispatchEvent(new Event("toggle-search"))}
            className="hidden sm:flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/80 transition-all"
            aria-label="Open search" 
            title="Search (K)"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="h-3.5 w-3.5" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"></path>
            </svg>
            <span>Search</span>
            <kbd className="text-xs bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-300 dark:border-neutral-700 font-sans shadow-sm opacity-80">K</kbd>
          </button>

          
          <button 
            type="button"
            data-keyboard-bypass="true"
            onClick={onToggleMinimal} 
            className="hidden sm:flex rounded-lg p-2 text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100" 
            title="Switch to minimal sidebar navigation" 
            aria-label="Switch to minimal sidebar navigation"
          >
            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="h-[15px] w-[15px]" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm64 64l0 256 160 0 0-256L64 160zm384 0l-160 0 0 256 160 0 0-256z"></path>
            </svg>
          </button>

          
          <button 
            onClick={toggleTheme}
            data-keyboard-bypass="true"
            className="rounded-lg p-2 text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100" 
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 384 512" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M223.5 32C100 32 0 132.3 0 256S100 480 223.5 480c60.6 0 115.5-24.2 155.8-63.4c5-4.9 6.3-12.5 3.1-18.7s-10.1-9.7-17-8.5c-9.8 1.7-19.8 2.6-30.1 2.6c-96.9 0-175.5-78.8-175.5-176c0-65.8 36-123.1 89.3-153.3c6.1-3.5 9.2-10.5 7.7-17.3s-7.3-11.9-14.3-12.5c-6.3-.5-12.6-.8-19-.8z"></path>
              </svg>
            ) : (
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm8-5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2a.5.5 0 0 1 .5.5zM3 8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1 0-1h2A.5.5 0 0 1 3 8zm10.657-5.657a.5.5 0 0 1 0 .707l-1.414 1.415a.5.5 0 1 1-.707-.708l1.414-1.414a.5.5 0 0 1 .707 0zm-9.193 9.193a.5.5 0 0 1 0 .707L3.05 13.657a.5.5 0 0 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm9.193 2.121a.5.5 0 0 1-.707 0l-1.414-1.414a.5.5 0 0 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .707zM4.464 4.465a.5.5 0 0 1-.707 0L2.343 3.05a.5.5 0 1 1 .707-.707l1.414 1.414a.5.5 0 0 1 0 .708z"/>
              </svg>
            )}
          </button>

          
          <div className="md:hidden">
            <button 
              type="button"
              onClick={onToggleMobileMenu} 
              aria-label="Open navigation" 
              className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-neutral-100"
            >
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="h-4 w-4" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}