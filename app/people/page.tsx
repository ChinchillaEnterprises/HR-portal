"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, UserPlus, Search, Filter, Edit2, Trash2, 
  MoreVertical, Mail, Phone, Calendar, MapPin,
  Briefcase, Building, Award, ChevronDown, X,
  Download, Upload, Eye, UserCheck, UserX, Shield,
  AlertCircle
} from "lucide-react";
import Image from "next/image";
import { EmailService } from "@/lib/emailService";
import { NotificationService } from "@/lib/notificationService";
import { InvitationService } from "@/lib/invitationService";
import { useSession } from "next-auth/react";

const client = generateClient<Schema>();

type User = Schema["User"]["type"];

const departments = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "HR",
  "Finance",
  "Operations"
];

const roles = [
  { value: "admin", label: "Admin", color: "bg-red-100 text-red-700" },
  { value: "mentor", label: "Mentor", color: "bg-purple-100 text-purple-700" },
  { value: "team_lead", label: "Team Lead", color: "bg-blue-100 text-blue-700" },
  { value: "intern", label: "Intern", color: "bg-green-100 text-green-700" },
  { value: "staff", label: "Staff", color: "bg-gray-100 text-gray-700" }
];

export default function PeoplePage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setError(null);
      // Use Promise.allSettled to handle potential API failures gracefully
      const [usersResult] = await Promise.allSettled([
        client.models.User.list()
      ]);
      
      // Safely extract data with fallback
      const users = usersResult.status === 'fulfilled' ? usersResult.value.data : [];
      
      // Log any errors for debugging
      if (usersResult.status === 'rejected') {
        console.error('Failed to load users:', usersResult.reason);
        setError('Failed to load team members. Please refresh the page to try again.');
      }
      
      setUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
      // Ensure we have an empty array even if everything fails
      setUsers([]);
      setError('An unexpected error occurred. Please refresh the page to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowAddModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowAddModal(true);
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;
    
    try {
      const result = await client.models.User.delete({ id: user.id });
      
      // Only update state if deletion was successful
      if (result) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      // Optionally, you could add a toast notification here to inform the user
      alert("Failed to delete user. Please try again.");
    }
  };

  const getRoleStyle = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return roleConfig?.color || "bg-gray-100 text-gray-700";
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700";
      case "inactive": return "bg-gray-100 text-gray-700";
      case "pending": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesDepartment = filterDepartment === "all" || user.department === filterDepartment;
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  // Group users by department
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const dept = user.department || "Unassigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, User[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People Directory</h1>
          <p className="text-gray-600 mt-1">Manage your team members and organizational structure</p>
        </div>
        <button
          onClick={handleAddUser}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Person
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Team</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Members</p>
              <p className="text-2xl font-bold text-green-600">
                {users.filter(u => u.status === "active").length}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Departments</p>
              <p className="text-2xl font-bold text-blue-600">
                {new Set(users.map(u => u.department).filter(Boolean)).size}
              </p>
            </div>
            <Building className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Onboarding</p>
              <p className="text-2xl font-bold text-amber-600">
                {users.filter(u => u.status === "pending").length}
              </p>
            </div>
            <UserX className="w-8 h-8 text-amber-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or department..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role.value} value={role.value}>{role.label}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Users List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-red-50 rounded-lg border border-red-200 p-12 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-800 font-medium">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              loadUsers();
            }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No people found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or add new team members</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-6">
          {Object.entries(groupedUsers).map(([department, deptUsers]) => (
            <div key={department} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">{department}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {deptUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.profilePicture ? (
                            <Image
                              src={user.profilePicture}
                              alt={`${user.firstName} ${user.lastName}`}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-lg font-medium text-gray-600">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </h4>
                          <div className="flex items-center gap-4 mt-1">
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </span>
                            {user.phoneNumber && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {user.phoneNumber}
                              </span>
                            )}
                            {user.position && (
                              <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" />
                                {user.position}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className={`text-sm px-3 py-1 rounded-full ${getRoleStyle(user.role || "staff")}`}>
                          {roles.find(r => r.value === user.role)?.label || "Staff"}
                        </span>
                        <span className={`text-sm px-3 py-1 rounded-full ${getStatusStyle(user.status || "pending")}`}>
                          {user.status || "Pending"}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.map((user) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                  {user.profilePicture ? (
                    <Image
                      src={user.profilePicture}
                      alt={`${user.firstName} ${user.lastName}`}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-xl font-medium text-gray-600">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  )}
                </div>
                <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                  <MoreVertical className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              
              <h4 className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </h4>
              <p className="text-sm text-gray-500 mt-1">{user.position || "No position"}</p>
              
              <div className="mt-3 space-y-1">
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                {user.department && (
                  <p className="text-xs text-gray-500">{user.department}</p>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <span className={`text-xs px-2 py-1 rounded-full ${getRoleStyle(user.role || "staff")}`}>
                  {roles.find(r => r.value === user.role)?.label || "Staff"}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(user.status || "pending")}`}>
                  {user.status || "Pending"}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEditUser(user)}
                  className="flex-1 py-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteUser(user)}
                  className="flex-1 py-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <UserModal
            user={editingUser}
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSave={(user) => {
              if (editingUser) {
                setUsers(prev => prev.map(u => u.id === user.id ? user : u));
              } else {
                setUsers(prev => [user, ...prev]);
              }
              setShowAddModal(false);
            }}
            currentUserEmail={session?.user?.email}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// User Modal Component
function UserModal({ 
  user, 
  isOpen, 
  onClose, 
  onSave,
  currentUserEmail
}: { 
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  currentUserEmail?: string;
}) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    role: user?.role || "staff",
    status: user?.status || "pending",
    department: user?.department || "",
    position: user?.position || "",
    linkedinUrl: user?.linkedinUrl || "",
    cohortId: user?.cohortId || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (user) {
        // Update existing user
        const updated = await client.models.User.update({
          id: user.id,
          ...formData
        });
        
        if (updated.data) {
          onSave(updated.data);
        } else {
          throw new Error('Failed to update user');
        }
      } else {
        // For new users, send invitation instead of creating directly
        const invitationResult = await InvitationService.createInvitation({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role as "admin" | "mentor" | "team_lead" | "intern" | "staff",
          department: formData.department,
          position: formData.position,
          note: `Welcome to the team! You've been invited to join as ${formData.position || 'a team member'} in ${formData.department || 'our organization'}.`
        }, currentUserEmail || 'system');

        if (invitationResult.success) {
          // Create a placeholder user record with pending status
          const created = await client.models.User.create({
            ...formData,
            status: "pending", // Always pending until invitation is accepted
            startDate: new Date().toISOString().split('T')[0]
          });
          
          if (created.data) {
            onSave(created.data);
            
            // Send notification to admin about invitation sent
            try {
              await NotificationService.create({
                type: "onboarding_update",
                title: "Team Member Invitation Sent",
                message: `Invitation sent to ${created.data.firstName} ${created.data.lastName} (${formData.email})`,
                userId: currentUserEmail,
                relatedId: created.data.id,
                relatedType: "User",
                actionUrl: `/people?highlight=${created.data.id}`,
                priority: "medium",
              });
            } catch (notificationError) {
              // Log notification error but don't fail the whole operation
              console.error("Failed to create notification:", notificationError);
            }
          } else {
            throw new Error('Failed to create user record');
          }
        } else {
          throw new Error(invitationResult.error || 'Failed to send invitation');
        }
      }
    } catch (error) {
      console.error("Error saving user:", error);
      // Show user-friendly error message
      alert(error instanceof Error ? error.message : 'Failed to save user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-lg shadow-xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {user ? "Edit Team Member" : "Add New Team Member"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* LinkedIn URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.linkedinUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {user ? "Update" : "Add"} Team Member
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}