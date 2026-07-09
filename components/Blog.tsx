"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/lib/blogData";

export default function Blog() {
  // slice to show only the first 2 featured posts on your main portfolio dashboard page
  const featuredPosts = BLOG_POSTS.slice(0, 2);

  return (
    <section id="blog-section" className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left select-none bg-transparent text-neutral-800 dark:text-neutral-200">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        {/* 1. SECTION TITLE HEADERS */}
        <div className="mb-10">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">Writing</p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-neutral-900 dark:text-white uppercase mb-3">Blog</h2>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
            Mixed writing on frontend, psychology, browser extensions, and ideas worth sharing.
          </p>
        </div>

        {/* 2. FEATURED TWO-COLUMN BALANCED CARD GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {featuredPosts.map((post, idx) => (
            <motion.div
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex flex-col rounded-2xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#141414]/40 backdrop-blur-sm overflow-hidden group hover:border-indigo-500/20 dark:hover:border-neutral-700/60 transition-all duration-300 shadow-sm dark:shadow-none"
            >
              {/* Card Thumbnail Box Container with Image and Gradient Overlay */}
              <div className="h-44 w-full relative overflow-hidden border-b border-neutral-200 dark:border-neutral-800/40 bg-neutral-900">
                
                {/* Visual Label Overlays with adaptive fallback gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent dark:from-[#0d0d0d] dark:via-[#0d0d0d]/30 dark:to-transparent p-5 flex flex-col justify-between z-10">
                  <div className="flex justify-between items-center">
                    <span className="bg-neutral-200/90 dark:bg-neutral-800/90 text-neutral-600 dark:text-neutral-400 font-mono font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider border border-neutral-300/40 dark:border-neutral-700/30 backdrop-blur-sm">
                      Blog
                    </span>
                    <span className="text-[11px] font-bold text-neutral-400 dark:text-neutral-500 font-mono tracking-wide drop-shadow-sm">
                      {post.date}
                    </span>
                  </div>
                  
                  {/* Category Stamp Tag */}
                  <span className="text-[10px] font-black tracking-[0.18em] text-neutral-500 dark:text-neutral-400 uppercase drop-shadow-sm">
                    {post.category}
                  </span>
                </div>

                {/* Actual Banner Image Element with smooth hover amplification effect */}
                {post.bannerImage ? (
                  <Image
                    src={post.bannerImage}
                    alt={post.title}
                    fill
                    sizes="(max-w-768px) 100vw, 450px"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.035] dark:opacity-85"
                  />
                ) : (
                  /* Elegant Gradient Fallback Mesh if bannerImage isn't defined */
                  <div className={`absolute inset-0 w-full h-full bg-gradient-to-br ${post.imageClassName}`}>
                    <div className="w-full h-full opacity-[0.08] dark:opacity-[0.12] bg-[linear-gradient(to_right,#80808033_1px,transparent_1px),linear-gradient(to_bottom,#80808033_1px,transparent_1px)] bg-[size:14px_24px]" />
                  </div>
                )}
              </div>

              {/* Lower Details Content Body Segment */}
              <div className="p-6 flex flex-col justify-between flex-1 gap-4 bg-white dark:bg-[#0c0c0c]/40">
                <div className="space-y-2">
                  
                  {/* Clock metadata tracker row */}
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-400 dark:text-neutral-500 font-mono">
                    <Clock className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-600" />
                    <span>{post.readTime}</span>
                  </div>

                  {/* Dynamic Route Next.js Redirect Link Element */}
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="group/title inline-flex items-start gap-1 text-lg font-bold text-neutral-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors static leading-snug tracking-tight text-left"
                  >
                    <span>{post.title}</span>
                    <ArrowUpRight className="w-4 h-4 shrink-0 opacity-40 group-hover/title:opacity-100 group-hover/title:translate-x-0.5 group-hover/title:-translate-y-0.5 transition-all mt-1" />
                  </Link>

                  {/* Body description preview sentence */}
                  <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed tracking-wide pt-1">
                    {post.description}
                  </p>
                </div>

                {/* Click action indicator link row */}
                <div className="pt-2">
                  <Link 
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors tracking-wide group/action"
                  >
                    Read Article
                    <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/action:translate-x-0.5 group-hover/action:-translate-y-0.5" />
                  </Link>
                </div>
              </div>

            </motion.div>
          ))}
        </div>

        {/* 3. "VIEW ALL BLOGS" NAVIGATION BUTTON ROUTE REDIRECT */}
        <div className="mt-12 text-center">
          <Link 
            href="/blog" 
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800/80 bg-neutral-100/80 dark:bg-[#141414]/40 backdrop-blur-sm px-5 py-3 text-xs font-bold text-neutral-500 dark:text-neutral-400 tracking-wider uppercase transition-all duration-200 hover:border-neutral-300 dark:hover:border-neutral-700 hover:text-neutral-900 dark:hover:text-white group shadow-sm dark:shadow-none"
          >
            <span>View All Blogs</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

      </motion.div>
    </section>
  );
}