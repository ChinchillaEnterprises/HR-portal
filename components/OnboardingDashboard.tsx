"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  CheckCircle, 
  Clock, 
  User, 
  Calendar, 
  FileText, 
  Mail, 
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from "lucide-react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { OnboardingService } from "@/lib/onboardingService";

const client = generateClient<Schema>();

type Onboarding = Schema["Onboarding"]["type"];
type OnboardingTask = Schema["OnboardingTask"]["type"];
type Applicant = Schema["Applicant"]["type"];

interface OnboardingWithTasks extends Onboarding {
  tasks: OnboardingTask[];
  applicant: Applicant;
}

interface OnboardingDashboardProps {
  userId?: string;
  applicantId?: string;
  showAll?: boolean;
}

export default function OnboardingDashboard({ 
  userId, 
  applicantId, 
  showAll = false 
}: OnboardingDashboardProps) {
  const [onboardings, setOnboardings] = useState<OnboardingWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOnboarding, setSelectedOnboarding] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadOnboardings();
  }, [userId, applicantId]);

  const loadOnboardings = async () => {
    try {
      setLoading(true);
      
      let onboardingData;
      if (applicantId) {
        // Load specific applicant's onboarding
        onboardingData = await client.models.Onboarding.list({
          filter: {
            applicantId: { eq: applicantId },
          },
        });
      } else {
        // Load all onboardings
        onboardingData = await client.models.Onboarding.list();
      }

      if (!onboardingData.data) {
        setOnboardings([]);
        return;
      }

      // Fetch tasks and applicant data for each onboarding
      const enrichedOnboardings = await Promise.all(
        onboardingData.data.map(async (onboarding) => {
          const [tasksResult, applicantResult] = await Promise.all([
            client.models.OnboardingTask.list({
              filter: {
                onboardingId: { eq: onboarding.id },
              },
            }),
            client.models.Applicant.get({ id: onboarding.applicantId }),
          ]);

          return {
            ...onboarding,
            tasks: tasksResult.data || [],
            applicant: applicantResult.data!,
          };
        })
      );

      setOnboardings(enrichedOnboardings);
    } catch (err) {
      console.error("Error loading onboardings:", err);
      setError("Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string, onboardingId: string) => {
    try {
      setActionLoading(taskId);
      
      const result = await OnboardingService.completeTask(
        taskId, 
        "Completed via dashboard",
        userId || "System"
      );

      if (result.success) {
        await loadOnboardings();
      } else {
        setError(result.error || "Failed to complete task");
      }
    } catch (err) {
      setError("Failed to complete task");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartOnboarding = async (applicantId: string, workflowId?: string) => {
    try {
      setActionLoading(applicantId);
      
      const result = await OnboardingService.startOnboarding(applicantId, workflowId);

      if (result.success) {
        await loadOnboardings();
      } else {
        setError(result.error || "Failed to start onboarding");
      }
    } catch (err) {
      setError("Failed to start onboarding");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 bg-green-50";
      case "in_progress": return "text-blue-600 bg-blue-50";
      case "paused": return "text-yellow-600 bg-yellow-50";
      case "cancelled": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "active": return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending": return <Clock className="w-4 h-4 text-gray-400" />;
      case "failed": return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case "document_upload": return <FileText className="w-4 h-4" />;
      case "form_completion": return <FileText className="w-4 h-4" />;
      case "email_send": return <Mail className="w-4 h-4" />;
      case "approval_required": return <User className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-900">Error</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {onboardings.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Onboardings Found</h3>
          <p className="text-gray-600">
            {applicantId 
              ? "This applicant hasn't started onboarding yet." 
              : "No active onboarding processes found."
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {onboardings.map((onboarding) => {
            const activeTasks = onboarding.tasks.filter(t => t.status === "active");
            const completedTasks = onboarding.tasks.filter(t => t.status === "completed");
            const totalTasks = onboarding.tasks.length;
            const completionPercentage = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

            return (
              <motion.div
                key={onboarding.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {onboarding.applicant.fullName}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {onboarding.workflowName}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(onboarding.status || "not_started")}`}>
                          {onboarding.status?.replace("_", " ").toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          Started {new Date(onboarding.startDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">
                        {completionPercentage}%
                      </div>
                      <div className="text-sm text-gray-600">Complete</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>{completedTasks.length} of {totalTasks} tasks completed</span>
                      <span>{activeTasks.length} active tasks</span>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Tasks</h4>
                    <button
                      onClick={() => setSelectedOnboarding(
                        selectedOnboarding === onboarding.id ? null : onboarding.id
                      )}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {selectedOnboarding === onboarding.id ? "Hide Details" : "Show All Tasks"}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Active Tasks */}
                    {activeTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                      >
                        <div className="flex items-center gap-3">
                          {getTaskStatusIcon(task.status || "pending")}
                          {getTaskTypeIcon(task.type || "system_check")}
                          <div>
                            <div className="font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-600">{task.description}</div>
                            {task.dueDate && (
                              <div className="text-xs text-gray-500 mt-1">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                        {task.status === "active" && (
                          <button
                            onClick={() => handleCompleteTask(task.id, onboarding.id)}
                            disabled={actionLoading === task.id}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {actionLoading === task.id ? "..." : "Complete"}
                          </button>
                        )}
                      </div>
                    ))}

                    {/* All Tasks (when expanded) */}
                    {selectedOnboarding === onboarding.id && (
                      <div className="mt-4 space-y-2">
                        <h5 className="font-medium text-gray-700 text-sm">All Tasks</h5>
                        {onboarding.tasks
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((task) => (
                          <div
                            key={task.id}
                            className={`flex items-center gap-3 p-2 rounded ${
                              task.status === "completed" 
                                ? "bg-green-50" 
                                : task.status === "active"
                                ? "bg-blue-50"
                                : "bg-gray-50"
                            }`}
                          >
                            {getTaskStatusIcon(task.status || "pending")}
                            {getTaskTypeIcon(task.type || "system_check")}
                            <div className="flex-1">
                              <div className={`text-sm ${task.status === "completed" ? "line-through text-gray-500" : "text-gray-900"}`}>
                                {task.title}
                              </div>
                              {task.completedAt && (
                                <div className="text-xs text-gray-500">
                                  Completed {new Date(task.completedAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}