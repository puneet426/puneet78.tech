"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

// A quick run of "hello" in different languages before landing on your name.
// Feels human, not like a boot sequence.
const GREETINGS = [
  "Hello",
  "Namaste",
  "Bonjour",
  "Hola",
  "Ciao",
  "こんにちは",
];

export default function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [showName, setShowName] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const STEP = 220; // ms per greeting
    const TOTAL_GREETINGS = GREETINGS.length;

    // Cycle through greetings
    for (let i = 1; i < TOTAL_GREETINGS; i++) {
      timeouts.current.push(
        setTimeout(() => setIndex(i), STEP * i)
      );
    }

    // After the last greeting, reveal the name
    const nameDelay = STEP * TOTAL_GREETINGS + 150;
    timeouts.current.push(
      setTimeout(() => setShowName(true), nameDelay)
    );

    // Hold on the name, then exit
    const exitDelay = nameDelay + 900;
    timeouts.current.push(
      setTimeout(() => {
        setIsVisible(false);
        timeouts.current.push(setTimeout(() => onComplete(), 500));
      }, exitDelay)
    );

    return () => timeouts.current.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#050505] text-neutral-200 select-none"
        >
          {/* Subtle grid backdrop, kept minimal — no fake hardware readouts */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:48px_48px]" />

          <div className="relative flex flex-col items-center gap-6">
            <AnimatePresence mode="wait">
              {!showName ? (
                <motion.span
                  key={GREETINGS[index]}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="text-3xl md:text-5xl font-medium tracking-tight text-neutral-100"
                >
                  {GREETINGS[index]}
                </motion.span>
              ) : (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="flex flex-col items-center gap-3"
                >
                  <span className="text-3xl md:text-5xl font-semibold tracking-tight text-white">
                    Puneet Tiwari
                  </span>
                  <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-cyan-400">
                    Full Stack Developer
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimal progress dots instead of a % counter / fake diagnostics */}
            <div className="flex items-center gap-1.5 mt-2">
              {GREETINGS.map((_, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-neutral-700"
                  animate={{
                    backgroundColor:
                      i <= index && !showName ? "#22d3ee" : showName ? "#22d3ee" : "#404040",
                    scale: i === index && !showName ? 1.3 : 1,
                  }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}