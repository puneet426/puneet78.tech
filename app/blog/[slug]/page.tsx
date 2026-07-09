"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Copy, Check, User } from "lucide-react";
import { BLOG_POSTS, CodeSnippetItem } from "@/lib/blogData";

export default function DynamicBlogPostView() {
  const params = useParams();
  const router = useRouter();
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const currentPost = BLOG_POSTS.find((p) => p.slug === params.slug);

  if (!currentPost) {
    return (
      <div className="mx-auto max-w-xl text-center p-20 text-neutral-500 dark:text-neutral-400 text-xs tracking-widest uppercase font-mono">
        <p className="mb-4">⚠️ Article Not Found</p>
        <button onClick={() => router.push("/blog")} className="text-indigo-600 dark:text-indigo-400 hover:underline">
          Return to blog archive
        </button>
      </div>
    );
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Reusable Code Block Render Component
  const RenderSnippet = (snippet: CodeSnippetItem, groupIndex: string) => {
    const uniqueId = `${groupIndex}-${snippet.filename}`;
    return (
      <div key={snippet.filename} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#0c0c0c] overflow-hidden font-mono text-xs my-5 shadow-inner dark:shadow-none">
        {snippet.title && (
          <div className="px-4 pt-2.5 text-[11px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider select-none bg-neutral-100/40 dark:bg-[#111]/30">
            // {snippet.title}
          </div>
        )}
        <div className="bg-neutral-100/80 dark:bg-[#141414]/90 px-4 py-2 border-b border-neutral-200 dark:border-neutral-800/80 flex justify-between text-neutral-500 select-none">
          <span className="text-neutral-600 dark:text-neutral-400">{snippet.filename}</span>
          <button 
            onClick={() => handleCopyCode(snippet.code, uniqueId)}
            className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1 font-sans font-bold text-[11px]"
          >
            {copiedText === uniqueId ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedText === uniqueId ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-neutral-700 dark:text-neutral-400 leading-relaxed text-left">{snippet.code}</pre>
      </div>
    );
  };

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6 md:py-20 text-left text-neutral-800 dark:text-neutral-200 font-sans selection:bg-indigo-500/30 select-text">
      
      {/* 1. BACK HEADER ACTION */}
      <div className="mb-8 select-none">
        <button
          onClick={() => router.push("/blog")}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/80 dark:bg-[#141414]/40 backdrop-blur-sm px-4 py-2 text-xs font-bold text-neutral-500 dark:text-neutral-400 transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>BACK TO BLOG</span>
        </button>
      </div>

      {/* 2. MAIN POST HEADINGS METADATA */}
      <div className="space-y-4 mb-8">
        <div className="flex flex-wrap gap-2 select-none">
          {currentPost.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-0.5 text-[10px] font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
              {tag}
            </span>
          ))}
        </div>

        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white leading-tight uppercase">
          {currentPost.title}
        </h1>

        <p className="text-lg text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed max-w-2xl">
          {currentPost.description}
        </p>

        <div className="flex items-center gap-4 text-xs font-semibold text-neutral-400 dark:text-neutral-500 font-mono pt-2 select-none">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span>{currentPost.date}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-600" />
            <span>{currentPost.readTime}</span>
          </div>
        </div>
      </div>

      {/* 3. HERO SHOWCASE IMAGE LAYER */}
      {currentPost.bannerImage && (
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-900 overflow-hidden mb-12 select-none shadow-sm">
          <Image
            src={currentPost.bannerImage}
            alt={currentPost.title}
            fill
            priority
            className="object-cover opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* 4. SEQUENTIAL BODY BLOCKS LOOP CHANGER */}
      <div className="space-y-6 text-[15.5px] text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal tracking-wide">
        
        {/* Intro Passages */}
        {currentPost.introParagraphs.map((p, i) => <p key={`intro-${i}`}>{p}</p>)}

        {/* Snippets Batch 1 */}
        {currentPost.snippetsGroup1?.map((s) => RenderSnippet(s, "g1"))}

        {/* Custom Core Section Subheads */}
        {currentPost.sections?.map((section) => (
          <div key={section.heading} className="space-y-3 pt-4">
            <h2 className="text-2xl font-black tracking-tight text-neutral-950 dark:text-white uppercase">
              {section.heading}
            </h2>
            {section.content.map((p, i) => (
              <p key={`${section.heading}-${i}`}>{p}</p>
            ))}
          </div>
        ))}

        {/* Snippets Batch 2 */}
        {currentPost.snippetsGroup2?.map((s) => RenderSnippet(s, "g2"))}

        {/* Mid-article Text Content */}
        {currentPost.midParagraphs?.map((p, i) => <p key={`mid-${i}`}>{p}</p>)}

        {/* Snippets Batch 3 */}
        {currentPost.snippetsGroup3?.map((s) => RenderSnippet(s, "g3"))}

        {/* Conclusion Chunk Summary */}
        <div className="pt-4 border-t border-neutral-100 dark:border-neutral-900/60">
          <h3 className="text-xl font-black text-neutral-950 dark:text-white uppercase mb-2">Summary</h3>
          <p>{currentPost.conclusion}</p>
        </div>

      </div>

      {/* 5. USER BRAND AUTHOR INFO CLOSURE COMPONENT BOX */}
      <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-900 select-none">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#141414]/20 p-5 md:p-6 rounded-2xl max-w-xl mx-auto shadow-sm dark:shadow-none">
          <div className="h-12 w-12 rounded-full border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex items-center justify-center shrink-0 shadow-sm text-neutral-400 dark:text-neutral-500">
            <User className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 block">Written By</span>
            <h4 className="text-base font-black text-neutral-950 dark:text-white uppercase tracking-tight">{currentPost.author.name}</h4>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{currentPost.author.role}</p>
          </div>
        </div>
      </div>

    </article>
  );
}