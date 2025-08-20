"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import ModernBento from "@/components/ModernBento";
import ModernHero from "@/components/ModernHero";
import AIChips from "@/components/AIChips";

const client = generateClient<Schema>();

export default function ModernHome() {
  const [counts, setCounts] = useState({ users: 0, tasks: 0, applicants: 0, documents: 0, comms: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [u, t, a, d, c] = await Promise.all([
          client.models.User.list(),
          client.models.OnboardingTask.list(),
          client.models.Applicant.list(),
          client.models.Document.list(),
          client.models.Communication.list(),
        ]);
        setCounts({ users: u.data.length, tasks: t.data.length, applicants: a.data.length, documents: d.data.length, comms: c.data.length });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tiles = [
    { title: "Team Members", value: loading ? "…" : counts.users, hint: "Active directory", href: "/team", gradient: "from-blue-500 to-indigo-600" },
    { title: "Onboarding Tasks", value: loading ? "…" : counts.tasks, hint: "Assigned across users", href: "/onboarding", gradient: "from-emerald-500 to-teal-600" },
    { title: "Applicants", value: loading ? "…" : counts.applicants, hint: "In your pipeline", href: "/applicants", gradient: "from-purple-500 to-pink-600" },
    { title: "Documents", value: loading ? "…" : counts.documents, hint: "Policies & contracts", href: "/documents", gradient: "from-amber-500 to-orange-600" },
    { title: "Comms Sent", value: loading ? "…" : counts.comms, hint: "Emails & notifications", href: "/communications", gradient: "from-cyan-500 to-blue-600" },
    { title: "Reports", value: "Live", hint: "Analytics & insights", href: "/reports", gradient: "from-rose-500 to-fuchsia-600" },
  ];

  return (
    <>
      <ModernHero />
      <AIChips />
      <ModernBento tiles={tiles} />
    </>
  );
}
