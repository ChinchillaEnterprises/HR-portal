"use client";

import { useAuth } from '@/contexts/AuthContext';
import { Permission } from '@/lib/auth/rbac';

interface PermissionGateProps {
  permission?: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
  requireAll?: boolean; // For multiple permissions
}

export default function PermissionGate({
  permission,
  fallback = null,
  children,
  requireAll = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth();

  if (!permission) {
    return <>{children}</>;
  }

  let hasAccess = false;

  if (Array.isArray(permission)) {
    hasAccess = requireAll
      ? hasAllPermissions(permission)
      : hasAnyPermission(permission);
  } else {
    hasAccess = hasPermission(permission);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// Convenience components for common permission checks
export function CanView({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const permission = `${resource}:view` as Permission;
  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanCreate({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const permission = `${resource}:create` as Permission;
  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanUpdate({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const permission = `${resource}:update` as Permission;
  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}

export function CanDelete({ 
  resource, 
  children, 
  fallback 
}: { 
  resource: string; 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  const permission = `${resource}:delete` as Permission;
  return (
    <PermissionGate permission={permission} fallback={fallback}>
      {children}
    </PermissionGate>
  );
}