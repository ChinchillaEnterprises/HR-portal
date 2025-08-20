"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, Calendar, Download, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const client = generateClient<Schema>();

export default function ModernReports() {
  const [data, setData] = useState<any>({
    users: [],
    applicants: [],
    tasks: [],
    documents: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, applicantsRes, tasksRes, docsRes] = await Promise.all([
        client.models.User.list(),
        client.models.Applicant.list(),
        client.models.OnboardingTask.list(),
        client.models.Document.list(),
      ]);
      
      setData({
        users: usersRes.data,
        applicants: applicantsRes.data,
        tasks: tasksRes.data,
        documents: docsRes.data,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const metrics = {
    totalEmployees: data.users.length,
    newHires: data.users.filter((u: any) => {
      const hireDate = new Date(u.hireDate);
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return hireDate > monthAgo;
    }).length,
    activeApplicants: data.applicants.filter((a: any) => 
      ["NEW", "REVIEWING", "INTERVIEW"].includes(a.status)
    ).length,
    taskCompletion: data.tasks.length > 0 
      ? Math.round((data.tasks.filter((t: any) => t.status === "COMPLETED").length / data.tasks.length) * 100)
      : 0,
  };

  // Chart configurations
  const hiringTrendChart = {
    options: {
      chart: { toolbar: { show: false }, sparkline: { enabled: true } },
      stroke: { curve: "smooth" as const, width: 3 },
      colors: ["#3B82F6"],
      tooltip: { enabled: true },
    },
    series: [{
      name: "New Hires",
      data: [3, 5, 4, 6, 8, 7, 9, 11, 10, 12, 15, 13],
    }],
  };

  const departmentChart = {
    options: {
      chart: { toolbar: { show: false } },
      plotOptions: { bar: { horizontal: true, borderRadius: 8 } },
      colors: ["#8B5CF6"],
      xaxis: { categories: ["Engineering", "Sales", "Marketing", "HR", "Finance"] },
    },
    series: [{ name: "Employees", data: [23, 18, 14, 8, 6] }],
  };

  const taskStatusChart = {
    options: {
      chart: { toolbar: { show: false } },
      labels: ["Completed", "In Progress", "Pending"],
      colors: ["#10B981", "#3B82F6", "#F59E0B"],
      legend: { position: "bottom" as const },
    },
    series: [
      data.tasks.filter((t: any) => t.status === "COMPLETED").length,
      data.tasks.filter((t: any) => t.status === "IN_PROGRESS").length,
      data.tasks.filter((t: any) => t.status === "PENDING").length,
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-fuchsia-600 bg-clip-text text-transparent">
            Analytics & Insights
          </h1>
          <p className="text-gray-600 mt-1">Track your HR metrics and performance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={loadData} disabled={loading} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        {["week", "month", "quarter", "year"].map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedPeriod === period
                ? "bg-gradient-to-r from-rose-500 to-fuchsia-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Employees", value: metrics.totalEmployees, icon: Users, trend: "+12%", color: "from-blue-500 to-cyan-600" },
          { label: "New Hires", value: metrics.newHires, icon: TrendingUp, trend: "+23%", color: "from-emerald-500 to-teal-600" },
          { label: "Active Applicants", value: metrics.activeApplicants, icon: Users, trend: "+8%", color: "from-purple-500 to-pink-600" },
          { label: "Task Completion", value: `${metrics.taskCompletion}%`, icon: BarChart3, trend: "+5%", color: "from-amber-500 to-orange-600" },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-light rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${metric.color} bg-clip-text text-transparent`}>
                  {loading ? "..." : metric.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">{metric.label}</div>
                <div className="text-xs text-green-600 mt-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {metric.trend} vs last {selectedPeriod}
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${metric.color}`}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hiring Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiring Trend</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Chart options={hiringTrendChart.options} series={hiringTrendChart.series} type="line" height={200} />
          )}
        </motion.div>

        {/* Department Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <Chart options={departmentChart.options} series={departmentChart.series} type="bar" height={200} />
          )}
        </motion.div>

        {/* Task Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Task Status</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <Chart options={taskStatusChart.options} series={taskStatusChart.series} type="donut" height={200} />
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {[
              { action: "New hire onboarded", user: "John Doe", time: "2 hours ago", color: "bg-green-100 text-green-700" },
              { action: "Interview scheduled", user: "Jane Smith", time: "4 hours ago", color: "bg-blue-100 text-blue-700" },
              { action: "Document uploaded", user: "Policy Update", time: "Yesterday", color: "bg-purple-100 text-purple-700" },
              { action: "Task completed", user: "IT Setup", time: "2 days ago", color: "bg-amber-100 text-amber-700" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.user}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${activity.color}`}>
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}