"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion } from "framer-motion";
import { Briefcase, User, Mail, Phone, Calendar, MapPin, Search, Filter, Plus, Brain } from "lucide-react";
import AIInsightsPanel from "@/components/AIInsightsPanel";

const client = generateClient<Schema>();

export default function ModernApplicants() {
  const [applicants, setApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    loadApplicants();
  }, []);

  const loadApplicants = async () => {
    try {
      const { data } = await client.models.Applicant.list();
      setApplicants(data);
    } catch (error) {
      console.error("Error loading applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["all", "NEW", "REVIEWING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

  const filteredApplicants = applicants.filter(applicant => {
    const matchesSearch = applicant.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         applicant.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || applicant.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      NEW: "bg-blue-100 text-blue-700",
      REVIEWING: "bg-purple-100 text-purple-700",
      INTERVIEW: "bg-amber-100 text-amber-700",
      OFFER: "bg-emerald-100 text-emerald-700",
      HIRED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const stats = {
    total: applicants.length,
    new: applicants.filter(a => a.status === "NEW").length,
    interviewing: applicants.filter(a => a.status === "INTERVIEW").length,
    hired: applicants.filter(a => a.status === "HIRED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
            Applicant Tracking
          </h1>
          <p className="text-gray-600 mt-1">Manage your recruitment pipeline</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAIInsights(!showAIInsights)}
            className={`px-4 py-2 rounded-xl hover:shadow-lg transition-all flex items-center gap-2 ${
              showAIInsights 
                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white" 
                : "bg-white text-purple-600 border border-purple-200"
            }`}
          >
            <Brain className="w-4 h-4" />
            AI Insights
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Applicant
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Applicants", value: stats.total, icon: User, color: "from-gray-500 to-gray-600" },
          { label: "New Applications", value: stats.new, icon: Briefcase, color: "from-blue-500 to-cyan-600" },
          { label: "In Interview", value: stats.interviewing, icon: Calendar, color: "from-amber-500 to-orange-600" },
          { label: "Hired This Month", value: stats.hired, icon: User, color: "from-green-500 to-emerald-600" },
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

      {/* AI Insights Panel */}
      {showAIInsights && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <AIInsightsPanel 
            position="Software Engineer" 
            applicants={applicants}
          />
        </motion.div>
      )}

      {/* Search and Filters */}
      <div className="glass-light rounded-2xl p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search applicants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex-shrink-0 ${
                selectedStatus === status
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {status === "all" ? "All" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Applicants List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        ) : filteredApplicants.length === 0 ? (
          <div className="text-center py-12 glass-light rounded-2xl">
            <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No applicants found</p>
          </div>
        ) : (
          filteredApplicants.map((applicant, index) => (
            <motion.div
              key={applicant.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="glass-light rounded-2xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center text-white font-semibold">
                    {applicant.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{applicant.name}</h3>
                    <p className="text-gray-600">{applicant.position}</p>
                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {applicant.email}
                      </span>
                      {applicant.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {applicant.phone}
                        </span>
                      )}
                      {applicant.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {applicant.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(applicant.appliedDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(applicant.status)}`}>
                  {applicant.status}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}