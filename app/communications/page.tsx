"use client";

import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mail, Send, CheckCircle2, Clock, AlertCircle, Search, 
  Filter, Plus, MessageSquare, Bell, Calendar, User,
  FileText, RefreshCw, X, ChevronRight
} from "lucide-react";
import { EmailService } from "@/lib/emailService";

const client = generateClient<Schema>();

type Communication = Schema["Communication"]["type"];

export default function ModernCommunications() {
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    loadCommunications();
  }, []);

  const loadCommunications = async () => {
    try {
      const { data } = await client.models.Communication.list({
        limit: 100,
      });
      setCommunications(data.sort((a, b) => 
        new Date(b.sentDate || b.createdAt).getTime() - new Date(a.sentDate || a.createdAt).getTime()
      ));
    } catch (error) {
      console.error("Error loading communications:", error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ["all", "sent", "delivered", "failed", "scheduled"];
  const types = ["all", "email", "slack", "notification"];

  const filteredCommunications = communications.filter(comm => {
    const matchesSearch = comm.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.recipientEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         comm.content?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || comm.status === selectedStatus;
    const matchesType = selectedType === "all" || comm.type === selectedType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
      case "delivered":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "scheduled":
        return <Clock className="w-5 h-5 text-amber-500" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Mail className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "slack":
        return <MessageSquare className="w-4 h-4" />;
      case "notification":
        return <Bell className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const stats = {
    total: communications.length,
    sent: communications.filter(c => c.status === "sent" || c.status === "delivered").length,
    scheduled: communications.filter(c => c.status === "scheduled").length,
    failed: communications.filter(c => c.status === "failed").length,
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
        <div className="flex items-center gap-2">
          <button 
            onClick={loadCommunications}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => setShowCompose(true)}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transition-shadow flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Message
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Messages", value: stats.total, icon: Mail, color: "from-gray-500 to-gray-600" },
          { label: "Sent", value: stats.sent, icon: Send, color: "from-green-500 to-emerald-600" },
          { label: "Scheduled", value: stats.scheduled, icon: Clock, color: "from-amber-500 to-orange-600" },
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
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-sm text-gray-600">Status:</span>
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  selectedStatus === status
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Type:</span>
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                  selectedType === type
                    ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
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
                  <div className="p-2 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl">
                    {getTypeIcon(comm.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{comm.subject}</h3>
                    <p className="text-sm text-gray-600 mt-1">To: {comm.recipientEmail || comm.recipientId}</p>
                    <p className="text-gray-600 mt-2 line-clamp-2">{comm.content}</p>
                    <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        {getTypeIcon(comm.type)}
                        {comm.type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(comm.sentDate || comm.scheduledDate || comm.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {comm.senderId}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(comm.status)}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    comm.status === "sent" || comm.status === "delivered" ? "bg-green-100 text-green-700" :
                    comm.status === "scheduled" ? "bg-amber-100 text-amber-700" :
                    comm.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {comm.status}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Compose Modal */}
      <AnimatePresence>
        {showCompose && (
          <ComposeModal
            isOpen={showCompose}
            onClose={() => setShowCompose(false)}
            onSend={async (data) => {
              const result = await EmailService.sendEmail({
                to: data.to,
                subject: data.subject,
                htmlContent: data.content,
                textContent: data.content,
              });
              
              if (result.success) {
                console.log('Email sent successfully');
                loadCommunications();
                setShowCompose(false);
              } else {
                console.error('Failed to send email:', result.error);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Compose Modal Component
function ComposeModal({ 
  isOpen, 
  onClose, 
  onSend 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onSend: (data: { to: string; subject: string; content: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({
    to: "",
    subject: "",
    content: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await onSend(formData);
    setSending(false);
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
        className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Compose Message
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <input
              type="email"
              required
              value={formData.to}
              onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject
            </label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter subject"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message
            </label>
            <textarea
              required
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Type your message here..."
              rows={10}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {sending && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </motion.div>
    </>
  );
}