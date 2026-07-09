"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { PROJECTS_DATA } from "@/lib/projectsData";

export default function Projects() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const isAnyCardHovered = hoveredIndex !== null;

  return (
    <section id="projects" className="mx-auto w-full max-w-4xl px-4 md:px-6 py-12 md:py-20 font-content">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Section Header */}
        <div className="flex flex-col items-start text-left mb-10 md:mb-14">
          <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Work</span>
          <h2 className="font-displayXl text-5xl md:text-6xl uppercase text-neutral-950 dark:text-white">Projects</h2>
        </div>

        {/* Project Grid Container */}
        <div 
          className="flex flex-col gap-6 relative"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {PROJECTS_DATA.map((project, idx) => {
            const isThirdCard = idx === 2;
            const isHovered = hoveredIndex === idx && !isThirdCard; 
            const isOtherCardHovered = isAnyCardHovered && !isHovered;

            // Safe case-insensitive status formatting
            const projectStatus = project.status ? project.status.toLowerCase().trim() : "";

            return (
              <motion.div
                key={project.slug}
                onHoverStart={() => !isThirdCard && setHoveredIndex(idx)}
                animate={{
                  scale: isHovered ? 1.015 : 1,
                  filter: isThirdCard || isOtherCardHovered ? "blur(4px)" : "blur(0px)",
                  opacity: isThirdCard || isOtherCardHovered ? 0.35 : 1,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.25, 1, 0.5, 1],
                }}
                className={`relative ${isThirdCard ? "pointer-events-none select-none" : "z-10"}`}
              >
                <article 
                  className={`group flex flex-col gap-5 overflow-hidden rounded-2xl border p-4 md:flex-row md:items-stretch md:gap-6 md:p-5 transition-all duration-300 ${
                    isHovered 
                      ? "border-brand/40 bg-white dark:bg-card/60 shadow-lg" 
                      : "border-neutral-200 dark:border-neutral-800/60 bg-white/50 dark:bg-card/30"
                  } ${idx % 2 === 1 ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Fixed Image Box Container with explicit aspect/height rules to prevent collapsing */}
                  <div className={`w-full shrink-0 md:w-[44%] min-h-[200px] relative aspect-[16/10] overflow-hidden rounded-xl border bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300 ${
                    isHovered ? "border-brand/50" : "border-neutral-200 dark:border-neutral-800"
                  }`}>
                    {project.image ? (
                      <Image 
                        alt={project.title} 
                        src={project.image} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 45vw"
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center text-xs text-neutral-600">No Image</div>
                    )}
                    
                    {/* Your Requested Dynamic Colored Badges */}
                    <div className="absolute right-3 top-3 z-20 select-none">
                      {projectStatus === "live" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400 backdrop-blur-md">
                          <span className="relative flex h-1.5 w-1.5 shrink-0">
                            <span className="absolute inset-0 animate-ping rounded-full opacity-60 bg-emerald-500" />
                            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          </span>
                          Live
                        </span>
                      )}

                      {(projectStatus === "in production" || projectStatus === "inproduction") && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 dark:text-orange-400 backdrop-blur-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 shrink-0" />
                          In Production
                        </span>
                      )}

                      {projectStatus === "upgrading" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-500 backdrop-blur-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                          Upgrading
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Project Content Pane */}
                  <div className="flex flex-1 flex-col gap-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-neutral-500 dark:text-muted-foreground/50">{project.year}</span>
                      <span className="text-neutral-300 dark:text-muted-foreground/30">·</span>
                      <span className="text-[11px] font-medium uppercase tracking-wider text-neutral-500 dark:text-muted-foreground/50">{project.tags}</span>
                    </div>
                    
                    <h3 className={`font-sans text-2xl font-bold uppercase leading-tight md:text-[1.65rem] transition-colors duration-200 ${
                      isHovered ? "text-brand" : "text-neutral-950 dark:text-white"
                    }`}>
                      {project.title}
                    </h3>
                    
                    <p className="text-sm leading-relaxed text-neutral-600 dark:text-muted-foreground">
                      {project.description}
                    </p>
                    
                    <p className="border-l-2 border-brand/35 pl-3 text-[12px] leading-relaxed text-neutral-500 dark:text-muted-foreground/70 italic">
                      {project.italicNote}
                    </p>

                    {/* Stack Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {project.tech?.map((t) => (
                        <span key={t.name} className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-border/40 bg-neutral-50 dark:bg-background/30 px-2 py-1 text-[11px] font-medium text-neutral-600 dark:text-muted-foreground">
                          <span className="relative h-3 w-3 shrink-0">
                            {t.darkIcon ? (
                              <>
                                <img src={t.icon} alt={t.name} className="block dark:hidden object-contain w-3 h-3" />
                                <img src={t.darkIcon} alt={t.name} className="hidden dark:block object-contain w-3 h-3" />
                              </>
                            ) : (
                              <img src={t.icon} alt={t.name} className="object-contain w-3 h-3" />
                            )}
                          </span>
                          {t.name}
                        </span>
                      ))}
                      <span className="rounded-md border border-neutral-200 dark:border-border/40 bg-neutral-50 dark:bg-background/30 px-2 py-1 text-[11px] font-medium text-neutral-500 dark:text-muted-foreground/60">
                        +{project.extraTechCount}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <Link 
                        href={`/projects/${project.slug}`}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition-all duration-300 ${
                          isHovered 
                            ? "bg-brand text-neutral-950 border-transparent shadow-md shadow-brand/10" 
                            : "border-brand/35 bg-transparent text-brand hover:bg-brand hover:text-white"
                        }`}
                      >
                        Case Study <ArrowRight className="h-3 w-3" />
                      </Link>
                      
                      <a 
                        href={project.liveUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-border/40 px-3 py-1.5 text-[11px] font-medium text-neutral-600 dark:text-muted-foreground transition-all duration-150 hover:border-brand/40 hover:text-brand"
                      >
                        <ExternalLink className="h-3 w-3" /> Live
                      </a>
                    </div>
                  </div>
                </article>
              </motion.div>
            );
          })}

          {/* Foreground Overlay Masking layer */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fdfbf7] via-[#fdfbf7]/70 to-transparent dark:from-background dark:via-background/70 dark:to-transparent pointer-events-none z-20" />

          {/* Action Trigger Link Button */}
          <div className="absolute inset-x-0 bottom-2 flex justify-center z-30">
            <Link 
              href="/projects" 
              className="flex items-center gap-2 rounded-full border border-brand/40 bg-white/90 dark:bg-background/90 px-5 py-2.5 text-sm font-semibold text-brand shadow-md backdrop-blur-sm transition-all duration-200 hover:bg-brand hover:text-white hover:border-transparent"
            >
              View all projects <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}