"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, ExternalLink } from "lucide-react";
import { PROJECTS_DATA } from "@/lib/projectsData";

export default function AllProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 md:px-6 py-12 font-sans min-h-screen text-left">
      {/* Back Button */}
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to Home
      </Link>

      <div className="flex flex-col items-start text-left mb-10">
        <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">Archive</span>
        <h1 className="text-5xl md:text-6xl uppercase font-black tracking-tight text-neutral-950 dark:text-white">All Projects</h1>
      </div>

      <div className="flex flex-col gap-6">
        {PROJECTS_DATA.map((project) => (
          <article 
            key={project.slug}
            className="group flex flex-col gap-5 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800/70 bg-white/40 dark:bg-neutral-900/10 p-4 md:flex-row md:items-center md:gap-6 md:p-5 transition-all duration-300 shadow-sm"
          >
            {/* Image Section - Fixed collapsing layout bug */}
            <div className="w-full shrink-0 md:w-[38%] relative aspect-[16/10] overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 shadow-inner">
              <Image 
                alt={project.title} 
                src={project.image} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" 
              />
            </div>

            {/* Content Section */}
            <div className="flex flex-1 flex-col gap-2.5 self-center">
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-bold">
                <span className="font-mono">{project.year}</span>
                <span>·</span>
                <span className="uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{project.tags}</span>
              </div>
              
              <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-950 dark:text-white">{project.title}</h2>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400 font-normal">{project.description}</p>
              
              {/* Dynamic Inline Tech Badges Row */}
              {project.tech && project.tech.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tech.map((t) => {
                    const isWhiteDarkIcon = t.icon.endsWith("-dark.svg");
                    return (
                      <span key={t.name} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 px-2.5 py-1 text-[11px] text-neutral-600 dark:text-neutral-400 shadow-sm">
                        <span className="flex h-3 w-3 shrink-0 items-center justify-center">
                          <img 
                            src={t.icon} 
                            alt={t.name} 
                            className={`h-full w-full object-contain ${
                              isWhiteDarkIcon ? "invert dark:invert-0" : ""
                            }`} 
                          />
                        </span>
                        {t.name}
                      </span>
                    );
                  })}
                </div>
              )}
              
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-neutral-100 dark:border-neutral-900/40">
                <Link 
                  href={`/projects/${project.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/35 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 transition-all duration-200 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-400 dark:hover:text-black"
                >
                  Case Study <ArrowRight className="h-3 w-3" />
                </Link>
                
                {project.liveUrl !== "#" && (
                  <a 
                    href={project.liveUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition-colors"
                  >
                    Live <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}