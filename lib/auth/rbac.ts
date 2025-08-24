import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";

const client = generateClient<Schema>();

// Define roles and their permissions
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  HR_MANAGER: 'hr_manager',
  HR_STAFF: 'hr_staff',
  INTERVIEWER: 'interviewer',
  VIEWER: 'viewer',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

// Define permissions
export const PERMISSIONS = {
  // Applicant permissions
  APPLICANT_VIEW: 'applicant:view',
  APPLICANT_CREATE: 'applicant:create',
  APPLICANT_UPDATE: 'applicant:update',
  APPLICANT_DELETE: 'applicant:delete',
  APPLICANT_VIEW_SENSITIVE: 'applicant:view_sensitive',
  
  // Document permissions
  DOCUMENT_VIEW: 'document:view',
  DOCUMENT_CREATE: 'document:create',
  DOCUMENT_UPDATE: 'document:update',
  DOCUMENT_DELETE: 'document:delete',
  DOCUMENT_SIGN: 'document:sign',
  
  // Communication permissions
  COMMUNICATION_VIEW: 'communication:view',
  COMMUNICATION_CREATE: 'communication:create',
  COMMUNICATION_DELETE: 'communication:delete',
  
  // Onboarding permissions
  ONBOARDING_VIEW: 'onboarding:view',
  ONBOARDING_CREATE: 'onboarding:create',
  ONBOARDING_UPDATE: 'onboarding:update',
  ONBOARDING_DELETE: 'onboarding:delete',
  
  // Report permissions
  REPORT_VIEW: 'report:view',
  REPORT_CREATE: 'report:create',
  REPORT_EXPORT: 'report:export',
  
  // Settings permissions
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update',
  
  // User management permissions
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ASSIGN_ROLES: 'user:assign_roles',
  
  // Integration permissions
  INTEGRATION_VIEW: 'integration:view',
  INTEGRATION_MANAGE: 'integration:manage',
  
  // Audit permissions
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role-Permission mapping
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [ROLES.ADMIN]: [
    // All applicant permissions
    PERMISSIONS.APPLICANT_VIEW,
    PERMISSIONS.APPLICANT_CREATE,
    PERMISSIONS.APPLICANT_UPDATE,
    PERMISSIONS.APPLICANT_DELETE,
    PERMISSIONS.APPLICANT_VIEW_SENSITIVE,
    // All document permissions
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_DELETE,
    PERMISSIONS.DOCUMENT_SIGN,
    // All communication permissions
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.COMMUNICATION_CREATE,
    PERMISSIONS.COMMUNICATION_DELETE,
    // All onboarding permissions
    PERMISSIONS.ONBOARDING_VIEW,
    PERMISSIONS.ONBOARDING_CREATE,
    PERMISSIONS.ONBOARDING_UPDATE,
    PERMISSIONS.ONBOARDING_DELETE,
    // All report permissions
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
    // Settings
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_UPDATE,
    // User management (except role assignment)
    PERMISSIONS.USER_VIEW,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_UPDATE,
    // Integration management
    PERMISSIONS.INTEGRATION_VIEW,
    PERMISSIONS.INTEGRATION_MANAGE,
    // Audit
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.AUDIT_EXPORT,
  ],
  
  [ROLES.HR_MANAGER]: [
    // All applicant permissions
    PERMISSIONS.APPLICANT_VIEW,
    PERMISSIONS.APPLICANT_CREATE,
    PERMISSIONS.APPLICANT_UPDATE,
    PERMISSIONS.APPLICANT_DELETE,
    PERMISSIONS.APPLICANT_VIEW_SENSITIVE,
    // Document permissions
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_CREATE,
    PERMISSIONS.DOCUMENT_UPDATE,
    PERMISSIONS.DOCUMENT_SIGN,
    // Communication permissions
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.COMMUNICATION_CREATE,
    // Onboarding permissions
    PERMISSIONS.ONBOARDING_VIEW,
    PERMISSIONS.ONBOARDING_CREATE,
    PERMISSIONS.ONBOARDING_UPDATE,
    // Report permissions
    PERMISSIONS.REPORT_VIEW,
    PERMISSIONS.REPORT_CREATE,
    PERMISSIONS.REPORT_EXPORT,
    // Limited settings
    PERMISSIONS.SETTINGS_VIEW,
    // User view only
    PERMISSIONS.USER_VIEW,
    // Integration view
    PERMISSIONS.INTEGRATION_VIEW,
    // Audit view
    PERMISSIONS.AUDIT_VIEW,
  ],
  
  [ROLES.HR_STAFF]: [
    // Basic applicant permissions
    PERMISSIONS.APPLICANT_VIEW,
    PERMISSIONS.APPLICANT_CREATE,
    PERMISSIONS.APPLICANT_UPDATE,
    // Document permissions
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.DOCUMENT_CREATE,
    // Communication permissions
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.COMMUNICATION_CREATE,
    // Onboarding view
    PERMISSIONS.ONBOARDING_VIEW,
    // Report view
    PERMISSIONS.REPORT_VIEW,
    // Settings view
    PERMISSIONS.SETTINGS_VIEW,
  ],
  
  [ROLES.INTERVIEWER]: [
    // Limited applicant view
    PERMISSIONS.APPLICANT_VIEW,
    // Communication view
    PERMISSIONS.COMMUNICATION_VIEW,
    // Limited report view
    PERMISSIONS.REPORT_VIEW,
  ],
  
  [ROLES.VIEWER]: [
    // View only permissions
    PERMISSIONS.APPLICANT_VIEW,
    PERMISSIONS.DOCUMENT_VIEW,
    PERMISSIONS.COMMUNICATION_VIEW,
    PERMISSIONS.ONBOARDING_VIEW,
    PERMISSIONS.REPORT_VIEW,
  ],
};

// User-Role assignment interface
export interface UserRole {
  userId: string;
  email: string;
  role: Role;
  assignedBy?: string;
  assignedAt: Date;
  expiresAt?: Date;
}

// Permission check result
export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiredRole?: Role;
}

/**
 * Check if a user has a specific permission
 */
export function hasPermission(
  userRole: Role,
  permission: Permission
): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  return rolePermissions?.includes(permission) || false;
}

/**
 * Check if a user has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * Check if a user has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: Role,
  permissions: Permission[]
): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role can perform an action on a resource
 */
export function canPerformAction(
  userRole: Role,
  resource: string,
  action: string
): PermissionCheckResult {
  const permission = `${resource}:${action}` as Permission;
  
  if (hasPermission(userRole, permission)) {
    return { allowed: true };
  }
  
  // Find the minimum role required
  const requiredRole = Object.entries(ROLE_PERMISSIONS).find(([_, permissions]) =>
    permissions.includes(permission)
  )?.[0] as Role | undefined;
  
  return {
    allowed: false,
    reason: `Permission denied. You need ${permission} permission.`,
    requiredRole,
  };
}

/**
 * Get user's role from the database
 */
export async function getUserRole(email: string): Promise<Role | null> {
  try {
    // For now, we'll use a simple email-based role assignment
    // In production, this should query a UserRole table
    
    // Default super admin (for initial setup)
    if (email === process.env.SUPER_ADMIN_EMAIL) {
      return ROLES.SUPER_ADMIN;
    }
    
    // Check if user exists in our system
    // This is a placeholder - implement actual database lookup
    const roleMapping = await getRoleMappingFromStorage();
    return roleMapping[email] || ROLES.VIEWER; // Default to viewer
  } catch (error) {
    console.error('Error getting user role:', error);
    return ROLES.VIEWER; // Safe default
  }
}

/**
 * Assign a role to a user
 */
export async function assignRole(
  email: string,
  role: Role,
  assignedBy: string
): Promise<boolean> {
  try {
    // This is a placeholder - implement actual database storage
    const roleMapping = await getRoleMappingFromStorage();
    roleMapping[email] = role;
    await saveRoleMappingToStorage(roleMapping);
    
    // Log the role assignment for audit
    console.log(`Role ${role} assigned to ${email} by ${assignedBy}`);
    
    return true;
  } catch (error) {
    console.error('Error assigning role:', error);
    return false;
  }
}

/**
 * Remove a user's role
 */
export async function removeRole(email: string): Promise<boolean> {
  try {
    const roleMapping = await getRoleMappingFromStorage();
    delete roleMapping[email];
    await saveRoleMappingToStorage(roleMapping);
    return true;
  } catch (error) {
    console.error('Error removing role:', error);
    return false;
  }
}

/**
 * List all user roles
 */
export async function listUserRoles(): Promise<UserRole[]> {
  try {
    const roleMapping = await getRoleMappingFromStorage();
    return Object.entries(roleMapping).map(([email, role]) => ({
      userId: email, // In production, use actual user ID
      email,
      role,
      assignedAt: new Date(), // In production, store actual date
    }));
  } catch (error) {
    console.error('Error listing user roles:', error);
    return [];
  }
}

// Helper functions for role storage (replace with actual database in production)
async function getRoleMappingFromStorage(): Promise<Record<string, Role>> {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('userRoles');
    return stored ? JSON.parse(stored) : {};
  }
  return {};
}

async function saveRoleMappingToStorage(mapping: Record<string, Role>): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.setItem('userRoles', JSON.stringify(mapping));
  }
}

/**
 * Middleware helper to check permissions in API routes
 */
export async function checkApiPermission(
  req: NextRequest,
  permission: Permission
): Promise<PermissionCheckResult> {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return {
        allowed: false,
        reason: 'Not authenticated',
      };
    }
    
    const userRole = await getUserRole(session.user.email);
    if (!userRole) {
      return {
        allowed: false,
        reason: 'No role assigned',
      };
    }
    
    if (hasPermission(userRole, permission)) {
      return { allowed: true };
    }
    
    return {
      allowed: false,
      reason: `Permission denied. You need ${permission} permission.`,
    };
  } catch (error) {
    console.error('Error checking API permission:', error);
    return {
      allowed: false,
      reason: 'Permission check failed',
    };
  }
}

/**
 * Get display name for a role
 */
export function getRoleDisplayName(role: Role): string {
  const displayNames: Record<Role, string> = {
    [ROLES.SUPER_ADMIN]: 'Super Administrator',
    [ROLES.ADMIN]: 'Administrator',
    [ROLES.HR_MANAGER]: 'HR Manager',
    [ROLES.HR_STAFF]: 'HR Staff',
    [ROLES.INTERVIEWER]: 'Interviewer',
    [ROLES.VIEWER]: 'Viewer',
  };
  return displayNames[role] || role;
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    [ROLES.SUPER_ADMIN]: 'red',
    [ROLES.ADMIN]: 'purple',
    [ROLES.HR_MANAGER]: 'blue',
    [ROLES.HR_STAFF]: 'green',
    [ROLES.INTERVIEWER]: 'yellow',
    [ROLES.VIEWER]: 'gray',
  };
  return colors[role] || 'gray';
}