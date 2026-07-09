"use client";

import React, { useRef, useState, useTransition } from "react";
import { motion } from "framer-motion";

export default function ContactPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<{ success: boolean; error: string | null }>({
    success: false,
    error: null,
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState({ success: false, error: null });

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const subject = formData.get("subject")?.toString().trim();
    const message = formData.get("message")?.toString().trim();

    if (!name || !email || !message) {
      setState({ success: false, error: "Please fill all required fields." });
      return;
    }

    // 🚀 Execute submission safely within transition boundaries from the client browser
    startTransition(async () => {
      try {
        // Securely read key configuration matching your Next.js local setup
        const formAccessKey = process.env.NEXT_PUBLIC_WEB3FORMS_KEY;

        if (!formAccessKey) {
          setState({ success: false, error: "Configuration Error: Access key is missing." });
          return;
        }

        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            access_key: formAccessKey,
            name,
            email,
            subject: subject || `New Portfolio Query from ${name}`,
            message,
            from_name: "Portfolio Contact Form",
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setState({ success: true, error: null });
          formRef.current?.reset();
        } else {
          setState({ success: false, error: data.message || "Form submission failed." });
        }
      } catch (err) {
        setState({ 
          success: false, 
          error: "Network validation failed. Please check your internet connection or try again." 
        });
      }
    });
  };

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-12 md:px-6 md:py-20 font-sans text-left text-neutral-800 dark:text-neutral-200 select-none">
      <motion.div 
        initial={{ opacity: 0, y: 15 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        {/* Header Content */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-2">Any query?</h1>
          <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
            Drop your message below and I’ll get back to you.
          </p>
        </div>

        {/* Core Form Card Box Container with Semantic Dual-Theme Tokens */}
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-[#141414]/30 backdrop-blur-sm p-6 md:p-8 shadow-sm dark:shadow-none">
          
          {state.success ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm uppercase tracking-wider">✔ Message Sent Successfully!</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Thank you for reaching out. I will get back to you shortly.</p>
              <button 
                type="button"
                onClick={() => setState({ success: false, error: null })}
                className="mt-4 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name & Email Multi-Column Row Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Name <span className="text-neutral-300 dark:text-neutral-600">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Your name"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-3.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-700 outline-none transition-all focus:border-neutral-400 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                    Email <span className="text-neutral-300 dark:text-neutral-600">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-3.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-700 outline-none transition-all focus:border-neutral-400 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950"
                  />
                </div>
              </div>

              {/* Subject Input Field Box */}
              <div className="space-y-2">
                <label htmlFor="subject" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  placeholder="What is this about?"
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-3.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-700 outline-none transition-all focus:border-neutral-400 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950"
                />
              </div>

              {/* Message Textarea Field Box */}
              <div className="space-y-2">
                <label htmlFor="message" className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                  Any Query? <span className="text-neutral-300 dark:text-neutral-600">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  placeholder="Tell me about your project, question, or idea..."
                  className="w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950/60 p-3.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-700 outline-none transition-all focus:border-neutral-400 dark:focus:border-neutral-700 focus:bg-white dark:focus:bg-neutral-950 resize-none min-h-[140px]"
                />
              </div>

              {/* Form Action Controls Row */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="text-xs font-medium text-neutral-400 dark:text-neutral-500 sm:text-left text-center">
                  {state.error ? (
                    <span className="text-rose-500 dark:text-rose-400 font-semibold">{state.error}</span>
                  ) : (
                    <span>Please fill all required fields.</span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto px-6 py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold text-sm transition-all duration-200 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md whitespace-nowrap self-end"
                >
                  {isPending ? "Sending..." : "Send Query"}
                </button>
              </div>

            </form>
          )}

        </div>
      </motion.div>
    </section>
  );
}