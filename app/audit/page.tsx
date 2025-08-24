"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Shield,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Clock,
  User,
  FileText,
  Mail,
  Settings,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGate from "@/components/PermissionGate";
import { 
  PERMISSIONS,
  getRoleDisplayName,
} from "@/lib/auth/rbac";
import {
  AuditService,
  AuditLog,
  AuditAction,
  AuditSeverity,
} from "@/lib/auditService";

export default function AuditLogPage() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userEmail: "",
    action: "",
    resourceType: "",
    severity: "",
    success: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(0);
  const [pageSize] = useState(50);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadLogs();
  }, [page, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        limit: pageSize,
        offset: page * pageSize,
      };

      // Apply filters
      if (filters.userEmail) params.userEmail = filters.userEmail;
      if (filters.action) params.action = filters.action;
      if (filters.resourceType) params.resourceType = filters.resourceType;
      if (filters.severity) params.severity = filters.severity;
      if (filters.success !== "") params.success = filters.success === "true";
      if (filters.startDate) params.startDate = new Date(filters.startDate);
      if (filters.endDate) params.endDate = new Date(filters.endDate);

      const result = await AuditService.query(params);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (error) {
      console.error("Error loading audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    const result = await AuditService.exportLogs(format, {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
      success: filters.success !== "" ? filters.success === "true" : undefined,
    });

    if (result.success && result.data) {
      // Download file
      const blob = new Blob([result.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename!;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.startsWith('auth')) return LogIn;
    if (action.startsWith('user')) return User;
    if (action.startsWith('document')) return FileText;
    if (action.startsWith('email')) return Mail;
    if (action.startsWith('settings')) return Settings;
    return Shield;
  };

  const getSeverityIcon = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.INFO: return Info;
      case AuditSeverity.WARNING: return AlertCircle;
      case AuditSeverity.ERROR: return XCircle;
      case AuditSeverity.CRITICAL: return XCircle;
      default: return Info;
    }
  };

  const getSeverityColor = (severity: AuditSeverity) => {
    switch (severity) {
      case AuditSeverity.INFO: return 'text-blue-600';
      case AuditSeverity.WARNING: return 'text-yellow-600';
      case AuditSeverity.ERROR: return 'text-red-600';
      case AuditSeverity.CRITICAL: return 'text-red-800';
      default: return 'text-gray-600';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Audit Logs
          </h1>
          <p className="mt-2 text-gray-600">
            Track and monitor all system activities
          </p>
        </div>

        <PermissionGate
          permission={PERMISSIONS.AUDIT_VIEW}
          fallback={
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to view audit logs.
              </p>
            </div>
          }
        >
          {/* Filters and Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <Filter className="w-5 h-5" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={loadLogs}
                  disabled={loading}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>

                <PermissionGate permission={PERMISSIONS.AUDIT_EXPORT}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('csv')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => handleExport('json')}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export JSON
                    </button>
                  </div>
                </PermissionGate>
              </div>
            </div>

            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t border-gray-200 pt-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email
                    </label>
                    <input
                      type="text"
                      value={filters.userEmail}
                      onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
                      placeholder="Search by email..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Action Type
                    </label>
                    <select
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Actions</option>
                      <optgroup label="Authentication">
                        <option value={AuditAction.LOGIN}>Login</option>
                        <option value={AuditAction.LOGOUT}>Logout</option>
                        <option value={AuditAction.LOGIN_FAILED}>Login Failed</option>
                      </optgroup>
                      <optgroup label="User Management">
                        <option value={AuditAction.USER_CREATE}>User Create</option>
                        <option value={AuditAction.USER_UPDATE}>User Update</option>
                        <option value={AuditAction.ROLE_ASSIGN}>Role Assign</option>
                      </optgroup>
                      <optgroup label="Documents">
                        <option value={AuditAction.DOCUMENT_UPLOAD}>Document Upload</option>
                        <option value={AuditAction.DOCUMENT_DOWNLOAD}>Document Download</option>
                        <option value={AuditAction.DOCUMENT_DELETE}>Document Delete</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severity
                    </label>
                    <select
                      value={filters.severity}
                      onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All Severities</option>
                      <option value={AuditSeverity.INFO}>Info</option>
                      <option value={AuditSeverity.WARNING}>Warning</option>
                      <option value={AuditSeverity.ERROR}>Error</option>
                      <option value={AuditSeverity.CRITICAL}>Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="datetime-local"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="datetime-local"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={filters.success}
                      onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="">All</option>
                      <option value="true">Success</option>
                      <option value="false">Failed</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setFilters({
                        userEmail: "",
                        action: "",
                        resourceType: "",
                        severity: "",
                        success: "",
                        startDate: "",
                        endDate: "",
                      });
                      setPage(0);
                    }}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={() => {
                      setPage(0);
                      loadLogs();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading audit logs...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No audit logs found
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Timestamp
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Resource
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {logs.map((log, index) => {
                        const ActionIcon = getActionIcon(log.action);
                        const SeverityIcon = getSeverityIcon(log.severity);
                        return (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-400" />
                                {formatTimestamp(log.timestamp)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{log.userEmail}</div>
                              {log.userRole && (
                                <div className="text-xs text-gray-500">
                                  {getRoleDisplayName(log.userRole as any)}
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <ActionIcon className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-900">
                                  {log.action.replace('.', ' ')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {log.resourceType && log.resourceId ? (
                                <div>
                                  <div className="font-medium">{log.resourceName || log.resourceId}</div>
                                  <div className="text-xs text-gray-500">{log.resourceType}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {log.success ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                )}
                                <SeverityIcon 
                                  className={`w-4 h-4 ${getSeverityColor(log.severity)}`} 
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {log.errorMessage ? (
                                <span className="text-red-600">{log.errorMessage}</span>
                              ) : log.details ? (
                                <span className="text-gray-600">
                                  {JSON.stringify(log.details).substring(0, 50)}...
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, total)} of {total} entries
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={(page + 1) * pageSize >= total}
                      className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}