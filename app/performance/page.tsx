"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Zap,
  Database,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  BarChart3,
} from "lucide-react";
import { PerformanceMonitor } from "@/lib/performance/performanceMonitor";
import { CacheService } from "@/lib/performance/cacheService";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGate from "@/components/PermissionGate";
import { PERMISSIONS } from "@/lib/auth/rbac";

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  icon: any;
  color: string;
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [slowOperations, setSlowOperations] = useState<any[]>([]);
  const [cacheStats, setCacheStats] = useState({ size: 0, hitRate: 0 });
  const [timeRange, setTimeRange] = useState<number>(5 * 60 * 1000); // 5 minutes
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    setRefreshing(true);
    try {
      // Get performance report
      const report = PerformanceMonitor.getReport(undefined, timeRange);
      
      // Get slow operations
      const slow = PerformanceMonitor.getSlowOperations(500);
      setSlowOperations(slow.slice(0, 10));

      // Calculate metrics
      const avgResponseTime = report.summary.averageDuration;
      const totalOperations = report.summary.operationCount;
      const errorRate = calculateErrorRate(report.metrics);
      const throughput = calculateThroughput(report.metrics, timeRange);

      // Cache statistics
      const cacheSize = CacheService.size();
      setCacheStats({
        size: cacheSize,
        hitRate: calculateCacheHitRate(),
      });

      // Update metric cards
      setMetrics([
        {
          title: "Avg Response Time",
          value: `${avgResponseTime.toFixed(2)}ms`,
          change: calculateChange('responseTime', avgResponseTime),
          icon: Clock,
          color: "blue",
        },
        {
          title: "Operations/min",
          value: throughput.toFixed(0),
          change: calculateChange('throughput', throughput),
          icon: Activity,
          color: "green",
        },
        {
          title: "Error Rate",
          value: `${errorRate.toFixed(1)}%`,
          change: calculateChange('errorRate', errorRate),
          icon: AlertTriangle,
          color: errorRate > 5 ? "red" : "yellow",
        },
        {
          title: "Cache Hit Rate",
          value: `${cacheStats.hitRate.toFixed(1)}%`,
          change: calculateChange('cacheHitRate', cacheStats.hitRate),
          icon: Database,
          color: "purple",
        },
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateErrorRate = (metrics: any[]) => {
    const failed = metrics.filter(m => m.metadata?.success === false).length;
    return metrics.length > 0 ? (failed / metrics.length) * 100 : 0;
  };

  const calculateThroughput = (metrics: any[], timeWindowMs: number) => {
    const minutes = timeWindowMs / 60000;
    return metrics.length / minutes;
  };

  const calculateCacheHitRate = () => {
    // This is a mock calculation - in real app, track cache hits/misses
    return 75 + Math.random() * 20;
  };

  const calculateChange = (metric: string, value: number) => {
    // Mock calculation - in real app, compare with previous period
    return (Math.random() - 0.5) * 20;
  };

  const handleExport = () => {
    const data = PerformanceMonitor.exportMetrics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    CacheService.clear();
    loadMetrics();
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Zap className="w-8 h-8 text-yellow-500" />
            Performance Monitor
          </h1>
          <p className="mt-2 text-gray-600">
            Real-time application performance metrics
          </p>
        </div>

        <PermissionGate
          permission={PERMISSIONS.SETTINGS_VIEW}
          fallback={
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to view performance metrics.
              </p>
            </div>
          }
        >
          {/* Controls */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">
                  Time Range:
                </label>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value={5 * 60 * 1000}>Last 5 minutes</option>
                  <option value={15 * 60 * 1000}>Last 15 minutes</option>
                  <option value={60 * 60 * 1000}>Last hour</option>
                  <option value={24 * 60 * 60 * 1000}>Last 24 hours</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadMetrics}
                  disabled={refreshing}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Clear Cache
                </button>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              const isPositive = metric.title === "Error Rate" 
                ? (metric.change || 0) < 0 
                : (metric.change || 0) > 0;
              
              return (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg shadow-md p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                      <Icon className={`w-6 h-6 text-${metric.color}-600`} />
                    </div>
                    {metric.change !== undefined && (
                      <div className={`flex items-center gap-1 text-sm ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4" />
                        ) : (
                          <TrendingDown className="w-4 h-4" />
                        )}
                        {Math.abs(metric.change).toFixed(1)}%
                      </div>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{metric.value}</h3>
                  <p className="text-sm text-gray-600">{metric.title}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Slow Operations */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Slow Operations
            </h2>
            
            {slowOperations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No slow operations detected
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Operation</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Duration</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Time</th>
                      <th className="text-left py-2 text-sm font-medium text-gray-700">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slowOperations.map((op, index) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-2 text-sm text-gray-900">{op.name}</td>
                        <td className="py-2 text-sm">
                          <span className={`font-medium ${
                            op.duration > 1000 ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {formatDuration(op.duration)}
                          </span>
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {new Date(op.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 text-sm text-gray-600">
                          {op.metadata ? JSON.stringify(op.metadata).substring(0, 50) + '...' : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Cache Statistics */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              Cache Statistics
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cache Size</p>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.size} items</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Hit Rate</p>
                <p className="text-2xl font-bold text-gray-900">{cacheStats.hitRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Memory Usage</p>
                <p className="text-2xl font-bold text-gray-900">~{(cacheStats.size * 0.5).toFixed(1)} KB</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Clear cache regularly to free up memory and ensure fresh data. 
                The cache automatically expires entries after their TTL.
              </p>
            </div>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}