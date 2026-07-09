"use client";

import React, { useEffect, useRef } from "react";

const TECH_ICONS = [
  "aws-dark.svg", "c++.svg", "canva.svg", "cloudflare.svg", "docker.svg",
  "drizzle-dark.svg", "expressjs-dark.svg", "figma.svg", "framer-motion.svg",
  "git.svg", "github-dark.svg", "go.svg", "grpc-dark.svg", "gsap.svg",
  "js.svg", "jwt.svg", "mongodb.svg", "mongoose.svg", "nextjs-dark.svg",
  "nodejs.svg", "openai-dark.svg", "postgresql.svg", "postman.svg",
  "prisma-dark.svg", "react.svg", "reactquery.svg"
];

interface PhysicsCard {
  name: string;
  img: HTMLImageElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  angularVelocity: number;
  opacity: number;
}

export default function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let cards: PhysicsCard[] = [];

    const resizeCanvas = () => {
      const parent = document.getElementById("hero-section");
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      } else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const GRAVITY = 0.08;
    const BOUNCE = 0.4; 
    const FRICTION = 0.98;

    cards = TECH_ICONS.map((icon, index) => {
      const img = new Image();
      img.src = `/technology/${icon}`;

      const width = window.innerWidth < 768 ? 100 : 180; 
      const height = width;

      const x = Math.random() * (canvas.width - width) + width / 2;
      const y = -200 - (index * 220);

      return {
        name: icon, // Keep file name context to selectively invert specific items
        img,
        x,
        y,
        vx: (Math.random() - 0.5) * 4, 
        vy: 0.5 + Math.random() * 2,
        width,
        height,
        rotation: (Math.random() - 0.5) * 0.5,
        angularVelocity: (Math.random() - 0.5) * 0.02,
        opacity: 0.60 
      };
    });

    const updatePhysics = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Check current theme node dynamically on each frame loop
      const isDark = document.documentElement.classList.contains("dark");

      for (let i = 0; i < cards.length; i++) {
        const c = cards[i];

        c.vy += GRAVITY;
        c.x += c.vx;
        c.y += c.vy;
        c.rotation += c.angularVelocity;

        c.vx *= FRICTION;

        const floorLevel = canvas.height - (c.height / 2) - 40; 
        if (c.y > floorLevel) {
          c.y = floorLevel;
          c.vy = -c.vy * BOUNCE;
          c.vx *= 0.8; 
          c.angularVelocity *= 0.5;
        }

        if (c.x < c.width / 2) {
          c.x = c.width / 2;
          c.vx = -c.vx * BOUNCE;
        }

        if (c.x > canvas.width - c.width / 2) {
          c.x = canvas.width - c.width / 2;
          c.vx = -c.vx * BOUNCE;
        }

        for (let j = i + 1; j < cards.length; j++) {
          const o = cards[j];
          const dx = o.x - c.x;
          const dy = o.y - c.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = c.width * 0.85; 

          if (distance < minDistance) {
            const overlap = minDistance - distance;
            const nx = dx / distance;
            const ny = dy / distance;

            c.x -= nx * overlap * 0.5;
            c.y -= ny * overlap * 0.5;
            o.x += nx * overlap * 0.5;
            o.y += ny * overlap * 0.5;

            const kx = c.vx - o.vx;
            const ky = c.vy - o.vy;
            const p = 2 * (nx * kx + ny * ky) / 2;

            c.vx -= p * nx * BOUNCE;
            c.vy -= p * ny * BOUNCE;
            o.vx += p * nx * BOUNCE;
            o.vy += p * ny * BOUNCE;
          }
        }

        // RENDER STYLED 2D ROUNDED CARDS WITH THEME DETECTION
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        
        // Match base canvas container opacity settings
        ctx.globalAlpha = c.opacity;

        // Apply light/dark color tokens based on active document class states
        ctx.fillStyle = isDark ? "#0d0d0d" : "#ffffff";
        ctx.strokeStyle = isDark ? "#222222" : "#e5e5e5";
        ctx.lineWidth = 1.5;
        
        // Render rounded rect box
        const r = 16; 
        ctx.beginPath();
        ctx.roundRect(-c.width / 2, -c.height / 2, c.width, c.height, r);
        ctx.fill();
        ctx.stroke();

        // 🎨 LOGO INVERSION FIX: Apply filter context only to the logo layer if in light mode
        const imgSize = c.width * 0.55;
        ctx.globalAlpha = 1.0; 

        const isWhiteDarkIcon = c.name.endsWith("-dark.svg");
        if (!isDark && isWhiteDarkIcon) {
          ctx.filter = "invert(1)"; // Turns white SVG details black on light background cards
        } else {
          ctx.filter = "none";
        }

        ctx.drawImage(c.img, -imgSize / 2, -imgSize / 2, imgSize, imgSize);
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(updatePhysics);
    };

    updatePhysics();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full block bg-transparent"
    />
  );
}