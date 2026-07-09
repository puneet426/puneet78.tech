"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200/60 dark:border-neutral-900 bg-white dark:bg-[#050101] pt-16 pb-8 transition-colors duration-300">
      <div className="mx-auto max-w-3xl px-4 md:px-0 font-content">
        
        <div className="text-left mb-10">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-indigo-500 dark:text-brand block mb-3">
            GET IN TOUCH
          </span>
          
          <h2 className="font-sans font-black text-5xl md:text-7xl uppercase text-neutral-950 dark:text-white tracking-tighter leading-none mb-4">
            Let's build something.
          </h2>
          
          <p className="text-sm md:text-base font-normal italic text-neutral-400 dark:text-neutral-500">
            “Have an idea? Let's build something great together. I'm always open to discussing new projects and opportunities.”
          </p>
        </div>

        
        <div className="flex flex-wrap items-center gap-3 mb-14">
          <a 
            href="https://cal.com/puneet426" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-card px-4 py-2 text-sm font-semibold text-neutral-800 dark:text-white shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all duration-200"
          >
            <span className="relative h-10 w-10 overflow-hidden rounded-full shrink-0">
              <Image 
                alt="Puneet Tiwari" 
                src="/profile.webp" 
                fill 
                sizes="40px"
                className="object-cover" 
              />
            </span>
            Book a Free Call
          </a>

          
          <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            </span>
            Available for work
          </span>
        </div>

      
        <div className="border-t border-neutral-100 dark:border-neutral-900/60 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
        
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Core Internal Links */}
            <Link href="/" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Home
            </Link>
            <Link href="/projects" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Projects
            </Link>
            <Link href="/contact" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Contact
            </Link>
            
            <span className="hidden md:inline text-neutral-300 dark:text-neutral-800 mx-1">|</span>

            
            <a href="https://github.com/puneet426" target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              GitHub
            </a>
            <a href="https://linkedin.com/in/flawlesspuneet" target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              LinkedIn
            </a>
            <a href="https://twitter.com/puneet626" target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 px-3 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors">
              Twitter
            </a>
          </div>

        
          <div className="flex items-center">
            <a href="mailto:tiwaripuneet626@gmail.com" className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 dark:border-brand/20 bg-indigo-500/10 dark:bg-brand/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-indigo-600 dark:text-brand hover:bg-indigo-500 hover:text-white dark:hover:bg-brand dark:hover:text-black transition-all shadow-sm">
              <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" className="h-3 w-3" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/>
              </svg>
              Email Me
            </a>
          </div>

        </div>

       
        <div className="mt-10 text-left select-none pointer-events-none opacity-5 dark:opacity-[0.05] overflow-hidden hidden md:block">
          <span className="font-sans font-black text-[9.5rem] tracking-tighter uppercase leading-none text-neutral-950 dark:text-white block translate-y-8 -ml-1">
            Puneet Tiwari
          </span>
        </div>

     
        <div className="flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-600 font-medium pt-4 border-t border-neutral-100 dark:border-neutral-900/40 gap-2 mt-6 sm:mt-0">
          <p>© 2026 Puneet Tiwari. All rights reserved.</p>
          <p className="opacity-60 font-mono text-[10px]">v4.0.0 // Built with Next.js</p>
        </div>

      </div>
    </footer>
  );
}