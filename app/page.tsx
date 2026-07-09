
import Hero from "@/components/Hero";
import { Metadata } from "next";
import Experience from "@/components/Experience";
import Projects from "@/components/Projects";
import Skills from "@/components/Skills";
import GithubGraph from "@/components/GithubGraph";
import Gear from "@/components/Gear";
import Education from "@/components/Education";
import Blog from "@/components/Blog";
import Contact from "@/components/Contact";

import SocialLinks from "@/components/SocialLinks";
import CodingStats from "@/components/CodingStats";

export const metadata: Metadata = {
 
  metadataBase: new URL(
    process.env.NODE_ENV === "production"
      ? "https://puneettiwari.com" 
      : "http://localhost:3000"
  ),
  
  title: "Puneet Tiwari | Full-Stack Developer ",
  description: "Portfolio of Puneet Tiwari. Specializing in building high-performance full-stack web applications, clean user interfaces, and intelligent automation systems.",
  authors: [{ name: "Puneet Tiwari" }],
  keywords: [
    "puneet",
    "puneet tiwari",
    "puneet426",
    "full stack developer",
    "software engineer",
    "portfolio",
    "next.js developer",
    "codeforge",
    "niamt"
  ],
  icons: {
    icon: [
      {
        url: "/profile.webp",
        href: "/profile.webp",
      }
    ],
    shortcut: "/profile.webp",
    apple: "/profile.webp",
  },
  openGraph: {
    title: "Puneet Tiwari | Full-Stack Developer & Software Engineer",
    description: "Portfolio of Puneet Tiwari. Turning ideas into production apps with clean code, fast APIs, and UIs that don't suck.",
    url: "/", // Next.js will automatically combine this with your metadataBase
    siteName: "Puneet Tiwari Portfolio",
    images: [
      {
        url: "/profile.webp", 
        width: 800,
        height: 800,
        alt: "Puneet Tiwari Portfolio Preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Puneet Tiwari | Full-Stack Developer & Software Engineer",
    description: "Portfolio of Puneet Tiwari. Turning ideas into production apps with Next.js and Node.js.",
    images: ["/profile.webp"],
  },
};

export default function Home() {
  return (
    <>
      
      <main>
        <Hero />
        <SocialLinks/>
        <Projects />
      
        <Experience />
        
        <Skills />
        <GithubGraph />
        <CodingStats/>
        
        <Education />
        <Blog />
        {/* <Gear />
        <Contact /> */}
      </main>
      
    </>
  );
}
