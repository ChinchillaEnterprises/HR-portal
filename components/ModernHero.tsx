"use client";

import { Space_Grotesk } from "next/font/google";
import Typewriter from "./Typewriter";

const space = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });

export default function ModernHero() {
  return (
    <section className="mb-8">
      <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 glass-light">
        <div className="absolute inset-0 professional-gradient opacity-20 blur-2xl" />
        <h1 className={`${space.className} text-4xl md:text-6xl font-bold tracking-tight relative z-10`}>
          HR, Reimagined for <span className="gradient-text">2050</span>
        </h1>
        <p className="mt-4 text-gray-600 text-lg relative z-10">
          <Typewriter
            texts={[
              "Onboard in minutes with AI.",
              "Glass‑fast analytics and insights.",
              "Documents, tasks, people — in sync.",
            ]}
            className="gradient-text"
            speed={80}
            deleteSpeed={40}
            delayBetween={1000}
          />
        </p>
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full professional-gradient blur-3xl opacity-40" />
      </div>
    </section>
  );
}

