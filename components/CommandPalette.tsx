"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, FileText, Users, UserCheck, Briefcase, BarChart3, 
  Home, Command, Sparkles, Settings, LogOut, Plus
} from "lucide-react";

interface Action { 
  id: string; 
  label: string; 
  hint?: string; 
  icon?: any;
  category?: string;
  run: () => void;
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const actions: Action[] = [
    // Navigation
    { id: "home", label: "Go to Dashboard", hint: "Overview", icon: Home, category: "Navigation", run: () => router.push("/") },
    { id: "onboard", label: "Onboarding", hint: "Manage onboarding tasks", icon: UserCheck, category: "Navigation", run: () => router.push("/onboarding") },
    { id: "docs", label: "Documents", hint: "Policies & contracts", icon: FileText, category: "Navigation", run: () => router.push("/documents") },
    { id: "applicants", label: "Applicants", hint: "Pipeline & interviews", icon: Briefcase, category: "Navigation", run: () => router.push("/applicants") },
    { id: "reports", label: "Analytics", hint: "Dashboards & KPIs", icon: BarChart3, category: "Navigation", run: () => router.push("/reports") },
    { id: "team", label: "Team Directory", hint: "Find teammates", icon: Users, category: "Navigation", run: () => router.push("/team") },
    { id: "status", label: "System Status", hint: "Health & integrations", icon: Settings, category: "Navigation", run: () => router.push("/status") },
    
    // Actions
    { id: "new-employee", label: "Add New Employee", hint: "Create employee profile", icon: Plus, category: "Actions", run: () => router.push("/team?action=new") },
    { id: "new-task", label: "Create Onboarding Task", hint: "Assign new task", icon: Plus, category: "Actions", run: () => router.push("/onboarding?action=new") },
    { id: "upload-doc", label: "Upload Document", hint: "Add new document", icon: Plus, category: "Actions", run: () => router.push("/documents?action=upload") },
    { id: "new-applicant", label: "Add Applicant", hint: "Add to pipeline", icon: Plus, category: "Actions", run: () => router.push("/applicants?action=new") },
    
    // AI Features
    { id: "ai-assist", label: "AI Assistant", hint: "Get help with tasks", icon: Sparkles, category: "AI", run: () => setOpen(false) },
    { id: "ai-insights", label: "Generate Insights", hint: "AI-powered analytics", icon: Sparkles, category: "AI", run: () => router.push("/reports?ai=true") },
  ];

  const filtered = actions.filter(a => 
    a.label.toLowerCase().includes(query.toLowerCase()) ||
    a.hint?.toLowerCase().includes(query.toLowerCase()) ||
    a.category?.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") || (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setOpen((o) => !o);
        setQuery("");
        setSelectedIndex(0);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setSelectedIndex(0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          setOpen(false);
          setQuery("");
          setSelectedIndex(0);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [filtered, selectedIndex, open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Group filtered actions by category
  const groupedActions = filtered.reduce((acc, action) => {
    const category = action.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(action);
    return acc;
  }, {} as Record<string, Action[]>);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
          onClick={() => {
            setOpen(false);
            setQuery("");
            setSelectedIndex(0);
          }} 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          className="absolute left-1/2 top-24 -translate-x-1/2 w-full max-w-2xl glass-light rounded-2xl p-0 shadow-2xl"
        >
          <div className="flex items-center gap-3 p-4 border-b border-gray-200/50">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              placeholder="Type a command or search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-lg placeholder-gray-500 focus:outline-none"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">↑↓</kbd>
              <span>Navigate</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd>
              <span>Select</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded border border-gray-300">Esc</kbd>
              <span>Close</span>
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-2">
            {Object.entries(groupedActions).map(([category, categoryActions]) => (
              <div key={category} className="mb-4">
                <div className="text-xs font-semibold text-gray-500 px-3 py-1">{category}</div>
                {categoryActions.map((action, idx) => {
                  const globalIndex = filtered.indexOf(action);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={action.id}
                      className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                        isSelected ? "bg-gray-100" : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        action.run();
                        setOpen(false);
                        setQuery("");
                        setSelectedIndex(0);
                      }}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      {action.icon && <action.icon className="w-5 h-5 text-gray-600" />}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{action.label}</div>
                        {action.hint && <div className="text-xs text-gray-500">{action.hint}</div>}
                      </div>
                      {isSelected && <div className="text-xs text-gray-400">Press Enter</div>}
                    </button>
                  );
                })}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Command className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No commands found</p>
                <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

