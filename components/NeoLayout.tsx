"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  LayoutGrid,
  Users,
  FileText,
  UserCheck,
  Briefcase,
  BarChart3,
  Menu,
  X,
  Sparkles,
  Search,
  Bell,
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import BackgroundEffects from "./BackgroundEffects";
import AIFloater from "./AIFloater";
import CommandPalette from "./CommandPalette";
import { useRouter } from "next/navigation";

const client = generateClient<Schema>();

export default function NeoLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const router = useRouter();

  const nav = [
    { href: "/", label: "Overview", icon: LayoutGrid },
    { href: "/onboarding", label: "Onboarding", icon: UserCheck },
    { href: "/documents", label: "Documents", icon: FileText },
    { href: "/applicants", label: "Applicants", icon: Briefcase },
    { href: "/reports", label: "Analytics", icon: BarChart3 },
    { href: "/team", label: "Directory", icon: Users },
  ];

  // Global search functionality
  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => performSearch(), 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setSearching(true);
    try {
      const [users, docs, applicants, tasks] = await Promise.all([
        client.models.User.list(),
        client.models.Document.list(),
        client.models.Applicant.list(),
        client.models.OnboardingTask.list(),
      ]);

      const results: any[] = [];
      
      // Search users
      users.data.forEach(user => {
        const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
        if (fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: "user", data: user, title: fullName || "Unnamed User", subtitle: user.email });
        }
      });

      // Search documents
      docs.data.forEach(doc => {
        if (doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: "document", data: doc, title: doc.name, subtitle: doc.description });
        }
      });

      // Search applicants
      applicants.data.forEach(app => {
        const fullName = `${app.firstName || ""} ${app.lastName || ""}`.trim();
        if (fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.position?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: "applicant", data: app, title: fullName || "Unnamed Applicant", subtitle: app.position });
        }
      });

      // Search tasks
      tasks.data.forEach(task => {
        if (task.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: "task", data: task, title: task.title, subtitle: task.description });
        }
      });

      setSearchResults(results.slice(0, 10));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case "user": return Users;
      case "document": return FileText;
      case "applicant": return Briefcase;
      case "task": return UserCheck;
      default: return FileText;
    }
  };

  const handleResultClick = (result: any) => {
    setSearchOpen(false);
    setSearchQuery("");
    
    switch (result.type) {
      case "user":
        router.push("/team");
        break;
      case "document":
        router.push("/documents");
        break;
      case "applicant":
        router.push("/applicants");
        break;
      case "task":
        router.push("/onboarding");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 relative">
      <BackgroundEffects />

      {/* Floating header */}
      <div className="fixed top-4 left-0 right-0 z-40">
        <div className="mx-auto max-w-7xl px-4">
          <div className="glass-light rounded-2xl px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setOpen(!open)} className="p-2 rounded-lg hover:bg-gray-100">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold hidden sm:inline">Chinchilla HR • Neo</span>
              </div>
              
              {/* Search */}
              <div className="flex-1 max-w-md relative">
                <button
                  onClick={() => setSearchOpen(true)}
                  className="w-full flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors text-left"
                >
                  <Search className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Search everything...</span>
                  <kbd className="ml-auto px-2 py-0.5 text-xs bg-gray-100 rounded border border-gray-300">⌘K</kbd>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Dark mode toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-gray-600" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                    JD
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Icon dock */}
      <motion.aside
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed left-4 top-24 bottom-4 z-30 flex flex-col gap-3"
      >
        <div className="glass-light rounded-2xl p-2 flex flex-col gap-1">
          {nav.map((n) => {
            const Icon = n.icon as any;
            return (
              <Link key={n.href} href={n.href} className="group">
                <div className="p-3 rounded-xl hover:bg-gray-100 transition-colors flex items-center gap-3">
                  <Icon className="w-5 h-5 text-gray-700 group-hover:text-gray-900" />
                  {open && <span className="text-sm text-gray-800">{n.label}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {children}
        </div>
      </main>

      {/* AI quick answers */}
      <AIFloater />
      <CommandPalette />

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <div className="fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery("");
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="absolute left-1/2 top-24 -translate-x-1/2 w-full max-w-2xl glass-light rounded-2xl p-0 shadow-2xl"
            >
              <div className="flex items-center gap-3 p-4 border-b border-gray-200/50">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  autoFocus
                  placeholder="Search users, documents, tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-lg placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery("");
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto p-2">
                {searching ? (
                  <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500 mt-2">Searching...</p>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-1">
                    {searchResults.map((result, index) => {
                      const Icon = getResultIcon(result.type);
                      return (
                        <button
                          key={index}
                          onClick={() => handleResultClick(result)}
                          className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-gray-100 flex items-center gap-3"
                        >
                          <Icon className="w-5 h-5 text-gray-600" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500">{result.subtitle}</div>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : searchQuery.length > 2 ? (
                  <div className="text-center py-12">
                    <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No results found</p>
                    <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-sm text-gray-500">Type to search...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Dropdown */}
      <AnimatePresence>
        {profileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 z-50 w-64 glass-light rounded-2xl p-2 shadow-lg"
          >
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                  JD
                </div>
                <div>
                  <div className="font-semibold text-gray-900">John Doe</div>
                  <div className="text-sm text-gray-600">john@chinchilla.com</div>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-3">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Profile</span>
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-3">
                <Settings className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Settings</span>
              </button>
              <hr className="my-2 border-gray-200" />
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 flex items-center gap-3">
                <LogOut className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700">Sign out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
