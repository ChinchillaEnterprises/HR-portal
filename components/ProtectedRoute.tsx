"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Shield, Lock } from "lucide-react";
import { getAuthenticatedUser, canAccessRoute, type UserRole } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole[];
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuthorization();
  }, [pathname]);

  const checkAuthorization = async () => {
    const user = await getAuthenticatedUser();
    
    if (!user) {
      router.push("/");
      return;
    }

    setUserRole(user.role);

    // Check route access
    const hasAccess = canAccessRoute(user.role, pathname);
    
    // Check specific role requirement if provided
    const meetsRoleRequirement = !requiredRole || requiredRole.includes(user.role);
    
    setIsAuthorized(hasAccess && meetsRoleRequirement);
    
    if (!hasAccess || !meetsRoleRequirement) {
      // Show unauthorized page instead of redirecting
      setIsAuthorized(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-red-100 rounded-full mx-auto flex items-center justify-center">
              <Lock className="w-12 h-12 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Your role: <span className="font-semibold capitalize">{userRole?.replace("_", " ")}</span>
          </p>
          
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}