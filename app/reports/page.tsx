"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import {
  BarChart3,
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  FileText,
  Calendar,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Activity,
  Target,
  Award,
  Briefcase,
  FileSpreadsheet,
  File,
  Printer,
  ChevronDown,
  Settings,
  PieChart,
  CheckCircle,
  AlertCircle,
  X,
  Share2,
  Mail,
} from "lucide-react";

const client = generateClient<Schema>();

interface ReportFilters {
  dateRange: string;
  department: string;
  userRole: string;
  status: string;
  reportType: string;
}

interface ExportOptions {
  format: "csv" | "pdf" | "excel";
  sections: string[];
  includeCharts: boolean;
  emailReport: boolean;
  emailAddress?: string;
}

function ReportsPage({ user }: { user: any }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeInterns: 0,
    completedOnboarding: 0,
    pendingTasks: 0,
    documentsProcessed: 0,
    applicantsThisMonth: 0,
    avgOnboardingTime: 0,
    taskCompletionRate: 0,
    hiredThisMonth: 0,
    pendingDocuments: 0,
    communicationsSent: 0,
    departmentStats: {} as Record<string, number>,
  });
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: "30",
    department: "all",
    userRole: "all",
    status: "all",
    reportType: "overview",
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "pdf",
    sections: ["overview", "onboarding", "recruitment", "departments"],
    includeCharts: true,
    emailReport: false,
  });
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [tasks, setTasks] = useState<Array<Schema["OnboardingTask"]["type"]>>([]);
  const [documents, setDocuments] = useState<Array<Schema["Document"]["type"]>>([]);
  const [applicants, setApplicants] = useState<Array<Schema["Applicant"]["type"]>>([]);
  const [communications, setCommunications] = useState<Array<Schema["Communication"]["type"]>>([]);

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Fetch all necessary data
      const [usersData, tasksData, documentsData, applicantsData, communicationsData] = await Promise.all([
        client.models.User.list(),
        client.models.OnboardingTask.list(),
        client.models.Document.list(),
        client.models.Applicant.list(),
        client.models.Communication.list(),
      ]);

      // Store raw data
      setUsers(usersData.data);
      setTasks(tasksData.data);
      setDocuments(documentsData.data);
      setApplicants(applicantsData.data);
      setCommunications(communicationsData.data);

      // Apply filters
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(filters.dateRange));
      
      // Filter users
      let filteredUsers = usersData.data;
      if (filters.department !== "all") {
        filteredUsers = filteredUsers.filter(u => u.department === filters.department);
      }
      if (filters.userRole !== "all") {
        filteredUsers = filteredUsers.filter(u => u.role === filters.userRole);
      }
      if (filters.status !== "all") {
        filteredUsers = filteredUsers.filter(u => u.status === filters.status);
      }
      
      // Filter tasks by user
      const userIds = filteredUsers.map(u => u.id);
      const filteredTasks = tasksData.data.filter(t => userIds.includes(t.userId || ""));
      
      // Calculate statistics
      const totalUsers = filteredUsers.length;
      const activeInterns = filteredUsers.filter(u => u.role === "intern").length;
      
      const completedTasks = filteredTasks.filter(t => t.status === "completed").length;
      const totalTasks = filteredTasks.length;
      const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      const pendingTasks = filteredTasks.filter(t => t.status === "pending" || t.status === "in_progress").length;
      
      const signedDocs = documentsData.data.filter(d => 
        d.signatureStatus === "signed" && 
        new Date(d.createdAt) > daysAgo
      ).length;
      
      const pendingDocs = documentsData.data.filter(d => 
        d.signatureStatus === "pending"
      ).length;
      
      // Filter applicants by date
      const recentApplicants = applicantsData.data.filter(a => 
        new Date(a.appliedDate) > daysAgo
      );
      
      const hiredThisMonth = recentApplicants.filter(a => a.status === "hired").length;
      
      // Communications sent
      const recentComms = communicationsData.data.filter(c => 
        c.sentDate && new Date(c.sentDate) > daysAgo
      ).length;
      
      // Department statistics
      const deptStats: Record<string, number> = {};
      filteredUsers.forEach(u => {
        if (u.department) {
          deptStats[u.department] = (deptStats[u.department] || 0) + 1;
        }
      });

      // Calculate average onboarding time
      const completedUsers = filteredUsers.filter(u => u.onboardingCompleted);
      let avgOnboardingDays = 14;
      if (completedUsers.length > 0) {
        const totalDays = completedUsers.reduce((acc, u) => {
          if (u.startDate && u.onboardingCompleted) {
            const start = new Date(u.startDate);
            const completed = new Date(u.onboardingCompleted);
            const days = Math.floor((completed.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            return acc + days;
          }
          return acc;
        }, 0);
        avgOnboardingDays = Math.round(totalDays / completedUsers.length);
      }

      setStats({
        totalUsers,
        activeInterns,
        completedOnboarding: completedTasks,
        pendingTasks,
        documentsProcessed: signedDocs,
        applicantsThisMonth: recentApplicants.length,
        avgOnboardingTime: avgOnboardingDays,
        taskCompletionRate,
        hiredThisMonth,
        pendingDocuments: pendingDocs,
        communicationsSent: recentComms,
        departmentStats: deptStats,
      });
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = "black" 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    trend?: "up" | "down"; 
    trendValue?: string;
    color?: string;
  }) => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color === "black" ? "black" : color + "-100"}`}>
          <Icon className={`w-6 h-6 ${color === "black" ? "text-white" : `text-${color}-600`}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
      <p className="text-sm text-gray-600 mt-1">{title}</p>
    </div>
  );

  const handleExport = async () => {
    // In a real app, this would generate actual files
    const reportData = {
      generatedDate: new Date().toISOString(),
      filters: filters,
      stats: stats,
      users: users,
      tasks: tasks,
      documents: documents,
      applicants: applicants,
    };
    
    if (exportOptions.format === "csv") {
      // Generate CSV
      console.log("Generating CSV report...", reportData);
    } else if (exportOptions.format === "pdf") {
      // Generate PDF
      console.log("Generating PDF report...", reportData);
    } else if (exportOptions.format === "excel") {
      // Generate Excel
      console.log("Generating Excel report...", reportData);
    }
    
    if (exportOptions.emailReport && exportOptions.emailAddress) {
      console.log("Emailing report to:", exportOptions.emailAddress);
    }
    
    setShowExportModal(false);
  };

  const chartData = [
    { month: "Jan", onboarded: 12, applications: 45 },
    { month: "Feb", onboarded: 15, applications: 52 },
    { month: "Mar", onboarded: 18, applications: 61 },
    { month: "Apr", onboarded: 22, applications: 73 },
    { month: "May", onboarded: 20, applications: 68 },
    { month: "Jun", onboarded: 25, applications: 82 },
  ];
  
  const uniqueDepartments = Array.from(new Set(users.map(u => u.department).filter((dept): dept is string => Boolean(dept))));
  const uniqueRoles = Array.from(new Set(users.map(u => u.role).filter(Boolean))) as string[];

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setShowFilterModal(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              Filters
              <ChevronDown className="w-4 h-4 ml-2" />
            </button>
            <button 
              onClick={() => setShowExportModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Team Members"
                value={stats.totalUsers}
                icon={Users}
                trend="up"
                trendValue="12%"
              />
              <StatCard
                title="Active Interns"
                value={stats.activeInterns}
                icon={Briefcase}
                trend="up"
                trendValue="8%"
                color="blue"
              />
              <StatCard
                title="Task Completion Rate"
                value={`${stats.taskCompletionRate.toFixed(0)}%`}
                icon={Target}
                trend="up"
                trendValue="5%"
                color="green"
              />
              <StatCard
                title="Avg Onboarding Time"
                value={`${stats.avgOnboardingTime} days`}
                icon={Clock}
                trend="down"
                trendValue="2 days"
                color="purple"
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="New Applicants"
                value={stats.applicantsThisMonth}
                icon={UserCheck}
                trend="up"
                trendValue="15%"
                color="indigo"
              />
              <StatCard
                title="Hired This Month"
                value={stats.hiredThisMonth}
                icon={Award}
                color="green"
              />
              <StatCard
                title="Pending Documents"
                value={stats.pendingDocuments}
                icon={FileText}
                trend="down"
                trendValue="3"
                color="yellow"
              />
              <StatCard
                title="Communications Sent"
                value={stats.communicationsSent}
                icon={Mail}
                trend="up"
                trendValue="20%"
                color="blue"
              />
            </div>

            {/* Performance Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Onboarding Progress</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Completed Onboarding</span>
                      <span className="font-medium">{stats.completedOnboarding}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(stats.completedOnboarding / (stats.completedOnboarding + stats.pendingTasks)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Pending Tasks</span>
                      <span className="font-medium">{stats.pendingTasks}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(stats.pendingTasks / (stats.completedOnboarding + stats.pendingTasks)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Documents Processed</span>
                      <span className="font-medium">{stats.documentsProcessed}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: "75%" }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Pipeline</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Activity className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium">New Applications</span>
                    </div>
                    <span className="text-2xl font-bold">{stats.applicantsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <UserCheck className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium">Interview Stage</span>
                    </div>
                    <span className="text-2xl font-bold">12</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium">Offers Extended</span>
                    </div>
                    <span className="text-2xl font-bold">8</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trends */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h2>
              <div className="h-64 flex items-end justify-between space-x-2">
                {chartData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col space-y-1">
                      <div 
                        className="bg-black rounded-t"
                        style={{ height: `${(data.onboarded / 30) * 200}px` }}
                        title={`Onboarded: ${data.onboarded}`}
                      />
                      <div 
                        className="bg-gray-400 rounded-t"
                        style={{ height: `${(data.applications / 100) * 200}px` }}
                        title={`Applications: ${data.applications}`}
                      />
                    </div>
                    <span className="text-xs text-gray-600 mt-2">{data.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center mt-4 space-x-6">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-black rounded mr-2" />
                  <span className="text-sm text-gray-600">Onboarded</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-400 rounded mr-2" />
                  <span className="text-sm text-gray-600">Applications</span>
                </div>
              </div>
            </div>

            {/* Department Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Overview</h2>
              {Object.keys(stats.departmentStats).length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(stats.departmentStats).map(([dept, count]) => (
                    <div key={dept} className="text-center p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-gray-600">{dept}</p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-black h-2 rounded-full"
                            style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {((count / stats.totalUsers) * 100).toFixed(0)}% of total
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No department data available
                </div>
              )}
            </div>
          </>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Report Filters</h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    value={filters.department}
                    onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Departments</option>
                    {uniqueDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Role
                  </label>
                  <select
                    value={filters.userRole}
                    onChange={(e) => setFilters({ ...filters, userRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Roles</option>
                    {uniqueRoles.map(role => (
                      <option key={role} value={role}>
                        {role?.replace("_", " ").charAt(0).toUpperCase() + role?.slice(1).replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Report Type
                  </label>
                  <select
                    value={filters.reportType}
                    onChange={(e) => setFilters({ ...filters, reportType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="overview">Overview</option>
                    <option value="onboarding">Onboarding Focus</option>
                    <option value="recruitment">Recruitment Focus</option>
                    <option value="performance">Performance Metrics</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setFilters({
                      dateRange: "30",
                      department: "all",
                      userRole: "all",
                      status: "all",
                      reportType: "overview",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Export Report</h2>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Format
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "pdf", label: "PDF", icon: File },
                      { value: "csv", label: "CSV", icon: FileSpreadsheet },
                      { value: "excel", label: "Excel", icon: FileSpreadsheet },
                    ].map((format) => (
                      <button
                        key={format.value}
                        onClick={() => setExportOptions({ ...exportOptions, format: format.value as any })}
                        className={`p-4 border rounded-lg transition-all ${
                          exportOptions.format === format.value
                            ? "border-black bg-gray-50"
                            : "border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <format.icon className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm font-medium">{format.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Report Sections
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: "overview", label: "Overview & Key Metrics" },
                      { value: "onboarding", label: "Onboarding Progress" },
                      { value: "recruitment", label: "Recruitment Pipeline" },
                      { value: "departments", label: "Department Statistics" },
                      { value: "performance", label: "Performance Metrics" },
                      { value: "raw_data", label: "Raw Data Tables" },
                    ].map((section) => (
                      <label key={section.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={exportOptions.sections.includes(section.value)}
                          onChange={(e) => {
                            const newSections = e.target.checked
                              ? [...exportOptions.sections, section.value]
                              : exportOptions.sections.filter(s => s !== section.value);
                            setExportOptions({ ...exportOptions, sections: newSections });
                          }}
                          className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">{section.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Options */}
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeCharts}
                      onChange={(e) => setExportOptions({ ...exportOptions, includeCharts: e.target.checked })}
                      className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include charts and visualizations</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exportOptions.emailReport}
                      onChange={(e) => setExportOptions({ ...exportOptions, emailReport: e.target.checked })}
                      className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Email report when ready</span>
                  </label>

                  {exportOptions.emailReport && (
                    <input
                      type="email"
                      value={exportOptions.emailAddress || ""}
                      onChange={(e) => setExportOptions({ ...exportOptions, emailAddress: e.target.value })}
                      placeholder="Enter email address"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  )}
                </div>

                {/* Current Filters Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Filters</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Date Range: Last {filters.dateRange} days</p>
                    <p>Department: {filters.department === "all" ? "All" : filters.department}</p>
                    <p>Role: {filters.userRole === "all" ? "All" : filters.userRole}</p>
                    <p>Status: {filters.status === "all" ? "All" : filters.status}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={exportOptions.sections.length === 0}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function ReportsPageWrapper() {
  return (
    <Authenticator>
      {({ signOut, user }) => <ReportsPage user={user} />}
    </Authenticator>
  );
}