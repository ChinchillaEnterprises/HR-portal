"use client";

import { useAuth } from '@/contexts/AuthContext';
import { AuditService, AuditAction, AuditSeverity } from '@/lib/auditService';
import { useCallback } from 'react';

export function useAudit() {
  const { user, role } = useAuth();

  const logAction = useCallback(async (
    action: AuditAction,
    params: {
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      details?: Record<string, any>;
      severity?: AuditSeverity;
    } = {}
  ) => {
    if (!user?.email) return;

    await AuditService.logSuccess({
      userId: user.email,
      userEmail: user.email,
      userRole: role || undefined,
      action,
      ...params,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('sessionId') || undefined : undefined,
      },
    });
  }, [user, role]);

  const logError = useCallback(async (
    action: AuditAction,
    error: string,
    params: {
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      details?: Record<string, any>;
    } = {}
  ) => {
    if (!user?.email) return;

    await AuditService.logFailure({
      userId: user.email,
      userEmail: user.email,
      userRole: role || undefined,
      action,
      ...params,
      metadata: {
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
        sessionId: typeof window !== 'undefined' ? window.sessionStorage.getItem('sessionId') || undefined : undefined,
      },
    }, error);
  }, [user, role]);

  const withAudit = useCallback(<T extends (...args: any[]) => Promise<any>>(
    action: AuditAction,
    fn: T,
    getParams?: (args: Parameters<T>, result?: Awaited<ReturnType<T>>) => {
      resourceType?: string;
      resourceId?: string;
      resourceName?: string;
      details?: Record<string, any>;
    }
  ): T => {
    return (async (...args: Parameters<T>) => {
      try {
        const result = await fn(...args);
        
        const params = getParams ? getParams(args, result) : {};
        await logAction(action, params);
        
        return result;
      } catch (error) {
        const params = getParams ? getParams(args) : {};
        await logError(
          action, 
          error instanceof Error ? error.message : 'Unknown error',
          params
        );
        throw error;
      }
    }) as T;
  }, [logAction, logError]);

  return {
    logAction,
    logError,
    withAudit,
  };
}