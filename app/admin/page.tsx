"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  Users,
  UserPlus,
  Settings,
  Shield,
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  AlertCircle,
  CheckSquare,
  Square,
  UserCheck,
  UserX,
  ChevronDown,
  RefreshCw,
  Send,
  FileText,
  Briefcase,
  ClipboardList,
  MoreVertical,
  Archive,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";

const client = generateClient<Schema>();

interface BulkAction {
  id: string;
  label: string;
  icon: any;
  action: (selectedIds: string[]) => Promise<void>;
  requireConfirmation?: boolean;
  confirmMessage?: string;
}

function AdminPage({ user }: { user: any }) {
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showBulkActionMenu, setShowBulkActionMenu] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "staff" as any,
    department: "",
    position: "",
    phoneNumber: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.models.User.list();
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      await client.models.User.create({
        ...formData,
        status: "pending",
        startDate: new Date().toISOString().split('T')[0],
      });
      
      setShowAddUser(false);
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "staff",
        department: "",
        position: "",
        phoneNumber: "",
      });
      
      fetchUsers();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await client.models.User.update({
        id: userId,
        ...updates,
      });
      
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // Bulk Actions
  const userBulkActions: BulkAction[] = [
    {
      id: "activate",
      label: "Activate Users",
      icon: UserCheck,
      action: async (ids) => {
        for (const id of ids) {
          await client.models.User.update({ id, status: "active" });
        }
        fetchUsers();
      },
    },
    {
      id: "deactivate",
      label: "Deactivate Users",
      icon: UserX,
      action: async (ids) => {
        for (const id of ids) {
          await client.models.User.update({ id, status: "inactive" });
        }
        fetchUsers();
      },
      requireConfirmation: true,
      confirmMessage: "Are you sure you want to deactivate selected users?",
    },
    {
      id: "change-role",
      label: "Change Role",
      icon: Shield,
      action: async (ids) => {
        const newRole = prompt("Enter new role (admin, mentor, team_lead, intern, staff):");
        if (newRole && ["admin", "mentor", "team_lead", "intern", "staff"].includes(newRole)) {
          for (const id of ids) {
            await client.models.User.update({ id, role: newRole as any });
          }
          fetchUsers();
        }
      },
    },
    {
      id: "send-email",
      label: "Send Email",
      icon: Mail,
      action: async (ids) => {
        const subject = prompt("Email subject:");
        const message = prompt("Email message:");
        if (subject && message) {
          const selectedUsersList = users.filter(u => ids.includes(u.id));
          for (const selectedUser of selectedUsersList) {
            await client.models.Communication.create({
              type: "email",
              subject,
              content: message,
              recipientEmail: selectedUser.email,
              recipientId: selectedUser.id,
              senderId: user.id,
              status: "sent",
              sentDate: new Date().toISOString(),
            });
          }
          alert(`Email sent to ${ids.length} users`);
        }
      },
    },
    {
      id: "export",
      label: "Export to CSV",
      icon: Download,
      action: async (ids) => {
        const selectedUsersList = users.filter(u => ids.includes(u.id));
        const csv = [
          ["ID", "Name", "Email", "Role", "Status", "Department", "Start Date"],
          ...selectedUsersList.map(u => [
            u.id,
            `${u.firstName} ${u.lastName}`,
            u.email,
            u.role,
            u.status,
            u.department || "",
            u.startDate || "",
          ]),
        ].map(row => row.join(",")).join("\n");
        
        const blob = new Blob([csv], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users-export.csv";
        a.click();
      },
    },
  ];

  const handleBulkAction = async (action: BulkAction) => {
    if (selectedUsers.length === 0) {
      alert("Please select users first");
      return;
    }

    if (action.requireConfirmation) {
      if (!confirm(action.confirmMessage || `Are you sure you want to ${action.label}?`)) {
        return;
      }
    }

    try {
      setBulkActionLoading(true);
      await action.action(selectedUsers);
      setSelectedUsers([]);
      setShowBulkActionMenu(false);
    } catch (error) {
      console.error("Bulk action error:", error);
      alert("Error performing bulk action");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id));
    }
  };

  const toggleSelectUser = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        await client.models.User.delete({ id: userId });
        fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === "active").length,
    pendingUsers: users.filter(u => u.status === "pending").length,
    adminCount: users.filter(u => u.role === "admin").length,
  };

  return (
    <ProtectedRoute requiredRole={["admin"]}>
      <Layout user={user}>
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600">Manage users and system settings</p>
            </div>
            <div className="flex items-center space-x-4">
              {selectedUsers.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowBulkActionMenu(!showBulkActionMenu)}
                    className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                  >
                    <Settings className="w-5 h-5 mr-2" />
                    Bulk Actions ({selectedUsers.length})
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  
                  {showBulkActionMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-10">
                      {userBulkActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleBulkAction(action)}
                          disabled={bulkActionLoading}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center disabled:opacity-50"
                        >
                          <action.icon className="w-4 h-4 mr-2" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={fetchUsers}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setShowAddUser(true)}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-gray-400" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold">{stats.activeUsers}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingUsers}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Admins</p>
                  <p className="text-2xl font-bold">{stats.adminCount}</p>
                </div>
                <Shield className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* User Management Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="mentor">Mentor</option>
                  <option value="team_lead">Team Lead</option>
                  <option value="intern">Intern</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Joined
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleSelectUser(user.id)}
                            className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center text-white font-medium">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user.id ? (
                            <select
                              value={user.role || 'staff'}
                              onChange={(e) => {
                                const updatedUsers = users.map(u => 
                                  u.id === user.id ? { ...u, role: e.target.value as any } : u
                                );
                                setUsers(updatedUsers);
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="admin">Admin</option>
                              <option value="mentor">Mentor</option>
                              <option value="team_lead">Team Lead</option>
                              <option value="intern">Intern</option>
                              <option value="staff">Staff</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              user.role === "admin" ? "bg-red-100 text-red-700" :
                              user.role === "mentor" ? "bg-blue-100 text-blue-700" :
                              user.role === "team_lead" ? "bg-purple-100 text-purple-700" :
                              user.role === "intern" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {user.role?.replace("_", " ")}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingUser === user.id ? (
                            <input
                              type="text"
                              value={user.department || ""}
                              onChange={(e) => {
                                const updatedUsers = users.map(u => 
                                  u.id === user.id ? { ...u, department: e.target.value } : u
                                );
                                setUsers(updatedUsers);
                              }}
                              className="text-sm border rounded px-2 py-1 w-full"
                            />
                          ) : (
                            user.department || "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user.id ? (
                            <select
                              value={user.status || 'active'}
                              onChange={(e) => {
                                const updatedUsers = users.map(u => 
                                  u.id === user.id ? { ...u, status: e.target.value as any } : u
                                );
                                setUsers(updatedUsers);
                              }}
                              className="text-sm border rounded px-2 py-1"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="pending">Pending</option>
                            </select>
                          ) : (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.status === "active" ? "bg-green-100 text-green-700" :
                              user.status === "inactive" ? "bg-gray-100 text-gray-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {user.status}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.startDate ? new Date(user.startDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {editingUser === user.id ? (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  const editedUser = users.find(u => u.id === user.id);
                                  if (editedUser) {
                                    handleUpdateUser(user.id, {
                                      role: editedUser.role,
                                      department: editedUser.department,
                                      status: editedUser.status,
                                    });
                                  }
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingUser(null);
                                  fetchUsers();
                                }}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => setEditingUser(user.id)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add User Modal */}
          {showAddUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add New User</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="staff">Staff</option>
                      <option value="intern">Intern</option>
                      <option value="team_lead">Team Lead</option>
                      <option value="mentor">Mentor</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 mt-6">
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateUser}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  );
}

export default function AdminPageWrapper() {
  return (
    <Authenticator>
      {({ signOut, user }) => <AdminPage user={user} />}
    </Authenticator>
  );
}