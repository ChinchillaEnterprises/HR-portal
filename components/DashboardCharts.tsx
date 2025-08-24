"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, BarChart3, PieChart, Calendar } from "lucide-react";

interface ChartData {
  onboardingProgress: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  weeklyActivity: Array<{
    day: string;
    applicants: number;
    documents: number;
    communications: number;
  }>;
  departmentDistribution: Array<{
    department: string;
    count: number;
    percentage: number;
  }>;
  documentStatus: {
    signed: number;
    pending: number;
    expired: number;
  };
}

export default function DashboardCharts({ data }: { data: ChartData }) {
  const [selectedMetric, setSelectedMetric] = useState<"applicants" | "documents" | "communications">("applicants");

  // Calculate totals for percentage displays
  const totalOnboarding = data.onboardingProgress.completed + data.onboardingProgress.inProgress + data.onboardingProgress.notStarted;
  const totalDocuments = data.documentStatus.signed + data.documentStatus.pending + data.documentStatus.expired;

  // Find max value for chart scaling
  const maxActivityValue = Math.max(
    ...data.weeklyActivity.map(d => Math.max(d.applicants, d.documents, d.communications))
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Onboarding Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Onboarding Progress</h3>
          <PieChart className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-4">
          {/* Progress Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Completed</span>
                <span className="text-sm text-gray-600">
                  {data.onboardingProgress.completed} ({totalOnboarding > 0 ? Math.round((data.onboardingProgress.completed / totalOnboarding) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalOnboarding > 0 ? `${(data.onboardingProgress.completed / totalOnboarding) * 100}%` : 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="bg-green-600 h-2 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">In Progress</span>
                <span className="text-sm text-gray-600">
                  {data.onboardingProgress.inProgress} ({totalOnboarding > 0 ? Math.round((data.onboardingProgress.inProgress / totalOnboarding) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalOnboarding > 0 ? `${(data.onboardingProgress.inProgress / totalOnboarding) * 100}%` : 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-amber-600 h-2 rounded-full"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">Not Started</span>
                <span className="text-sm text-gray-600">
                  {data.onboardingProgress.notStarted} ({totalOnboarding > 0 ? Math.round((data.onboardingProgress.notStarted / totalOnboarding) * 100) : 0}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: totalOnboarding > 0 ? `${(data.onboardingProgress.notStarted / totalOnboarding) * 100}%` : 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-gray-600 h-2 rounded-full"
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{data.onboardingProgress.completed}</p>
              <p className="text-xs text-gray-600">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{data.onboardingProgress.inProgress}</p>
              <p className="text-xs text-gray-600">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-600">{data.onboardingProgress.notStarted}</p>
              <p className="text-xs text-gray-600">Pending</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Weekly Activity Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Weekly Activity</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedMetric("applicants")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedMetric === "applicants" 
                  ? "bg-blue-100 text-blue-700" 
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Applicants
            </button>
            <button
              onClick={() => setSelectedMetric("documents")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedMetric === "documents" 
                  ? "bg-purple-100 text-purple-700" 
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setSelectedMetric("communications")}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                selectedMetric === "communications" 
                  ? "bg-green-100 text-green-700" 
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              Emails
            </button>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="h-48 flex items-end justify-between gap-2">
          {data.weeklyActivity.map((day, index) => {
            const value = day[selectedMetric];
            const height = maxActivityValue > 0 ? (value / maxActivityValue) * 100 : 0;
            const color = 
              selectedMetric === "applicants" ? "bg-blue-600" :
              selectedMetric === "documents" ? "bg-purple-600" : "bg-green-600";
            
            return (
              <motion.div
                key={day.day}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex-1 flex flex-col items-center gap-2"
              >
                <div className={`w-full ${color} rounded-t-lg relative group`}>
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {value}
                  </div>
                </div>
                <span className="text-xs text-gray-600">{day.day}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Department Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Team Distribution</h3>
          <BarChart3 className="w-5 h-5 text-gray-400" />
        </div>

        <div className="space-y-3">
          {data.departmentDistribution.map((dept, index) => (
            <div key={dept.department}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                <span className="text-sm text-gray-600">{dept.count} ({dept.percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${dept.percentage}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Document Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Document Status</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{data.documentStatus.signed}</p>
            <p className="text-sm text-green-700 mt-1">Signed</p>
            <p className="text-xs text-green-600 mt-2">
              {totalDocuments > 0 ? Math.round((data.documentStatus.signed / totalDocuments) * 100) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-amber-50 rounded-lg">
            <p className="text-3xl font-bold text-amber-600">{data.documentStatus.pending}</p>
            <p className="text-sm text-amber-700 mt-1">Pending</p>
            <p className="text-xs text-amber-600 mt-2">
              {totalDocuments > 0 ? Math.round((data.documentStatus.pending / totalDocuments) * 100) : 0}%
            </p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{data.documentStatus.expired}</p>
            <p className="text-sm text-red-700 mt-1">Expired</p>
            <p className="text-xs text-red-600 mt-2">
              {totalDocuments > 0 ? Math.round((data.documentStatus.expired / totalDocuments) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Completion Rate</span>
            <span className="font-medium text-gray-900">
              {totalDocuments > 0 ? Math.round((data.documentStatus.signed / totalDocuments) * 100) : 0}%
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {data.documentStatus.signed >= data.documentStatus.pending ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-xs text-green-600">Above target</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs text-red-600">Below target</span>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}