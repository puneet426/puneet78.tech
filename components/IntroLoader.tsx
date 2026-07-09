"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const LOADING_PHASES = [
  "INITIALIZING SYSTEM CORE HARDWARE...",
  "VERIFYING SECURE BOOT STACK TARGETS...",
  "LOADING EMBEDDED MEMORY IMAGES...",
  "RUNNING CLOCK CALIBRATION MATRIX...",
  "SYSTEM PARAMETERS STABILIZED. READY."
];

export default function IntroLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  // Real-time fluctuating telemetry values
  const [sysClk, setSysClk] = useState(4.71);
  const [coreTemp, setCoreTemp] = useState(34.1);
  const [vddCore, setVddCore] = useState(1.185);
  const [snrRatio, setSnrRatio] = useState(42);

  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    // 1. Telemetry jitter simulation loops
    const telemetryInterval = setInterval(() => {
      setSysClk((prev) => +(prev + (Math.random() * 0.1 - 0.05)).toFixed(2));
      setCoreTemp((prev) => +(prev + (Math.random() * 0.6 - 0.3)).toFixed(1));
      setVddCore((prev) => +(prev + (Math.random() * 0.006 - 0.003)).toFixed(3));
      setSnrRatio((prev) => Math.floor(prev + (Math.random() * 2 - 1)));
    }, 150);

    // 2. High-precision progressive boot sequencer loop
    const duration = 1800; // 4 seconds total screen duration
    
    const updateProgress = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const currentProgress = Math.min((elapsed / duration) * 100, 100);
      
      setProgress(Math.floor(currentProgress));

      // Map progress percentages dynamically onto text log arrays
      if (currentProgress < 25) setPhaseIndex(0);
      else if (currentProgress < 50) setPhaseIndex(1);
      else if (currentProgress < 75) setPhaseIndex(2);
      else if (currentProgress < 95) setPhaseIndex(3);
      else setPhaseIndex(4);

      if (currentProgress < 100) {
        animationRef.current = requestAnimationFrame(updateProgress);
      } else {
        // Safe dispatch exit sequence out to the master page context layout
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onComplete(), 400);
        }, 300);
      }
    };

    animationRef.current = requestAnimationFrame(updateProgress);

    return () => {
      clearInterval(telemetryInterval);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [onComplete]);

  // 3. Real-time oscillating waveform logic tracking coordinates dynamically based on current state parameters
  const generateOscilloscopePath = () => {
    const points = 40;
    const width = 300;
    const height = 100;
    const midY = height / 2;
    let path = `M 0 ${midY}`;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * width;
      // Synthesize primary sine wave layered with dynamic high-frequency telemetry noise
      const timeFactor = Date.now() * 0.01;
      const noise = Math.sin(i * 0.8 + timeFactor) * 4;
      const baseWave = Math.sin(i * 0.3 - timeFactor) * (height * 0.28);
      const y = midY + baseWave + noise;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  const [wavePath, setWavePath] = useState("M 0 50");

  useEffect(() => {
    let waveFrameId: number;
    const updateWave = () => {
      setWavePath(generateOscilloscopePath());
      waveFrameId = requestAnimationFrame(updateWave);
    };
    waveFrameId = requestAnimationFrame(updateWave);
    return () => cancelAnimationFrame(waveFrameId);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.4 } }}
          className="fixed inset-0 z-[9999] flex flex-col justify-between p-6 md:p-10 font-mono text-left select-none bg-[#050505] text-neutral-400 dark:bg-[#050505] dark:text-neutral-500"
        >
          {/* TOP HEADER RUNTIME META STRING */}
          <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-neutral-600 dark:text-neutral-600 border-b border-neutral-900/50 pb-3">
            <div>SGW_OS // SYS_CALIBRATION // V.2.1.0</div>
            <div className="hidden md:block">REF_VOLTAGE: 1.200V LOCKED</div>
            <div className="text-emerald-500 font-bold tracking-normal animate-pulse">SECURE BOOT</div>
          </div>

          {/* MAIN GRID CORE INSTRUMENTATION HUB */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-center my-auto w-full max-w-6xl mx-auto">
            
            {/* PANEL LEFT: TELEMETRY NUMERICAL SYSTEM READOUT */}
            <div className="border border-neutral-900/60 bg-neutral-950/40 rounded-xl p-5 space-y-4 shadow-2xl h-56 flex flex-col justify-between">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-900/60 pb-2">
                [ TELEMETRY READOUT ]
              </div>
              <div className="space-y-2 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-neutral-600">SYS_CLK:</span>
                  <span className="text-cyan-400">{sysClk.toFixed(2)} GHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">CORE_TEMP:</span>
                  <span className="text-emerald-400">{coreTemp.toFixed(1)} °C</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">VDD_CORE:</span>
                  <span className="text-amber-500">{vddCore.toFixed(3)} V</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">SNR_RATIO:</span>
                  <span className="text-cyan-500">{snrRatio} dB</span>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-700 uppercase pt-2 border-t border-neutral-900/40">
                <span>SENSORS: ACTIVE</span>
                <span>PLL: EN_LOCKED</span>
              </div>
            </div>

            {/* PANEL CENTER: COMPASS SCIFI RADAR COMPASS SHIELD (CONTAINS "PT") */}
            <div className="relative flex items-center justify-center h-56">
              {/* Outer ticking radar wheel */}
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                className="absolute w-44 h-44 rounded-full border border-dashed border-neutral-800/40 flex items-center justify-center"
              >
                <div className="absolute w-full h-px bg-neutral-900/30 rotate-45" />
                <div className="absolute w-full h-px bg-neutral-900/30 -rotate-45" />
              </motion.div>

              {/* Secondary targeted ticks border ring */}
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute w-32 h-32 rounded-full border-2 border-spacing-2 border-cyan-500/20 border-t-transparent border-b-transparent"
              />

              {/* Labeled Focus Box Framing Your Brand Monogram Initials */}
              <div className="relative w-14 h-14 border border-cyan-500/40 flex items-center justify-center bg-neutral-950 shadow-xl rounded-sm">
                {/* Blinking bounding box crosshair alignment pointers */}
                <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-cyan-400" />
                <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-cyan-400" />
                <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-cyan-400" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-cyan-400" />
                
                {/* Core Brand Initials Target Node */}
                <span className="text-sm font-black tracking-tight text-white animate-pulse">
                  PT
                </span>
                
                {/* Microscopic coordinate laser pointer anchor bullet */}
                <div className="absolute -bottom-6 text-[8px] font-bold text-neutral-700 tracking-widest uppercase">
                  SYS_LCK
                </div>
              </div>
            </div>

            {/* PANEL RIGHT: REALTIME ACTIVE SIGNAL OSCILLOSCOPE MONITOR */}
            <div className="border border-neutral-900/60 bg-neutral-950/40 rounded-xl p-5 space-y-3 shadow-2xl h-56 flex flex-col justify-between overflow-hidden">
              <div className="flex justify-between items-center border-b border-neutral-900/60 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">[ SIGNAL OSCILLOSCOPE ]</span>
                <span className="text-[9px] bg-cyan-950 text-cyan-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">LIVE</span>
              </div>
              
              {/* Dynamic Rendered Canvas Mapping Wave Paths */}
              <div className="w-full flex-1 flex items-center justify-center relative bg-neutral-950/80 rounded border border-neutral-900/40 px-2">
                {/* Grid guidelines overlay lines inside scope background */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 opacity-[0.03] pointer-events-none">
                  {[...Array(16)].map((_, i) => (
                    <div key={i} className="border-[0.5px] border-neutral-400" />
                  ))}
                </div>

                <svg viewBox="0 0 300 100" className="w-full h-24 overflow-visible">
                  <path
                    d={wavePath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="opacity-80 drop-shadow-[0_0_4px_rgba(6,182,212,0.5)]"
                  />
                </svg>
              </div>

              <div className="flex justify-between text-[9px] text-neutral-700 font-bold uppercase pt-1">
                <span>SCALE: 20mV / div</span>
                <span>TIME: 50.0ns / div</span>
              </div>
            </div>

          </div>

          {/* LOWER SECTION LOG TRACKERS AND BAR PROGRESS SEQUENCER */}
          <div className="w-full max-w-3xl mx-auto space-y-4">
            <div className="flex justify-between items-end">
              {/* Phase status strings with micro flashing code cursor block node */}
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping shrink-0" />
                <span>{LOADING_PHASES[phaseIndex]}</span>
              </div>
              <div className="text-sm font-black text-cyan-400 font-mono tracking-tighter">
                {progress}%
              </div>
            </div>

            {/* Main structural horizontal meter alignment track */}
            <div className="w-full h-1 bg-neutral-950 rounded-full overflow-hidden relative border border-neutral-900/30">
              <motion.div
                layout
                style={{ width: `${progress}%` }}
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                transition={{ ease: "easeOut", duration: 0.1 }}
              />
            </div>

            {/* Bottom hardware register diagnostics tracker row string info */}
            <div className="flex justify-between text-[9px] text-neutral-600 dark:text-neutral-700 tracking-wider font-bold pt-1 uppercase">
              <span>MEM_CHECK: OK (4096MB)</span>
              <span className="hidden sm:inline">CAL_LOCK: PLL_CLOSED</span>
              <span>DEV_CONN: READY</span>
            </div>
          </div>

        </motion.div>
      )}
    </AnimatePresence>
  );
}