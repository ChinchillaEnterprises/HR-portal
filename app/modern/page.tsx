"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { Users, Clock, FileText, CheckCircle2, AlertCircle, TrendingUp, BarChart3, Activity, Target, Zap } from "lucide-react";
import DashboardCharts from "@/components/DashboardCharts";

const client = generateClient<Schema>();

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    totalInterns: 0,
    activeOnboarding: 0,
    pendingDocuments: 0,
    systemUpdates: 3,
  });
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Add error handling for each API call
      const [usersResult, documentsResult, applicantsResult, communicationsResult] = await Promise.allSettled([
        client.models.User.list(),
        client.models.Document.list(),
        client.models.Applicant.list(),
        client.models.Communication.list(),
      ]);
      
      // Safely extract data with fallbacks
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
      const documents = documentsResult.status === 'fulfilled' ? documentsResult.value.data : [];
      const applicants = applicantsResult.status === 'fulfilled' ? applicantsResult.value.data : [];
      const communications = communicationsResult.status === 'fulfilled' ? communicationsResult.value.data : [];
      
      // Log any errors for debugging
      if (usersResult.status === 'rejected') console.error('Failed to load users:', usersResult.reason);
      if (documentsResult.status === 'rejected') console.error('Failed to load documents:', documentsResult.reason);
      if (applicantsResult.status === 'rejected') console.error('Failed to load applicants:', applicantsResult.reason);
      if (communicationsResult.status === 'rejected') console.error('Failed to load communications:', communicationsResult.reason);
      
      const interns = users.filter(u => u.role === 'intern');
      const activeOnboarding = interns.filter(u => !u.onboardingCompleted).length;
      const pendingDocs = documents.filter(d => d.signatureStatus === 'pending').length;
      
      setMetrics({
        totalInterns: interns.length,
        activeOnboarding,
        pendingDocuments: pendingDocs,
        systemUpdates: 3,
      });

      // Prepare chart data
      const onboardingProgress = {
        completed: interns.filter(u => u.onboardingCompleted).length,
        inProgress: activeOnboarding,
        notStarted: users.filter(u => u.status === 'pending').length,
      };

      // Department distribution
      const deptCounts: Record<string, number> = {};
      users.forEach(user => {
        const dept = user.department || 'Unassigned';
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      
      const totalUsers = users.length;
      const departmentDistribution = Object.entries(deptCounts)
        .map(([department, count]) => ({
          department,
          count,
          percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Weekly activity (simulated for demo)
      const weeklyActivity = [
        { day: 'Mon', applicants: 3, documents: 5, communications: 8 },
        { day: 'Tue', applicants: 5, documents: 3, communications: 12 },
        { day: 'Wed', applicants: 2, documents: 7, communications: 6 },
        { day: 'Thu', applicants: 4, documents: 4, communications: 10 },
        { day: 'Fri', applicants: 6, documents: 6, communications: 15 },
        { day: 'Sat', applicants: 1, documents: 2, communications: 3 },
        { day: 'Sun', applicants: 0, documents: 1, communications: 2 },
      ];

      // Document status
      const documentStatus = {
        signed: documents.filter(d => d.signatureStatus === 'signed').length,
        pending: pendingDocs,
        expired: documents.filter(d => d.signatureStatus === 'expired').length,
      };

      setChartData({
        onboardingProgress,
        weeklyActivity,
        departmentDistribution,
        documentStatus,
      });
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    {
      title: "Total Interns",
      value: metrics.totalInterns,
      icon: Users,
      description: "Currently in the program",
      color: "text-gray-900",
      bgColor: "bg-gray-100",
    },
    {
      title: "Active Onboarding",
      value: metrics.activeOnboarding,
      icon: Clock,
      description: "In progress",
      color: "text-gray-900",
      bgColor: "bg-gray-100",
    },
    {
      title: "Pending Documents",
      value: metrics.pendingDocuments,
      icon: FileText,
      description: "Awaiting signatures",
      color: "text-gray-900",
      bgColor: "bg-gray-100",
    },
    {
      title: "System Updates",
      value: metrics.systemUpdates,
      icon: AlertCircle,
      description: "New notifications",
      color: "text-gray-900",
      bgColor: "bg-gray-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of interns, tasks, and system updates</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {overviewCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
            <div className={`text-2xl font-bold ${card.color}`}>
              {loading ? "..." : card.value}
            </div>
            <p className="text-sm text-gray-600 mt-1">{card.title}</p>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.a
            href="/onboarding"
            whileHover={{ scale: 1.02 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">View Onboarding Progress</h3>
            <p className="text-sm text-gray-600 mt-1">Check status and assign dates</p>
          </motion.a>
          <motion.a
            href="/documents"
            whileHover={{ scale: 1.02 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Manage Documents</h3>
            <p className="text-sm text-gray-600 mt-1">Upload and track signatures</p>
          </motion.a>
          <motion.a
            href="/communications"
            whileHover={{ scale: 1.02 }}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h3 className="font-medium text-gray-900">Send Communications</h3>
            <p className="text-sm text-gray-600 mt-1">Email and notify team members</p>
          </motion.a>
        </div>
      </div>

      {/* Analytics Section */}
      {chartData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Analytics & Insights</h2>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Real-time data</span>
            </div>
          </div>
          <DashboardCharts data={chartData} />
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {[
            { icon: CheckCircle2, text: "John Doe completed onboarding", time: "2 hours ago", color: "text-green-600" },
            { icon: FileText, text: "NDA document uploaded for Jane Smith", time: "4 hours ago", color: "text-blue-600" },
            { icon: Users, text: "New applicant: Michael Johnson", time: "Yesterday", color: "text-purple-600" },
            { icon: AlertCircle, text: "Reminder: 3 documents pending signatures", time: "2 days ago", color: "text-amber-600" },
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <activity.icon className={`w-5 h-5 ${activity.color}`} />
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.text}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}