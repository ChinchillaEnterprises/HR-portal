"use client";

import { useEffect, useState } from "react";

export default function Typewriter({
  texts,
  speed = 90,
  deleteSpeed = 50,
  delayBetween = 1400,
  className,
}: {
  texts: string[];
  speed?: number;
  deleteSpeed?: number;
  delayBetween?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [display, setDisplay] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = texts[index % texts.length];
    const interval = setInterval(() => {
      setDisplay((cur) => {
        if (!deleting) {
          const next = full.slice(0, cur.length + 1);
          if (next === full) {
            clearInterval(interval);
            setTimeout(() => setDeleting(true), delayBetween);
          }
          return next;
        } else {
          const next = full.slice(0, cur.length - 1);
          if (next.length === 0) {
            clearInterval(interval);
            setDeleting(false);
            setIndex((i) => (i + 1) % texts.length);
          }
          return next;
        }
      });
    }, deleting ? deleteSpeed : speed);
    return () => clearInterval(interval);
  }, [index, deleting, texts, speed, deleteSpeed, delayBetween]);

  return <span className={className}>{display}<span className="opacity-60">|</span></span>;
}

