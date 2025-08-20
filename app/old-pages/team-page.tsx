"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import AuthWrapper from "@/components/AuthWrapper";
import NeoLayout from "@/components/NeoLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  UserCheck,
  Building,
  Briefcase,
  Award,
  ChevronRight,
  Grid,
  List,
  X,
  Sparkles,
  Zap,
  Star,
  UserPlus,
  Globe,
  Activity,
  TrendingUp,
} from "lucide-react";
import { type UserRole } from "@/lib/auth";

const client = generateClient<Schema>();

function TeamPage({ user }: { user: any }) {
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(true);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserData, setNewUserData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: "",
    role: "staff" as UserRole,
    position: "",
    startDate: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await client.models.User.list();
      const sorted = response.data.sort((a, b) => 
        (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName)
      );
      setUsers(sorted);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    console.log("handleAddUser called");
    console.log("Form data:", newUserData);
    
    try {
      const userData: any = {
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        email: newUserData.email,
        phoneNumber: newUserData.phoneNumber || null,
        department: newUserData.department || null,
        role: newUserData.role,
        position: newUserData.position || null,
        status: "active" as const,
        onboardingCompleted: null,
      };
      
      // Only include startDate if it's provided and valid
      if (newUserData.startDate && newUserData.startDate.trim() !== "") {
        userData.startDate = newUserData.startDate;
      }
      
      console.log("About to create user with data:", userData);
      const response = await client.models.User.create(userData);
      console.log("Full create response:", response);
      console.log("Response data:", response.data);
      console.log("Response errors:", response.errors);
      
      if (response.errors && response.errors.length > 0) {
        console.log("Error details:", JSON.stringify(response.errors, null, 2));
        response.errors.forEach((error, index) => {
          console.log(`Error ${index}:`, error.message, error);
        });
      }
      
      if (response.data) {
        console.log("User created successfully:", response.data);
        setUsers([...users, response.data]);
        setNewUserData({
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
          department: "",
          role: "staff" as UserRole,
          position: "",
          startDate: "",
        });
        setShowAddUserModal(false);
        alert("User added successfully!");
      } else {
        console.log("No data in response");
        alert("Failed to create user - no data returned");
      }
    } catch (error) {
      console.error("Error adding user:", error);
      alert(`Error adding user: ${error}`);
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case "admin":
        return <Shield className="w-4 h-4" />;
      case "mentor":
        return <UserCheck className="w-4 h-4" />;
      case "team_lead":
        return <Award className="w-4 h-4" />;
      case "intern":
        return <Briefcase className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getRoleColor = (role?: string | null) => {
    switch (role) {
      case "admin":
        return "from-red-500 to-rose-600";
      case "mentor":
        return "from-blue-500 to-indigo-600";
      case "team_lead":
        return "from-purple-500 to-pink-600";
      case "intern":
        return "from-green-500 to-emerald-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const departments = ["Engineering", "Design", "Marketing", "Sales", "HR", "Operations"];

  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesDepartment = filterDepartment === "all" || user.department === filterDepartment;
    return matchesSearch && matchesRole && matchesDepartment;
  });

  return (
    <NeoLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with animations */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl gradient-primary shadow-glow">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Team Directory</h1>
              <p className="text-gray-600 mt-1">Connect with your amazing colleagues</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddUserModal(true)}
              className="btn-primary flex items-center gap-2 shadow-soft"
            >
              <UserPlus className="w-5 h-5" />
              Add Person
            </motion.button>
            <div className="flex items-center gap-1 glass-card rounded-xl p-1">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "grid" 
                    ? "gradient-primary text-white shadow-soft" 
                    : "hover:bg-white/50 text-gray-600"
                }`}
              >
                <Grid className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${
                  viewMode === "list" 
                    ? "gradient-primary text-white shadow-soft" 
                    : "hover:bg-white/50 text-gray-600"
                }`}
              >
                <List className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Stats with modern styling */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: "Total Team", value: users.length, icon: Users, gradient: "from-blue-500 to-indigo-600" },
            { label: "Mentors", value: users.filter(u => u.role === "mentor").length, icon: UserCheck, gradient: "from-purple-500 to-pink-600" },
            { label: "Team Leads", value: users.filter(u => u.role === "team_lead").length, icon: Award, gradient: "from-amber-500 to-orange-600" },
            { label: "Interns", value: users.filter(u => u.role === "intern").length, icon: Briefcase, gradient: "from-emerald-500 to-teal-600" },
            { label: "Staff", value: users.filter(u => u.role === "staff").length, icon: Shield, gradient: "from-gray-500 to-gray-600" },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 hover-lift group"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-glow opacity-80 group-hover:opacity-100 transition-opacity`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="mt-2 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-green-600 font-medium">+12%</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Filters with glass morphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 transition-colors group-focus-within:text-indigo-600" />
              <input
                type="text"
                placeholder="Search by name, email, or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
              />
              {searchTerm && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </motion.button>
              )}
            </div>
            <motion.select
              whileHover={{ scale: 1.02 }}
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="mentor">Mentor</option>
              <option value="team_lead">Team Lead</option>
              <option value="intern">Intern</option>
              <option value="staff">Staff</option>
            </motion.select>
            <motion.select
              whileHover={{ scale: 1.02 }}
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </motion.select>
          </div>
        </motion.div>

        {/* Team Members */}
        {loading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600"
            />
            <p className="mt-4 text-gray-600">Loading amazing people...</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredUsers.map((user, index) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card rounded-2xl p-6 hover-lift group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white text-xl font-bold shadow-glow`}
                      >
                        <div className="absolute inset-0 rounded-2xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </motion.div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {user.firstName} {user.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{user.position || user.role}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <motion.div 
                      whileHover={{ x: 5 }}
                      className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 mr-3 text-indigo-500" />
                      <span className="truncate">{user.email}</span>
                    </motion.div>
                    {user.phoneNumber && (
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Phone className="w-4 h-4 mr-3 text-emerald-500" />
                        {user.phoneNumber}
                      </motion.div>
                    )}
                    {user.department && (
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <Building className="w-4 h-4 mr-3 text-purple-500" />
                        {user.department}
                      </motion.div>
                    )}
                    {user.startDate && (
                      <motion.div 
                        whileHover={{ x: 5 }}
                        className="flex items-center text-sm text-gray-600"
                      >
                        <Calendar className="w-4 h-4 mr-3 text-amber-500" />
                        Started {new Date(user.startDate).toLocaleDateString()}
                      </motion.div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <motion.span 
                      whileHover={{ scale: 1.05 }}
                      className={`inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role || undefined)} text-white shadow-soft`}
                    >
                      {getRoleIcon(user.role || undefined)}
                      <span className="ml-1.5 capitalize">{user.role?.replace("_", " ")}</span>
                    </motion.span>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center group"
                    >
                      View Profile
                      <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl overflow-hidden shadow-soft"
          >
            <table className="min-w-full divide-y divide-white/20">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      Name
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="relative px-6 py-4">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 divide-y divide-white/20">
                <AnimatePresence>
                  {filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-white/70 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getRoleColor(user.role)} flex items-center justify-center text-white font-medium shadow-soft`}
                          >
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </motion.div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{user.position}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.span 
                          whileHover={{ scale: 1.05 }}
                          className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-gradient-to-r ${getRoleColor(user.role || undefined)} text-white shadow-soft`}
                        >
                          {getRoleIcon(user.role || undefined)}
                          <span className="ml-1 capitalize">{user.role?.replace("_", " ")}</span>
                        </motion.span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.department ? (
                          <span className="flex items-center gap-2">
                            <Building className="w-4 h-4 text-purple-500" />
                            {user.department}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <Mail className="w-4 h-4 text-indigo-500" />
                          {user.email}
                        </div>
                        {user.phoneNumber && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                            <Phone className="w-4 h-4 text-emerald-500" />
                            {user.phoneNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.startDate ? (
                          <span className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-amber-500" />
                            {new Date(user.startDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </motion.div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-600 text-lg font-medium">No team members found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </motion.div>
        )}

        {/* Add User Modal with animations */}
        <AnimatePresence>
          {showAddUserModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAddUserModal(false)}
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="glass-card rounded-3xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl gradient-primary shadow-glow">
                      <UserPlus className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gradient">Add New Person</h2>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddUserModal(false)}
                    className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-all"
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={newUserData.firstName}
                        onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                        required
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                        required
                      />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={newUserData.phoneNumber}
                      onChange={(e) => setNewUserData({ ...newUserData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </motion.div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <select
                        value={newUserData.department}
                        onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all cursor-pointer"
                      >
                        <option value="">Select Department</option>
                        {departments.map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Role *
                      </label>
                      <select
                        value={newUserData.role}
                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as UserRole })}
                        className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all cursor-pointer"
                        required
                      >
                        <option value="staff">Staff</option>
                        <option value="intern">Intern</option>
                        <option value="team_lead">Team Lead</option>
                        <option value="mentor">Mentor</option>
                        <option value="admin">Admin</option>
                      </select>
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Position/Title
                    </label>
                    <input
                      type="text"
                      value={newUserData.position}
                      onChange={(e) => setNewUserData({ ...newUserData, position: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                      placeholder="e.g. Software Engineer, Designer"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45 }}
                  >
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newUserData.startDate}
                      onChange={(e) => setNewUserData({ ...newUserData, startDate: e.target.value })}
                      className="w-full px-4 py-3 bg-white/50 border border-white/30 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent focus:bg-white transition-all"
                    />
                  </motion.div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowAddUserModal(false)}
                    className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleAddUser}
                    className="px-6 py-3 btn-primary flex items-center gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    Add Person
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </NeoLayout>
  );
}

export default function TeamPageWrapper() {
  return (
    <AuthWrapper>
      {({ user }) => <TeamPage user={user} />}
    </AuthWrapper>
  );
}
