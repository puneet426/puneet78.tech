"use client";

import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import Eyebrow from "./Eyebrow";
import { profile } from "@/lib/data";

export default function Contact() {
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const subject = encodeURIComponent(`Portfolio message from ${form.name}`);
    const body = encodeURIComponent(`${form.message}\n\n— ${form.name} (${form.email})`);
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  return (
    <section id="contact" className="px-6 py-24 md:px-10">
      <div className="mx-auto max-w-content">
        <Eyebrow index="09" label="Contact" />

        <h2 className="mb-4 font-display text-2xl font-bold text-ink sm:text-3xl">
          Let&apos;s work together
        </h2>
        <p className="mb-10 max-w-[34rem] text-muted">
          Have a project in mind, or just want to say hi? My inbox is open.
        </p>

        <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="font-mono text-[11px] uppercase tracking-wide text-faint">
              Name
            </label>
            <input
              id="name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="Jane Doe"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-wide text-faint">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="jane@example.com"
            />
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <label htmlFor="message" className="font-mono text-[11px] uppercase tracking-wide text-faint">
              Message
            </label>
            <textarea
              id="message"
              required
              rows={5}
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              className="resize-none rounded-md border border-line bg-panel px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent"
              placeholder="What are you building?"
            />
          </div>

          <div className="flex items-center gap-4 sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-md bg-ink px-5 py-2.5  font-medium text-base transition-opacity hover:opacity-85"
            >
              Send message
              <ArrowUpRight size={15} />
            </button>
            {status === "sent" && (
              <span className="text-xs text-good">opening your mail client…</span>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
