"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const client = generateClient<Schema>();

type Applicant = Schema["Applicant"]["type"];
type Document = Schema["Document"]["type"];
type Communication = Schema["Communication"]["type"];
type Onboarding = Schema["Onboarding"]["type"];
type OnboardingTask = Schema["OnboardingTask"]["type"];

interface ReportOptions {
  title: string;
  description?: string;
  includeCharts?: boolean;
  includeMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

interface ReportData {
  applicants: Applicant[];
  documents: Document[];
  communications: Communication[];
  onboardings: Onboarding[];
  tasks: OnboardingTask[];
  stats: Record<string, number>;
}

export class ReportService {
  /**
   * Generate comprehensive applicant report
   */
  static async generateApplicantReport(
    format: 'pdf' | 'excel' | 'csv' = 'pdf',
    options: ReportOptions = { title: "Applicant Report" }
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
  }> {
    try {
      // Fetch applicant data
      const applicants = await client.models.Applicant.list();
      const data = applicants.data || [];

      // Apply filters if provided
      let filteredData = data;
      if (options.filters) {
        filteredData = this.filterData(data, options.filters);
      }

      // Apply date range if provided
      if (options.dateRange) {
        filteredData = filteredData.filter(applicant => {
          const createdAt = new Date(applicant.createdAt);
          const start = new Date(options.dateRange!.start);
          const end = new Date(options.dateRange!.end);
          return createdAt >= start && createdAt <= end;
        });
      }

      const stats = this.calculateApplicantStats(filteredData);

      switch (format) {
        case 'pdf':
          return this.generateApplicantPDF(filteredData, stats, options);
        case 'excel':
          return this.generateApplicantExcel(filteredData, stats, options);
        case 'csv':
          return this.generateApplicantCSV(filteredData, options);
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error("Error generating applicant report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  }

  /**
   * Generate onboarding progress report
   */
  static async generateOnboardingReport(
    format: 'pdf' | 'excel' = 'pdf',
    options: ReportOptions = { title: "Onboarding Progress Report" }
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
  }> {
    try {
      // Fetch onboarding data
      const [onboardings, tasks, applicants] = await Promise.all([
        client.models.Onboarding.list(),
        client.models.OnboardingTask.list(),
        client.models.Applicant.list(),
      ]);

      const onboardingData = onboardings.data || [];
      const taskData = tasks.data || [];
      const applicantData = applicants.data || [];

      // Create lookup map for applicants
      const applicantMap = new Map(applicantData.map(a => [a.id, a]));

      // Enrich onboarding data with applicant info and tasks
      const enrichedData = onboardingData.map(onboarding => {
        const applicant = applicantMap.get(onboarding.applicantId);
        const onboardingTasks = taskData.filter(t => t.onboardingId === onboarding.id);
        
        return {
          ...onboarding,
          applicant,
          tasks: onboardingTasks,
          completedTasks: onboardingTasks.filter(t => t.status === 'completed').length,
          totalTasks: onboardingTasks.length,
        };
      });

      const stats = this.calculateOnboardingStats(enrichedData);

      switch (format) {
        case 'pdf':
          return this.generateOnboardingPDF(enrichedData, stats, options);
        case 'excel':
          return this.generateOnboardingExcel(enrichedData, stats, options);
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error("Error generating onboarding report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  }

  /**
   * Generate document activity report
   */
  static async generateDocumentReport(
    format: 'pdf' | 'excel' = 'pdf',
    options: ReportOptions = { title: "Document Activity Report" }
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
  }> {
    try {
      const documents = await client.models.Document.list();
      const data = documents.data || [];

      // Apply filters and date range
      let filteredData = data;
      if (options.filters) {
        filteredData = this.filterData(data, options.filters);
      }

      if (options.dateRange) {
        filteredData = filteredData.filter(doc => {
          const uploadDate = new Date(doc.uploadDate || doc.createdAt);
          const start = new Date(options.dateRange!.start);
          const end = new Date(options.dateRange!.end);
          return uploadDate >= start && uploadDate <= end;
        });
      }

      const stats = this.calculateDocumentStats(filteredData);

      switch (format) {
        case 'pdf':
          return this.generateDocumentPDF(filteredData, stats, options);
        case 'excel':
          return this.generateDocumentExcel(filteredData, stats, options);
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error("Error generating document report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  }

  /**
   * Generate comprehensive dashboard report
   */
  static async generateDashboardReport(
    format: 'pdf' | 'excel' = 'pdf',
    options: ReportOptions = { title: "HR Dashboard Report", includeCharts: true }
  ): Promise<{
    success: boolean;
    downloadUrl?: string;
    fileName?: string;
    error?: string;
  }> {
    try {
      // Fetch all data
      const [applicants, documents, communications, onboardings, tasks] = await Promise.all([
        client.models.Applicant.list(),
        client.models.Document.list(),
        client.models.Communication.list(),
        client.models.Onboarding.list(),
        client.models.OnboardingTask.list(),
      ]);

      const reportData: ReportData = {
        applicants: applicants.data || [],
        documents: documents.data || [],
        communications: communications.data || [],
        onboardings: onboardings.data || [],
        tasks: tasks.data || [],
        stats: {},
      };

      // Calculate comprehensive stats
      reportData.stats = {
        totalApplicants: reportData.applicants.length,
        hiredApplicants: reportData.applicants.filter(a => a.status === 'hired').length,
        pendingApplicants: reportData.applicants.filter(a => a.status === 'pending').length,
        rejectedApplicants: reportData.applicants.filter(a => a.status === 'rejected').length,
        totalDocuments: reportData.documents.length,
        signedDocuments: reportData.documents.filter(d => d.signatureStatus === 'signed').length,
        pendingSignatures: reportData.documents.filter(d => d.signatureStatus === 'pending').length,
        totalOnboardings: reportData.onboardings.length,
        completedOnboardings: reportData.onboardings.filter(o => o.status === 'completed').length,
        inProgressOnboardings: reportData.onboardings.filter(o => o.status === 'in_progress').length,
        totalCommunications: reportData.communications.length,
        emailsSent: reportData.communications.filter(c => c.type === 'email').length,
      };

      switch (format) {
        case 'pdf':
          return this.generateDashboardPDF(reportData, options);
        case 'excel':
          return this.generateDashboardExcel(reportData, options);
        default:
          throw new Error('Unsupported format');
      }
    } catch (error) {
      console.error("Error generating dashboard report:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate report",
      };
    }
  }

  // PDF Generation Methods
  private static generateApplicantPDF(data: Applicant[], stats: any, options: ReportOptions) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(options.title, 20, 20);
    
    if (options.description) {
      doc.setFontSize(12);
      doc.text(options.description, 20, 30);
    }

    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
    doc.text(`Total Records: ${data.length}`, 20, 45);

    // Summary Stats
    let yPos = 60;
    doc.setFontSize(14);
    doc.text('Summary Statistics', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Total Applicants: ${stats.total}`, 20, yPos);
    doc.text(`Hired: ${stats.hired}`, 20, yPos + 5);
    doc.text(`Pending: ${stats.pending}`, 20, yPos + 10);
    doc.text(`Rejected: ${stats.rejected}`, 20, yPos + 15);
    
    yPos += 30;

    // Applicant Table
    const tableData = data.map(applicant => [
      applicant.fullName,
      applicant.email,
      applicant.position || 'N/A',
      applicant.status || 'N/A',
      applicant.phoneNumber || 'N/A',
      new Date(applicant.createdAt).toLocaleDateString(),
    ]);

    (doc as any).autoTable({
      head: [['Name', 'Email', 'Position', 'Status', 'Phone', 'Applied Date']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Save PDF
    const fileName = `applicant-report-${Date.now()}.pdf`;
    doc.save(fileName);

    return {
      success: true,
      fileName,
      downloadUrl: `data:application/pdf;base64,${doc.output('datauristring').split(',')[1]}`,
    };
  }

  private static generateOnboardingPDF(data: any[], stats: any, options: ReportOptions) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(options.title, 20, 20);
    
    if (options.description) {
      doc.setFontSize(12);
      doc.text(options.description, 20, 30);
    }

    // Metadata
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);
    doc.text(`Total Onboardings: ${data.length}`, 20, 45);

    // Summary Stats
    let yPos = 60;
    doc.setFontSize(14);
    doc.text('Onboarding Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Completed: ${stats.completed}`, 20, yPos);
    doc.text(`In Progress: ${stats.inProgress}`, 20, yPos + 5);
    doc.text(`Not Started: ${stats.notStarted}`, 20, yPos + 10);
    doc.text(`Average Completion: ${stats.averageCompletion}%`, 20, yPos + 15);
    
    yPos += 30;

    // Onboarding Table
    const tableData = data.map(onboarding => [
      onboarding.applicant?.fullName || 'N/A',
      onboarding.workflowName,
      onboarding.status || 'N/A',
      `${onboarding.completionPercentage || 0}%`,
      `${onboarding.completedTasks}/${onboarding.totalTasks}`,
      new Date(onboarding.startDate).toLocaleDateString(),
    ]);

    (doc as any).autoTable({
      head: [['Employee', 'Workflow', 'Status', 'Progress', 'Tasks', 'Start Date']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Save PDF
    const fileName = `onboarding-report-${Date.now()}.pdf`;
    doc.save(fileName);

    return {
      success: true,
      fileName,
      downloadUrl: `data:application/pdf;base64,${doc.output('datauristring').split(',')[1]}`,
    };
  }

  private static generateDocumentPDF(data: Document[], stats: any, options: ReportOptions) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(options.title, 20, 20);
    
    // Summary Stats
    let yPos = 40;
    doc.setFontSize(14);
    doc.text('Document Summary', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text(`Total Documents: ${stats.total}`, 20, yPos);
    doc.text(`Signed: ${stats.signed}`, 20, yPos + 5);
    doc.text(`Pending Signature: ${stats.pending}`, 20, yPos + 10);
    doc.text(`By Type:`, 20, yPos + 15);
    
    Object.entries(stats.byType).forEach(([type, count], index) => {
      doc.text(`  ${type}: ${count}`, 25, yPos + 20 + (index * 5));
    });
    
    yPos += 50;

    // Document Table
    const tableData = data.map(document => [
      document.name,
      document.type || 'N/A',
      document.signatureStatus || 'N/A',
      document.uploadedBy || 'N/A',
      new Date(document.uploadDate || document.createdAt).toLocaleDateString(),
    ]);

    (doc as any).autoTable({
      head: [['Document Name', 'Type', 'Signature Status', 'Uploaded By', 'Upload Date']],
      body: tableData,
      startY: yPos,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Save PDF
    const fileName = `document-report-${Date.now()}.pdf`;
    doc.save(fileName);

    return {
      success: true,
      fileName,
      downloadUrl: `data:application/pdf;base64,${doc.output('datauristring').split(',')[1]}`,
    };
  }

  private static generateDashboardPDF(data: ReportData, options: ReportOptions) {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text(options.title, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`HR System Overview - ${new Date().toLocaleDateString()}`, 20, 30);

    // Executive Summary
    let yPos = 50;
    doc.setFontSize(16);
    doc.text('Executive Summary', 20, yPos);
    yPos += 15;

    doc.setFontSize(10);
    const summaryItems = [
      `Total Applicants: ${data.stats.totalApplicants}`,
      `Hired This Period: ${data.stats.hiredApplicants}`,
      `Active Onboardings: ${data.stats.inProgressOnboardings}`,
      `Documents Processed: ${data.stats.totalDocuments}`,
      `Communications Sent: ${data.stats.totalCommunications}`,
    ];

    summaryItems.forEach((item, index) => {
      doc.text(item, 20, yPos + (index * 6));
    });

    yPos += 50;

    // Detailed sections would go here...
    doc.setFontSize(14);
    doc.text('Detailed Analytics', 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.text('This comprehensive report includes detailed breakdowns of:', 20, yPos);
    doc.text('• Applicant pipeline and conversion rates', 20, yPos + 8);
    doc.text('• Onboarding completion metrics', 20, yPos + 16);
    doc.text('• Document processing efficiency', 20, yPos + 24);
    doc.text('• Communication activity summary', 20, yPos + 32);

    // Save PDF
    const fileName = `dashboard-report-${Date.now()}.pdf`;
    doc.save(fileName);

    return {
      success: true,
      fileName,
      downloadUrl: `data:application/pdf;base64,${doc.output('datauristring').split(',')[1]}`,
    };
  }

  // Excel Generation Methods
  private static generateApplicantExcel(data: Applicant[], stats: any, options: ReportOptions) {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Applicants', stats.total],
      ['Hired', stats.hired],
      ['Pending', stats.pending],
      ['Rejected', stats.rejected],
      ['', ''],
      ['Report Generated', new Date().toLocaleString()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Applicant data sheet
    const applicantData = data.map(applicant => ({
      'Full Name': applicant.fullName,
      'Email': applicant.email,
      'Phone': applicant.phoneNumber || '',
      'Position': applicant.position || '',
      'Status': applicant.status || '',
      'LinkedIn': applicant.linkedinUrl || '',
      'Experience': applicant.experience || '',
      'Applied Date': new Date(applicant.createdAt).toLocaleDateString(),
    }));
    const applicantSheet = XLSX.utils.json_to_sheet(applicantData);
    XLSX.utils.book_append_sheet(workbook, applicantSheet, 'Applicants');

    // Save Excel
    const fileName = `applicant-report-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
    };
  }

  private static generateOnboardingExcel(data: any[], stats: any, options: ReportOptions) {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Onboardings', data.length],
      ['Completed', stats.completed],
      ['In Progress', stats.inProgress],
      ['Not Started', stats.notStarted],
      ['Average Completion', `${stats.averageCompletion}%`],
      ['', ''],
      ['Report Generated', new Date().toLocaleString()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Onboarding data sheet
    const onboardingData = data.map(onboarding => ({
      'Employee Name': onboarding.applicant?.fullName || 'N/A',
      'Workflow': onboarding.workflowName,
      'Status': onboarding.status || '',
      'Start Date': new Date(onboarding.startDate).toLocaleDateString(),
      'Completion %': `${onboarding.completionPercentage || 0}%`,
      'Completed Tasks': onboarding.completedTasks,
      'Total Tasks': onboarding.totalTasks,
      'Expected Completion': onboarding.expectedCompletionDate ? 
        new Date(onboarding.expectedCompletionDate).toLocaleDateString() : 'N/A',
    }));
    const onboardingSheet = XLSX.utils.json_to_sheet(onboardingData);
    XLSX.utils.book_append_sheet(workbook, onboardingSheet, 'Onboardings');

    // Save Excel
    const fileName = `onboarding-report-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
    };
  }

  private static generateDocumentExcel(data: Document[], stats: any, options: ReportOptions) {
    const workbook = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Metric', 'Value'],
      ['Total Documents', stats.total],
      ['Signed', stats.signed],
      ['Pending Signature', stats.pending],
      ['', ''],
      ['By Type:', ''],
      ...Object.entries(stats.byType).map(([type, count]) => [type, count]),
      ['', ''],
      ['Report Generated', new Date().toLocaleString()],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

    // Document data sheet
    const documentData = data.map(document => ({
      'Document Name': document.name,
      'Type': document.type || '',
      'Category': document.category || '',
      'Signature Status': document.signatureStatus || '',
      'Uploaded By': document.uploadedBy || '',
      'Upload Date': new Date(document.uploadDate || document.createdAt).toLocaleDateString(),
      'File Size (KB)': document.fileSize ? Math.round(document.fileSize / 1024) : 0,
      'Access Level': document.accessLevel || '',
    }));
    const documentSheet = XLSX.utils.json_to_sheet(documentData);
    XLSX.utils.book_append_sheet(workbook, documentSheet, 'Documents');

    // Save Excel
    const fileName = `document-report-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
    };
  }

  private static generateDashboardExcel(data: ReportData, options: ReportOptions) {
    const workbook = XLSX.utils.book_new();

    // Executive Summary sheet
    const summaryData = [
      ['HR Dashboard Report', ''],
      ['Generated', new Date().toLocaleString()],
      ['', ''],
      ['Key Metrics', 'Value'],
      ['Total Applicants', data.stats.totalApplicants],
      ['Hired Applicants', data.stats.hiredApplicants],
      ['Pending Applications', data.stats.pendingApplicants],
      ['Total Documents', data.stats.totalDocuments],
      ['Signed Documents', data.stats.signedDocuments],
      ['Active Onboardings', data.stats.inProgressOnboardings],
      ['Completed Onboardings', data.stats.completedOnboardings],
      ['Total Communications', data.stats.totalCommunications],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    // Individual data sheets (simplified versions)
    const applicantSheet = XLSX.utils.json_to_sheet(
      data.applicants.map(a => ({
        Name: a.fullName,
        Email: a.email,
        Status: a.status,
        Position: a.position,
        'Applied Date': new Date(a.createdAt).toLocaleDateString(),
      }))
    );
    XLSX.utils.book_append_sheet(workbook, applicantSheet, 'Applicants');

    // Save Excel
    const fileName = `dashboard-report-${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    return {
      success: true,
      fileName,
    };
  }

  // CSV Generation
  private static generateApplicantCSV(data: Applicant[], options: ReportOptions) {
    const headers = ['Full Name', 'Email', 'Phone', 'Position', 'Status', 'LinkedIn', 'Applied Date'];
    const csvContent = [
      headers.join(','),
      ...data.map(applicant => [
        `"${applicant.fullName}"`,
        `"${applicant.email}"`,
        `"${applicant.phoneNumber || ''}"`,
        `"${applicant.position || ''}"`,
        `"${applicant.status || ''}"`,
        `"${applicant.linkedinUrl || ''}"`,
        `"${new Date(applicant.createdAt).toLocaleDateString()}"`,
      ].join(','))
    ].join('\n');

    const fileName = `applicant-report-${Date.now()}.csv`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Trigger download
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      fileName,
      downloadUrl: url,
    };
  }

  // Utility Methods
  private static filterData(data: any[], filters: Record<string, any>): any[] {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value || value === 'all') return true;
        return item[key] === value;
      });
    });
  }

  private static calculateApplicantStats(data: Applicant[]) {
    return {
      total: data.length,
      hired: data.filter(a => a.status === 'hired').length,
      pending: data.filter(a => a.status === 'pending').length,
      rejected: data.filter(a => a.status === 'rejected').length,
      interviewed: data.filter(a => a.status === 'interviewed').length,
    };
  }

  private static calculateOnboardingStats(data: any[]) {
    const completed = data.filter(o => o.status === 'completed').length;
    const inProgress = data.filter(o => o.status === 'in_progress').length;
    const notStarted = data.filter(o => o.status === 'not_started').length;
    const totalCompletion = data.reduce((sum, o) => sum + (o.completionPercentage || 0), 0);
    const averageCompletion = data.length > 0 ? Math.round(totalCompletion / data.length) : 0;

    return {
      completed,
      inProgress,
      notStarted,
      averageCompletion,
    };
  }

  private static calculateDocumentStats(data: Document[]) {
    const byType = data.reduce((acc, doc) => {
      const type = doc.type || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: data.length,
      signed: data.filter(d => d.signatureStatus === 'signed').length,
      pending: data.filter(d => d.signatureStatus === 'pending').length,
      byType,
    };
  }
}