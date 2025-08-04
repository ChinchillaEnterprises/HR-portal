import { useCallback } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { getAuthenticatedUser } from '@/lib/auth';

const client = generateClient<Schema>();

export interface ActivityLog {
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
}

export const useActivityLogger = () => {
  const logActivity = useCallback(async (activity: ActivityLog) => {
    try {
      const authUser = await getAuthenticatedUser();
      if (!authUser) return;

      // In a real implementation, this would create an ActivityLog model
      // For now, we'll use console logging and local storage for demo
      const logEntry = {
        id: `log-${Date.now()}`,
        userId: authUser.id,
        userEmail: authUser.email,
        timestamp: new Date().toISOString(),
        action: activity.action,
        resource: activity.resource,
        resourceId: activity.resourceId,
        details: activity.details,
        userAgent: navigator.userAgent,
        url: window.location.pathname,
      };

      // Store in localStorage for demo (in production, this would go to a database)
      const existingLogs = JSON.parse(localStorage.getItem('activityLogs') || '[]');
      existingLogs.push(logEntry);
      
      // Keep only last 100 logs to prevent localStorage from growing too large
      const limitedLogs = existingLogs.slice(-100);
      localStorage.setItem('activityLogs', JSON.stringify(limitedLogs));

      // Also log to console for development
      console.log('Activity logged:', logEntry);

      // In production, you might want to batch these and send to your analytics service
      // or create ActivityLog records in your database
      
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }, []);

  const getActivityLogs = useCallback(() => {
    try {
      return JSON.parse(localStorage.getItem('activityLogs') || '[]');
    } catch (error) {
      console.error('Failed to retrieve activity logs:', error);
      return [];
    }
  }, []);

  const clearActivityLogs = useCallback(() => {
    localStorage.removeItem('activityLogs');
  }, []);

  return {
    logActivity,
    getActivityLogs,
    clearActivityLogs,
  };
};

// Pre-defined activity types for consistency
export const ACTIVITY_TYPES = {
  // Authentication
  LOGIN: 'login',
  LOGOUT: 'logout',
  
  // Navigation
  PAGE_VIEW: 'page_view',
  SEARCH: 'search',
  
  // User Management
  USER_CREATE: 'user_create',
  USER_UPDATE: 'user_update',
  USER_DELETE: 'user_delete',
  BULK_USER_ACTION: 'bulk_user_action',
  
  // Document Management
  DOCUMENT_UPLOAD: 'document_upload',
  DOCUMENT_DOWNLOAD: 'document_download',
  DOCUMENT_DELETE: 'document_delete',
  DOCUMENT_SIGN: 'document_sign',
  
  // Communication
  MESSAGE_SEND: 'message_send',
  EMAIL_SEND: 'email_send',
  
  // Tasks
  TASK_CREATE: 'task_create',
  TASK_UPDATE: 'task_update',
  TASK_COMPLETE: 'task_complete',
  TASK_DELETE: 'task_delete',
  
  // Applicants
  APPLICANT_CREATE: 'applicant_create',
  APPLICANT_UPDATE: 'applicant_update',
  APPLICANT_STATUS_CHANGE: 'applicant_status_change',
  
  // Reports & Analytics
  REPORT_GENERATE: 'report_generate',
  REPORT_EXPORT: 'report_export',
  REPORT_SCHEDULE: 'report_schedule',
  ANALYTICS_VIEW: 'analytics_view',
  
  // System
  SETTINGS_UPDATE: 'settings_update',
  SYSTEM_REFRESH: 'system_refresh',
} as const;

export type ActivityType = typeof ACTIVITY_TYPES[keyof typeof ACTIVITY_TYPES];