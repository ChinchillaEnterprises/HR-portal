"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  ChevronDown,
  Check,
  X,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import PermissionGate from "@/components/PermissionGate";
import { 
  ROLES, 
  PERMISSIONS, 
  Role, 
  UserRole,
  getRoleDisplayName,
  getRoleBadgeColor,
  assignRole,
  removeRole,
  listUserRoles,
  getRolePermissions
} from "@/lib/auth/rbac";

export default function UsersPage() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserRole | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [showPermissions, setShowPermissions] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    role: ROLES.VIEWER as Role,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userRoles = await listUserRoles();
      setUsers(userRoles);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.role) return;

    try {
      const success = await assignRole(
        newUser.email,
        newUser.role,
        user?.email || 'system'
      );

      if (success) {
        setShowAddUser(false);
        setNewUser({ email: "", role: ROLES.VIEWER });
        loadUsers();
      }
    } catch (error) {
      console.error("Error adding user:", error);
    }
  };

  const handleUpdateRole = async (email: string, newRole: Role) => {
    try {
      const success = await assignRole(
        email,
        newRole,
        user?.email || 'system'
      );

      if (success) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!confirm(`Are you sure you want to remove access for ${email}?`)) {
      return;
    }

    try {
      const success = await removeRole(email);
      if (success) {
        loadUsers();
      }
    } catch (error) {
      console.error("Error removing user:", error);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            User Management
          </h1>
          <p className="mt-2 text-gray-600">
            Manage user roles and permissions
          </p>
        </div>

        <PermissionGate
          permission={PERMISSIONS.USER_VIEW}
          fallback={
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to view user management.
              </p>
            </div>
          }
        >
          {/* Search and Actions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <PermissionGate permission={PERMISSIONS.USER_CREATE}>
                <button
                  onClick={() => setShowAddUser(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add User
                </button>
              </PermissionGate>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No users found
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Permissions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assigned
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((userRole) => (
                    <tr key={userRole.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userRole.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: {userRole.userId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PermissionGate
                          permission={PERMISSIONS.USER_ASSIGN_ROLES}
                          fallback={
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-${getRoleBadgeColor(userRole.role)}-100 text-${getRoleBadgeColor(userRole.role)}-800`}>
                              {getRoleDisplayName(userRole.role)}
                            </span>
                          }
                        >
                          <select
                            value={userRole.role}
                            onChange={(e) => handleUpdateRole(userRole.email, e.target.value as Role)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            {Object.values(ROLES).map((role) => (
                              <option key={role} value={role}>
                                {getRoleDisplayName(role)}
                              </option>
                            ))}
                          </select>
                        </PermissionGate>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setShowPermissions(
                            showPermissions === userRole.email ? null : userRole.email
                          )}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {getRolePermissions(userRole.role).length} permissions
                          <ChevronDown className={`w-4 h-4 transition-transform ${
                            showPermissions === userRole.email ? 'rotate-180' : ''
                          }`} />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {userRole.assignedAt ? new Date(userRole.assignedAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <PermissionGate permission={PERMISSIONS.USER_DELETE}>
                          <button
                            onClick={() => handleRemoveUser(userRole.email)}
                            className="text-red-600 hover:text-red-900"
                            disabled={userRole.email === user?.email}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </PermissionGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </PermissionGate>

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg max-w-md w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add User
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {Object.values(ROLES).map((role) => (
                      <option key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddUser(false);
                    setNewUser({ email: "", role: ROLES.VIEWER });
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!newUser.email}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add User
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Permissions Detail */}
        {showPermissions && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 bg-gray-50 rounded-lg p-4"
          >
            <h4 className="font-medium text-gray-900 mb-3">
              Permissions for {showPermissions}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {getRolePermissions(
                users.find(u => u.email === showPermissions)?.role || ROLES.VIEWER
              ).map((permission) => (
                <div
                  key={permission}
                  className="flex items-center gap-2 text-sm text-gray-600"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  {permission}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}