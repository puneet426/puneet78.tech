"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Folder, FileText, Mail, Settings, X, Search, Moon, Sun } from "lucide-react";

interface SidebarLayoutProps {
  children: React.ReactNode;
  isMinimal: boolean;
  setIsMinimal: (val: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (val: boolean) => void;
}

export default function SidebarLayout({ 
  children, 
  isMinimal, 
  setIsMinimal, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: SidebarLayoutProps) {

  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Sync internal theme tracking state with document element classes on mount
  useEffect(() => {
    const activeTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(activeTheme);
  }, [isMinimal]); // Checks whenever the sidebar visibility toggles

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

  const navItems = [
    { name: "Projects", href: "/projects", icon: Folder },
    { name: "Blog", href: "/blog", icon: FileText },
    { name: "Contact", href: "/contact", icon: Mail },
  ];

  return (
    <div className="flex min-h-screen bg-[#fdfbf7] dark:bg-black font-sans text-left transition-colors duration-300 relative">
      
      {/* ========================================================= */}
      {/* 1. DESKTOP SIDEBAR PANEL (Hides completely to w-0)        */}
      {/* ========================================================= */}
      <aside 
        className={`hidden md:flex flex-col justify-between border-r border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#0a0a0a] transition-all duration-300 ease-in-out sticky top-0 h-screen z-30 overflow-hidden ${
          isMinimal ? "w-0 p-0 border-r-0 opacity-0 pointer-events-none" : "w-64 p-4 opacity-100"
        }`}
      >
        {!isMinimal && (
          <div className="flex flex-col justify-between h-full w-full min-w-[224px]">
            
            {/* Top Group: Search & Navigation Links */}
            <div className="space-y-6">
              {/* Working Search Bar Button Trigger */}
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event("toggle-search"))}
                className="relative flex items-center w-full bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800/60 rounded-xl pl-9 pr-7 py-1.5 text-xs font-medium text-neutral-400 select-none text-left shadow-inner dark:shadow-none"
              >
                <Search className="absolute left-3 h-3.5 w-3.5 text-neutral-400" />
                <span>Search</span>
                <span className="absolute right-3 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-1.5 py-0.5 text-[9px] font-mono font-bold rounded text-neutral-400 shadow-sm">K</span>
              </button>

              <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 select-none">
                Menu
              </p>

              {/* Navigation Group items */}
              <nav className="space-y-1 flex flex-col">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900/60 hover:text-neutral-950 dark:hover:text-white transition-all group"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-neutral-400 group-hover:scale-105 transition-transform" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Group: Settings Grid & User Card Profile */}
            <div className="space-y-4">
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 select-none">
                Settings
              </p>

              {/* Side-by-Side Dual Control Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {/* Theme Controller Settings Trigger Button */}
                <button 
                  type="button"
                  onClick={toggleTheme}
                  className="flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 shadow-sm transition-colors"
                  title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Sidebar Close Width Toggle Layout Trigger Button */}
                <button 
                  type="button"
                  onClick={() => setIsMinimal(true)}
                  className="flex items-center justify-center rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-2.5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900 shadow-sm transition-colors" 
                  title="Hide sidebar navigation"
                  aria-label="Hide sidebar navigation"
                >
                  {/* Custom Minimal Double Column Line SVG */}
                  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="h-3.5 w-3.5">
                    <path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zm64 64l0 256 160 0 0-256L64 160zm384 0l-160 0 0 256 160 0 0-256z"></path>
                  </svg>
                </button>
              </div>

              {/* Full Profile Footer Card Layout */}
              <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-900/40 w-full">
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100 shadow-sm shrink-0">
                  <Image 
                    src="/profile.webp" 
                    alt="Puneet Tiwari" 
                    fill 
                    sizes="36px" 
                    className="object-cover" 
                  />
                </div>
                <div className="min-w-0 text-left leading-tight">
                  <p className="text-sm font-black text-neutral-900 dark:text-white uppercase truncate tracking-tight">Puneet Tiwari</p>
                  <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 truncate">@puneet426</p>
                </div>
              </div>

            </div>

          </div>
        )}
      </aside>

      {/* ========================================================= */}
      {/* 2. MOBILE TOP NAVIGATION FIXED TRIGGER BAR                */}
      {/* ========================================================= */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-neutral-200 dark:border-neutral-900 bg-white/80 dark:bg-black/80 backdrop-blur-md z-40 px-4 flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-neutral-900 dark:text-white">
          Puneet Tiwari
        </span>

        <button 
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open mobile navigation menu drawer" 
          className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" className="h-4 w-4">
            <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"></path>
          </svg>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. MOBILE MODAL SLIDEOUT MENU OVERLAY SIDE CANVAS         */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" />
          <div className="relative w-full max-w-[270px] h-full bg-white dark:bg-[#0a0a0a] border-l border-neutral-200 dark:border-neutral-900 p-5 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">Navigation</span>
                <button type="button" onClick={() => setIsMobileMenuOpen(false)} className="rounded-lg p-2 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors"><X className="h-4 w-4" /></button>
              </div>
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3.5 py-3 text-base font-bold text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/60 hover:text-neutral-950 dark:hover:text-white transition-colors">
                      <Icon className="h-4 w-4 text-neutral-400" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3 border-t border-neutral-100 dark:border-neutral-900/80 pt-4">
              <div className="relative h-8 w-8 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100">
                <Image src="/profile.webp" alt="Puneet Tiwari" fill sizes="32px" className="object-cover" />
              </div>
              <div className="text-left leading-tight">
                <h4 className="text-xs font-black text-neutral-950 dark:text-white uppercase">Puneet Tiwari</h4>
                <p className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500">Full Stack Developer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Content window layer area */}
      <div className="flex-1 w-full min-w-0 pt-14 md:pt-0 transition-all duration-300">
        {children}
      </div>

    </div>
  );
}