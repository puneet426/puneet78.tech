"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface RoleBlock {
  title: string;
  type: string;
  timeline: string;
  tech: { name: string; icon: string }[];
  bulletPoints: string[];
}

interface CompanyExperience {
  id: string;
  companyName: string;
  location: string;
  logo: string;
  isCurrent: boolean;
  roles: RoleBlock[];
}

const EXPERIENCE_DATA: CompanyExperience[] = [
{
  "id": "shreesam",
  "companyName": "Shreesam",
  "location": "Noida, Uttar Pradesh",
  "logo": "/shreesam.png",
  "isCurrent": true,
  "roles": [
    {
      "title": "Full Stack Developer",
      "type": "Full-time",
      "timeline": "Jan 2026 - Present",
      "tech": [
        { "name": "React", "icon": "/technology/react.svg" },
        { "name": "TypeScript", "icon": "/technology/typescript.svg" },
        { "name": "Node.js", "icon": "/technology/nodejs.svg" },
        { "name": "Express", "icon": "/technology/expressjs-dark.svg" },
        { "name": "Next.js", "icon": "/technology/nextjs-dark.svg" },
        { "name": "PostgreSQL", "icon": "/technology/postgresql.svg" },
        { "name": "Prisma", "icon": "/technology/prisma-dark.svg" },
        { "name": "AWS", "icon": "/technology/aws-dark.svg" },
        { "name": "Turborepo", "icon": "/technology/turborepo-dark.svg" },
        { "name": "Zustand", "icon": "/technology/zustand.svg" },
        { "name": "React Query", "icon": "/technology/reactquery.svg" },
        { "name": "Git", "icon": "/technology/git.svg" }
      ],
      "bulletPoints": [
        "Architected and engineered a highly scalable, multi-tenant Fintech School Management ERP designed to support 10+ schools and over 5000+ active users across an administrative dashboard and dual mobile applications.",
        "Designed an abstract dynamic billing engine using PostgreSQL and Prisma 7, allowing schools to provision completely custom fee structures (class, section, and student-specific) and automate dynamic invoicing schedules.",
        "Built a production-grade, append-only immutable ledger accounting system to strictly log all debits and credits, completely eliminating financial discrepancies by replacing floating-point data types with arbitrary-precision Decimal structures.",
        "Integrated an advanced Razorpay split-payment gateway marketplace architecture, enabling automated payment routing directly to school-specific merchant accounts while handling complex payment behaviors like partial payments, advance collections, and localized fine engines.",
        "Orchestrated the cross-app unification of a Next.js admin dashboard and two React Native Expo mobile applications (Student & Teacher) driven by a single Express.js REST API with zero-leak Role-Based Access Control (RBAC).",
        "Successfully overhauled database infrastructure by migrating to the Prisma 7 framework, implementing native PostgreSQL driver adapters and connection pooling over AWS/Neon to prevent performance degradation under concurrent connection spikes."
      ]
    },
    {
      "title": "Web Developer Intern",
      "type": "Internship",
      "timeline": "Dec 2025 - Jan 2026",
      "tech": [
        { "name": "React", "icon": "/technology/react.svg" },
        { "name": "Tailwind CSS", "icon": "/technology/tailwindcss.svg" },
        { "name": "JavaScript", "icon": "/technology/js.svg" },
        { "name": "JWT", "icon": "/technology/jwt.svg" },
        { "name": "Git", "icon": "/technology/git.svg" },
        { "name": "GitHub", "icon": "/technology/github-dark.svg" }
      ],
      "bulletPoints": [
        "Led the end-to-end frontend performance optimization of legacy student portal workflows, boosting Core Web Vitals scores by 60% through aggressive code-splitting, lazy loading, and asset optimization pipelines.",
        "Designed responsive user interface frameworks with React and Tailwind CSS, reducing average initial page load times from 8+ seconds down to under 400ms to heavily improve mobile engagement metrics."
      ]
    }
  ]
},

 {
  id: "gssoc",
  companyName: "GirlScript Summer of Code",
  location: "Remote",
  logo: "/gssoc.png",
  isCurrent: false,
  roles: [
    {
      title: "Open Source Contributor",
      type: "Open Source",
      timeline: "May 2024 - Jul 2024",
      tech: [
        { name: "Git", icon: "/technology/git.svg" },
        { name: "GitHub", icon: "/technology/github-dark.svg" },
        { name: "JavaScript", icon: "/technology/js.svg" },
        { name: "React", icon: "/technology/react.svg" },
        { name: "Next.js", icon: "/technology/nextjs-dark.svg" }
      ],
      bulletPoints: [
        "Contributed to multiple open-source projects by implementing new features, fixing bugs, and improving project documentation.",
        "Collaborated with maintainers through GitHub Issues and Pull Requests while following industry-standard Git workflows.",
        "Enhanced React and Next.js codebases by writing clean, maintainable, and production-ready code."
      ]
    },
    {
      title: "Open Source Mentor",
      type: "Open Source",
      timeline: "Aug 2024 - Sep 2024",
      tech: [
        { name: "Git", icon: "/technology/git.svg" },
        { name: "GitHub", icon: "/technology/github-dark.svg" },
        { name: "JavaScript", icon: "/technology/js.svg" },
        { name: "React", icon: "/technology/react.svg" },
        { name: "Next.js", icon: "/technology/nextjs-dark.svg" }
      ],
      bulletPoints: [
        "Mentored open-source contributors by reviewing pull requests, resolving implementation issues, and providing technical guidance throughout the program.",
        "Collaborated with project maintainers to maintain code quality, validate feature implementations, and ensure smooth contribution workflows.",
        "Helped contributors understand Git/GitHub workflows, issue tracking, documentation standards, and best practices for open-source development."
      ]
    }
  ]
}
];

export default function Experience() {
  const [expandedId, setExpandedId] = useState<string | null>("shreesam");

  const toggleAccordion = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <section id="experience-section" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {/* Section Header Labels */}
        <div className="mb-10 md:mb-12">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">Career</p>
          <h2 className="text-5xl md:text-6xl uppercase font-black tracking-tight text-neutral-950 dark:text-white">Experience</h2>
        </div>

        {/* Dynamic Accordion Stream Loop */}
        <div className="space-y-4">
          {EXPERIENCE_DATA.map((exp) => {
            const isOpen = expandedId === exp.id;

            return (
              <div 
                key={exp.id} 
                className="rounded-2xl border border-neutral-200 dark:border-neutral-800/60 bg-white/40 dark:bg-neutral-900/10 overflow-hidden transition-all duration-300 shadow-sm"
              >
                {/* Header Expand Accordion Trigger Button */}
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleAccordion(exp.id)}
                  className="group flex w-full items-center gap-4 p-4 text-left transition-colors duration-150 hover:bg-neutral-50/50 dark:hover:bg-neutral-900/40 md:p-5"
                >
                  {/* Brand Logotype Box */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white p-1 shadow-sm mix-blend-multiply dark:mix-blend-normal relative">
                    <Image
                      alt={exp.companyName}
                      src={exp.logo}
                      width={44}
                      height={44}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Company Titles Info */}
                  <div className="flex flex-1 min-w-0 items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-sans text-lg font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {exp.companyName}
                        </h3>
                        {exp.isCurrent && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 backdrop-blur-sm">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500" />
                            Working
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                        {exp.location}
                      </p>
                    </div>

                    {/* Expand Chevron Icon Indicator */}
                    <motion.div 
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-neutral-400 dark:text-neutral-500 group-hover:bg-neutral-100 dark:group-hover:bg-neutral-900 group-hover:text-neutral-950 dark:group-hover:text-white"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </div>
                </button>

                {/* Smooth Sliding Content Drawer Block */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    >
                      <div className="px-4 pb-5 pt-2 md:px-5 md:pb-6 border-t border-neutral-100 dark:border-neutral-900/50 bg-white/20 dark:bg-black/10">
                        <div className="space-y-6">
                          {exp.roles.map((role, rIdx) => (
                            <div key={rIdx} className={rIdx > 0 ? "pt-6 border-t border-neutral-100 dark:border-neutral-900/30" : ""}>
                              
                              {/* Title, Scope Type, and Timeline Header */}
                              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 mb-3">
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <h4 className="text-[15px] font-bold text-neutral-800 dark:text-neutral-200">
                                    {role.title}
                                  </h4>
                                  <span className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 px-2 py-0.5 text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                    {role.type}
                                  </span>
                                </div>
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 sm:text-right">
                                  {role.timeline}
                                </span>
                              </div>

                              {/* Tech Stack Badge Row */}
                              <div className="mb-4 flex flex-wrap gap-1.5">
                                {role.tech.map((t) => {
                                  // Detect if the icon filename ends with "-dark.svg"
                                  const isWhiteDarkIcon = t.icon.endsWith("-dark.svg");

                                  return (
                                    <span 
                                      key={t.name} 
                                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-900/20 px-2 py-1 text-xs text-neutral-600 dark:text-neutral-400 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white"
                                    >
                                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                                        <img 
                                          src={t.icon} 
                                          alt={t.name} 
                                          className={`h-full w-full object-contain ${
                                            isWhiteDarkIcon 
                                              ? "invert dark:invert-0" // Inverts white SVG file to black in light mode, turns off in dark mode
                                              : ""
                                          }`} 
                                        />
                                      </span>
                                      {t.name}
                                    </span>
                                  );
                                })}
                              </div>

                              {/* Action Responsibilities Bullet List */}
                              <ul className="space-y-2">
                                {role.bulletPoints.map((bullet, bIdx) => (
                                  <li 
                                    key={bIdx} 
                                    className="flex items-start text-[14px] leading-relaxed text-neutral-600 dark:text-neutral-400 font-normal"
                                  >
                                    <span className="mr-2.5 mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                                    <span>{bullet}</span>
                                  </li>
                                ))}
                              </ul>

                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}