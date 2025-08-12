"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Amplify } from "aws-amplify";
import outputs from "@/amplify_outputs.json";
import "@aws-amplify/ui-react/styles.css";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  UserCheck,
  AlertCircle,
  CheckCircle,
  Bell,
  ArrowRight,
  Mail,
  Briefcase,
  Target,
  Activity,
  Award,
  Shield,
  Info,
  CheckSquare,
  XCircle,
  BarChart3,
  PieChart,
  LineChart,
  DollarSign,
  Zap,
  BookOpen,
  MessageSquare,
  Star,
  TrendingDown,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  Settings,
  Download,
  X,
  RefreshCw,
  Sparkles,
  Rocket,
  Heart,
  Globe,
  Cpu,
  Layers,
} from "lucide-react";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";
import { useActivityLogger, ACTIVITY_TYPES } from "@/hooks/useActivityLogger";

Amplify.configure(outputs);

const client = generateClient<Schema>();

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  time: Date;
  read: boolean;
}

function Dashboard({ user }: { user: any }) {
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [userProfile, setUserProfile] = useState<Schema["User"]["type"] | null>(null);
  const { logActivity } = useActivityLogger();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [dataCache, setDataCache] = useState<{
    users?: Array<Schema["User"]["type"]>;
    tasks?: Array<Schema["OnboardingTask"]["type"]>;
    applicants?: Array<Schema["Applicant"]["type"]>;
    documents?: Array<Schema["Document"]["type"]>;
    communications?: Array<Schema["Communication"]["type"]>;
    lastFetch?: number;
  }>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingOnboarding: 0,
    activeApplicants: 0,
    recentDocuments: 0,
    myTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    pendingApprovals: 0,
    // New analytics stats
    newUsersThisMonth: 0,
    userGrowthRate: 0,
    avgOnboardingTime: 0,
    taskCompletionRate: 0,
    applicantConversionRate: 0,
    communicationsSentToday: 0,
    departmentDistribution: {} as Record<string, number>,
    monthlyStats: [] as Array<{ month: string; users: number; tasks: number; applicants: number }>,
  });

  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Array<Schema["OnboardingTask"]["type"]>>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledReports, setScheduledReports] = useState<Array<{
    id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'csv' | 'json' | 'pdf';
    nextRun: string;
    enabled: boolean;
  }>>([]);

  const fetchDashboardData = useCallback(async (forceRefresh = false) => {
    try {
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes
      
      // Check if we can use cached data
      if (!forceRefresh && dataCache.lastFetch && (now - dataCache.lastFetch) < cacheExpiry) {
        console.log('Using cached data');
        return;
      }

      setLoading(!dataCache.lastFetch); // Only show loading spinner on first load
      setRefreshing(!!dataCache.lastFetch); // Show refresh indicator on subsequent loads
      
      // Get authenticated user info
      const authUser = await getAuthenticatedUser();
      if (authUser) {
        setUserRole(authUser.role);
        
        // Get user profile from cache or fetch if needed
        let users = dataCache.users;
        if (!users || forceRefresh) {
          const { data: usersData } = await client.models.User.list({
            filter: { email: { eq: authUser.email } }
          });
          users = usersData;
        }
        
        const userProfile = users.find(u => u.email === authUser.email);
        if (userProfile) {
          setUserProfile(userProfile);
        }
      }
      
      // Fetch all data in parallel only if not cached or force refresh
      let usersData, tasksData, applicantsData, documentsData, communicationsData;
      
      if (!dataCache.users || forceRefresh) {
        [
          usersData,
          tasksData,
          applicantsData,
          documentsData,
          communicationsData,
        ] = await Promise.all([
          client.models.User.list(),
          client.models.OnboardingTask.list(),
          client.models.Applicant.list(),
          client.models.Document.list(),
          client.models.Communication.list(),
        ]);
        
        // Update cache
        setDataCache({
          users: usersData.data,
          tasks: tasksData.data,
          applicants: applicantsData.data,
          documents: documentsData.data,
          communications: communicationsData.data,
          lastFetch: now,
        });
      } else {
        // Use cached data
        usersData = { data: dataCache.users };
        tasksData = { data: dataCache.tasks! };
        applicantsData = { data: dataCache.applicants! };
        documentsData = { data: dataCache.documents! };
        communicationsData = { data: dataCache.communications! };
      }
      
      // Calculate stats based on role
      const isManager = ["admin", "mentor", "team_lead"].includes(userRole);
      
      // My tasks (for regular users)
      const myTasks = userProfile 
        ? tasksData.data.filter(t => t.userId === userProfile.id)
        : [];
      
      // Pending tasks (for managers: all, for users: own)
      const pendingTasks = isManager
        ? tasksData.data.filter(t => t.status === "pending" || t.status === "in_progress")
        : myTasks.filter(t => t.status === "pending" || t.status === "in_progress");
      
      // Active applicants (managers only)
      const activeApplicants = applicantsData.data.filter(
        a => a.status !== "rejected" && a.status !== "hired"
      );
      
      // Recent documents
      const recentDocs = documentsData.data.filter(doc => {
        const uploadDate = new Date(doc.uploadDate || doc.createdAt);
        const daysSinceUpload = (Date.now() - uploadDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceUpload <= 7;
      });
      
      // Overdue tasks
      const overdueTasks = pendingTasks.filter(t => {
        if (!t.dueDate) return false;
        return new Date(t.dueDate) < new Date();
      });
      
      // Update stats
      setStats({
        totalUsers: usersData.data.length,
        pendingOnboarding: pendingTasks.length,
        activeApplicants: activeApplicants.length,
        recentDocuments: recentDocs.length,
        myTasks: myTasks.length,
        completedTasks: myTasks.filter(t => t.status === "completed").length,
        overdueTasks: overdueTasks.length,
        pendingApprovals: documentsData.data.filter(d => d.signatureStatus === "pending").length,
        newUsersThisMonth: usersData.data.filter(u => {
          const createdDate = new Date(u.createdAt);
          const thisMonth = new Date();
          return createdDate.getMonth() === thisMonth.getMonth() && 
                 createdDate.getFullYear() === thisMonth.getFullYear();
        }).length,
        userGrowthRate: Math.floor(Math.random() * 20) + 5, // Mock growth rate
        avgOnboardingTime: Math.floor(Math.random() * 10) + 10, // Mock avg time
        taskCompletionRate: myTasks.length > 0 ? Math.round((myTasks.filter(t => t.status === "completed").length / myTasks.length) * 100) : 0,
        applicantConversionRate: Math.floor(Math.random() * 30) + 20, // Mock conversion
        communicationsSentToday: communicationsData.data.filter(c => {
          if (!c.sentDate) return false;
          const sentDate = new Date(c.sentDate);
          const today = new Date();
          return sentDate.toDateString() === today.toDateString();
        }).length,
        departmentDistribution: usersData.data.reduce((acc, user) => {
          if (user.department) {
            acc[user.department] = (acc[user.department] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        monthlyStats: [
          { month: "Jan", users: 12, tasks: 45, applicants: 8 },
          { month: "Feb", users: 15, tasks: 52, applicants: 12 },
          { month: "Mar", users: 18, tasks: 61, applicants: 15 },
          { month: "Apr", users: 22, tasks: 73, applicants: 18 },
          { month: "May", users: 20, tasks: 68, applicants: 14 },
          { month: "Jun", users: 25, tasks: 82, applicants: 20 },
        ],
      });

      // Set upcoming tasks
      const upcoming = pendingTasks
        .filter(t => t.dueDate)
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5);
      setUpcomingTasks(upcoming);

      // Generate recent activity
      const activities: any[] = [];
      
      // Add user activities
      usersData.data.forEach(user => {
        if (new Date(user.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
          activities.push({
            id: `user-${user.id}`,
            title: `${user.firstName} ${user.lastName} joined the team`,
            time: user.createdAt,
            icon: Users,
            color: 'text-indigo-600'
          });
        }
      });

      // Add task activities
      tasksData.data.forEach(task => {
        if (task.status === "completed" && task.updatedAt) {
          activities.push({
            id: `task-${task.id}`,
            title: `Task "${task.title}" was completed`,
            time: task.updatedAt,
            icon: CheckCircle,
            color: 'text-emerald-600'
          });
        }
      });

      // Add communication activities
      communicationsData.data.forEach(comm => {
        if (comm.sentDate && new Date(comm.sentDate).getTime() > Date.now() - 24 * 60 * 60 * 1000) {
          activities.push({
            id: `comm-${comm.id}`,
            title: `Message sent: ${comm.subject}`,
            time: comm.sentDate,
            icon: Mail,
            color: 'text-purple-600'
          });
        }
      });
      
      // Sort activities by time
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setRecentActivity(activities.slice(0, 5));
      
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dataCache, userRole]);

  useEffect(() => {
    fetchDashboardData();
    
    // Log page view
    logActivity({
      action: ACTIVITY_TYPES.PAGE_VIEW,
      resource: 'dashboard',
      details: { userRole }
    });
  }, [fetchDashboardData, logActivity, userRole]);


  const exportAnalyticsData = (format: 'csv' | 'json') => {
    // Log export activity
    logActivity({
      action: ACTIVITY_TYPES.REPORT_EXPORT,
      resource: 'analytics',
      details: { format, userRole, exportTimestamp: new Date().toISOString() }
    });
    const analyticsData = {
      timestamp: new Date().toISOString(),
      userRole,
      metrics: {
        totalUsers: stats.totalUsers,
        newUsersThisMonth: stats.newUsersThisMonth,
        userGrowthRate: stats.userGrowthRate,
        avgOnboardingTime: stats.avgOnboardingTime,
        taskCompletionRate: stats.taskCompletionRate,
        applicantConversionRate: stats.applicantConversionRate,
        communicationsSentToday: stats.communicationsSentToday,
        overdueTasks: stats.overdueTasks,
        pendingApprovals: stats.pendingApprovals,
      },
      departmentDistribution: stats.departmentDistribution,
      monthlyStats: stats.monthlyStats,
      systemHealth: {
        activeUsers: stats.totalUsers - stats.overdueTasks,
        systemHealthScore: Math.round(((stats.totalUsers - stats.overdueTasks) / stats.totalUsers) * 100) || 100,
      }
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvRows = [
        ['Metric', 'Value', 'Type'],
        ['Total Users', stats.totalUsers, 'Count'],
        ['New Users This Month', stats.newUsersThisMonth, 'Count'],
        ['User Growth Rate', `${stats.userGrowthRate}%`, 'Percentage'],
        ['Avg Onboarding Time', `${stats.avgOnboardingTime} days`, 'Duration'],
        ['Task Completion Rate', `${stats.taskCompletionRate}%`, 'Percentage'],
        ['Applicant Conversion Rate', `${stats.applicantConversionRate}%`, 'Percentage'],
        ['Communications Sent Today', stats.communicationsSentToday, 'Count'],
        ['Overdue Tasks', stats.overdueTasks, 'Count'],
        ['Pending Approvals', stats.pendingApprovals, 'Count'],
        ...Object.entries(stats.departmentDistribution).map(([dept, count]) => 
          [`Department: ${dept}`, count, 'Count']
        ),
      ];

      const csvContent = csvRows.map(row => row.join(',')).join('\n');
      downloadFile(csvContent, `analytics-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
    } else {
      // Export as JSON
      const jsonContent = JSON.stringify(analyticsData, null, 2);
      downloadFile(jsonContent, `analytics-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const scheduleReport = (reportConfig: {
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    format: 'csv' | 'json' | 'pdf';
  }) => {
    const getNextRunDate = (frequency: string) => {
      const nextRunDate = new Date();
      switch (frequency) {
        case 'daily':
          nextRunDate.setDate(nextRunDate.getDate() + 1);
          break;
        case 'weekly':
          nextRunDate.setDate(nextRunDate.getDate() + 7);
          break;
        case 'monthly':
          nextRunDate.setMonth(nextRunDate.getMonth() + 1);
          break;
      }
      return nextRunDate.toISOString();
    };

    const newReport = {
      id: `report-${Date.now()}`,
      name: reportConfig.name,
      frequency: reportConfig.frequency,
      format: reportConfig.format,
      nextRun: getNextRunDate(reportConfig.frequency),
      enabled: true,
    };

    setScheduledReports(prev => [...prev, newReport]);
    
    // Log report scheduling activity
    logActivity({
      action: ACTIVITY_TYPES.REPORT_SCHEDULE,
      resource: 'scheduled_report',
      resourceId: newReport.id,
      details: { 
        reportName: reportConfig.name,
        frequency: reportConfig.frequency,
        format: reportConfig.format,
        nextRun: newReport.nextRun
      }
    });
    
    // In a real implementation, this would save to database and set up a cron job
    console.log('Scheduled report:', newReport);
    
    // Mock notification
    alert(`Report "${reportConfig.name}" scheduled successfully!`);
    setShowScheduleModal(false);
  };

  const toggleScheduledReport = (reportId: string) => {
    setScheduledReports(prev => 
      prev.map(report => 
        report.id === reportId 
          ? { ...report, enabled: !report.enabled }
          : report
      )
    );
  };

  const deleteScheduledReport = (reportId: string) => {
    setScheduledReports(prev => prev.filter(report => report.id !== reportId));
  };

  // Memoized calculations for better performance
  const roleSpecificStats = useMemo(() => {
    switch (userRole) {
      case "admin":
        return [
          {
            title: "Total Team Members",
            value: stats.totalUsers,
            icon: Users,
            gradient: "from-blue-500 to-indigo-600",
            trend: `+${stats.newUsersThisMonth} this month`,
            trendUp: true,
            link: "/admin",
          },
          {
            title: "System Health",
            value: `${Math.round(((stats.totalUsers - stats.overdueTasks) / stats.totalUsers) * 100) || 100}%`,
            icon: Cpu,
            gradient: "from-emerald-500 to-teal-600",
            trend: "Excellent",
            trendUp: true,
            link: "/reports",
          },
          {
            title: "Active Applicants",
            value: stats.activeApplicants,
            icon: UserCheck,
            gradient: "from-purple-500 to-pink-600",
            trend: `${stats.applicantConversionRate}% conversion`,
            trendUp: true,
            link: "/applicants",
          },
          {
            title: "Pending Approvals",
            value: stats.pendingApprovals,
            icon: Shield,
            gradient: "from-amber-500 to-orange-600",
            trend: stats.pendingApprovals > 0 ? "Needs attention" : "All clear",
            trendUp: false,
            link: "/documents",
          },
        ];
      case "mentor":
        return [
          {
            title: "My Mentees",
            value: stats.pendingOnboarding,
            icon: Users,
            gradient: "from-blue-500 to-indigo-600",
            trend: "Active onboarding",
            trendUp: true,
            link: "/onboarding",
          },
          {
            title: "Completion Rate",
            value: `${stats.taskCompletionRate}%`,
            icon: Target,
            gradient: "from-emerald-500 to-teal-600",
            trend: "Team performance",
            trendUp: stats.taskCompletionRate > 80,
            link: "/reports",
          },
          {
            title: "Training Sessions",
            value: Math.floor(stats.communicationsSentToday / 2) || 0,
            icon: BookOpen,
            gradient: "from-purple-500 to-pink-600",
            trend: "This week",
            trendUp: true,
            link: "/communications",
          },
          {
            title: "Support Tickets",
            value: stats.overdueTasks,
            icon: AlertCircle,
            gradient: stats.overdueTasks > 0 ? "from-amber-500 to-orange-600" : "from-gray-400 to-gray-600",
            trend: stats.overdueTasks > 0 ? "Needs review" : "All resolved",
            trendUp: false,
            link: "/onboarding",
          },
        ];
      case "team_lead":
        return [
          {
            title: "Team Members",
            value: Math.floor(stats.totalUsers / 3) || 1,
            icon: Users,
            gradient: "from-blue-500 to-indigo-600",
            trend: "Direct reports",
            trendUp: true,
            link: "/team",
          },
          {
            title: "Team Tasks",
            value: stats.pendingOnboarding,
            icon: ClipboardList,
            gradient: "from-yellow-500 to-amber-600",
            trend: "In progress",
            trendUp: false,
            link: "/onboarding",
          },
          {
            title: "Project Progress",
            value: `${Math.min(stats.taskCompletionRate + 10, 100)}%`,
            icon: TrendingUp,
            gradient: "from-emerald-500 to-teal-600",
            trend: "On track",
            trendUp: true,
            link: "/reports",
          },
          {
            title: "Team Messages",
            value: stats.communicationsSentToday,
            icon: MessageSquare,
            gradient: "from-purple-500 to-pink-600",
            trend: "Today",
            trendUp: true,
            link: "/communications",
          },
        ];
      case "intern":
        return [
          {
            title: "Learning Progress",
            value: `${Math.round((stats.completedTasks / Math.max(stats.myTasks, 1)) * 100)}%`,
            icon: BookOpen,
            gradient: "from-blue-500 to-indigo-600",
            trend: `${stats.completedTasks}/${stats.myTasks} completed`,
            trendUp: true,
            link: "/onboarding",
          },
          {
            title: "Completed Tasks",
            value: stats.completedTasks,
            icon: CheckCircle,
            gradient: "from-emerald-500 to-teal-600",
            trend: "Great progress!",
            trendUp: true,
            link: "/onboarding",
          },
          {
            title: "Next Milestone",
            value: stats.myTasks - stats.completedTasks,
            icon: Target,
            gradient: "from-purple-500 to-pink-600",
            trend: "Tasks remaining",
            trendUp: false,
            link: "/onboarding",
          },
          {
            title: "Mentor Sessions",
            value: Math.floor(Math.random() * 3) + 1,
            icon: Users,
            gradient: "from-yellow-500 to-amber-600",
            trend: "This week",
            trendUp: true,
            link: "/team",
          },
        ];
      case "staff":
      default:
        return [
          {
            title: "My Tasks",
            value: stats.myTasks,
            icon: CheckSquare,
            gradient: "from-blue-500 to-indigo-600",
            trend: `${stats.completedTasks}/${stats.myTasks} done`,
            trendUp: true,
            link: "/onboarding",
          },
          {
            title: "Recent Activity",
            value: stats.completedTasks,
            icon: Activity,
            gradient: "from-emerald-500 to-teal-600",
            trend: "Tasks completed",
            trendUp: true,
            link: "/onboarding",
          },
          {
            title: "Urgent Items",
            value: stats.overdueTasks,
            icon: AlertCircle,
            gradient: stats.overdueTasks > 0 ? "from-red-500 to-rose-600" : "from-gray-400 to-gray-600",
            trend: stats.overdueTasks > 0 ? "Action needed" : "All caught up",
            trendUp: false,
            link: "/onboarding",
          },
          {
            title: "Resources",
            value: stats.recentDocuments,
            icon: FileText,
            gradient: "from-purple-500 to-pink-600",
            trend: "Available",
            trendUp: true,
            link: "/documents",
          },
        ];
    }
  }, [userRole, stats]);

  const getRoleSpecificStats = () => roleSpecificStats;

  const quickActions = useMemo(() => {
    switch (userRole) {
      case "admin":
        return [
          { title: "Admin Panel", icon: Shield, link: "/admin", gradient: "from-red-500 to-rose-600" },
          { title: "System Reports", icon: BarChart3, link: "/reports", gradient: "from-blue-500 to-indigo-600" },
          { title: "Manage Users", icon: Users, link: "/admin", gradient: "from-emerald-500 to-teal-600" },
          { title: "Global Settings", icon: Settings, link: "/admin", gradient: "from-purple-500 to-pink-600" },
        ];
      case "mentor":
        return [
          { title: "My Mentees", icon: Users, link: "/onboarding", gradient: "from-blue-500 to-indigo-600" },
          { title: "Create Training", icon: BookOpen, link: "/communications", gradient: "from-emerald-500 to-teal-600" },
          { title: "Progress Review", icon: Target, link: "/reports", gradient: "from-purple-500 to-pink-600" },
          { title: "Schedule Session", icon: Calendar, link: "/communications", gradient: "from-amber-500 to-orange-600" },
        ];
      case "team_lead":
        return [
          { title: "Team Tasks", icon: ClipboardList, link: "/onboarding", gradient: "from-blue-500 to-indigo-600" },
          { title: "Team Messages", icon: MessageSquare, link: "/communications", gradient: "from-emerald-500 to-teal-600" },
          { title: "Project Status", icon: TrendingUp, link: "/reports", gradient: "from-purple-500 to-pink-600" },
          { title: "Review Applicants", icon: Briefcase, link: "/applicants", gradient: "from-amber-500 to-orange-600" },
        ];
      case "intern":
        return [
          { title: "Learning Path", icon: BookOpen, link: "/onboarding", gradient: "from-blue-500 to-indigo-600" },
          { title: "Study Materials", icon: FileText, link: "/documents", gradient: "from-emerald-500 to-teal-600" },
          { title: "Ask Mentor", icon: Users, link: "/team", gradient: "from-purple-500 to-pink-600" },
          { title: "Progress Check", icon: Target, link: "/onboarding", gradient: "from-amber-500 to-orange-600" },
        ];
      case "staff":
      default:
        return [
          { title: "My Tasks", icon: CheckSquare, link: "/onboarding", gradient: "from-blue-500 to-indigo-600" },
          { title: "My Documents", icon: FileText, link: "/documents", gradient: "from-emerald-500 to-teal-600" },
          { title: "Team Directory", icon: Users, link: "/team", gradient: "from-purple-500 to-pink-600" },
          { title: "Request Help", icon: Mail, link: "/communications", gradient: "from-amber-500 to-orange-600" },
        ];
    }
  }, [userRole]);

  const getQuickActions = () => quickActions;

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center h-96">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="rounded-full h-12 w-12 border-b-2 border-indigo-600"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 page-transition">
        {/* Modern Hero Section */}
        <div className="relative overflow-hidden rounded-3xl gradient-primary p-8 sm:p-12 text-white">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse-slow animation-delay-2000" />
          </div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6">
              <div className="flex-1">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl font-bold mb-3 flex items-center gap-3"
                >
                  Welcome back, {userProfile?.firstName || user?.attributes?.given_name}!
                  <Sparkles className="w-8 h-8 animate-pulse" />
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-lg text-white/90 mb-6"
                >
                  {userRole === "admin" 
                    ? "Your command center for HR excellence and team success"
                    : userRole === "mentor"
                    ? `Empowering ${stats.pendingOnboarding} professionals on their journey`
                    : userRole === "team_lead"
                    ? `Leading ${Math.floor(stats.totalUsers / 3) || 1} amazing team members`
                    : userRole === "intern"
                    ? `${Math.round((stats.completedTasks / Math.max(stats.myTasks, 1)) * 100) || 0}% through your exciting journey`
                    : "Your hub for productivity and collaboration"}
                </motion.p>
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-xl border border-white/30">
                    {getRoleIcon(userRole)}
                    <span className="ml-2 capitalize">{userRole.replace("_", " ")}</span>
                  </span>
                  {userProfile?.department && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-xl border border-white/30">
                      <Layers className="w-4 h-4 mr-2" />
                      {userProfile.department}
                    </span>
                  )}
                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/20 backdrop-blur-xl border border-white/30">
                    <Globe className="w-4 h-4 mr-2" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    logActivity({
                      action: ACTIVITY_TYPES.SYSTEM_REFRESH,
                      resource: 'dashboard',
                      details: { triggeredByUser: true }
                    });
                    fetchDashboardData(true);
                  }}
                  disabled={refreshing}
                  className="p-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 transition-all disabled:opacity-50"
                  title="Refresh dashboard data"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </motion.button>
                <div className="relative">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-3 rounded-xl bg-white/20 backdrop-blur-xl border border-white/30 hover:bg-white/30 transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.filter(n => !n.read).length > 0 && (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </motion.button>
                
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 glass rounded-2xl shadow-2xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-gray-200/50">
                          <h3 className="font-semibold text-gray-900">Notifications</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {notifications.length > 0 ? (
                            notifications.map((notif) => (
                              <div key={notif.id} className="p-4 border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start gap-3">
                                  <div className={`p-2 rounded-xl ${
                                    notif.type === "warning" ? "bg-amber-100" :
                                    notif.type === "error" ? "bg-red-100" :
                                    notif.type === "success" ? "bg-emerald-100" :
                                    "bg-blue-100"
                                  }`}>
                                    {notif.type === "warning" ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                                     notif.type === "error" ? <XCircle className="w-4 h-4 text-red-600" /> :
                                     notif.type === "success" ? <CheckCircle className="w-4 h-4 text-emerald-600" /> :
                                     <Info className="w-4 h-4 text-blue-600" />}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-sm text-gray-900">{notif.title}</p>
                                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                      {new Date(notif.time).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                              <p>No new notifications</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {getRoleSpecificStats().map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={stat.link}
                  className="block group relative overflow-hidden rounded-3xl glass-card hover-lift"
                >
                  <div className="absolute inset-0 opacity-5">
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
                  </div>
                  
                  {/* Animated background gradient */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                  
                  <div className="relative p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-glow group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                        className={`text-sm font-medium flex items-center gap-1 ${
                          stat.trendUp ? 'text-emerald-600' : 'text-gray-600'
                        }`}
                      >
                        {stat.trendUp ? (
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="w-4 h-4" />
                            <span className="text-xs bg-emerald-50 px-2 py-1 rounded-full">{stat.trend}</span>
                          </div>
                        ) : (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{stat.trend}</span>
                        )}
                      </motion.span>
                    </div>
                    <motion.h3
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      className="text-4xl font-bold text-gradient mb-2"
                    >
                      {stat.value}
                    </motion.h3>
                    <p className="text-sm text-gray-600 font-medium">{stat.title}</p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Tasks/Activity Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Tasks with Modern Design */}
            {upcomingTasks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-3xl p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gradient flex items-center gap-3">
                    <div className="p-2 rounded-xl gradient-primary animate-pulse-glow">
                      <Rocket className="w-6 h-6 text-white" />
                    </div>
                    {userRole === "admin" || userRole === "mentor" || userRole === "team_lead" 
                      ? "Team Tasks Overview" 
                      : "My Upcoming Tasks"}
                  </h2>
                  <Link href="/onboarding" className="btn-modern px-4 py-2 rounded-xl text-white text-sm font-medium flex items-center group">
                    View All
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
                <div className="space-y-4">
                  {upcomingTasks.map((task, taskIndex) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: taskIndex * 0.05 }}
                      whileHover={{ x: 4 }}
                      className="flex items-center justify-between p-5 bg-white/60 hover:bg-white/80 rounded-2xl transition-all group hover-lift"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${
                          task.status === "overdue" ? "gradient-secondary" :
                          task.status === "in_progress" ? "gradient-accent" :
                          "bg-gray-100"
                        } shadow-soft`}>
                          {task.status === "overdue" ? <AlertCircle className="w-5 h-5 text-white" /> :
                           task.status === "in_progress" ? <Clock className="w-5 h-5 text-white" /> :
                           <Circle className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{task.title}</p>
                          <p className="text-sm text-gray-500">
                            Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        task.status === "overdue" ? "bg-red-100 text-red-700" :
                        task.status === "in_progress" ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>
                        {task.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recent Activity with Timeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-2xl p-6"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600" />
                Recent Activity
              </h2>
              <div className="space-y-4">
                {recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-4 group"
                      >
                        <div className="relative">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${
                            activity.color === 'text-indigo-600' ? 'from-indigo-500 to-blue-600' :
                            activity.color === 'text-emerald-600' ? 'from-emerald-500 to-teal-600' :
                            activity.color === 'text-purple-600' ? 'from-purple-500 to-pink-600' :
                            'from-gray-500 to-gray-600'
                          } shadow-lg group-hover:scale-110 transition-transform`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          {index < recentActivity.length - 1 && (
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-gray-200" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 group-hover:text-indigo-600 transition-colors">{activity.title}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(activity.time).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Quick Actions & Progress */}
          <div className="space-y-6">
            {/* Quick Actions with Gradient Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-gradient mb-6 flex items-center gap-3">
                <div className="p-2 rounded-xl gradient-accent animate-float">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {getQuickActions().map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Link
                        href={action.link}
                        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl bg-gradient-to-br ${action.gradient} text-white shadow-soft hover:shadow-glow transition-all group overflow-hidden`}
                      >
                        {/* Animated background effect */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
                        <Icon className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform relative z-10" />
                        <span className="text-sm font-semibold text-center relative z-10">{action.title}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Progress Card for Non-Managers */}
            {(userRole === "intern" || userRole === "staff") && stats.myTasks > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="relative overflow-hidden rounded-2xl gradient-primary p-6 text-white"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Your Progress
                  </h3>
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Onboarding Journey</span>
                      <span className="font-bold">{Math.round((stats.completedTasks / stats.myTasks) * 100)}%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-4 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(stats.completedTasks / stats.myTasks) * 100}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-white rounded-full shadow-lg"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-white/20 backdrop-blur-xl rounded-xl p-3">
                      <p className="text-2xl font-bold">{stats.completedTasks}</p>
                      <p className="text-sm opacity-90">Completed</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-xl rounded-xl p-3">
                      <p className="text-2xl font-bold">{stats.myTasks - stats.completedTasks}</p>
                      <p className="text-sm opacity-90">Remaining</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Admin System Health */}
            {userRole === "admin" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  System Health
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-600">Active Users</span>
                    <span className="font-bold text-gray-900">{stats.totalUsers}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                    <span className="text-sm text-gray-600">Pending Tasks</span>
                    <span className="font-bold text-amber-600">{stats.pendingOnboarding}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                    <span className="text-sm text-gray-600">Open Applications</span>
                    <span className="font-bold text-blue-600">{stats.activeApplicants}</span>
                  </div>
                  <Link 
                    href="/admin"
                    className="block w-full mt-4 text-center btn-primary"
                  >
                    Open Admin Panel
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Analytics Section - For Admin/Managers */}
        {(userRole === "admin" || userRole === "mentor" || userRole === "team_lead") && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-8"
          >
            {/* Analytics Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                Analytics & Insights
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportAnalyticsData('csv')}
                  className="btn-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </button>
                <button
                  onClick={() => exportAnalyticsData('json')}
                  className="btn-secondary text-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export JSON
                </button>
                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="btn-primary text-sm"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Report
                </button>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className={`flex items-center text-sm font-medium ${
                    stats.userGrowthRate > 0 ? "text-emerald-600" : "text-red-600"
                  }`}>
                    {stats.userGrowthRate > 0 ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    {Math.abs(stats.userGrowthRate)}%
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.newUsersThisMonth}</h3>
                <p className="text-sm text-gray-600 mt-1">New Users This Month</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    days avg
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.avgOnboardingTime}</h3>
                <p className="text-sm text-gray-600 mt-1">Avg Onboarding Time</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    completion
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.taskCompletionRate}%</h3>
                <p className="text-sm text-gray-600 mt-1">Task Completion Rate</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                    <Briefcase className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    hired
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{stats.applicantConversionRate}%</h3>
                <p className="text-sm text-gray-600 mt-1">Applicant Conversion</p>
              </motion.div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Monthly Trends Chart */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <LineChart className="w-6 h-6 text-indigo-600" />
                  Monthly Trends
                </h3>
                <div className="space-y-6">
                  {stats.monthlyStats.map((month, index) => {
                    const maxValue = Math.max(...stats.monthlyStats.map(m => 
                      Math.max(m.users, m.tasks, m.applicants)
                    ));
                    return (
                      <motion.div
                        key={month.month}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{month.month}</span>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-indigo-600 font-medium">{month.users} users</span>
                            <span className="text-emerald-600 font-medium">{month.tasks} tasks</span>
                            <span className="text-purple-600 font-medium">{month.applicants} apps</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="relative">
                            <div 
                              className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-300"
                              style={{ width: `${(month.users / maxValue) * 100}%` }}
                            />
                          </div>
                          <div className="relative">
                            <div 
                              className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-300"
                              style={{ width: `${(month.tasks / maxValue) * 100}%` }}
                            />
                          </div>
                          <div className="relative">
                            <div 
                              className="h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full transition-all duration-300"
                              style={{ width: `${(month.applicants / maxValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Department Distribution */}
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="glass rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <PieChart className="w-6 h-6 text-indigo-600" />
                  Department Distribution
                </h3>
                <div className="space-y-4">
                  {Object.entries(stats.departmentDistribution)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([dept, count], index) => {
                      const percentage = Math.round((count / stats.totalUsers) * 100);
                      const gradients = [
                        "from-blue-500 to-indigo-600",
                        "from-emerald-500 to-teal-600",
                        "from-purple-500 to-pink-600",
                        "from-amber-500 to-orange-600",
                        "from-red-500 to-rose-600",
                      ];
                      return (
                        <motion.div
                          key={dept}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{dept}</span>
                            <span className="text-sm font-bold text-gray-900">{count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
                              className={`h-full bg-gradient-to-r ${gradients[index]} rounded-full`}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  {Object.keys(stats.departmentDistribution).length === 0 && (
                    <p className="text-center text-gray-500 py-8">No department data available</p>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Activity Summary */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-2xl gradient-primary p-8 text-white"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Sparkles className="w-8 h-8" />
                  Today's Activity Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center bg-white/20 backdrop-blur-xl rounded-xl p-6">
                    <p className="text-4xl font-bold mb-2">{stats.communicationsSentToday}</p>
                    <p className="text-white/90">Messages Sent</p>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur-xl rounded-xl p-6">
                    <p className="text-4xl font-bold mb-2">{stats.overdueTasks}</p>
                    <p className="text-white/90">Overdue Tasks</p>
                  </div>
                  <div className="text-center bg-white/20 backdrop-blur-xl rounded-xl p-6">
                    <p className="text-4xl font-bold mb-2">{stats.pendingApprovals}</p>
                    <p className="text-white/90">Pending Approvals</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>

      {/* Schedule Report Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowScheduleModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-8 h-8 text-indigo-600" />
                Schedule Automated Report
              </h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                scheduleReport({
                  name: formData.get('name') as string,
                  frequency: formData.get('frequency') as 'daily' | 'weekly' | 'monthly',
                  format: formData.get('format') as 'csv' | 'json' | 'pdf',
                });
              }}>
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Report Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g., Weekly Analytics Summary"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      name="frequency"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format
                    </label>
                    <select
                      name="format"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="csv">CSV</option>
                      <option value="json">JSON</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                  >
                    Schedule Report
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}

function AdminActivityLogPreview() {
  const { getActivityLogs } = useActivityLogger();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    const activityLogs = getActivityLogs();
    setLogs(activityLogs.slice(-10).reverse()); // Show last 10 logs, most recent first
  }, [getActivityLogs]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case ACTIVITY_TYPES.PAGE_VIEW:
        return <Activity className="w-4 h-4 text-blue-500" />;
      case ACTIVITY_TYPES.SYSTEM_REFRESH:
        return <RefreshCw className="w-4 h-4 text-green-500" />;
      case ACTIVITY_TYPES.REPORT_EXPORT:
        return <Download className="w-4 h-4 text-purple-500" />;
      case ACTIVITY_TYPES.REPORT_SCHEDULE:
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Circle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Activity className="w-6 h-6 text-indigo-600" />
          System Activity
        </h3>
        <button 
          onClick={() => {
            const allLogs = getActivityLogs();
            console.table(allLogs);
          }}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          View All
        </button>
      </div>
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-start gap-3 p-3 hover:bg-gray-50/50 rounded-xl transition-colors"
            >
              <div className="mt-1">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {log.userEmail?.split('@')[0]} • {log.action.replace('_', ' ')}
                </p>
                <p className="text-xs text-gray-500">
                  {log.resource} • {new Date(log.timestamp).toLocaleTimeString()}
                </p>
                {log.details && Object.keys(log.details).length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {JSON.stringify(log.details).substring(0, 50)}...
                  </p>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">No activity logs yet</p>
        )}
      </div>
    </motion.div>
  );
}

function getRoleIcon(role?: string) {
  switch (role) {
    case "admin":
      return <Shield className="w-4 h-4" />;
    case "mentor":
      return <Award className="w-4 h-4" />;
    case "team_lead":
      return <Target className="w-4 h-4" />;
    case "intern":
      return <Briefcase className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
}

export default function App() {
  return (
    <Authenticator>
      {({ signOut, user }) => (
        user ? <Dashboard user={user} /> : <div>Loading...</div>
      )}
    </Authenticator>
  );
}