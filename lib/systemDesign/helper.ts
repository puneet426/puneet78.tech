import type { BlogPost, ContentSection } from "../blogData";

export type SystemDesignKind = "Design" | "Fundamentals" | "Low-Level Design";

export interface SystemDesignInput {
  day: number;
  kind: SystemDesignKind;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  intro: string[];
  sections: ContentSection[];
  conclusion: string;
}

// Fallback card gradients (these posts have no banner image)
const GRADIENTS = [
  "from-indigo-950 via-neutral-900 to-black",
  "from-emerald-950 via-neutral-900 to-black",
  "from-sky-950 via-neutral-900 to-black",
  "from-rose-950 via-neutral-900 to-black",
  "from-amber-950 via-neutral-900 to-black",
  "from-violet-950 via-neutral-900 to-black",
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// Day 1 was published on October 13, 2026; one article per day after that
function dateForDay(day: number): string {
  const d = new Date(Date.UTC(2026, 9, 12 + day));
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function readTime(input: SystemDesignInput): string {
  const text = [
    ...input.intro,
    ...input.sections.flatMap((s) => [
      ...s.content,
      ...(s.bullets ?? []),
      ...(s.snippets ?? []).map((sn) => sn.code),
    ]),
    input.conclusion,
  ].join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min read`;
}

export function sd(input: SystemDesignInput): BlogPost {
  return {
    slug: input.slug,
    title: input.title,
    description: input.description,
    date: dateForDay(input.day),
    readTime: readTime(input),
    category: `System Design · Day ${String(input.day).padStart(2, "0")} · ${input.kind}`,
    imageClassName: GRADIENTS[(input.day - 1) % GRADIENTS.length],
    tags: ["System Design", ...input.tags],
    introParagraphs: input.intro,
    sections: input.sections,
    conclusion: input.conclusion,
    author: { name: "Puneet Tiwari", role: "Full Stack Developer" },
  };
}
