"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

interface TileMetric { label: string; value: string | number }
interface Tile {
  title: string;
  value: string | number;
  hint?: string;
  metrics?: TileMetric[];
  gradient?: string; // tailwind gradient classes
  href?: string;
}

export default function ModernBento({ tiles }: { tiles: Tile[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {tiles.map((t, i) => (
        <motion.a
          key={i}
          href={t.href || "#"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="group relative rounded-2xl p-1"
        >
          {/* Animated border */}
          <div className={`absolute inset-0 rounded-2xl ${t.gradient || "professional-gradient"} opacity-70 blur-sm transition group-hover:opacity-100`} />
          <TiltCard>
            <div className="relative rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-5 card-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm text-gray-500 mb-1">{t.title}</div>
                  <div className="text-3xl font-semibold tracking-tight">{t.value}</div>
                </div>
                <div className="p-2 rounded-full bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              {t.metrics && t.metrics.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {t.metrics.slice(0,3).map((m, idx) => (
                    <div key={idx} className="text-xs text-gray-600">
                      <div className="text-gray-400">{m.label}</div>
                      <div className="font-medium">{m.value}</div>
                    </div>
                  ))}
                </div>
              )}
              {t.hint && <div className="text-xs text-gray-500 mt-3">{t.hint}</div>}
            </div>
          </TiltCard>
        </motion.a>
      ))}
    </div>
  );
}

function TiltCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative rounded-2xl"
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const midX = rect.width / 2;
        const midY = rect.height / 2;
        const rotateX = ((y - midY) / midY) * -6;
        const rotateY = ((x - midX) / midX) * 6;
        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        el.style.transition = "transform 60ms linear";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
        el.style.transition = "transform 300ms ease";
      }}
    >
      {children}
    </div>
  );
}

