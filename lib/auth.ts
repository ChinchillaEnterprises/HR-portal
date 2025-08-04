import { getCurrentUser } from "aws-amplify/auth";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export type UserRole = "admin" | "mentor" | "team_lead" | "intern" | "staff";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  groups: string[];
  firstName?: string;
  lastName?: string;
}

export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  try {
    const cognitoUser = await getCurrentUser();
    
    // Get user details from database
    const { data: users } = await client.models.User.list({
      filter: { email: { eq: cognitoUser.signInDetails?.loginId || "" } }
    });
    
    const dbUser = users[0];
    
    return {
      id: cognitoUser.userId,
      email: cognitoUser.signInDetails?.loginId || "",
      role: dbUser?.role || "staff",
      groups: cognitoUser.signInDetails?.loginId?.includes("admin") ? ["Admin"] : [],
      firstName: dbUser?.firstName,
      lastName: dbUser?.lastName,
    };
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

export const rolePermissions = {
  admin: {
    canViewAllData: true,
    canEditAllData: true,
    canDeleteData: true,
    canManageUsers: true,
    canViewReports: true,
    canExportData: true,
    canManageOnboarding: true,
    canManageApplicants: true,
    canSendCommunications: true,
    canUploadDocuments: true,
  },
  mentor: {
    canViewAllData: false,
    canEditAllData: false,
    canDeleteData: false,
    canManageUsers: false,
    canViewReports: true,
    canExportData: true,
    canManageOnboarding: true,
    canManageApplicants: true,
    canSendCommunications: true,
    canUploadDocuments: true,
  },
  team_lead: {
    canViewAllData: false,
    canEditAllData: false,
    canDeleteData: false,
    canManageUsers: false,
    canViewReports: true,
    canExportData: true,
    canManageOnboarding: true,
    canManageApplicants: true,
    canSendCommunications: true,
    canUploadDocuments: true,
  },
  intern: {
    canViewAllData: false,
    canEditAllData: false,
    canDeleteData: false,
    canManageUsers: false,
    canViewReports: false,
    canExportData: false,
    canManageOnboarding: false,
    canManageApplicants: false,
    canSendCommunications: false,
    canUploadDocuments: false,
  },
  staff: {
    canViewAllData: false,
    canEditAllData: false,
    canDeleteData: false,
    canManageUsers: false,
    canViewReports: false,
    canExportData: false,
    canManageOnboarding: false,
    canManageApplicants: false,
    canSendCommunications: false,
    canUploadDocuments: true,
  },
};

export function hasPermission(role: UserRole, permission: keyof typeof rolePermissions.admin): boolean {
  return rolePermissions[role]?.[permission] || false;
}

export function canAccessRoute(role: UserRole, route: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/": ["admin", "mentor", "team_lead", "intern", "staff"],
    "/onboarding": ["admin", "mentor", "team_lead", "intern", "staff"],
    "/documents": ["admin", "mentor", "team_lead", "intern", "staff"],
    "/communications": ["admin", "mentor", "team_lead"],
    "/applicants": ["admin", "mentor", "team_lead"],
    "/team": ["admin", "mentor", "team_lead", "staff"],
    "/reports": ["admin", "mentor", "team_lead"],
  };
  
  const allowedRoles = routePermissions[route] || [];
  return allowedRoles.includes(role);
}