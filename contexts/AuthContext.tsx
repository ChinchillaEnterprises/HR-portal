"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Role, 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  getUserRole,
  ROLES 
} from '@/lib/auth/rbac';

interface AuthContextType {
  user: any;
  role: Role | null;
  loading: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccess: (resource: string, action: string) => boolean;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session?.user?.email) {
      loadUserRole();
    } else {
      setRole(null);
      setLoading(false);
    }
  }, [session, status]);

  const loadUserRole = async () => {
    try {
      setLoading(true);
      if (session?.user?.email) {
        const userRole = await getUserRole(session.user.email);
        setRole(userRole);
      }
    } catch (error) {
      console.error('Error loading user role:', error);
      setRole(ROLES.VIEWER); // Safe default
    } finally {
      setLoading(false);
    }
  };

  const checkPermission = (permission: Permission): boolean => {
    if (!role) return false;
    return hasPermission(role, permission);
  };

  const checkAnyPermission = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAnyPermission(role, permissions);
  };

  const checkAllPermissions = (permissions: Permission[]): boolean => {
    if (!role) return false;
    return hasAllPermissions(role, permissions);
  };

  const canAccess = (resource: string, action: string): boolean => {
    const permission = `${resource}:${action}` as Permission;
    return checkPermission(permission);
  };

  const value: AuthContextType = {
    user: session?.user || null,
    role,
    loading: status === 'loading' || loading,
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    canAccess,
    refreshRole: loadUserRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protecting components
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission?: Permission | Permission[],
  options?: {
    fallback?: React.ComponentType;
    redirectTo?: string;
  }
) {
  return function AuthorizedComponent(props: P) {
    const { hasPermission, hasAnyPermission, loading } = useAuth();
    
    if (loading) {
      return <div>Loading...</div>;
    }
    
    if (requiredPermission) {
      const hasAccess = Array.isArray(requiredPermission)
        ? hasAnyPermission(requiredPermission)
        : hasPermission(requiredPermission);
        
      if (!hasAccess) {
        if (options?.fallback) {
          const Fallback = options.fallback;
          return <Fallback />;
        }
        
        if (options?.redirectTo && typeof window !== 'undefined') {
          window.location.href = options.redirectTo;
          return null;
        }
        
        return (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
              <p className="text-gray-600 mb-6">
                You don't have permission to access this resource.
              </p>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        );
      }
    }
    
    return <Component {...props} />;
  };
}