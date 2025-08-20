"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { Mail, Send, CheckCircle2, Clock, AlertCircle, Search, Filter, Plus } from "lucide-react";

const client = generateClient<Schema>();

export default function ModernCommunications() {
  const [communications, setCommunications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      const { data } = await client.models.Communication.list();
      setCommunications(data);
    } catch (error) {
      console.error("Error loading communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["all", "SENT", "PENDING", "FAILED"];

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.recipient?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.message?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || comm.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "FAILED":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const stats = {
    total: communications.length,
    sent: communications.filter(c => c.status === "SENT").length,
    pending: communications.filter(c => c.status === "PENDING").length,
    failed: communications.filter(c => c.status === "FAILED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Communications Hub
          </h1>
          <p className="text-gray-600 mt-1">Track all employee communications</p>
        </div>
        <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Message
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Messages", value: stats.total, icon: Mail, color: "from-gray-500 to-gray-600" },
          { label: "Sent", value: stats.sent, icon: Send, color: "from-green-500 to-emerald-600" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "from-amber-500 to-orange-600" },
          { label: "Failed", value: stats.failed, icon: AlertCircle, color: "from-red-500 to-rose-600" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-light rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                  {loading ? "..." : stat.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">{stat.label}</div>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="glass-light rounded-2xl p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Communications List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
          </div>
        ) : filteredCommunications.length === 0 ? (
          <div className="text-center py-12 glass-light rounded-2xl">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No communications found</p>
          </div>
        ) : (
          filteredCommunications.map((comm, index) => (
            <motion.div
              key={comm.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {getStatusIcon(comm.status)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">To: {comm.recipient}</p>
                    <p className="text-gray-600 mt-2 line-clamp-2">{comm.message}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span>Type: {comm.type}</span>
                      <span>Sent: {new Date(comm.sentAt || comm.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  comm.status === "SENT" ? "bg-green-100 text-green-700" :
                  comm.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                  comm.status === "FAILED" ? "bg-red-100 text-red-700" :
                  "bg-gray-100 text-gray-700"
                }`}>
                  {comm.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}