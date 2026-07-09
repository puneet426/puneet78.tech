"use client";

import React, { useState } from "react";
import { Anton, Instrument_Serif, Space_Grotesk } from "next/font/google";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import SidebarLayout from "@/components/SidebarLayout";
import KeyboardNavigation from "@/components/KeyboardNavigation";
import IntroLoader from "@/components/IntroLoader";
import "./globals.css";

const anton = Anton({ subsets: ["latin"], weight: "400", variable: "--font-anton", display: "swap" });
const instrumentSerif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument-serif", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-space-grotesk", display: "swap" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  
  // 🚀 Hidden/Closed by default on initial mount
  const [isMinimal, setIsMinimal] = useState(true); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <html lang="en" className={`${anton.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const savedTheme = localStorage.getItem("theme");
            const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
              document.documentElement.classList.add("dark");
              document.documentElement.style.colorScheme = "dark";
            } else {
              document.documentElement.classList.remove("dark");
              document.documentElement.style.colorScheme = "light";
            }
          } catch (_) {}
        `}} />
      </head>
      <body className="bg-[#fdfbf7] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 antialiased min-h-screen relative overflow-x-hidden">
        
        {loading && <IntroLoader onComplete={() => setLoading(false)} />}
        
        <div className={loading ? "opacity-0 invisible h-screen overflow-hidden" : "opacity-100 visible transition-opacity duration-500 flex flex-col min-h-screen"}>
          <Nav 
            onToggleMinimal={() => setIsMinimal(!isMinimal)}
            onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          />
          
          <SidebarLayout
            isMinimal={isMinimal}
            setIsMinimal={setIsMinimal}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          >
            <div className="flex flex-col min-h-[calc(100vh-3.5rem)] justify-between">
              <main className="flex-grow">
                {children}
              </main>
              <Footer />
            </div>
          </SidebarLayout>
        </div>

        <KeyboardNavigation />
      </body>
    </html>
  );
}