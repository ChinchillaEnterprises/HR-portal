"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, AlertTriangle, FileSignature, Briefcase, Calendar, BookOpen } from "lucide-react";

const chips = [
  { label: "Workforce Snapshot", icon: Users, href: "/team" },
  { label: "Overdue Tasks", icon: AlertTriangle, href: "/onboarding" },
  { label: "Pending Signatures", icon: FileSignature, href: "/documents" },
  { label: "Applicants This Week", icon: Briefcase, href: "/applicants" },
  { label: "Schedule Orientation", icon: Calendar, href: "/onboarding" },
  { label: "Policy Index", icon: BookOpen, href: "/documents" },
];

export default function AIChips() {
  const router = useRouter();
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((c, i) => {
        const Icon = c.icon as any;
        return (
          <motion.button
            key={c.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => router.push(c.href)}
            className="px-3 py-1.5 rounded-full bg-white/80 border border-gray-200 hover:bg-gray-100 text-sm text-gray-800 inline-flex items-center gap-2"
          >
            <Icon className="w-4 h-4" />
            {c.label}
          </motion.button>
        );
      })}
    </div>
  );
}

