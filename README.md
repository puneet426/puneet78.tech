# Puneet's Portfolio

A full-stack developer portfolio: dark, motion-driven, terminal-flavored.
Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Framer Motion.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## What to edit first

Almost everything you need to change lives in **one file**:

```
lib/data.ts
```

That's where your name, role, bio, projects, skills, blog posts, email,
resume link, and social links live. Update it and the whole site updates.

Other things worth knowing:

- **GitHub activity graph** (`components/GithubGraph.tsx`) fetches live
  contribution data for the username set in `lib/data.ts`
  (`profile.githubUsername`) from a free public API
  (github-contributions-api.jogruber.de). No API key needed. If the fetch
  fails for any reason, it falls back to sample data automatically.
- **Contact form** (`components/Contact.tsx`) currently opens the visitor's
  email client with a pre-filled message (no backend required). When you're
  ready, swap the `handleSubmit` function for a POST request to a service
  like Formspree, Resend, or your own API route.
- **Resume**: drop a PDF at `public/resume.pdf` and it will be served at
  `/resume.pdf` — already linked from `profile.resumeUrl` in `lib/data.ts`
  if you wire up a "Download resume" button.
- **Colors / fonts**: defined once in `tailwind.config.ts` under `colors`
  and in `app/layout.tsx` for fonts (Space Grotesk / Inter / JetBrains Mono).

## Sections included

- Hero with avatar, "open to roles" badge, resume + contact CTAs
- Sticky top nav with a working Cmd+K / Ctrl+K command palette
- About
- Experience timeline
- Projects / case studies
- Skills / tech stack
- Live GitHub contribution graph + commit/streak/consistency stats
- Development setup / gear
- Education
- Writing / blog list
- Contact form


## Command palette

Press **⌘K** (or **Ctrl+K**) anywhere on the page, or tap the Search button
in the nav, to jump to any section or open a social link. Add or edit
entries in `components/CommandPalette.tsx`.

## Deploying

Push to GitHub and import the repo on [Vercel](https://vercel.com/new) —
zero configuration needed.

## Notes

Respects `prefers-reduced-motion`, has visible keyboard focus states, and
is responsive down to small mobile widths.
