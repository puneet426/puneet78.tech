"use client";

import React from "react";
import { motion } from "framer-motion";

interface TechItem {
  name: string;
  icon: string;
}

interface SkillCategory {
  categoryName: string;
  items: TechItem[];
}

const SKILLS_DATA: SkillCategory[] = [
  {
    categoryName: "Languages",
    items: [
      { name: "JavaScript", icon: "/technology/js.svg" },
      { name: "TypeScript", icon: "/technology/typescript.svg" },
      { name: "C++", icon: "/technology/c++.svg" },
    ],
  },
  {
    categoryName: "Frontend",
    items: [
      { name: "Next.js", icon: "/technology/nextjs-dark.svg" },
      { name: "React", icon: "/technology/react.svg" },
      { name: "TailwindCSS", icon: "/technology/tailwindcss.svg" },
      { name: "Redux Toolkit", icon: "/technology/redux.svg" },
      { name: "Zustand", icon: "/technology/zustand.svg" },
      { name: "Tanstack Query", icon: "/technology/reactquery.svg" },
      { name: "GSAP", icon: "/technology/gsap.svg" },
      { name: "Three.js", icon: "/technology/threejs-dark.svg" },
    ],
  },
  {
    categoryName: "Backend",
    items: [
      { name: "Node.js", icon: "/technology/nodejs.svg" },
      { name: "Express", icon: "/technology/expressjs-dark.svg" },
      { name: "Zod", icon: "/technology/zod.svg" },
      { name: "Vitest", icon: "/technology/vitest.svg" },
      { name: "WebSocket", icon: "/technology/ws.svg" }, // standard multicolored fallback
    ],
  },
  {
    categoryName: "Database & ORM",
    items: [
      { name: "PostgreSQL", icon: "/technology/postgresql.svg" },
      { name: "MongoDB", icon: "/technology/mongodb.svg" },
      { name: "Prisma", icon: "/technology/prisma-dark.svg" },
      { name: "Drizzle", icon: "/technology/drizzle-dark.svg" },
    ],
  },
  {
    categoryName: "Cloud & Tools",
    items: [
      { name: "AWS", icon: "/technology/aws-dark.svg" },
      { name: "Docker", icon: "/technology/docker.svg" },
    
      { name: "GitHub", icon: "/technology/github-dark.svg" },
      { name: "Figma", icon: "/technology/figma.svg" },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const badgeVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 15,
    },
  },
};

export default function Skills() {
  return (
    <section id="tech-stack" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left">
      
      {/* 1. Header Frame Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-12"
      >
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-600 dark:text-indigo-400">Stack</p>
        <h2 className="text-5xl md:text-6xl uppercase font-black tracking-tight text-neutral-950 dark:text-white">Technologies</h2>
        <p className="mt-3 max-w-lg text-base text-neutral-600 dark:text-neutral-400">
          Languages, frameworks, and tools I use to ship production applications.
        </p>
      </motion.div>

      {/* 2. Structured Category Stack Lists Grid */}
      <div className="space-y-10">
        {SKILLS_DATA.map((category) => (
          <div key={category.categoryName} className="space-y-4">
            
            {/* Divider Subheader Lines */}
            <div className="flex items-center gap-3 select-none">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800/60" />
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
                {category.categoryName}
              </p>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800/60" />
            </div>

            {/* Badges Flow loop with responsive stagger */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              className="flex flex-wrap gap-2"
            >
              {category.items.map((tech) => {
                // Dynamically detect white dark icons that need inversion in light layout mode
                const isWhiteDarkIcon = tech.icon.endsWith("-dark.svg");

                return (
                  <motion.span
                    key={tech.name}
                    variants={badgeVariants}
                    className="group flex cursor-default items-center gap-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/20 px-4 py-2.5 text-[13px] font-medium text-neutral-700 dark:text-neutral-300 shadow-sm transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:scale-[1.03]"
                  >
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                      <img 
                        src={tech.icon} 
                        alt={tech.name} 
                        className={`h-full w-full object-contain ${
                          isWhiteDarkIcon 
                            ? "invert dark:invert-0" // Turns white icons black in Light mode; keeps them white in Dark mode
                            : ""
                        }`} 
                      />
                    </span>
                    {tech.name}
                  </motion.span>
                );
              })}
            </motion.div>

          </div>
        ))}
      </div>

    </section>
  );
}