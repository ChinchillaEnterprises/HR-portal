"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, 
  Key, 
  AlertCircle, 
  CheckCircle,
  Save,
  Info
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGate from "@/components/PermissionGate";
import { 
  PERMISSIONS,
  ROLES,
  getRoleDisplayName,
  assignRole
} from "@/lib/auth/rbac";

export default function SecuritySettingsPage() {
  const { user, role, refreshRole } = useAuth();
  const [superAdminEmail, setSuperAdminEmail] = useState("");
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if we need to set up initial super admin
    const savedSuperAdmin = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || localStorage.getItem('superAdminEmail');
    if (savedSuperAdmin) {
      setSuperAdminEmail(savedSuperAdmin);
    }
  }, []);

  const handleSetSuperAdmin = async () => {
    if (!superAdminEmail) {
      setMessage({ type: 'error', text: 'Please enter an email address' });
      return;
    }

    setLoading(true);
    try {
      // Assign super admin role
      const success = await assignRole(
        superAdminEmail,
        ROLES.SUPER_ADMIN,
        'system'
      );

      if (success) {
        // Save to localStorage as backup
        localStorage.setItem('superAdminEmail', superAdminEmail);
        
        setMessage({ 
          type: 'success', 
          text: `Super Admin role assigned to ${superAdminEmail}. Please sign out and sign back in with this account.` 
        });

        // Refresh current user's role if they are the super admin
        if (user?.email === superAdminEmail) {
          await refreshRole();
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to assign Super Admin role' });
      }
    } catch (error) {
      console.error('Error setting super admin:', error);
      setMessage({ type: 'error', text: 'An error occurred while setting Super Admin' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Settings
          </h1>
          <p className="mt-2 text-gray-600">
            Configure security and access control settings
          </p>
        </div>

        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current User</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium text-gray-900">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Role:</span>
              <span className="font-medium text-gray-900">
                {role ? getRoleDisplayName(role) : 'No role assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Super Admin Setup */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-yellow-600" />
            Super Admin Configuration
          </h2>

          {role === ROLES.SUPER_ADMIN ? (
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-800 font-medium">
                    You are the Super Administrator
                  </p>
                  <p className="text-green-700 text-sm mt-1">
                    You have full access to all features and can manage other users' roles.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-blue-50 rounded-lg mb-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Initial Setup Required</p>
                    <p>
                      Set up the Super Administrator account to manage user roles and permissions. 
                      This should be your primary admin email address.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Super Admin Email
                  </label>
                  <input
                    type="email"
                    value={superAdminEmail}
                    onChange={(e) => setSuperAdminEmail(e.target.value)}
                    placeholder="admin@company.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    This email will have full administrative privileges
                  </p>
                </div>

                <button
                  onClick={handleSetSuperAdmin}
                  disabled={loading || !superAdminEmail}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Set Super Admin
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-lg flex items-start gap-3 ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : message.type === 'error'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-blue-50 text-blue-800'
              }`}
            >
              {message.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              {message.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              {message.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              <p className="text-sm">{message.text}</p>
            </motion.div>
          )}
        </div>

        {/* Security Features */}
        <PermissionGate permission={PERMISSIONS.SETTINGS_VIEW}>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Security Features</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Role-Based Access Control (RBAC)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Fine-grained permissions system with 6 predefined roles
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  Active
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Audit Logging</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Track all user actions and system changes
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                  Coming Soon
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Additional security layer for user accounts
                  </p>
                </div>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  Planned
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Data Encryption</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    End-to-end encryption for sensitive data
                  </p>
                </div>
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                  Active
                </span>
              </div>
            </div>
          </div>
        </PermissionGate>
      </div>
    </div>
  );
}