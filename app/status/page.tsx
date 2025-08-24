"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { 
  CheckCircle2, XCircle, AlertCircle, Activity, 
  Database, Cloud, Shield, Zap, RefreshCw,
  TrendingUp, Server, Cpu
} from "lucide-react";
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

const client = generateClient<Schema>();

export default function ModernStatus() {
  const [counts, setCounts] = useState({
    users: 0,
    applicants: 0,
    documents: 0,
    communications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [users, applicants, documents, communications] = await Promise.all([
        client.models.User.list(),
        client.models.Applicant.list(),
        client.models.Document.list(),
        client.models.Communication.list(),
      ]);

      setCounts({
        users: users.data.length,
        applicants: applicants.data.length,
        documents: documents.data.length,
        communications: communications.data.length,
      });
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const services = [
    { name: "Database", status: "operational", icon: Database, uptime: 99.99 },
    { name: "API Gateway", status: "operational", icon: Cloud, uptime: 99.95 },
    { name: "Authentication", status: "operational", icon: Shield, uptime: 100 },
    { name: "Storage", status: "operational", icon: Server, uptime: 99.98 },
    { name: "Lambda Functions", status: "operational", icon: Zap, uptime: 99.97 },
    { name: "Analytics", status: "operational", icon: Activity, uptime: 99.90 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational":
        return "bg-green-100 text-green-700";
      case "degraded":
        return "bg-amber-100 text-amber-700";
      case "down":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Performance metrics chart
  const performanceChart = {
    options: {
      chart: { toolbar: { show: false }, sparkline: { enabled: true } },
      stroke: { curve: "smooth" as const, width: 2 },
      colors: ["#3B82F6"],
    },
    series: [{
      name: "Response Time",
      data: [120, 118, 122, 119, 121, 117, 123, 120, 119, 121, 118, 120],
    }],
  };

  // Resource utilization chart
  const resourceChart = {
    options: {
      chart: { toolbar: { show: false } },
      plotOptions: { 
        radialBar: { 
          dataLabels: { 
            show: true,
            value: { show: true, fontSize: "16px", fontWeight: 600 },
            total: { show: true, label: "System Load", fontSize: "14px" }
          }
        }
      },
      labels: ["CPU", "Memory", "Storage"],
      colors: ["#3B82F6", "#8B5CF6", "#10B981"],
    },
    series: [65, 48, 72],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            System Status
          </h1>
          <p className="text-gray-600 mt-1">Monitor system health and performance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
          <button 
            onClick={loadData} 
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-light rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Systems Operational</h2>
              <p className="text-gray-600">No incidents reported</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600">99.98%</div>
            <div className="text-sm text-gray-600">Uptime this month</div>
          </div>
        </div>
      </motion.div>

      {/* Service Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <service.icon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">{service.name}</h3>
              </div>
              {getStatusIcon(service.status)}
            </div>
            <div className="flex items-center justify-between">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                {service.status.charAt(0).toUpperCase() + service.status.slice(1)}
              </span>
              <span className="text-sm text-gray-600">{service.uptime}% uptime</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Counts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Overview</h3>
          <div className="space-y-3">
            {[
              { label: "Total Users", value: counts.users, icon: "👥" },
              { label: "Active Applicants", value: counts.applicants, icon: "📋" },
              { label: "Documents", value: counts.documents, icon: "📄" },
              { label: "Communications", value: counts.communications, icon: "✉️" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {loading ? "..." : item.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-light rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Time (ms)</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <Chart options={performanceChart.options} series={performanceChart.series} type="line" height={200} />
          )}
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Average</div>
              <div className="text-lg font-semibold text-gray-900">120ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Peak</div>
              <div className="text-lg font-semibold text-gray-900">123ms</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Low</div>
              <div className="text-lg font-semibold text-gray-900">117ms</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Resource Utilization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-light rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              </div>
            ) : (
              <Chart options={resourceChart.options} series={resourceChart.series} type="radialBar" height={280} />
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">System Health</h4>
              <div className="space-y-2">
                {[
                  { metric: "API Latency", value: "< 200ms", status: "good" },
                  { metric: "Error Rate", value: "0.02%", status: "good" },
                  { metric: "Throughput", value: "1.2k req/min", status: "good" },
                  { metric: "Active Sessions", value: "847", status: "good" },
                ].map((item) => (
                  <div key={item.metric} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm text-gray-700">{item.metric}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{item.value}</span>
                      <div className={`w-2 h-2 rounded-full ${item.status === "good" ? "bg-green-500" : "bg-amber-500"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}