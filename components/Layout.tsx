"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut } from "aws-amplify/auth";
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
    { name: "Dashboard", href: "/", icon: Home, roles: ["admin", "mentor", "team_lead", "intern", "staff"] },
    { name: "Onboarding", href: "/onboarding", icon: UserCheck, roles: ["admin", "mentor", "team_lead", "intern", "staff"] },
    { name: "Templates", href: "/templates", icon: BookOpen, roles: ["admin", "mentor", "team_lead"] },
    { name: "Document Vault", href: "/documents", icon: FileText, roles: ["admin", "mentor", "team_lead", "intern", "staff"] },
    { name: "Communications", href: "/communications", icon: Mail, roles: ["admin", "mentor", "team_lead"] },
    { name: "Applicants", href: "/applicants", icon: Briefcase, roles: ["admin", "mentor", "team_lead"] },
    { name: "Team Directory", href: "/team", icon: Users, roles: ["admin", "mentor", "team_lead", "staff"] },
    { name: "Reports", href: "/reports", icon: BarChart3, roles: ["admin", "mentor", "team_lead"] },
    { name: "Admin Panel", href: "/admin", icon: Shield, roles: ["admin"] },
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-sm z-40 h-16">
        <div className="flex items-center justify-between h-full px-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
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
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-black shadow-lg transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 border-b border-gray-800">
            <h1 className="text-2xl font-bold text-white">Chinchilla Flow</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white text-black"
                      : "text-gray-300 hover:bg-gray-900 hover:text-white"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-black" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {userInfo?.firstName || user?.attributes?.given_name} {userInfo?.lastName || user?.attributes?.family_name}
                </p>
                <p className="text-xs text-gray-400 truncate">{userInfo?.email || user?.attributes?.email}</p>
                <p className="text-xs text-gray-400 capitalize">{userRole.replace("_", " ")}</p>
              </div>
            </div>
            <div className="space-y-2">
              <Link
                href="/profile"
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 min-h-screen bg-gray-50 pt-16 lg:pt-0">
        {/* Desktop header */}
        <header className="hidden lg:block bg-white shadow-sm sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {navigation.find((item) => item.href === pathname)?.name || "Dashboard"}
              </h2>
              <div className="flex items-center space-x-4">
                <GlobalSearch />
                <div className="relative">
                  <NotificationCenter />
                </div>
                <Link href="/profile" className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <User className="w-6 h-6" />
                </Link>
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <Settings className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-3 sm:p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}