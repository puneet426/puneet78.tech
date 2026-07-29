"use client";
import Image from "next/image";
import React from "react";
import dynamic from "next/dynamic";
import { ArrowUpRight, FileText } from "lucide-react";

const HeroCanvas = dynamic(() => import("./HeroCanvas"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />,
});

export default function Hero() {
  return (
    <section id="hero-section" className="relative w-full h-auto bg-[#fffdef] dark:bg-[#060202] text-neutral-900 dark:text-foreground overflow-hidden flex items-center font-content pt-20 pb-28 transition-colors duration-300">
      
      {/* BACKGROUND CANVAS PHYSICS LAYER */}
      <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
        <HeroCanvas />
        {/* Multi-theme gradient cut-off layer */}
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7]/80 to-transparent dark:from-background dark:via-background/80 dark:to-transparent z-10" />
      </div>

      {/* TYPOGRAPHY CONTENT LAYER (COMPLETELY VISIBLE ON TOP) */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 w-full pt-12 select-text">
        
        {/* Status Pill Badge */}
        <div className="mb-6 flex items-center gap-3 transition-all duration-300">
          
          {/* Rounded Avatar with Glow Ring */}
          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full ring-2 ring-indigo-500/40">
            <Image 
              alt="Puneet Tiwari" 
              src="/profile.webp" // Make sure to drop your profile image into the public folder as profile.webp
              fill
              sizes="36px"
              priority
              className="object-cover"
            />
          </span>

          {/* Status Pill Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-70 motion-reduce:animate-none"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
            </span>
            Open to roles 
          </span>
          
        </div>

        {/* Huge Bold Title Heading */}
        <h1 className="text-8xl md:text-[11rem] font-black tracking-tighter leading-[0.85] font-sans text-neutral-950 dark:text-white uppercase drop-shadow-[0_4px_12px_rgba(0,0,0,0.04)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,1)]">
          Puneet
          <span className="block text-neutral-950 dark:text-white">Tiwari</span>
        </h1>

        {/* Subtitle Banner Info Line */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-950 dark:text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.03)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,1)]">
            Full Stack Developer
          </h2>
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Twitter_Verified_Badge.svg" 
            alt="Verified" 
            className="w-5 h-5 object-contain filter hue-rotate-[30deg] saturate-150 select-none align-middle"
            draggable="false"
          />

          <a href="https://twitter.com/puneet626" className="text-xs text-neutral-500 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white transition-colors ml-1">
            @puneet626
          </a>
        </div>

        <p className="mt-6 max-w-2xl text-base md:text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 tracking-wide font-normal drop-shadow-[0_2px_10px_rgba(0,0,0,0.01)] dark:drop-shadow-[0_2px_10px_rgba(0,0,0,1)]">
          Full Stack Developer. Turning ideas into production apps — 
          
          {/* React Logo Badge */}
          <span className="inline-flex items-center gap-1.5 mx-1 bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-md text-sm font-medium text-neutral-800 dark:text-white shadow-sm align-middle">
            <img src="/technology/react.svg" alt="React" className="w-4 h-4 object-contain" />
            React
          </span> 
          
          and 
          
          {/* Next.js Logo Badge */}
          <span className="inline-flex items-center gap-1.5 mx-1 bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-md text-sm font-medium text-neutral-800 dark:text-white shadow-sm align-middle">
            <img src="/technology/nextjs-dark.svg" alt="Next.js" className="w-4 h-4 object-contain invert dark:invert-0" />
            Next.js
          </span> 
          
          on the frontend, 
          
          {/* Node.js Logo Badge */}
          <span className="inline-flex items-center gap-1.5 mx-1 bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-md text-sm font-medium text-neutral-800 dark:text-white shadow-sm align-middle">
            <img src="/technology/nodejs.svg" alt="Node.js" className="w-4 h-4 object-contain" />
            Node.js
          </span> 
          
          and 
          
          {/* TypeScript Logo Badge */}
          <span className="inline-flex items-center gap-1.5 mx-1 bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 px-2.5 py-1 rounded-md text-sm font-medium text-neutral-800 dark:text-white shadow-sm align-middle">
            <img src="/technology/js.svg" alt="TypeScript" className="w-4 h-4 object-contain rounded-sm" />
            TypeScript
          </span> 
          
          powering the backend. Clean code, fast APIs, and UIs that don't suck.
        </p>

        {/* Bottom CTA Actions Trigger Row */}
        <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4 transition-all duration-300">
          
          {/* Resume Button */}
          <a 
            className="inline-flex items-center tracking-normal transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 bg-indigo-500 dark:bg-indigo-400 text-white border border-transparent hover:opacity-90 active:scale-95 px-4 py-2 text-[15px] gap-2 rounded-lg font-medium shadow-md"
            href="https://media.licdn.com/dms/image/v2/D562DAQHnkiK5DmudBg/profile-treasury-document-images_1920/B56Z.vHDq5HUAk-/1/1785349291823?e=1785974400&v=beta&t=eVcSqoYFJm7gzC0SXULaNLf7ZSaXuQ0JpmBDvffzhY0" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <span className="shrink-0">
              <svg 
                stroke="currentColor" 
                fill="currentColor" 
                strokeWidth="0" 
                viewBox="0 0 384 512" 
                className="h-3.5 w-3.5" 
                height="1em" 
                width="1em" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M64 0C28.7 0 0 28.7 0 64L0 448c0 35.3 28.7 64 64 64l256 0c35.3 0 64-28.7 64-64l0-288-128 0c-17.7 0-32-14.3-32-32L224 0 64 0zM256 0l0 128 128 0L256 0zM112 256l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16zm0 64l160 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-160 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"></path>
              </svg>
            </span>
            <span>Resume</span>
          </a>

          {/* Get In Touch Button */}
          <a
            className="inline-flex items-center tracking-normal transition-all duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-800 bg-transparent text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-900 active:scale-95 px-4 py-2 text-[15px] gap-2 rounded-lg font-medium"
            href="mailto:tiwaripuneet626@gmail.com"
          >
            <span className="shrink-0">
              <svg 
                stroke="currentColor" 
                fill="currentColor" 
                strokeWidth="0" 
                viewBox="0 0 512 512" 
                className="h-3.5 w-3.5" 
                height="1em" 
                width="1em" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z"></path>
              </svg>
            </span>
            <span>Get in touch</span>
          </a>
          
        </div>
      </div>
    </section>
  );
}