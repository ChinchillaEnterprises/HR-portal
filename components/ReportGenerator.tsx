"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Download, 
  FileText, 
  Users, 
  BarChart3, 
  Calendar,
  Filter,
  Settings,
  Clock,
  CheckCircle2
} from "lucide-react";
import { ReportService } from "@/lib/reportService";

interface ReportGeneratorProps {
  className?: string;
}

export default function ReportGenerator({ className = "" }: ReportGeneratorProps) {
  const [selectedReport, setSelectedReport] = useState<string>("applicants");
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>("pdf");
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [generating, setGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const reportTypes = [
    {
      id: "applicants",
      name: "Applicant Report",
      description: "Comprehensive view of all applicants, their status, and application details",
      icon: Users,
      color: "bg-blue-500",
      formats: ['pdf', 'excel', 'csv'],
    },
    {
      id: "onboarding",
      name: "Onboarding Progress",
      description: "Track onboarding workflows, completion rates, and task progress",
      icon: CheckCircle2,
      color: "bg-green-500",
      formats: ['pdf', 'excel'],
    },
    {
      id: "documents",
      name: "Document Activity",
      description: "Document uploads, signatures, and processing activity",
      icon: FileText,
      color: "bg-purple-500",
      formats: ['pdf', 'excel'],
    },
    {
      id: "dashboard",
      name: "Executive Dashboard",
      description: "High-level overview with key metrics and analytics",
      icon: BarChart3,
      color: "bg-orange-500",
      formats: ['pdf', 'excel'],
    },
  ];

  const formatOptions = [
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Formatted report with charts' },
    { value: 'excel', label: 'Excel', icon: BarChart3, description: 'Spreadsheet with data analysis' },
    { value: 'csv', label: 'CSV', icon: Download, description: 'Raw data export' },
  ];

  const handleGenerateReport = async () => {
    setGenerating(true);
    
    try {
      const options = {
        title: reportTypes.find(r => r.id === selectedReport)?.name || "Report",
        description: `Generated on ${new Date().toLocaleString()}`,
        includeCharts: selectedFormat === 'pdf',
        includeMetadata: true,
        dateRange: dateRange.start && dateRange.end ? dateRange : undefined,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
      };

      let result;
      switch (selectedReport) {
        case "applicants":
          result = await ReportService.generateApplicantReport(selectedFormat, options);
          break;
        case "onboarding":
          result = await ReportService.generateOnboardingReport(selectedFormat, options);
          break;
        case "documents":
          result = await ReportService.generateDocumentReport(selectedFormat, options);
          break;
        case "dashboard":
          result = await ReportService.generateDashboardReport(selectedFormat, options);
          break;
        default:
          throw new Error("Invalid report type");
      }

      if (result.success) {
        // Show success message
        alert(`Report generated successfully! ${result.fileName}`);
      } else {
        alert(`Error generating report: ${result.error}`);
      }
    } catch (error) {
      alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const selectedReportType = reportTypes.find(r => r.id === selectedReport);
  const availableFormats = selectedReportType?.formats || ['pdf'];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Download className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Report Generator</h3>
            <p className="text-sm text-gray-600">Generate and download comprehensive reports</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Report Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Report Type
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    selectedReport === report.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${report.color} rounded-lg`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{report.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-3">
            {formatOptions.map((format) => {
              const Icon = format.icon;
              const isAvailable = availableFormats.includes(format.value as any);
              return (
                <button
                  key={format.value}
                  onClick={() => isAvailable && setSelectedFormat(format.value as any)}
                  disabled={!isAvailable}
                  className={`p-3 border-2 rounded-lg text-center transition-all ${
                    selectedFormat === format.value && isAvailable
                      ? 'border-gray-900 bg-gray-50'
                      : isAvailable
                      ? 'border-gray-200 hover:border-gray-300'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <Icon className={`w-5 h-5 mx-auto mb-2 ${
                    isAvailable ? 'text-gray-600' : 'text-gray-400'
                  }`} />
                  <div className="text-sm font-medium text-gray-900">{format.label}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.description}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <Settings className="w-4 h-4" />
            Advanced Options
            <motion.div
              animate={{ rotate: showAdvanced ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </button>

          {showAdvanced && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg"
            >
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Filters */}
              {selectedReport === "applicants" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filters
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Status</label>
                      <select
                        value={filters.status || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="interviewed">Interviewed</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Position</label>
                      <input
                        type="text"
                        placeholder="Filter by position..."
                        value={filters.position || ""}
                        onChange={(e) => setFilters(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Generate Button */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating Report...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Generate & Download Report
              </>
            )}
          </button>
        </div>

        {/* Report Preview Info */}
        {selectedReportType && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <div className={`p-2 ${selectedReportType.color} rounded-lg`}>
                <selectedReportType.icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">{selectedReportType.name}</h4>
                <p className="text-sm text-blue-700 mt-1">{selectedReportType.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Est. generation time: 10-30 seconds
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    Format: {selectedFormat.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}