// lib/data.ts

export interface ProfileData {
  name: string;
  username: string;
  email: string;
  role: string;
  github: string;
  twitter: string;
  bio: string;
  skills: string[];
}

export const profile: ProfileData = {
  name: "Puneet Tiwari",
  username: "puneet426",
  email: "puneettiwari426@gmail.com", // 🚀 Used directly by window.location.href mailto template
  role: "Full Stack Developer",
  github: "https://github.com/puneet426",
  twitter: "https://twitter.com/puneet426",
  bio: "Turning ideas into clean production applications. Focused on robust system architecture, scalable web performance, and responsive frontend interaction design.",
  skills: [
    "Next.js",
    "React",
    "TypeScript",
    "Node.js",
    "Python",
    "Database Management Systems (DBMS)",
    "Tailwind CSS"
  ]
};