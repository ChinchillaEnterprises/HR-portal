"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";
import AIResumeAnalyzer from "@/components/AIResumeAnalyzer";
import { aiService } from "@/lib/ai-service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Linkedin,
  Calendar,
  Star,
  FileText,
  ChevronRight,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare,
  Briefcase,
  Building,
  GraduationCap,
  MapPin,
  DollarSign,
  Edit,
  Trash2,
  Download,
  Send,
  X,
  ArrowRight,
  ArrowLeft,
  UserPlus,
  Video,
  ClipboardList,
  Zap,
  Eye,
  Circle,
  Brain,
  Sparkles,
  BarChart3,
  TrendingUp,
} from "lucide-react";

const client = generateClient<Schema>();

interface ApplicantFormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  position: string;
  status: "applied" | "screening" | "interview" | "offer" | "rejected" | "hired";
  appliedDate: string;
  resumeUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  rating?: number;
  notes?: string;
  salary?: string;
  location?: string;
  education?: string;
  experience?: string;
  source?: string;
}

interface InterviewData {
  date: string;
  time: string;
  type: "phone" | "video" | "in-person";
  interviewer: string;
  location?: string;
  notes?: string;
}

interface NoteData {
  content: string;
  author: string;
  timestamp: Date;
  type: "general" | "interview" | "reference" | "decision";
}

function ApplicantsPage({ user }: { user: any }) {
  const [applicants, setApplicants] = useState<Array<Schema["Applicant"]["type"]>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPosition, setFilterPosition] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Schema["Applicant"]["type"] | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [currentUserId, setCurrentUserId] = useState("");
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [newNote, setNewNote] = useState("");
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [aiAnalysisResults, setAiAnalysisResults] = useState<any>(null);
  const [formData, setFormData] = useState<ApplicantFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    position: "",
    status: "applied",
    appliedDate: new Date().toISOString().split('T')[0],
    rating: 0,
  });
  const [interviewData, setInterviewData] = useState<InterviewData>({
    date: "",
    time: "",
    type: "video",
    interviewer: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    fetchApplicants();
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
      setCurrentUserId(authUser.id);
    }
  };

  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const response = await client.models.Applicant.list();
      const sorted = response.data.sort((a, b) => 
        new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime()
      );
      setApplicants(sorted);
    } catch (error) {
      console.error("Error fetching applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplicant = async () => {
    try {
      await client.models.Applicant.create(formData);
      
      setShowAddModal(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        position: "",
        status: "applied",
        appliedDate: new Date().toISOString().split('T')[0],
        rating: 0,
          });
      fetchApplicants();
    } catch (error) {
      console.error("Error adding applicant:", error);
    }
  };

  const handleUpdateStatus = async (applicantId: string, newStatus: any) => {
    try {
      await client.models.Applicant.update({
        id: applicantId,
        status: newStatus,
      });
      fetchApplicants();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDeleteApplicant = async (applicantId: string) => {
    if (confirm("Are you sure you want to delete this applicant?")) {
      try {
        await client.models.Applicant.delete({ id: applicantId });
        fetchApplicants();
      } catch (error) {
        console.error("Error deleting applicant:", error);
      }
    }
  };

  const handleScheduleInterview = async () => {
    if (!selectedApplicant) return;
    
    // In a real app, this would create an interview record and send calendar invites
    const interviewDetails = `Interview scheduled for ${selectedApplicant.firstName} ${selectedApplicant.lastName}
Date: ${interviewData.date}
Time: ${interviewData.time}
Type: ${interviewData.type}
Interviewer: ${interviewData.interviewer}
${interviewData.location ? `Location: ${interviewData.location}` : ''}
${interviewData.notes ? `Notes: ${interviewData.notes}` : ''}`;
    
    const currentNotes = selectedApplicant.notes || "";
    await client.models.Applicant.update({
      id: selectedApplicant.id,
      notes: currentNotes + "\n\n" + interviewDetails,
      status: "interview",
    });
    
    setShowInterviewModal(false);
    setInterviewData({
      date: "",
      time: "",
      type: "video",
      interviewer: "",
      location: "",
      notes: "",
    });
    fetchApplicants();
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    
    const note: NoteData = {
      content: newNote,
      author: user?.attributes?.email || "Unknown",
      timestamp: new Date(),
      type: "general",
    };
    
    setNotes([note, ...notes]);
    setNewNote("");
  };

  const moveToNextStage = async (applicant: Schema["Applicant"]["type"]) => {
    const stages: Array<"applied" | "screening" | "interview" | "offer" | "hired"> = 
      ["applied", "screening", "interview", "offer", "hired"];
    const currentIndex = stages.indexOf(applicant.status as any);
    
    if (currentIndex < stages.length - 1) {
      await handleUpdateStatus(applicant.id, stages[currentIndex + 1]);
    }
  };

  const moveToPreviousStage = async (applicant: Schema["Applicant"]["type"]) => {
    const stages: Array<"applied" | "screening" | "interview" | "offer" | "hired"> = 
      ["applied", "screening", "interview", "offer", "hired"];
    const currentIndex = stages.indexOf(applicant.status as any);
    
    if (currentIndex > 0) {
      await handleUpdateStatus(applicant.id, stages[currentIndex - 1]);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "applied":
        return "from-gray-500 to-gray-600";
      case "screening":
        return "from-blue-500 to-indigo-600";
      case "interview":
        return "from-purple-500 to-pink-600";
      case "offer":
        return "from-green-500 to-emerald-600";
      case "rejected":
        return "from-red-500 to-rose-600";
      case "hired":
        return "from-green-600 to-teal-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const handleAIAnalysis = async (applicant: Schema["Applicant"]["type"]) => {
    setSelectedApplicant(applicant);
    setShowAIAnalysis(true);
  };

  const getStageProgress = (status?: string) => {
    const stages = ["applied", "screening", "interview", "offer", "hired"];
    const currentIndex = stages.indexOf(status || "applied");
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const filteredApplicants = applicants.filter((applicant) => {
    const matchesSearch = 
      applicant.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.position?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || applicant.status === filterStatus;
    const matchesPosition = filterPosition === "all" || applicant.position === filterPosition;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const uniquePositions = Array.from(new Set(applicants.map(a => a.position).filter(Boolean)));

  const statusCounts = {
    all: applicants.length,
    applied: applicants.filter(a => a.status === "applied").length,
    screening: applicants.filter(a => a.status === "screening").length,
    interview: applicants.filter(a => a.status === "interview").length,
    offer: applicants.filter(a => a.status === "offer").length,
  };

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with AI features */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl gradient-primary shadow-glow">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">AI-Powered Applicant Tracker</h1>
              <p className="text-gray-600 mt-1">Smart candidate screening and analysis</p>
            </div>
          </div>
          {hasPermission(userRole, "canManageApplicants") && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Add Applicant
            </motion.button>
          )}
        </motion.div>

        {/* Pipeline Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`p-4 rounded-lg border-2 transition-all ${
                filterStatus === status 
                  ? "border-black bg-black text-white" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-sm capitalize">{status === "all" ? "Total" : status}</p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search applicants by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            {uniquePositions.length > 0 && (
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Positions</option>
                {uniquePositions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Applicants List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApplicants.map((applicant) => (
              <motion.div 
                key={applicant.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl hover-lift"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center text-white font-medium">
                        {applicant.firstName?.[0]}{applicant.lastName?.[0]}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {applicant.firstName} {applicant.lastName}
                            </h3>
                            <p className="text-gray-600">{applicant.position}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <motion.span 
                              whileHover={{ scale: 1.05 }}
                              className={`px-4 py-1.5 rounded-xl text-sm font-medium bg-gradient-to-r ${getStatusColor(applicant.status || undefined)} text-white shadow-soft`}
                            >
                              {applicant.status}
                            </motion.span>
                            <div className="relative group">
                              <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 hidden group-hover:block">
                                {hasPermission(userRole, "canManageApplicants") && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setSelectedApplicant(applicant);
                                        setShowDetailsModal(true);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Details
                                    </button>
                                    <button
                                      onClick={() => handleAIAnalysis(applicant)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-indigo-600"
                                    >
                                      <Brain className="w-4 h-4 mr-2" />
                                      AI Analysis
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedApplicant(applicant);
                                        setShowInterviewModal(true);
                                      }}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                                    >
                                      <Video className="w-4 h-4 mr-2" />
                                      Schedule Interview
                                    </button>
                                    {applicant.status !== "hired" && (
                                      <button
                                        onClick={() => moveToNextStage(applicant)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                                      >
                                        <ArrowRight className="w-4 h-4 mr-2" />
                                        Move to Next Stage
                                      </button>
                                    )}
                                    {applicant.status !== "applied" && (
                                      <button
                                        onClick={() => moveToPreviousStage(applicant)}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                                      >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Move to Previous Stage
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateStatus(applicant.id, "rejected")}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleDeleteApplicant(applicant.id)}
                                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {applicant.email}
                          </span>
                          {applicant.phoneNumber && (
                            <span className="flex items-center">
                              <Phone className="w-4 h-4 mr-1" />
                              {applicant.phoneNumber}
                            </span>
                          )}
                          {applicant.linkedinUrl && (
                            <a href={applicant.linkedinUrl} target="_blank" rel="noopener noreferrer" 
                               className="flex items-center hover:text-blue-600">
                              <Linkedin className="w-4 h-4 mr-1" />
                              LinkedIn
                            </a>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="flex items-center text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              Applied {new Date(applicant.appliedDate).toLocaleDateString()}
                            </span>
                            {applicant.rating && (
                              <span className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < (applicant.rating || 0) 
                                        ? "text-yellow-400 fill-current" 
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {applicant.resumeUrl && (
                              <a 
                                href={applicant.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-black hover:text-gray-700 text-sm font-medium flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Resume
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-black h-2 rounded-full transition-all duration-300"
                              style={{ width: `${getStageProgress(applicant.status || undefined)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
                    {/* AI Match Score if analyzed */}
                    {applicant.aiAnalyzed && applicant.aiMatchScore !== null && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute top-4 right-4 flex items-center gap-2"
                      >
                        <div className="text-right">
                          <p className="text-xs text-gray-500">AI Match</p>
                          <p className="text-2xl font-bold text-indigo-600">{applicant.aiMatchScore}%</p>
                        </div>
                        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-glow">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {filteredApplicants.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No applicants found</p>
          </div>
        )}

        {/* Add Applicant Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Add New Applicant</h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phoneNumber: "",
                      position: "",
                      status: "applied",
                      appliedDate: new Date().toISOString().split('T')[0],
                      rating: 0,
                                      });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
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

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <input
                      type="text"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g. Software Engineer"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => setFormData({ ...formData, appliedDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl || ""}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Resume URL
                    </label>
                    <input
                      type="url"
                      value={formData.resumeUrl || ""}
                      onChange={(e) => setFormData({ ...formData, resumeUrl: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Link to resume"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes || ""}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phoneNumber: "",
                      position: "",
                      status: "applied",
                      appliedDate: new Date().toISOString().split('T')[0],
                      rating: 0,
                                      });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddApplicant}
                  disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.position}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Applicant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Applicant Details Modal */}
        {showDetailsModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Applicant Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedApplicant(null);
                    setNotes([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Basic Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center text-white text-2xl font-bold">
                        {selectedApplicant.firstName?.[0]}{selectedApplicant.lastName?.[0]}
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-center mb-2">
                      {selectedApplicant.firstName} {selectedApplicant.lastName}
                    </h3>
                    <p className="text-center text-gray-600 mb-4">{selectedApplicant.position}</p>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{selectedApplicant.email}</p>
                      </div>
                      {selectedApplicant.phoneNumber && (
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium">{selectedApplicant.phoneNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500">Applied Date</p>
                        <p className="font-medium">{new Date(selectedApplicant.appliedDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Status</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedApplicant.status || undefined)}`}>
                          {selectedApplicant.status}
                        </span>
                      </div>
                      {selectedApplicant.rating && (
                        <div>
                          <p className="text-sm text-gray-500">Rating</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < (selectedApplicant.rating || 0) 
                                    ? "text-yellow-400 fill-current" 
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 space-y-2">
                      {selectedApplicant.resumeUrl && (
                        <a
                          href={selectedApplicant.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          View Resume
                        </a>
                      )}
                      {selectedApplicant.linkedinUrl && (
                        <a
                          href={selectedApplicant.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn Profile
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Notes and Activity */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Stage Progress */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Hiring Pipeline Progress</h4>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full h-1 bg-gray-200"></div>
                      </div>
                      <div className="relative flex justify-between">
                        {["applied", "screening", "interview", "offer", "hired"].map((stage, index) => {
                          const stages = ["applied", "screening", "interview", "offer", "hired"];
                          const currentIndex = stages.indexOf(selectedApplicant.status || "applied");
                          const isCompleted = index <= currentIndex;
                          const isCurrent = index === currentIndex;
                          
                          return (
                            <div key={stage} className="text-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isCompleted ? "bg-black text-white" : "bg-gray-300 text-gray-600"
                              } ${isCurrent ? "ring-4 ring-gray-200" : ""}`}>
                                {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </div>
                              <p className="text-xs mt-2 capitalize">{stage}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold mb-4">Notes & Comments</h4>
                    
                    {selectedApplicant.notes && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{selectedApplicant.notes}</p>
                      </div>
                    )}

                    <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                      {notes.map((note, index) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium">{note.author}</p>
                            <p className="text-xs text-gray-500">{note.timestamp.toLocaleString()}</p>
                          </div>
                          <p className="text-sm text-gray-700">{note.content}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleAddNote()}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      />
                      <button
                        onClick={handleAddNote}
                        disabled={!newNote.trim()}
                        className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  {hasPermission(userRole, "canManageApplicants") && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold mb-4">Quick Actions</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setShowDetailsModal(false);
                            setShowInterviewModal(true);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
                        >
                          <Video className="w-4 h-4 mr-2" />
                          Schedule Interview
                        </button>
                        {selectedApplicant.status !== "hired" && (
                          <button
                            onClick={() => {
                              moveToNextStage(selectedApplicant);
                              setShowDetailsModal(false);
                            }}
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Next Stage
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Interview Scheduling Modal */}
        {showInterviewModal && selectedApplicant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Schedule Interview</h2>
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    setInterviewData({
                      date: "",
                      time: "",
                      type: "video",
                      interviewer: "",
                      location: "",
                      notes: "",
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Scheduling interview for: <span className="font-medium">{selectedApplicant.firstName} {selectedApplicant.lastName}</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={interviewData.date}
                      onChange={(e) => setInterviewData({ ...interviewData, date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={interviewData.time}
                      onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interview Type
                  </label>
                  <select
                    value={interviewData.type}
                    onChange={(e) => setInterviewData({ ...interviewData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  >
                    <option value="phone">Phone Interview</option>
                    <option value="video">Video Interview</option>
                    <option value="in-person">In-Person Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Interviewer
                  </label>
                  <input
                    type="text"
                    value={interviewData.interviewer}
                    onChange={(e) => setInterviewData({ ...interviewData, interviewer: e.target.value })}
                    placeholder="Enter interviewer name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>

                {interviewData.type === "in-person" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      type="text"
                      value={interviewData.location}
                      onChange={(e) => setInterviewData({ ...interviewData, location: e.target.value })}
                      placeholder="Office address or room number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={interviewData.notes}
                    onChange={(e) => setInterviewData({ ...interviewData, notes: e.target.value })}
                    rows={3}
                    placeholder="Any additional notes or instructions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowInterviewModal(false);
                    setInterviewData({
                      date: "",
                      time: "",
                      type: "video",
                      interviewer: "",
                      location: "",
                      notes: "",
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleInterview}
                  disabled={!interviewData.date || !interviewData.time || !interviewData.interviewer}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Schedule Interview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Analysis Modal */}
        <AnimatePresence>
          {showAIAnalysis && selectedApplicant && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setShowAIAnalysis(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25 }}
                className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl gradient-primary shadow-glow">
                      <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">AI Candidate Analysis</h2>
                      <p className="text-gray-600">
                        {selectedApplicant.firstName} {selectedApplicant.lastName} - {selectedApplicant.position}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAIAnalysis(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-500" />
                  </motion.button>
                </div>

                <AIResumeAnalyzer
                  applicantId={selectedApplicant.id}
                  position={selectedApplicant.position || ""}
                  onAnalysisComplete={async (analysis) => {
                    // Update applicant with AI analysis results
                    await client.models.Applicant.update({
                      id: selectedApplicant.id,
                      aiAnalyzed: true,
                      aiMatchScore: analysis.matchScore,
                      aiRecommendation: 
                        analysis.matchScore >= 80 ? "strong_yes" :
                        analysis.matchScore >= 70 ? "yes" :
                        analysis.matchScore >= 60 ? "maybe" :
                        analysis.matchScore >= 50 ? "no" : "strong_no",
                      aiInsights: {
                        extractedData: analysis.extractedData,
                        strengths: analysis.strengths,
                        weaknesses: analysis.weaknesses,
                        recommendations: analysis.recommendations
                      }
                    });
                    
                    fetchApplicants(); // Refresh the list
                    setAiAnalysisResults(analysis);
                  }}
                />

                {/* Quick Actions based on AI Analysis */}
                {aiAnalysisResults && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl"
                  >
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-indigo-600" />
                      AI-Powered Actions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {aiAnalysisResults.matchScore >= 70 && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowAIAnalysis(false);
                            setShowInterviewModal(true);
                          }}
                          className="p-4 bg-white rounded-xl shadow-soft hover:shadow-md transition-all flex items-center gap-3"
                        >
                          <Video className="w-5 h-5 text-green-600" />
                          <div className="text-left">
                            <p className="font-medium text-gray-900">Schedule Interview</p>
                            <p className="text-xs text-gray-600">Strong candidate match</p>
                          </div>
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => moveToNextStage(selectedApplicant)}
                        className="p-4 bg-white rounded-xl shadow-soft hover:shadow-md transition-all flex items-center gap-3"
                      >
                        <ArrowRight className="w-5 h-5 text-indigo-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Move to Screening</p>
                          <p className="text-xs text-gray-600">Begin evaluation process</p>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          // Generate AI-powered email
                          alert("AI-generated email feature coming soon!");
                        }}
                        className="p-4 bg-white rounded-xl shadow-soft hover:shadow-md transition-all flex items-center gap-3"
                      >
                        <Mail className="w-5 h-5 text-purple-600" />
                        <div className="text-left">
                          <p className="font-medium text-gray-900">Send AI Email</p>
                          <p className="text-xs text-gray-600">Personalized response</p>
                        </div>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}

export default function ApplicantsPageWrapper() {
  return (
    <Authenticator>
      {({ signOut, user }) => <ApplicantsPage user={user} />}
    </Authenticator>
  );
}