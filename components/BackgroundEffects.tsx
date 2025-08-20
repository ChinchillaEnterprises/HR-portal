"use client";

import { useEffect, useRef } from "react";

export default function BackgroundEffects() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const createParticle = () => {
      const el = document.createElement("div");
      el.className = "pointer-events-none rounded-full opacity-40";
      const size = Math.random() * 4 + 2;
      const duration = Math.random() * 20 + 10;
      const delay = Math.random() * 5;
      el.style.position = "absolute";
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.left = `${Math.random() * 100}%`;
      el.style.top = `${Math.random() * 100}%`;
      el.style.backgroundColor = Math.random() > 0.5 ? "#3B82F6" : "#8B5CF6";
      el.style.boxShadow = `0 0 ${size * 2}px currentColor`;
      el.style.animation = `float ${duration}s ${delay}s ease-in-out infinite`;
      container.appendChild(el);
      setTimeout(() => el.remove(), (duration + delay) * 1000);
    };

    for (let i = 0; i < 40; i++) setTimeout(createParticle, i * 120);
    const interval = setInterval(createParticle, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient mesh overlays */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 professional-gradient blur-3xl" />
      </div>

      {/* Radial dot grid */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #3b82f6 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>
    </div>
  );
}

