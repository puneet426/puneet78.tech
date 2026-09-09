export interface ProjectTech {
  name: string;
  icon: string;
  darkIcon?: string;
}

export interface CaseStudyDetails {
  problemText: string;
  approachText: string;
  outcomesList: string[];
  overviewParagraphs: string[];
  problemStatementLong: string;
  painPoints: string[];
  functionalGoals: string[];
  nonFunctionalGoals: string[];
  successCriteria: string[];
  roleResponsibilities: string[];
  techStackRationale: string;
  architectureDiagramSource: string;
  keyFeatures: { title: string; desc: string; highlightWord?: string }[];
  processChallenges: string[];
  uxProductDecisions: string[];
  futureImprovements: string[];
  userFlowDiagramSource: string;
  bookingUrl: string;
}


export interface Project {
  slug: string;
  title: string;
  year: string;
  tags: string;
  description: string;
  italicNote: string;
  image: string;
  status: "Live" | "In Production" | "Upgrading"; // 
  tech: ProjectTech[];
  extraTechCount: number;
  liveUrl: string;
  caseStudy: CaseStudyDetails;
}

export const PROJECTS_DATA: Project[] = [
  
{
  slug: "occazi",
  title: "Occazi",
  year: "2026",
  tags: "AI + Full Stack + SaaS",
  description: "AI-powered event management platform that helps organizers create, manage, and scale events with intelligent automation, seamless registrations, QR ticketing, and real-time analytics.",
  italicNote: "Great events shouldn't require endless spreadsheets and manual coordination — software should handle the complexity so organizers can focus on the experience.",
  image: "/projects/project1.png",
  status: "Live",
  tech: [
    { name: "Next.js", icon:"/technology/nextjs-dark.svg" },
    { name: "TypeScript", icon: "/technology/typescript.svg" },
    { name: "Tailwind CSS", icon: "/technology/tailwindcss.svg" },
    { name: "Convex", icon: "/technology/convex.svg" },
    { name: "Clerk", icon: "/technology/clerk.svg" },
    { name: "Google Gemini", icon: "/technology/gemini.svg" }
  ],
  extraTechCount: 5,
  liveUrl: "https://occazi.in",
  caseStudy: {
    problemText:
      "Planning and managing events often involves multiple disconnected tools for registrations, communication, scheduling, ticketing, and attendee management. This creates unnecessary manual work, inconsistent experiences, and poor visibility for organizers.",

    approachText:
      "I built Occazi as an AI-first event management platform that centralizes the complete event lifecycle. Using modern web technologies and AI, the platform streamlines event creation, automates repetitive tasks, manages registrations, generates QR tickets, and provides organizers with real-time operational insights.",

    outcomesList: [
      "Live production platform deployed with modern full-stack architecture.",
      "AI-assisted event creation significantly reduces organizer setup time.",
      "QR-based ticket generation and verification simplify event check-ins.",
      "Real-time dashboards help organizers monitor registrations and event performance.",
      "Responsive experience optimized for organizers and attendees across devices."
    ],

    overviewParagraphs: [
      "Occazi is a production-ready AI-powered event management platform built to simplify how organizations, colleges, communities, and businesses plan and manage events. Instead of relying on multiple disconnected services, users can create, publish, manage, and monitor events from a single platform.",
      "The application combines AI-assisted workflows, secure authentication, real-time backend capabilities, and modern UI design to provide an intuitive experience for both event organizers and attendees. Every major workflow—from creating an event to attendee check-in—has been designed to reduce manual effort while improving operational efficiency."
    ],

    problemStatementLong:
      "Event organizers frequently struggle with fragmented workflows involving registration forms, spreadsheets, payment tracking, attendee lists, ticket verification, and communication. Existing solutions are often either too complex, too expensive, or lack intelligent automation. The goal behind Occazi was to build a modern platform that removes these inefficiencies by combining AI, automation, and real-time collaboration into one seamless experience.",

    painPoints: [
      "Creating professional event pages requires significant manual effort.",
      "Managing registrations across multiple platforms leads to data inconsistency.",
      "Manual attendee verification slows down event check-in.",
      "Organizers lack real-time insights into registrations and engagement.",
      "Traditional event management platforms provide limited AI assistance."
    ],

    functionalGoals: [
      "Allow organizers to create and publish events within minutes.",
      "Generate AI-assisted event descriptions and structured content.",
      "Provide secure authentication and role-based access.",
      "Enable attendee registrations and QR-code ticket generation.",
      "Support real-time event updates using Convex.",
      "Display organizer dashboards with live analytics.",
      "Manage event schedules, attendees, and event metadata from one interface."
    ],

    nonFunctionalGoals: [
      "Maintain fast page loads with Next.js App Router.",
      "Provide responsive UI across desktop, tablet, and mobile.",
      "Ensure scalable real-time architecture.",
      "Maintain secure authentication and protected routes.",
      "Deliver production-ready performance and accessibility."
    ],

    successCriteria: [
      "Organizers can publish an event within a few minutes.",
      "Attendees experience a smooth registration process.",
      "QR-based verification reduces check-in time.",
      "The platform remains responsive with growing event data.",
      "AI reduces repetitive work during event creation."
    ],

    roleResponsibilities: [
      "Designed the complete product architecture and user experience.",
      "Developed both frontend and backend independently.",
      "Integrated AI-powered event generation using Google Gemini.",
      "Implemented secure authentication and authorization with Clerk.",
      "Built real-time backend functionality using Convex.",
      "Designed responsive UI components using Tailwind CSS and Shadcn UI.",
      "Handled deployment, production optimization, debugging, and maintenance."
    ],

    techStackRationale:
      "Next.js App Router provides excellent performance, routing, SEO, and server capabilities for a SaaS platform. Convex enables real-time synchronization without managing complex backend infrastructure, while Clerk simplifies authentication and user management. Google Gemini powers AI-assisted event generation, and Tailwind CSS with Shadcn UI accelerates development while maintaining a polished design system.",

    architectureDiagramSource: `flowchart LR
      Organizer --> Frontend[Next.js Application]
      Attendee --> Frontend
      Frontend --> Clerk[Authentication]
      Frontend --> Convex[Real-time Backend]
      Convex --> Database[(Database)]
      Frontend --> Gemini[Google Gemini AI]
      Frontend --> QR[QR Ticket Generator]
      Convex --> Dashboard[Analytics Dashboard]
      Dashboard --> Organizer`,

    keyFeatures: [
      {
        title: "AI Event Creation",
        desc: "Generate complete event details, descriptions, and structured content using Google Gemini AI.",
        highlightWord: "AI"
      },
      {
        title: "Real-time Event Management",
        desc: "Convex keeps registrations, attendee lists, and dashboards synchronized instantly.",
        highlightWord: "Real-time"
      },
      {
        title: "QR Ticketing",
        desc: "Automatically generate secure QR-based tickets for attendee verification during check-in.",
        highlightWord: "QR"
      },
      {
        title: "Organizer Dashboard",
        desc: "Monitor registrations, attendees, and event activity from a centralized analytics dashboard.",
        highlightWord: "Dashboard"
      }
    ],

    processChallenges: [
      "Designing a workflow that remains simple for first-time organizers while still supporting advanced event management features required multiple UX iterations.",
      "Integrating AI meaningfully was challenging because generated content needed to be useful, editable, and context-aware rather than generic.",
      "Building a responsive dashboard with real-time synchronization required careful state management and backend architecture.",
      "Balancing performance with modern UI interactions involved optimizing rendering, loading strategies, and component organization."
    ],

    uxProductDecisions: [
      "The product prioritizes reducing organizer effort through AI-assisted workflows rather than adding unnecessary complexity.",
      "Important actions such as creating events, publishing, viewing registrations, and managing attendees are always accessible within minimal navigation depth.",
      "Clean layouts, responsive components, and intuitive forms reduce the learning curve for non-technical users."
    ],

    futureImprovements: [
      "Integrated payment gateways for paid events.",
      "Multi-organizer collaboration with granular permissions.",
      "Email and WhatsApp notification automation.",
      "AI-powered attendee engagement recommendations.",
      "Sponsor management and exhibitor portals.",
      "Public Event API for third-party integrations.",
      "Native Android and iOS applications.",
      "Advanced analytics with predictive insights."
    ],

    userFlowDiagramSource: `flowchart TD
      A[Organizer Login] --> B[Create Event]
      B --> C[AI Generates Event Details]
      C --> D[Publish Event]
      D --> E[Attendee Registration]
      E --> F[QR Ticket Generated]
      F --> G[Event Check-in]
      G --> H[Organizer Dashboard]
      H --> I[Analytics & Insights]`,

    bookingUrl: "https://cal.com/puneet426"
  }
},
{
  slug: "peerreview",
  title: "PeerReview",
  year: "2026",
  tags: "Full Stack + SaaS + Career Tech",
  description:
    "GitHub Pull Requests for resumes upload a resume, get an instant structured review across 8 scoring dimensions, match it against real job descriptions, track applications, and let the community leave inline, line-anchored comments version by version until it's ready to ship.",
  italicNote:
    "Resume feedback is the one thing everyone needs and nobody can get honestly — a resume shouldn't be judged once in a vacuum, it should be iterated on in the open like code.",
  image: "/projects/project2.png",
  status: "Live",
  tech: [
    { name: "Next.js 15", icon: "/technology/nextjs-dark.svg" },
    { name: "TypeScript", icon: "/technology/typescript.svg" },
    { name: "Tailwind CSS", icon: "/technology/tailwindcss.svg" },
    
    { name: "PostgreSQL", icon: "/technology/postgresql.svg" },
    
  ],
  extraTechCount: 6, // React 19, @react-pdf/renderer, jose (JWT), bcryptjs, Nodemailer, pdf-parse/mammoth
  liveUrl: "https://peerreview.occazi.in",
  repoUrl: "https://github.com/puneet426/peerreview",

  caseStudy: {
    problemText:
      "Getting honest resume feedback is either impossible or expensive. Friends say it looks great, recruiters never reply, and paid review services charge for one round of generic advice with no way to iterate. Meanwhile the resume artifact itself is unmanaged: there's no history, no record of what changed between the version that got an interview and the one that didn't, and no way for feedback to point at the exact line it's about.",

    approachText:
      "I built PeerReview around a mechanic developers already trust: the pull request. Every resume is a repository, every edit is a version, and feedback is either an inline comment anchored to a quoted line or a structured multi-category review. An instant heuristic analyzer scores every version the moment it's uploaded so nobody waits on a human for the obvious fixes, and a job-description matcher plus an application tracker extend the loop from 'is my resume good' to 'is my resume good for this specific job I'm applying to today'.",

    outcomesList: [
      "Live production SaaS at peerreview.occazi.in with a real payment flow, email verification, and a Postgres-backed multi-instance-safe rate limiter.",
      "8-dimension instant resume analysis (ATS, grammar, projects, experience, skills, design, achievements, completeness) that runs locally with zero external API keys and no per-request cost.",
      "GitHub-style version control for resumes — word-level diffs between versions, with reviews and comments bound to the specific version they were written about.",
      "Job Match Score with an explicit missing-keyword breakdown, wired into a Kanban application tracker so every logged application carries the score of the resume actually sent.",
      "Five real PDF templates with a live in-browser preview that renders the exact same component as the final server-generated PDF — one source of truth, no visual drift.",
      "Concurrency-verified rate limiting: 100 genuinely simultaneous requests against one key returned 100 consecutive unique counts with zero duplicates against a real Postgres 16 instance."
    ],

    overviewParagraphs: [
      "PeerReview is a production resume-improvement platform built on the idea that a resume should be iterated on the way code is — in public, in versions, with feedback attached to specific lines. A user uploads a PDF or DOCX, the app extracts the text, scores it instantly across eight dimensions, and publishes it (optionally anonymously) to a showcase where other users review it across seven star-rated categories and leave inline comments tied to a quoted fragment.",
      "Around that core loop sit the things that make it a real product rather than a demo: a job-description matcher that names the keywords the JD wants and the resume lacks, a Kanban application tracker that remembers the match score of the exact resume sent to each company, an interview-question generator that reads a resume back as likely questions, a five-template PDF builder with live preview, and an XP/badge/leaderboard system that makes reviewing other people's resumes worth doing.",
      "The entire analysis layer is deliberately local heuristics rather than an LLM call. That keeps the app free to run, instant, deterministic, and inspectable — and every analyzer (`analyzeResume`, `computeJobMatch`, `generateInterviewQuestions`) sits behind a stable return type, so swapping in a real model later is a one-function change rather than a rewrite."
    ],

    problemStatementLong:
      "Resume feedback is a broken market at both ends. Candidates get either polite non-feedback from people who don't want to discourage them, or nothing at all from recruiters who never respond. Paid services sell a single round of generic advice with no iteration, no version history, and no way to see whether the changes actually improved anything. On top of that, the resume artifact itself is unmanaged: people keep resume_final_v3_ACTUAL.pdf on a desktop, can't remember what changed between versions, and have no mechanism for feedback to point at a specific bullet point. Separately, the job-search workflow around the resume is fragmented across a spreadsheet of applications, a mental note of which resume version went where, and a manual re-read of every job description to guess which keywords an ATS is scanning for. PeerReview's goal was to collapse all of that into one versioned, reviewable, measurable loop.",

    painPoints: [
      "Honest resume feedback is unavailable, generic, or paywalled behind a single non-iterative round.",
      "Feedback that isn't anchored to a specific line is hard to act on — 'tighten your bullets' means nothing without knowing which bullet.",
      "There's no version history for resumes, so nobody can tell which change actually improved the outcome.",
      "Candidates can't see what an ATS keyword scan sees — which terms a job description expects and their resume is missing.",
      "Application tracking lives in a spreadsheet disconnected from the resume version actually sent to each company.",
      "People with nothing to gain won't review strangers' resumes, so peer-review communities die without an incentive layer.",
      "Sharing a resume publicly for feedback normally means exposing personal contact details to everyone."
    ],

    functionalGoals: [
      "Accept PDF and DOCX uploads with automatic server-side text extraction, plus a plain-text fallback path.",
      "Score every uploaded version instantly across ATS, grammar, projects, experience, skills, design, achievements, and completeness, with actionable written suggestions.",
      "Render the real document — inline PDF viewer, sanitized DOCX-to-HTML render, or plain text — rather than only showing extracted text.",
      "Treat every edit as a new version, with a word-level GitHub-style diff between versions.",
      "Let the community leave 7-category star reviews and inline comments anchored to a quoted highlight from the resume.",
      "Support anonymous publishing so a resume can be reviewed without exposing the owner's identity.",
      "Compute a Job Match Score against any pasted or uploaded job description, split into matched and missing keywords.",
      "Split missing terms into single words (skills to add) and two-word phrases (responsibilities to weave into a bullet) with calibrated advice.",
      "Provide a Kanban application tracker (Saved → Applied → Interviewing → Offer/Rejected) with match score and notes on every card.",
      "Generate likely interview questions from what's actually on the resume — detected tech stack, quantified results, leadership language.",
      "Offer five distinct PDF resume templates with a live, debounced preview that renders the same component as the final PDF.",
      "Reward participation with XP, four levels, and auto-awarded badges, surfaced on profiles and a leaderboard.",
      "Gate resume count and template access by plan, enforced server-side on every creation path.",
      "Take one-time payments via Razorpay with server-side signature verification before any plan upgrade.",
      "Verify email addresses over plain SMTP with single-use, 24-hour, replay-proof tokens."
    ],

    nonFunctionalGoals: [
      "Zero required external AI API keys — the analysis layer must work with no third-party service and no per-request cost.",
      "Every query bounded: no route may load an unbounded collection into memory to sort or count in JavaScript.",
      "Rate limiting must be correct across multiple server instances, not just within one process.",
      "Every mutation re-verifies ownership, visibility, and plan limits server-side, independent of what the client sends.",
      "Uploaded content is never trusted as safe HTML — DOCX renders through a sanitizer allowlist.",
      "Every data-heavy route ships a loading skeleton and an error boundary instead of a blank screen or a crash.",
      "Storage stays roughly 'one file per resume' rather than growing linearly with every edit.",
      "Read-heavy public pages cache their rendered output instead of hitting the database on every request.",
      "Full responsive behavior including a real mobile navigation menu, not a truncated desktop bar."
    ],

    successCriteria: [
      "A user goes from signup to an uploaded, scored, publicly reviewable resume in under two minutes.",
      "Every piece of feedback points at something specific — a category score, a suggestion, or a quoted line.",
      "Two versions of the same resume can be compared word by word without leaving the app.",
      "A pasted job description produces a match score and a concrete list of missing terms, not a vague verdict.",
      "The rate limiter provably holds under genuine concurrency, not just in theory.",
      "Payment can never be spoofed from the client — only a server-verified Razorpay signature upgrades a plan.",
      "The app runs correctly on a fresh clone with only a database URL and a session secret, no AI keys."
    ],

    roleResponsibilities: [
      "Sole designer, developer, and operator — product definition through production deployment.",
      "Designed the full relational data model (14 Prisma models) including the version/review/comment graph and the denormalized fields that keep public listings to a single indexed query.",
      "Wrote the entire heuristic analysis layer: resume scorer, bullet rewriter, job-description keyword matcher, tailoring-suggestion generator, and interview-question generator.",
      "Built a homegrown JWT session system on `jose` with bcrypt (cost factor 12) hashing and httpOnly, SameSite=Lax cookies, plus route-level middleware protection.",
      "Implemented PDF/DOCX text extraction and a sanitized DOCX-to-HTML document viewer.",
      "Built the word-level diff engine and the GitHub-style version compare view.",
      "Built five @react-pdf/renderer templates and the live-preview builder, validating output against an independent renderer (Poppler).",
      "Integrated Razorpay one-time payments with constant-time server-side signature verification.",
      "Implemented SMTP email verification with single-use, resend-invalidating tokens and per-user resend rate limiting.",
      "Ran a dedicated scaling and security pass: replaced the in-memory rate limiter with an atomic Postgres upsert, closed an unauthenticated file-parsing endpoint, bounded every unbounded query, and added health checks, loading skeletons, and error boundaries.",
      "Designed the dark, diff-inspired visual system and the full responsive UI."
    ],

    techStackRationale:
      "Next.js 15 App Router with Server Actions removes most of the API surface — mutations are typed server functions with built-in Origin-header CSRF protection instead of hand-rolled endpoints, and server components let heavy pages read straight from the database with no client-side waterfall. Prisma + Postgres was chosen over a real-time backend because the data is deeply relational (users → resumes → versions → reviews → votes) and the hard requirements were correct indexes and bounded queries, not live sync; Postgres also doubles as the rate-limit store, which removes Redis from the deployment entirely. Authentication is homegrown on `jose` + bcryptjs rather than a hosted provider, so a session stays a signed cookie with no vendor lock-in and no per-MAU cost. The analysis layer is local heuristics: free, instant, deterministic, debuggable, and hidden behind stable return types so a model call can replace it later without touching a single caller. @react-pdf/renderer lets one template component serve both the browser live preview and the server-side final PDF, which structurally prevents preview drift. Razorpay is the natural fit for a ₹99 one-time INR payment, and plain Nodemailer SMTP keeps email verification working on a free Gmail app password or Brevo tier with no third-party auth dependency.",

    architectureDiagramSource: `flowchart LR
      Candidate --> Frontend[Next.js 15 App Router]
      Reviewer --> Frontend
      Frontend --> MW[JWT Middleware]
      MW --> SA[Server Actions]
      Frontend --> API[Route Handlers]
      SA --> Prisma[Prisma Client]
      API --> Prisma
      Prisma --> DB[(PostgreSQL)]
      API --> Parser[pdf-parse / mammoth]
      SA --> Analyzer[Heuristic Analysis Layer]
      Analyzer --> Score[8-Dimension Score]
      SA --> PDF[react-pdf Renderer]
      API --> RZP[Razorpay Signature Verify]
      SA --> Mail[Nodemailer SMTP]
      Prisma --> RL[(RateLimitEntry)]
      DB --> XP[XP / Badges / Leaderboard]`,

    keyFeatures: [
      {
        title: "Versioned Resume Review",
        desc: "Every edit creates a new version with a word-level GitHub-style diff, and reviews and comments stay bound to the exact version they were written about.",
        highlightWord: "Versioned"
      },
      {
        title: "Instant 8-Dimension Analysis",
        desc: "A local heuristic engine scores ATS, grammar, projects, experience, skills, design, achievements, and completeness the moment a resume is uploaded — no API key, no cost, no wait.",
        highlightWord: "Instant"
      },
      {
        title: "Inline Line-Anchored Comments",
        desc: "Reviewers quote a specific fragment of the resume and comment on it, so feedback points at a real bullet point instead of the document as a whole.",
        highlightWord: "Inline"
      },
      {
        title: "Job Match Score",
        desc: "Paste a job description against any of your resumes and get a keyword-match percentage plus exactly which terms are matched and which are missing.",
        highlightWord: "Match"
      },
      {
        title: "Application Tracker",
        desc: "A Kanban board from Saved to Offer that keeps the match score, job description, and notes attached to every application you log.",
        highlightWord: "Tracker"
      },
      {
        title: "Live PDF Template Builder",
        desc: "Five distinct templates with a preview that renders the exact same component as the final downloaded PDF, so what you see cannot drift from what you get.",
        highlightWord: "Live"
      },
      {
        title: "XP and Reputation",
        desc: "Reviewing, commenting, and being marked helpful earn XP across four levels and auto-awarded badges, surfaced on public profiles and a leaderboard.",
        highlightWord: "XP"
      }
    ],

    processChallenges: [
      "Making the analyzer useful without an LLM: an 'AI review' that only counts keywords is worthless, so the scorer had to model real recruiter heuristics — strong versus weak action verbs, quantified outcomes, section completeness, bullet density — and produce written suggestions that name the specific gap rather than restating the score.",
      "A real bug in keyword extraction: two-word phrases were being formed by sliding a window across the entire cleaned text, so phrases crossed unrelated sentence boundaries ('...code review is required. You should be comfortable...' produced 'review comfortable'), and stopwords were stripped before pairing, so words never adjacent in the source got paired anyway. The fix was to split on real sentence and clause boundaries first — while protecting compound terms like 'Node.js' from being treated as sentence-enders — and only form bigrams from genuinely adjacent words.",
      "Rate limiting that survives horizontal scaling: the original in-memory Map limiter reset on restart and shared nothing across instances, which is exactly wrong at the traffic level where limits matter. Rather than adding Redis as a service to run and pay for, it moved to a Postgres table using a single atomic INSERT ... ON CONFLICT per check. Validated empirically against a real Postgres 16 instance — 100 genuinely concurrent requests against one key returned 100 consecutive unique counts with zero duplicates, which a naive read-then-write would have failed.",
      "An unauthenticated expensive endpoint: /api/parse-resume — the most CPU-costly route in the app — had no auth check at all, so anyone could POST arbitrary files to it. Found and closed during the security pass, along with adding rate limits to PDF rendering, job matching, AI rewrite, interview-question generation, and both billing endpoints.",
      "Unbounded queries that only break at scale: the showcase page loaded every public resume into memory to sort in JavaScript, the resume detail page loaded every historical version's full reviews and comments just to render the latest one, and profile pages capped reviews at 10 but left the adjacent resumes list uncapped. All three became bounded, indexed queries with separate lightweight aggregate counts so displayed averages stay accurate even when the list is capped — which is why `Resume.latestScore` exists as a denormalized field.",
      "Storage growing with every edit: binary PDF/DOCX bytes were kept on every version even though only the latest version's file is ever served or reopened. Both the upload and template-builder save paths now clear file bytes and structured builder data from every version except the newest, keeping storage roughly one file per resume.",
      "PDF templates that render without throwing but are still wrong: cross-checking all five templates against an independent renderer (Poppler) caught a name/title text overlap and an arrow character outside standard PDF font encoding that rendered as a stray glyph — neither of which produced an error at render time.",
      "A subtle plan-state ambiguity: with a single non-expiring paid tier, `planExpiresAt` is null for both a free user and a lifetime user. The resolution was to make `planTier` the sole decider inside one function, `getEffectivePlanTier`, documented and tested so the two null cases can't be confused."
    ],

    uxProductDecisions: [
      "The 'git for resumes' concept is expressed as real mechanics, not decoration — actual diff-style green/red additions and deletions appear in the hero, the version compare view, and inline comments, because that is the genuine product mechanic.",
      "The DOCX viewer deliberately renders on a white 'paper' card even though the rest of the UI is dark: a resume is a real document, and showing it on white reads as authentic rather than forcing it into a canvas nobody actually reads resumes on.",
      "Removed the `$ git ...`-style terminal micro-copy that once topped every page — it read as a developer in-joke rather than a professional tool, and the diff language already carries the concept where it's real.",
      "Dropped a fabricated 'average version count' stat strip from the landing page; inventing usage numbers for a product with no users yet is dishonest, not just informal.",
      "Anonymous publishing is a first-class option, because the value of public review collapses if getting feedback requires exposing your name and contact details.",
      "Email verification gates writing reviews and comments on other people's resumes, but not logging in or uploading your own — community trust is the surface fake accounts damage, and gating a user's private workflow would only punish real users.",
      "Back navigation uses browser history rather than a hardcoded parent route, since a resume page or profile can legitimately be reached from the dashboard, showcase, leaderboard, or a review author's name.",
      "Dashboard stat tiles link to where the data actually lives instead of being static numbers with nothing behind them, and logout asks for confirmation instead of firing on a single click.",
      "The template gallery shows locked templates rather than hiding them, so the upgrade path is legible — with the lock enforced server-side in the save action, not just in the UI.",
      "Tailoring suggestions include an explicit nudge not to add keywords that aren't true, because a keyword-stuffed resume that collapses in the interview is worse than a visible gap."
    ],

    securityNotes: [
      "Passwords hashed with bcrypt at cost factor 12; sessions are `jose`-signed JWTs in httpOnly, SameSite=Lax cookies.",
      "Middleware blocks unauthenticated access to /dashboard, /resumes/new, /resumes/build, and /applications before the page renders, preserving the intended destination through a `from` param.",
      "Every mutation re-checks ownership and visibility server-side: reviews and comments verify the version actually belongs to the resume ID passed in, ratings are clamped 1–5 regardless of client input, and you can't review your own resume even by calling the Server Action directly.",
      "Uploads capped at 8MB and restricted to PDF/DOCX by MIME type, enforced in the action rather than the form.",
      "DOCX-to-HTML rendering passes through `sanitize-html` with a tag allowlist before ever being shown to another user.",
      "Razorpay's `order_id|payment_id` signature is recomputed server-side and compared constant-time before any Subscription is marked paid or any plan upgraded — the client's 'payment succeeded' callback is never trusted alone.",
      "Verification tokens are single-use, expire in 24 hours, and are invalidated the moment a new one is requested, so an old link can't be replayed after a resend.",
      "Server-side length caps on every text input (titles, job descriptions, comments, review summaries, notes) to prevent storage abuse.",
      "Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) set on every response; Server Actions carry built-in Origin-header CSRF protection."
    ],

    dataModelNotes: [
      "14 Prisma models: User, Resume, ResumeVersion, Score, Review, HelpfulVote, Comment, XPLog, Badge, UserBadge, JobApplication, Subscription, EmailVerificationToken, RateLimitEntry.",
      "`Resume.latestScore` is a denormalized copy of the current version's overall score, kept in sync on every scoring path, purely so the showcase can sort and paginate top-rated resumes as one indexed query.",
      "`ResumeVersion.builderData` stores the raw structured ResumeData JSON for template-built resumes, so the builder can be reopened and kept editing instead of the structure being lost when flattened to a PDF.",
      "`User.planTier` is cached on the user rather than derived from Subscription, so 'can this user upload another resume?' is one cheap read instead of a join on every request that asks.",
      "Every foreign key and every column used in a WHERE or ORDER BY has an explicit @@index rather than relying on defaults.",
      "`HelpfulVote` carries a unique constraint on (reviewId, userId), so a review can't be farmed for repeat XP by the same voter."
    ],

    gamificationNotes: [
      "XP actions: upload a resume (+20), push a new version (+10), write a review (+25), leave a comment (+8), get a review marked helpful (+50), have a suggestion accepted (+10), daily login (+5), log an application (+5), record an offer (+100).",
      "Four levels — Resume Rookie (0), Reviewer (150), Resume Mentor (750), Career Coach (2000) — with progress toward the next level surfaced on the dashboard XP bar.",
      "Badges are defined in the database with an XP threshold and auto-awarded through an idempotent upsert inside the same XP-award call, so re-running it never double-grants."
    ],

    plansAndBilling: [
      "Two tiers, not three: Free (2 resumes, 2 templates) and Lifetime (₹99 one-time, unlimited resumes, all templates, never expires).",
      "`lib/plans.ts` is the single source of truth for what each tier includes, and `checkResumeLimit` is shared by both creation paths so the limit rule can't drift between file upload and the template builder.",
      "Template unlock order is literally the array order in the template registry — `isTemplateUnlocked` compares the template's index against the tier's `templateAccess` count, checked in both the gallery and the save action.",
      "Paying grants permanent access rather than a renewing mandate — nothing to cancel, no recurring charge, and no dunning logic to maintain."
    ],

    scalingNotes: [
      "Postgres-backed rate limiting via a single atomic upsert per check — correct across multiple instances with no Redis in the deployment.",
      "/showcase and /leaderboard revalidate on a 60-second window instead of querying on every request; both are read-heavy and a slightly stale ranking is a cheap trade.",
      "Two-URL Prisma setup (pooled DATABASE_URL, direct DIRECT_URL) so serverless invocations go through a pooler while migrations use a direct connection.",
      "GET /api/health runs a trivial query to confirm the database connection is actually alive, not just that the process is up.",
      "Route-specific loading.tsx skeletons and error.tsx / global-error.tsx boundaries on every data-heavy route, so a transient database hiccup shows a retry screen instead of crashing the app.",
      "PDF generation is CPU-bound and briefly blocks the event loop; on serverless each request is naturally isolated, and a job queue would only become the right fix if self-hosted on a single long-running process."
    ],

    knownLimitations: [
      "The analysis layer is heuristic, not a language model — fast, free, and deterministic, but it reasons about structure and signals rather than meaning.",
      "Legacy binary .doc files aren't supported; users are asked to save as .docx or .pdf.",
      "Scanned or image-only PDFs won't extract text, since there's no OCR step.",
      "The application tracker changes status through a dropdown rather than drag-and-drop.",
      "Only resumes are scored today — portfolios, GitHub profiles, and LinkedIn aren't."
    ],

    futureImprovements: [
      "Swap the heuristic analyzers for a real LLM behind the existing return types, keeping the local engine as a zero-cost fallback.",
      "OCR for scanned PDFs so image-only resumes are still reviewable.",
      "Resume Battles and Weekly Resume Roast — head-to-head voting mini-games on top of existing review data.",
      "Company-specific review presets calibrated to known screening styles.",
      "Recruiter-verified reviewer badges and university leaderboards to make reputation legible.",
      "Portfolio, GitHub, and LinkedIn scoring alongside resumes.",
      "Drag-and-drop for the application tracker Kanban board.",
      "Outcome tracking that ties interview callbacks back to the specific resume version that earned them."
    ],

    userFlowDiagramSource: `flowchart TD
      A[Register] --> B[Verify Email]
      B --> C{Create Resume}
      C -->|Upload PDF/DOCX| D[Text Extraction]
      C -->|Template Builder| E[Live PDF Preview]
      D --> F[Instant 8-Dimension Score]
      E --> F
      F --> G[Publish to Showcase]
      G --> H[Community Reviews & Inline Comments]
      H --> I[New Version]
      I --> J[Word-Level Diff vs Previous]
      J --> F
      F --> K[Paste Job Description]
      K --> L[Match Score + Missing Keywords]
      L --> M[Log Application in Tracker]
      M --> N[Interview Prep Questions]
      H --> O[XP, Badges, Leaderboard]`,

    bookingUrl: "https://cal.com/puneet426"
  }
},

{
    slug: "portfolio",
    title: "Personal Portfolio v4",
    year: "2026",
    tags: "Design + Frontend",
    description: "Motion-first personal site with 3D scenes, a blog, and design opinions baked in.",
    italicNote: "A portfolio is a product — scope and polish matter as much as any user-facing app.",
    image: "/projects/portfolio.png",
    status: "Live",
    tech: [
       { name: "Next.js", icon:"/technology/nextjs-dark.svg" },
      { name: "TypeScript", icon: "/technology/typescript.svg" },
      { name: "Tailwind CSS", icon: "/technology/tailwindcss.svg" },
      { name: "Framer Motion", icon: "/technology/framer-motion.svg" }
    ],
    extraTechCount: 1,
    liveUrl: "https://puneet.occazi.in/",
    caseStudy: {
      problemText: "Most portfolio templates are interchangeable — same layout, same card grid, no personality. I wanted something that actually represents how I think and work, not just a list of links.",
      approachText: "Built from scratch with Next.js App Router, prioritizing motion, theme depth, and real content. Added a 3D banner system, GitHub graph, blog engine, and case study format — so the site itself demonstrates what I build.",
      outcomesList: [
        "Multiple lazy-loaded banner modes including a 3D scene, terminal, tech grid, and GitHub contribution graph.",
        "Dark/light theme system with smooth transitions across all sections.",
        "Component-based blog routes and a full case study format for projects."
      ],
      overviewParagraphs: [
        "This portfolio is a Next.js App Router application. It includes a homepage, project list, dynamic project routes, blog routes, contact page, keymap page, tools/setup/terminal pages, animated hero banners, theme switching, search, GitHub activity, visitor count, and optional WakaTime/YouTube API routes.",
        "The main users are hiring managers, senior engineers, recruiters, and peers. The site exists to make project depth easy to scan while still giving technical readers enough substance to dive deeper."
      ],
      problemStatementLong: "Most developer portfolios look interchangeable: hero, cards, skills, contact. They often fail to show how the developer thinks about UX, interaction, architecture, or product narrative. My problem was not only showing projects; it was making the portfolio itself evidence of engineering and design judgment.",
      painPoints: [
        "Projects need structured case-study storytelling, not just screenshots.",
        "Navigation should be fast for keyboard-oriented technical users.",
        "Visual polish must not block basic readability or mobile behavior.",
        "Content should be maintainable without a CMS for a solo portfolio."
      ],
      functionalGoals: [
        "Render homepage sections, projects, blogs, contact, tools/setup, terminal, and keymap pages.",
        "Provide dynamic project routes and custom rich case-study components.",
        "Add search modal and keyboard shortcuts for fast navigation.",
        "Integrate GitHub contribution visuals and small API-backed widgets.",
        "Generate project-specific Open Graph images."
      ],
      nonFunctionalGoals: [
        "Keep content typed and centralized in config files.",
        "Preserve responsive behavior across desktop and mobile.",
        "Use motion intentionally without making the page feel heavy.",
        "Degrade gracefully when external APIs fail."
      ],
      successCriteria: [
        "A hiring manager can understand my strongest projects in under a minute.",
        "A senior engineer can find detailed project architecture and tradeoffs quickly.",
        "The app remains maintainable as project/blog content grows.",
        "Achieving 95+ Lighthouse scores across performance and accessibility."
      ],
      roleResponsibilities: [
        "I designed and implemented the site end-to-end: app routes, layout components, design system choices, animated sections, project config, blog config, search data, keyboard shortcut logic, API routes, dynamic OG images, and custom case-study components.",
        "The repo currently uses TSX/config for rich content rather than Markdown/MDX. These generated MDX files are standalone content artifacts; integrating them into the live app would require a content loader or conversion into existing TSX case-study components."
      ],
      techStackRationale: "Next.js is a strong fit because the app needs static pages, dynamic routes, metadata, API handlers, and OG image generation. Tailwind CSS v4 supports fast visual iteration with custom tokens. Framer Motion and Three.js are used where visual identity matters, while config files keep content separated from rendering components.",
      architectureDiagramSource: `flowchart LR\n    Visitor --> App[Next.js App Router]\n    App --> Pages[Home / Projects / Blog / Contact / Tools]\n    Pages --> Components[Sections, Layout, Widgets, Banners]\n    Components --> Config[Typed config data]\n    App --> API[API routes]\n    API --> GitHub[GitHub contribution API]\n    API --> WakaTime[WakaTime API]\n    API --> YouTube[YouTube API]\n    API --> Visitors[Local visitor count JSON]`,
      keyFeatures: [
        { title: "Config-driven content", desc: "Projects, blogs, profile, keymaps, tools, setup, terminal content, and search data live in modules.", highlightWord: "config" },
        { title: "Rich case-study routing", desc: "Dynamic project routes select custom case-study components for major projects and a generic fallback for others." }
      ],
      processChallenges: [
        "The main challenge was balancing personality with performance. A portfolio can easily become visually noisy or slow. I used lazy loading around heavier hero banners and kept content mostly static/config-driven so visual experimentation does not require backend complexity.",
        "Another challenge was keyboard shortcuts. Single-key shortcuts are powerful but dangerous if they fire inside forms or while selecting text. The shortcut utilities explicitly avoid editable contexts and default-prevented/repeated events.",
        "Iterative design required constant refactoring to keep the portfolio’s aesthetics and technical implementation in sync."
      ],
      uxProductDecisions: [
        "The portfolio is designed for skim-first reading. Sections create visual variety, while projects carry concise metadata and deeper case-study paths. Search and keymap features support technical users who expect command-palette-like navigation."
      ],
      futureImprovements: [
        "Add an MDX/content pipeline for case studies instead of hardcoding rich TSX pages.",
        "Replace local visitor-count JSON with durable storage or analytics.",
        "Add tests for shortcut behavior, project route rendering, and search filtering.",
        "Audit and remove unused dependencies such as Cloudinary if not used."
      ],
      userFlowDiagramSource: `flowchart TD\n    A[Hiring manager lands on homepage] --> B[Scans hero and project cards]\n    B --> C{Interested in a project?}\n    C -->|Yes| D[Open /projects/slug]\n    D --> E[Read custom or generic case study]\n    C -->|No| F[Open search or keymap]\n    F --> G[Jump to blog, contact, tools, or project]\n    E --> H[Open live/repo/contact links]`,
      bookingUrl: "https://cal.com/puneet426"
    }
  },


];