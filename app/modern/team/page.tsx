"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { Users, Mail, Phone, Building, Calendar, Search, Grid, List, UserCircle } from "lucide-react";

const client = generateClient<Schema>();

export default function ModernTeam() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data } = await client.models.User.list();
      setUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)));
  const stats = {
    total: users.length,
    departments: departments.length,
    newThisMonth: users.filter(u => {
      const joinDate = new Date(u.hireDate);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length,
  };

  const getRoleColor = (role: string) => {
    const colors: { [key: string]: string } = {
      "Manager": "from-purple-500 to-pink-600",
      "Engineer": "from-blue-500 to-cyan-600",
      "Designer": "from-amber-500 to-orange-600",
      "HR": "from-emerald-500 to-teal-600",
      "Sales": "from-rose-500 to-red-600",
    };
    return colors[role] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Team Directory
          </h1>
          <p className="text-gray-600 mt-1">Connect with your colleagues</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "grid" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === "list" ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-light rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                {loading ? "..." : stats.total}
              </div>
              <div className="text-sm text-gray-600 mt-1">Team Members</div>
            </div>
            <Users className="w-8 h-8 text-cyan-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-light rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent">
                {loading ? "..." : stats.departments}
              </div>
              <div className="text-sm text-gray-600 mt-1">Departments</div>
            </div>
            <Building className="w-8 h-8 text-purple-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-light rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                {loading ? "..." : stats.newThisMonth}
              </div>
              <div className="text-sm text-gray-600 mt-1">New This Month</div>
            </div>
            <Calendar className="w-8 h-8 text-emerald-500" />
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="glass-light rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search team members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Team Members */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 glass-light rounded-2xl">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team members found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col items-center text-center">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white text-2xl font-semibold mb-4`}>
                  {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.role}</p>
                <p className="text-xs text-gray-500 mt-1">{user.department}</p>
                
                <div className="flex flex-col gap-2 mt-4 w-full">
                  <a href={`mailto:${user.email}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </a>
                  {user.phone && (
                    <span className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRoleColor(user.role)} flex items-center justify-center text-white font-semibold`}>
                    {user.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.role} • {user.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <a href={`mailto:${user.email}`} className="flex items-center gap-1 hover:text-gray-900">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </a>
                  {user.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {user.phone}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}