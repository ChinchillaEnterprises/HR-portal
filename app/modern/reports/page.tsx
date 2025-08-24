"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { TrendingUp, Users, AlertCircle, Download, RefreshCw } from "lucide-react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const client = generateClient<Schema>();

export default function ReportsAnalytics() {
  const [data, setData] = useState<any>({
    users: [],
    applicants: [],
    communications: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, applicantsRes, commsRes] = await Promise.all([
        client.models.User.list(),
        client.models.Applicant.list(),
        client.models.Communication.list(),
      ]);
      
      setData({
        users: usersRes.data,
        applicants: applicantsRes.data,
        communications: commsRes.data,
      });
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate key metrics from roadmap
  const metrics = {
    progressRates: {
      completed: data.users.filter((u: any) => u.onboardingCompleted).length,
      inProgress: data.users.filter((u: any) => !u.onboardingCompleted && u.status === 'active').length,
      pending: data.users.filter((u: any) => u.status === 'pending').length,
    },
    applicantConversion: {
      total: data.applicants.length,
      hired: data.applicants.filter((a: any) => a.status === 'hired').length,
      rejected: data.applicants.filter((a: any) => a.status === 'rejected').length,
      inPipeline: data.applicants.filter((a: any) => ['applied', 'screening', 'interview', 'offer'].includes(a.status)).length,
    },
    alerts: [
      { type: 'warning', message: '3 documents pending signatures', priority: 'high' },
      { type: 'info', message: '2 new applicants this week', priority: 'medium' },
      { type: 'warning', message: '1 onboarding deadline approaching', priority: 'high' },
    ],
  };

  // Progress rates chart
  const progressChart = {
    options: {
      chart: { toolbar: { show: false } },
      labels: ['Completed', 'In Progress', 'Pending'],
      colors: ['#22c55e', '#3b82f6', '#6b7280'],
      legend: { position: 'bottom' as const },
    },
    series: [
      metrics.progressRates.completed,
      metrics.progressRates.inProgress,
      metrics.progressRates.pending,
    ],
  };

  // Applicant conversion funnel
  const conversionChart = {
    options: {
      chart: { toolbar: { show: false }, type: 'bar' as const },
      plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
      colors: ['#6b7280'],
      xaxis: { 
        categories: ['Applied', 'Screening', 'Interview', 'Offer', 'Hired'],
      },
    },
    series: [{
      name: 'Candidates',
      data: [
        data.applicants.filter((a: any) => a.status === 'applied').length,
        data.applicants.filter((a: any) => a.status === 'screening').length,
        data.applicants.filter((a: any) => a.status === 'interview').length,
        data.applicants.filter((a: any) => a.status === 'offer').length,
        data.applicants.filter((a: any) => a.status === 'hired').length,
      ],
    }],
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Progress rates, applicant conversion, and alerts</p>
        </div>
        <div className="flex items-center gap-4">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
          <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboarding Progress</h3>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? "..." : `${Math.round((metrics.progressRates.completed / (metrics.progressRates.completed + metrics.progressRates.inProgress + metrics.progressRates.pending)) * 100)}%`}
          </div>
          <p className="text-sm text-gray-600 mt-1">Overall completion rate</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Applicant Conversion</h3>
          <div className="text-3xl font-bold text-gray-900">
            {loading ? "..." : `${metrics.applicantConversion.total > 0 ? Math.round((metrics.applicantConversion.hired / metrics.applicantConversion.total) * 100) : 0}%`}
          </div>
          <p className="text-sm text-gray-600 mt-1">Applied to hired ratio</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Alerts</h3>
          <div className="text-3xl font-bold text-gray-900">{metrics.alerts.length}</div>
          <p className="text-sm text-gray-600 mt-1">Requiring attention</p>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progress Rates */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress Rates</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
          ) : (
            <Chart options={progressChart.options} series={progressChart.series} type="donut" height={250} />
          )}
        </motion.div>

        {/* Applicant Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Conversion Funnel</h3>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-gray-500">Loading...</div>
          ) : (
            <Chart options={conversionChart.options} series={conversionChart.series} type="bar" height={250} />
          )}
        </motion.div>
      </div>

      {/* Alerts & Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
          <button 
            onClick={loadData} 
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="space-y-3">
          {metrics.alerts.map((alert, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              {getAlertIcon(alert.type)}
              <div className="flex-1">
                <p className="text-sm text-gray-900">{alert.message}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                alert.priority === 'high' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {alert.priority}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Team Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{data.users.length}</p>
            <p className="text-sm text-gray-600">Total Team Size</p>
          </div>
          <div className="text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {data.users.filter((u: any) => {
                const startDate = u.startDate ? new Date(u.startDate) : null;
                if (!startDate) return false;
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return startDate > monthAgo;
              }).length}
            </p>
            <p className="text-sm text-gray-600">New This Month</p>
          </div>
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{metrics.progressRates.pending}</p>
            <p className="text-sm text-gray-600">Pending Onboarding</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{metrics.applicantConversion.inPipeline}</p>
            <p className="text-sm text-gray-600">In Pipeline</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}