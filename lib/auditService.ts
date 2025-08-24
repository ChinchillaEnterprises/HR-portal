import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export enum AuditAction {
  // Authentication
  LOGIN = 'auth.login',
  LOGOUT = 'auth.logout',
  LOGIN_FAILED = 'auth.login_failed',
  
  // User Management
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',
  ROLE_ASSIGN = 'role.assign',
  ROLE_REMOVE = 'role.remove',
  
  // Applicant Actions
  APPLICANT_VIEW = 'applicant.view',
  APPLICANT_CREATE = 'applicant.create',
  APPLICANT_UPDATE = 'applicant.update',
  APPLICANT_DELETE = 'applicant.delete',
  APPLICANT_STATUS_CHANGE = 'applicant.status_change',
  
  // Document Actions
  DOCUMENT_VIEW = 'document.view',
  DOCUMENT_UPLOAD = 'document.upload',
  DOCUMENT_DOWNLOAD = 'document.download',
  DOCUMENT_DELETE = 'document.delete',
  DOCUMENT_SIGN = 'document.sign',
  DOCUMENT_SHARE = 'document.share',
  
  // Communication Actions
  EMAIL_SEND = 'email.send',
  EMAIL_VIEW = 'email.view',
  NOTIFICATION_SEND = 'notification.send',
  
  // Onboarding Actions
  ONBOARDING_START = 'onboarding.start',
  ONBOARDING_UPDATE = 'onboarding.update',
  ONBOARDING_COMPLETE = 'onboarding.complete',
  TASK_CREATE = 'task.create',
  TASK_UPDATE = 'task.update',
  TASK_COMPLETE = 'task.complete',
  
  // Integration Actions
  INTEGRATION_CONNECT = 'integration.connect',
  INTEGRATION_DISCONNECT = 'integration.disconnect',
  INTEGRATION_SYNC = 'integration.sync',
  
  // Report Actions
  REPORT_VIEW = 'report.view',
  REPORT_EXPORT = 'report.export',
  
  // Settings Actions
  SETTINGS_UPDATE = 'settings.update',
  SECURITY_UPDATE = 'security.update',
  
  // Data Actions
  DATA_EXPORT = 'data.export',
  DATA_IMPORT = 'data.import',
  DATA_DELETE = 'data.delete',
}

export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface AuditLog {
  id?: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  userRole?: string;
  action: AuditAction;
  severity: AuditSeverity;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  details?: Record<string, any>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
  };
  success: boolean;
  errorMessage?: string;
}

export class AuditService {
  private static logs: AuditLog[] = [];
  private static maxInMemoryLogs = 1000;
  
  /**
   * Log an audit event
   */
  static async log(params: {
    userId: string;
    userEmail: string;
    userRole?: string;
    action: AuditAction;
    severity?: AuditSeverity;
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    details?: Record<string, any>;
    metadata?: AuditLog['metadata'];
    success?: boolean;
    errorMessage?: string;
  }): Promise<void> {
    try {
      const auditLog: AuditLog = {
        timestamp: new Date().toISOString(),
        userId: params.userId,
        userEmail: params.userEmail,
        userRole: params.userRole,
        action: params.action,
        severity: params.severity || AuditSeverity.INFO,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        resourceName: params.resourceName,
        details: params.details,
        metadata: params.metadata,
        success: params.success !== false,
        errorMessage: params.errorMessage,
      };

      // Store in memory (for development)
      this.logs.unshift(auditLog);
      if (this.logs.length > this.maxInMemoryLogs) {
        this.logs = this.logs.slice(0, this.maxInMemoryLogs);
      }

      // In production, store in database
      if (process.env.NODE_ENV === 'production') {
        await this.persistLog(auditLog);
      }

      // Log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUDIT] ${auditLog.action} by ${auditLog.userEmail}`, {
          resource: `${auditLog.resourceType}/${auditLog.resourceId}`,
          success: auditLog.success,
          details: auditLog.details,
        });
      }

      // Send critical events to monitoring
      if (auditLog.severity === AuditSeverity.CRITICAL) {
        await this.sendToMonitoring(auditLog);
      }
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log a successful action
   */
  static async logSuccess(params: Omit<Parameters<typeof AuditService.log>[0], 'success'>): Promise<void> {
    return this.log({ ...params, success: true });
  }

  /**
   * Log a failed action
   */
  static async logFailure(
    params: Omit<Parameters<typeof AuditService.log>[0], 'success' | 'severity'>,
    errorMessage: string
  ): Promise<void> {
    return this.log({
      ...params,
      success: false,
      severity: params.action.includes('login') ? AuditSeverity.WARNING : AuditSeverity.ERROR,
      errorMessage,
    });
  }

  /**
   * Query audit logs
   */
  static async query(params: {
    userId?: string;
    userEmail?: string;
    action?: AuditAction | AuditAction[];
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    severity?: AuditSeverity;
    success?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
  }> {
    try {
      let filteredLogs = [...this.logs];

      // Apply filters
      if (params.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === params.userId);
      }

      if (params.userEmail) {
        filteredLogs = filteredLogs.filter(log => 
          log.userEmail.toLowerCase().includes(params.userEmail.toLowerCase())
        );
      }

      if (params.action) {
        const actions = Array.isArray(params.action) ? params.action : [params.action];
        filteredLogs = filteredLogs.filter(log => actions.includes(log.action));
      }

      if (params.resourceType) {
        filteredLogs = filteredLogs.filter(log => log.resourceType === params.resourceType);
      }

      if (params.resourceId) {
        filteredLogs = filteredLogs.filter(log => log.resourceId === params.resourceId);
      }

      if (params.severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === params.severity);
      }

      if (params.success !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.success === params.success);
      }

      if (params.startDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) >= params.startDate!
        );
      }

      if (params.endDate) {
        filteredLogs = filteredLogs.filter(log => 
          new Date(log.timestamp) <= params.endDate!
        );
      }

      // Apply pagination
      const total = filteredLogs.length;
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      const logs = filteredLogs.slice(offset, offset + limit);

      return { logs, total };
    } catch (error) {
      console.error('Failed to query audit logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get user activity summary
   */
  static async getUserActivity(
    userId: string,
    days: number = 30
  ): Promise<{
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: AuditLog[];
    failedActions: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.query({
      userId,
      startDate,
      limit: 1000,
    });

    const actionsByType: Record<string, number> = {};
    const failedActions: AuditLog[] = [];

    result.logs.forEach(log => {
      // Count by action type
      const actionCategory = log.action.split('.')[0];
      actionsByType[actionCategory] = (actionsByType[actionCategory] || 0) + 1;

      // Collect failed actions
      if (!log.success) {
        failedActions.push(log);
      }
    });

    return {
      totalActions: result.total,
      actionsByType,
      recentActions: result.logs.slice(0, 10),
      failedActions: failedActions.slice(0, 10),
    };
  }

  /**
   * Get security events
   */
  static async getSecurityEvents(
    hours: number = 24
  ): Promise<{
    loginAttempts: AuditLog[];
    roleChanges: AuditLog[];
    dataExports: AuditLog[];
    criticalErrors: AuditLog[];
  }> {
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - hours);

    const [loginAttempts, roleChanges, dataExports, criticalErrors] = await Promise.all([
      this.query({
        action: [AuditAction.LOGIN, AuditAction.LOGIN_FAILED],
        startDate,
      }),
      this.query({
        action: [AuditAction.ROLE_ASSIGN, AuditAction.ROLE_REMOVE],
        startDate,
      }),
      this.query({
        action: [AuditAction.DATA_EXPORT, AuditAction.REPORT_EXPORT],
        startDate,
      }),
      this.query({
        severity: AuditSeverity.CRITICAL,
        startDate,
      }),
    ]);

    return {
      loginAttempts: loginAttempts.logs,
      roleChanges: roleChanges.logs,
      dataExports: dataExports.logs,
      criticalErrors: criticalErrors.logs,
    };
  }

  /**
   * Export audit logs
   */
  static async exportLogs(
    format: 'json' | 'csv',
    params: Parameters<typeof AuditService.query>[0]
  ): Promise<{
    success: boolean;
    data?: string;
    filename?: string;
    error?: string;
  }> {
    try {
      const result = await this.query({ ...params, limit: 10000 });

      if (format === 'json') {
        const data = JSON.stringify(result.logs, null, 2);
        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        return { success: true, data, filename };
      } else if (format === 'csv') {
        // CSV header
        const headers = [
          'Timestamp',
          'User Email',
          'Role',
          'Action',
          'Resource Type',
          'Resource ID',
          'Resource Name',
          'Success',
          'Severity',
          'Error Message',
          'IP Address',
        ];

        // CSV rows
        const rows = result.logs.map(log => [
          log.timestamp,
          log.userEmail,
          log.userRole || '',
          log.action,
          log.resourceType || '',
          log.resourceId || '',
          log.resourceName || '',
          log.success ? 'Yes' : 'No',
          log.severity,
          log.errorMessage || '',
          log.metadata?.ipAddress || '',
        ]);

        // Combine into CSV
        const csv = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        return { success: true, data: csv, filename };
      }

      return { success: false, error: 'Invalid format' };
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Clear old audit logs (retention policy)
   */
  static async cleanup(daysToKeep: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const originalCount = this.logs.length;
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp) > cutoffDate
    );

    const deletedCount = originalCount - this.logs.length;
    console.log(`Cleaned up ${deletedCount} audit logs older than ${daysToKeep} days`);

    return deletedCount;
  }

  /**
   * Persist log to database (placeholder for production)
   */
  private static async persistLog(log: AuditLog): Promise<void> {
    // In production, save to database
    // For now, we're just using in-memory storage
    console.log('[AUDIT] Would persist to database:', log);
  }

  /**
   * Send critical events to monitoring (placeholder)
   */
  private static async sendToMonitoring(log: AuditLog): Promise<void> {
    // In production, send to monitoring service
    console.error('[CRITICAL AUDIT EVENT]', log);
  }
}