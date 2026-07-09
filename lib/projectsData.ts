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
];