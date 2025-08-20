"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  Bot,
  Users,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Briefcase,
  Mail,
  BookOpen,
  X,
  Copy,
  Sparkles,
} from "lucide-react";

const client = generateClient<Schema>();

type QuestionId =
  | "workforce_snapshot"
  | "onboarding_risk"
  | "pending_signatures"
  | "applicants_pipeline"
  | "recent_communications"
  | "policy_index";

interface ResultItem { title: string; subtitle?: string; meta?: string }

export default function AIFloater() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<QuestionId | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [items, setItems] = useState<ResultItem[]>([]);

  const questions: { id: QuestionId; label: string; icon: any; hint: string }[] = [
    { id: "workforce_snapshot", label: "Workforce snapshot", icon: Users, hint: "Total users, active vs pending" },
    { id: "onboarding_risk", label: "Onboarding at risk", icon: AlertTriangle, hint: "Overdue and low completion" },
    { id: "pending_signatures", label: "Pending signatures", icon: FileSignature, hint: "Unsigned policy/contract docs" },
    { id: "applicants_pipeline", label: "Applicants pipeline", icon: Briefcase, hint: "Count by stage" },
    { id: "recent_communications", label: "Recent comms", icon: Mail, hint: "Last 10 notifications/emails" },
    { id: "policy_index", label: "Policy index", icon: BookOpen, hint: "KB policies available" },
  ];

  const load = async (id: QuestionId) => {
    setActive(id);
    setLoading(true);
    try {
      if (id === "workforce_snapshot") {
        const res = await client.models.User.list();
        const total = res.data.length;
        const active = res.data.filter(u => u.status === "active").length;
        const pending = res.data.filter(u => u.status === "pending").length;
        setSummary(`${total} users • ${active} active • ${pending} pending`);
        setItems(res.data.slice(0, 20).map(u => ({
          title: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unnamed User",
          subtitle: u.email,
          meta: `${u.role}${u.department ? " • "+u.department : ""}`,
        })));
      } else if (id === "onboarding_risk") {
        const tasks = await client.models.OnboardingTask.list();
        const now = new Date();
        const overdue = tasks.data.filter(t => {
          if (t.status === "completed") return false;
          if (!t.dueDate) return false;
          const dueDate = new Date(t.dueDate);
          return dueDate < now;
        });
        const total = tasks.data.length;
        const completed = tasks.data.filter(t => t.status === "completed").length;
        const rate = total ? Math.round((completed/total)*100) : 0;
        setSummary(`${overdue.length} overdue • ${rate}% completion`);
        setItems(overdue.slice(0, 20).map(t => ({
          title: t.title,
          subtitle: t.description || "",
          meta: t.dueDate ? `Due ${new Date(t.dueDate).toLocaleDateString()}` : "No due date",
        })));
      } else if (id === "pending_signatures") {
        const docs = await client.models.Document.list();
        const pending = docs.data.filter(d => d.signatureRequired && d.signatureStatus === "pending");
        setSummary(`${pending.length} documents requiring attention`);
        setItems(pending.slice(0, 20).map(d => ({
          title: d.name,
          subtitle: d.description || d.category || "",
          meta: d.uploadedBy ? `By ${d.uploadedBy}` : "System document",
        })));
      } else if (id === "applicants_pipeline") {
        const apps = await client.models.Applicant.list();
        const stages: Record<string, number> = {};
        for (const a of apps.data) stages[a.status || "NEW"] = (stages[a.status || "NEW"] || 0) + 1;
        const parts = Object.entries(stages).map(([k,v]) => `${k}: ${v}`);
        setSummary(parts.join(" • "));
        setItems(apps.data.slice(0, 20).map(a => ({
          title: `${a.firstName} ${a.lastName} • ${a.position}`,
          subtitle: a.email,
          meta: a.status || "NEW",
        })));
      } else if (id === "recent_communications") {
        const comms = await client.models.Communication.list();
        const sorted = comms.data.sort((a,b) => {
          const dateA = new Date(a.sentDate || a.createdAt).getTime();
          const dateB = new Date(b.sentDate || b.createdAt).getTime();
          return dateB - dateA;
        });
        setSummary(`${sorted.slice(0,10).length} recent messages`);
        setItems(sorted.slice(0, 10).map(c => ({
          title: c.subject,
          subtitle: c.content?.slice(0, 80) || "",
          meta: `${c.type} • ${c.status}`,
        })));
      } else if (id === "policy_index") {
        const docs = await client.models.Document.list();
        const policies = docs.data.filter(d => d.category === "policies" || d.category === "handbooks");
        setSummary(`${policies.length} policies in knowledge base`);
        setItems(policies.slice(0, 25).map(d => ({
          title: d.name,
          subtitle: d.description || d.category || "",
          meta: `Uploaded ${new Date(d.createdAt).toLocaleDateString()}`,
        })));
      }
    } finally {
      setLoading(false);
    }
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary + (items.length ? `\n\n- ` + items.map(i=>i.title).join("\n- ") : ""));
    } catch {}
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-40 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow"
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="p-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-semibold">AI</span>
        </div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
          >
            <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md glass-light bg-white/95 shadow-2xl p-5 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">AI Quick Answers</h3>
                </div>
                <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><X className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {questions.map((q) => {
                  const Icon = q.icon;
                  const activeCls = active === q.id ? "ring-2 ring-indigo-500" : "";
                  return (
                    <button
                      key={q.id}
                      onClick={() => load(q.id)}
                      className={`text-left bg-gray-50 hover:bg-gray-100 p-3 rounded-xl transition-all ${activeCls}`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{q.label}</div>
                          <div className="text-xs text-gray-600">{q.hint}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-gray-900">Answer</div>
                  <button onClick={copySummary} className="p-1.5 rounded hover:bg-gray-200 text-gray-600" title="Copy summary"><Copy className="w-4 h-4" /></button>
                </div>
                {loading ? (
                  <div className="text-sm text-gray-600 animate-pulse">Loading...</div>
                ) : active ? (
                  <>
                    <div className="text-sm text-gray-900 font-medium mb-3">{summary || "Select a question."}</div>
                    <ul className="space-y-2 max-h-[50vh] overflow-y-auto">
                      {items.map((it, i) => (
                        <li key={i} className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-sm transition-shadow">
                          <div className="text-sm font-medium text-gray-900">{it.title}</div>
                          {it.subtitle && <div className="text-xs text-gray-600">{it.subtitle}</div>}
                          {it.meta && <div className="text-[11px] text-gray-500 mt-1">{it.meta}</div>}
                        </li>
                      ))}
                      {items.length === 0 && (
                        <li className="text-sm text-gray-600">No results found.</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <div className="text-sm text-gray-600">Pick a question to see instant answers.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
