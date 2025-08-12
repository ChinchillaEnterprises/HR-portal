"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "aws-amplify/auth";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Users,
  Calendar,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Briefcase,
  Clock,
  Shield,
  Mail,
  BarChart3,
  UserCheck,
  BookOpen,
  Sparkles,
  Layers,
  Rocket,
  ChevronRight,
} from "lucide-react";
import { getAuthenticatedUser, type UserRole } from "@/lib/auth";
import GlobalSearch from "./GlobalSearch";
import NotificationCenter from "./NotificationCenter";

interface LayoutProps {
  children: React.ReactNode;
  user?: any;
}

export default function Layout({ children, user }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [userInfo, setUserInfo] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
      setUserInfo(authUser);
    }
  };

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home, roles: ["admin", "mentor", "team_lead", "intern", "staff"], gradient: "from-blue-500 to-indigo-600" },
    { name: "AI Assistant", href: "/ai-assistant", icon: Sparkles, roles: ["admin", "mentor", "team_lead", "intern", "staff"], gradient: "from-indigo-500 to-purple-600" },
    { name: "Onboarding", href: "/onboarding", icon: UserCheck, roles: ["admin", "mentor", "team_lead", "intern", "staff"], gradient: "from-emerald-500 to-teal-600" },
    { name: "Templates", href: "/templates", icon: BookOpen, roles: ["admin", "mentor", "team_lead"], gradient: "from-purple-500 to-pink-600" },
    { name: "Document Vault", href: "/documents", icon: FileText, roles: ["admin", "mentor", "team_lead", "intern", "staff"], gradient: "from-amber-500 to-orange-600" },
    { name: "Communications", href: "/communications", icon: Mail, roles: ["admin", "mentor", "team_lead"], gradient: "from-red-500 to-rose-600" },
    { name: "Applicants", href: "/applicants", icon: Briefcase, roles: ["admin", "mentor", "team_lead"], gradient: "from-cyan-500 to-blue-600" },
    { name: "Team Directory", href: "/team", icon: Users, roles: ["admin", "mentor", "team_lead", "staff"], gradient: "from-violet-500 to-purple-600" },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "mentor", "team_lead"], gradient: "from-green-500 to-emerald-600" },
    { name: "Admin Panel", href: "/admin", icon: Shield, roles: ["admin"], gradient: "from-gray-600 to-gray-900" },
  ].filter(item => item.roles.includes(userRole));

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50">
      {/* Animated background mesh */}
      <div className="fixed inset-0 bg-gradient-mesh opacity-5 pointer-events-none" />
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 glass-card z-40 h-16 border-b border-white/50">
        <div className="flex items-center justify-between h-full px-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/50 transition-all hover-lift"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
          <h1 className="text-lg font-semibold text-gray-900 truncate">
            {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
          </h1>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block">
              <GlobalSearch />
            </div>
            <NotificationCenter />
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: sidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : -280,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-y-0 left-0 z-40 w-72 glass-card shadow-2xl lg:translate-x-0 overflow-hidden"
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />
        
        <div className="flex flex-col h-full relative">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-white/20">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur-lg opacity-75 animate-pulse-slow" />
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-2">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white">Chinchilla Flow</h1>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item, index) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={`group flex items-center px-4 py-3 rounded-2xl transition-all duration-300 hover-lift ${
                      isActive
                        ? "bg-white/90 text-gray-900 shadow-soft"
                        : "text-gray-700 hover:bg-white/50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className={`p-2.5 rounded-xl transition-all duration-300 ${
                      isActive 
                        ? `bg-gradient-to-br ${item.gradient} shadow-glow` 
                        : "bg-gray-200/50 group-hover:bg-gray-200/70"
                    }`}>
                      <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-gray-600 group-hover:text-gray-800"}`} />
                    </div>
                    <span className="ml-3 font-medium flex-1">{item.name}</span>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <ChevronRight className="w-5 h-5 opacity-50" />
                      </motion.div>
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-white/20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-4 mb-4"
            >
              <div className="flex items-center mb-3">
                <div className="relative animate-float">
                  <div className="absolute inset-0 bg-gradient-primary rounded-full blur-lg opacity-60" />
                  <div className="relative w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                    <User className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userInfo?.firstName || user?.attributes?.given_name} {userInfo?.lastName || user?.attributes?.family_name}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{userInfo?.email || user?.attributes?.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium gradient-secondary text-white shadow-sm">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {userRole.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
            <div className="space-y-2">
              <Link
                href="/profile"
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-white/60 transition-all hover-lift font-medium"
                onClick={() => setSidebarOpen(false)}
              >
                <User className="w-4 h-4 mr-3 text-gray-600" />
                Profile Settings
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 rounded-xl hover:bg-red-50 hover:text-red-600 transition-all group hover-lift font-medium"
              >
                <LogOut className="w-4 h-4 mr-3 group-hover:text-red-500 transition-colors" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main content */}
      <div className="lg:pl-72 min-h-screen pt-16 lg:pt-0">
        {/* Desktop header */}
        <header className="hidden lg:block glass-card sticky top-0 z-30 border-b border-white/50">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3"
              >
                <h2 className="text-2xl font-bold text-gradient">
                  {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
                </h2>
                <Rocket className="w-6 h-6 text-indigo-600 animate-pulse" />
              </motion.div>
              <div className="flex items-center space-x-4">
                <GlobalSearch />
                <div className="relative">
                  <NotificationCenter />
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link 
                    href="/profile" 
                    className="p-2.5 text-gray-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 text-gray-600 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content with animations */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}