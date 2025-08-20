"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { UserCheck, Clock, CheckCircle2, AlertCircle, Plus, Search } from "lucide-react";

const client = generateClient<Schema>();

export default function ModernOnboarding() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        client.models.OnboardingTask.list(),
        client.models.User.list(),
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-blue-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
    }
  };

  const filteredTasks = tasks.filter(task =>
    task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "COMPLETED").length,
    inProgress: tasks.filter(t => t.status === "IN_PROGRESS").length,
    pending: tasks.filter(t => t.status === "PENDING").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Onboarding Hub
          </h1>
          <p className="text-gray-600 mt-1">Manage employee onboarding tasks and progress</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Tasks", value: stats.total, color: "from-gray-500 to-gray-600" },
          { label: "Completed", value: stats.completed, color: "from-green-500 to-emerald-600" },
          { label: "In Progress", value: stats.inProgress, color: "from-blue-500 to-cyan-600" },
          { label: "Pending", value: stats.pending, color: "from-amber-500 to-orange-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-light rounded-2xl p-6"
          >
            <div className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent" 
                 style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
                 className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
              {loading ? "..." : stat.value}
            </div>
            <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="glass-light rounded-2xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12 glass-light rounded-2xl">
            <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No tasks found</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(task.status)}
                    <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                  </div>
                  <p className="text-gray-600 mt-2">{task.description}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    {task.assignedTo && (
                      <span>Assigned to: {users.find(u => u.id === task.assignedTo)?.name || "Unknown"}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    task.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    task.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}