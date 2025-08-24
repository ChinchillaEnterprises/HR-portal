"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Users, Clock, CheckCircle } from "lucide-react";
import OnboardingDashboard from "@/components/OnboardingDashboard";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { OnboardingService } from "@/lib/onboardingService";

const client = generateClient<Schema>();

type Applicant = Schema["Applicant"]["type"];

export default function OnboardingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNewOnboardingModal, setShowNewOnboardingModal] = useState(false);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<string>("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    notStarted: 0,
  });

  useEffect(() => {
    loadApplicants();
    loadStats();
  }, []);

  const loadApplicants = async () => {
    try {
      const result = await client.models.Applicant.list({
        filter: {
          status: { eq: "hired" }, // Only show hired applicants
        },
      });
      setApplicants(result.data || []);
    } catch (error) {
      console.error("Error loading applicants:", error);
    }
  };

  const loadStats = async () => {
    try {
      const onboardings = await client.models.Onboarding.list();
      const data = onboardings.data || [];
      
      setStats({
        total: data.length,
        inProgress: data.filter(o => o.status === "in_progress").length,
        completed: data.filter(o => o.status === "completed").length,
        notStarted: data.filter(o => o.status === "not_started").length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleStartOnboarding = async () => {
    if (!selectedApplicant) return;
    
    try {
      const result = await OnboardingService.startOnboarding(
        selectedApplicant, 
        selectedWorkflow || undefined
      );

      if (result.success) {
        await loadStats();
        setShowNewOnboardingModal(false);
        setSelectedApplicant("");
        setSelectedWorkflow("");
      } else {
        alert(result.error || "Failed to start onboarding");
      }
    } catch (error) {
      alert("Failed to start onboarding");
    }
  };

  const availableWorkflows = OnboardingService.getAvailableWorkflows();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Onboarding Management</h1>
              <p className="text-gray-600 mt-2">
                Manage and track employee onboarding workflows
              </p>
            </div>
            <button
              onClick={() => setShowNewOnboardingModal(true)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Start Onboarding
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Onboardings</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-lg border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Not Started</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.notStarted}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by applicant name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">All Status</option>
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Onboarding Dashboard */}
        <OnboardingDashboard showAll={true} />

        {/* New Onboarding Modal */}
        {showNewOnboardingModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Start New Onboarding
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Applicant
                  </label>
                  <select 
                    value={selectedApplicant}
                    onChange={(e) => setSelectedApplicant(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Choose an applicant...</option>
                    {applicants.map((applicant) => (
                      <option key={applicant.id} value={applicant.id}>
                        {applicant.fullName} - {applicant.position}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Workflow Type
                  </label>
                  <select 
                    value={selectedWorkflow}
                    onChange={(e) => setSelectedWorkflow(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="">Auto-select based on role</option>
                    {availableWorkflows.map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowNewOnboardingModal(false)}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartOnboarding}
                  disabled={!selectedApplicant}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  Start Onboarding
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}