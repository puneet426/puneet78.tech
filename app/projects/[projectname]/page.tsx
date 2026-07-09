"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Terminal, Copy, Check, Hourglass } from "lucide-react";
import { PROJECTS_DATA } from "@/lib/projectsData";

export default function DetailedCaseStudyPage() {
  const params = useParams();
  const currentSlug = params.projectname as string;
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Grab the project match from your centralized data file
  const project = PROJECTS_DATA.find((p) => p.slug === currentSlug);

  if (!project) {
    notFound();
  }

  const copyToClipboard = (text: string, identifier: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(identifier);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // 🛡️ GUARD LAYER: If the case study data is completely missing or empty
  if (!project.caseStudy) {
    return (
      <div className="w-full bg-[#fdfbf7] dark:bg-background text-neutral-900 dark:text-foreground transition-colors duration-300 min-h-screen flex flex-col antialiased">
        <div className="mx-auto w-full max-w-5xl px-4 md:px-6 pt-8 flex-1 flex flex-col justify-start text-left">
          
          {/* Back Button */}
          <Link 
            href="/projects" 
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all mb-12 max-w-fit group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Back to Projects
          </Link>

          {/* Premium "Coming Soon" Hero Module */}
          <div className="w-full max-w-2xl mx-auto text-center my-auto py-12 flex flex-col items-center gap-6 font-content">
            <div className="h-14 w-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shadow-sm animate-pulse">
              <Hourglass className="h-6 w-6" />
            </div>

            <div className="space-y-2">
              <h1 className="font-sans font-black text-3xl md:text-5xl uppercase tracking-tighter text-neutral-950 dark:text-white">
                {project.title}
              </h1>
              <p className="text-xs font-bold uppercase tracking-widest text-brand">
                Case study under construction
              </p>
            </div>

            <p className="text-sm md:text-base text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed font-normal">
              A detailed case study is not available for this project right now. We are compiling the production breakdowns, metrics, and architecture maps and will update this space soon.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link 
                href="/projects"
                className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-card px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white transition-all shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-900"
              >
                Explore Other Work
              </Link>
              {project.liveUrl !== "#" && (
                <a 
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-950 dark:bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white dark:text-black transition-all shadow-sm hover:opacity-90"
                >
                  Visit Live Site <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>

        </div>
        
        {/* Simple adaptive footer signature layout for placeholder */}
        <footer className="py-6 border-t border-neutral-100 dark:border-neutral-900 text-center text-xs text-neutral-400 dark:text-neutral-600 font-content">
          © 2026 Puneet Tiwari. All rights reserved.
        </footer>
      </div>
    );
  }

  // 🚀 OTHERWISE: Render the complete detailed case study automatically
  const { caseStudy } = project;

  return (
    <div className="w-full bg-[#fdfbf7] dark:bg-background text-neutral-900 dark:text-foreground transition-colors duration-300 antialiased selection:bg-brand selection:text-brand-fg">
      
      {/* 1. HERO SPLIT SECTION */}
      <section className="mx-auto w-full max-w-5xl px-4 md:px-6 pt-8 pb-12 font-content">
        <Link 
          href="/projects" 
          className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all mb-8 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> Back to Projects
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-3xl border border-neutral-200 dark:border-neutral-800/70 bg-white/30 dark:bg-card/10 overflow-hidden p-4 md:p-6">
          <div className="lg:col-span-6 relative aspect-[16/11] lg:aspect-auto min-h-[300px] md:min-h-[420px] w-full overflow-hidden rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-2 group shadow-inner">
            <Image 
              alt={project.title} 
              src={project.image} 
              fill 
              priority
              className="object-cover p-4 rounded-xl transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center gap-5 text-left md:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-neutral-100 dark:bg-neutral-900 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-neutral-200 dark:border-neutral-800 text-neutral-500">
                Case Study
              </span>
              <span className="rounded-full bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-brand/20 text-brand">
                {project.status}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-neutral-950 dark:text-white leading-[0.95] tracking-tight">
              {project.title}
            </h1>

            <p className="text-base md:text-lg text-neutral-600 dark:text-muted-foreground font-normal leading-relaxed">
              {project.description}
            </p>

            <div className="grid grid-cols-2 gap-4 border-t border-b border-neutral-200 dark:border-neutral-800 py-4 my-1">
              <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-1">Role</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{project.tags}</span>
              </div>
              <div className="rounded-xl border border-neutral-100 dark:border-neutral-900 bg-neutral-50/50 dark:bg-neutral-950/20 p-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-1">Timeline</span>
                <span className="text-sm font-semibold text-neutral-900 dark:text-white">{project.year}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {project.tech.map((t) => (
                <span key={t.name} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/50 px-3 py-1.5 text-xs text-neutral-700 dark:text-neutral-300 shadow-sm">
                  <img src={t.icon} alt={t.name} className="w-3.5 h-3.5 object-cover" />
                  {t.name}
                </span>
              ))}
            </div>

            <div className="pt-2">
              <a 
                href={project.liveUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-neutral-950 dark:bg-white px-6 py-3.5 text-sm font-bold text-white dark:text-black transition-all hover:opacity-90 active:scale-95 shadow-md group"
              >
                LIVE SITE <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. HIGHLIGHT TRI-CARD BAR */}
      <section className="mx-auto w-full max-w-5xl px-4 md:px-6 py-6 font-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-card/20 p-5 md:p-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 block mb-3">Problem</span>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{caseStudy.problemText}</p>
          </div>
          
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-card/20 p-5 md:p-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 block mb-3">Approach</span>
            <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{caseStudy.approachText}</p>
          </div>

          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-card/20 p-5 md:p-6">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500 block mb-3">Outcomes</span>
            <ul className="flex flex-col gap-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
              {caseStudy.outcomesList.map((outcome, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 shrink-0 h-1.5 w-1.5 rounded-full bg-brand" />
                  {outcome}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 3. CASE STUDY BODY NARRATIVE */}
      <section className="mx-auto w-full max-w-4xl px-4 md:px-6 py-12 text-left font-content space-y-12">
        
        {/* Overview */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Project Overview</h2>
          {caseStudy.overviewParagraphs.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{p}</p>
          ))}
        </div>

        {/* Problem Long */}
        <div className="space-y-5">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Problem Statement</h2>
          <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{caseStudy.problemStatementLong}</p>
          
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block pt-2">Pain points addressed:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {caseStudy.painPoints.map((point, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-card/10 text-sm text-neutral-600 dark:text-neutral-400">
                • {point}
              </div>
            ))}
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Goals & Success Criteria</h2>
          
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block pt-2">Functional goals:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {caseStudy.functionalGoals.map((goal, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-card/10 text-sm text-neutral-600 dark:text-neutral-400">
                • {goal}
              </div>
            ))}
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block pt-4">Non-functional goals:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {caseStudy.nonFunctionalGoals.map((goal, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-card/10 text-sm text-neutral-600 dark:text-neutral-400">
                • {goal}
              </div>
            ))}
          </div>

          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block pt-4">Success criteria:</span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {caseStudy.successCriteria.map((crit, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-card/10 text-sm text-neutral-600 dark:text-neutral-400">
                • {crit}
              </div>
            ))}
          </div>
        </div>

        {/* Responsibilities */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">My Role & Responsibilities</h2>
          {caseStudy.roleResponsibilities.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{p}</p>
          ))}
        </div>

        {/* Tech Stack Rationale */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Tech Stack & Architecture</h2>
          <p className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{caseStudy.techStackRationale}</p>
        </div>

        {/* Architecture Diagram */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">Architecture Diagram</h3>
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black overflow-hidden font-mono text-[13px]">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-brand" /> Mermaid Code Block</span>
              <button 
                onClick={() => copyToClipboard(caseStudy.architectureDiagramSource, "arch")}
                className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {copiedSection === "arch" ? <Check className="w-3 h-3 text-good" /> : <Copy className="w-3 h-3" />}
                {copiedSection === "arch" ? "Copied" : "Copy Source"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-[#070708]">
              {caseStudy.architectureDiagramSource}
            </pre>
          </div>
        </div>

        {/* Key Features */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Key Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseStudy.keyFeatures.map((feat, i) => (
              <div key={i} className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-card/20">
                <span className="font-bold text-neutral-950 dark:text-white text-sm block mb-1.5">
                  • {feat.title}
                </span>
                <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Challenges */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Development Process & Challenges</h2>
          {caseStudy.processChallenges.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{p}</p>
          ))}
        </div>

        {/* UX Decisions */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">UX & Product Decisions</h2>
          {caseStudy.uxProductDecisions.map((p, i) => (
            <p key={i} className="text-base leading-relaxed text-neutral-700 dark:text-neutral-300">{p}</p>
          ))}
        </div>

        {/* Future Improvements */}
        <div className="space-y-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Future Improvements</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {caseStudy.futureImprovements.map((imp, i) => (
              <div key={i} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/30 dark:bg-card/10 text-sm text-neutral-600 dark:text-neutral-400">
                • {imp}
              </div>
            ))}
          </div>
        </div>

        {/* User Flow */}
        <div className="space-y-4 pt-4">
          <h2 className="font-display text-3xl md:text-4xl text-neutral-950 dark:text-white uppercase tracking-tight">Visuals & Diagrams</h2>
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 block mb-1">User Flow Diagram</span>
          
          <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-black overflow-hidden font-mono text-[13px]">
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-brand" /> User Path Logic</span>
              <button 
                onClick={() => copyToClipboard(caseStudy.userFlowDiagramSource, "user")}
                className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {copiedSection === "user" ? <Check className="w-3.5 h-3.5 text-good" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSection === "user" ? "Copied" : "Copy Source"}
              </button>
            </div>
            <pre className="p-4 overflow-x-auto text-neutral-600 dark:text-neutral-400 leading-relaxed bg-neutral-50 dark:bg-[#070708]">
              {caseStudy.userFlowDiagramSource}
            </pre>
          </div>
        </div>

      </section>


    </div>
  );
}