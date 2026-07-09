"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar } from "lucide-react";

interface EducationItem {
  institution: string;
  degree: string;
  location: string;
  duration: string;
  logoSrc: string;
}

const EDUCATION_DATA: EducationItem[] = [
  {
    institution: "National Institute of Advanced Manufacturing Technology ",
    degree: "B.Tech Computer Engineering",
    location: "Ranchi, Jharkhand - 834003",
    duration: "2023 — 2027",
    logoSrc: "/niamt.png",
  },
  {
    institution: "Saint Vivekanand Senior Secondary Public School",
    degree: "Intermediate",
    location: "Etawah, UP",
    duration: "2021 — 2022",
    logoSrc: "/svps.jpg",
  },
];

export default function Education() {
  return (
    <section id="education" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left select-none text-neutral-800 dark:text-neutral-200">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">Background</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white uppercase">Education</h2>
        </motion.div>

        {/* Timeline Stack list with Light / Dark Compatibility */}
        <div className="space-y-4">
          {EDUCATION_DATA.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
            >
              <div className="group relative flex items-start gap-5 overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800/60 bg-neutral-50/50 dark:bg-neutral-900/20 backdrop-blur-sm p-5 transition-all duration-200 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:bg-white dark:hover:bg-neutral-900/40 hover:-translate-y-px md:p-6 shadow-sm dark:shadow-none">
                
                {/* Active Left Indicator Bar Border */}
                <div className="absolute inset-y-0 left-0 w-[3px] rounded-l-2xl bg-neutral-200 dark:bg-neutral-800/40 transition-colors duration-200 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500/50" />
                
                {/* School Logo Shield */}
                <div className="ml-2 flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white p-1 shadow-sm">
                 <img 
                     alt={item.institution} 
                     loading="lazy" 
                       width="48" 
                       height="48" 
                       className="h-full w-full object-contain p-0.5 mix-blend-multiply dark:mix-blend-normal transition-transform duration-300 group-hover:scale-105" 
                         src={item.logoSrc} 
                           />
                        </div>

                {/* Info Metadata Block Container */}
                <div className="flex flex-1 min-w-0 flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white/90 tracking-tight">{item.institution}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-indigo-600 dark:text-indigo-400">{item.degree}</p>
                    
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400 dark:text-neutral-600" />
                      {item.location}
                    </p>
                  </div>

                  {/* Operational Timeline Span Badge element */}
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900/50 px-3 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 font-mono sm:mt-0">
                    <Calendar className="h-3 w-3 shrink-0 text-neutral-400 dark:text-neutral-500" />
                    {item.duration}
                  </span>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}