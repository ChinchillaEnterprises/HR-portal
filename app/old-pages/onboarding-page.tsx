"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import AuthWrapper from "@/components/AuthWrapper";
import NeoLayout from "@/components/NeoLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  FileText,
  Users,
  Settings,
  ChevronRight,
  Filter,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  UserPlus,
  PlayCircle,
  PauseCircle,
  CheckSquare,
  Square,
  MessageSquare,
  Zap,
  RotateCcw,
  Send,
  Copy,
  RefreshCw,
  Bot,
  Workflow,
  Target,
  Link,
  Timer,
  Bell,
  ArrowRight,
  Layers,
  Building,
} from "lucide-react";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";

// Auth handled via AuthWrapper (uses MockAuthenticator in dev)

const client = generateClient<Schema>();

interface TaskTemplate {
  title: string;
  description: string;
  category: "documentation" | "training" | "setup" | "meeting" | "other";
  daysFromStart: number;
  priority?: "low" | "medium" | "high";
  estimatedHours?: number;
  dependencies?: number[]; // indices of tasks that must be completed first
  autoAssign?: boolean;
  roleSpecific?: string[]; // specific roles this task applies to
  departmentSpecific?: string[]; // specific departments this task applies to
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  roleTargets: string[];
  departmentTargets: string[];
  tasks: TaskTemplate[];
  isActive: boolean;
  autoTrigger: boolean;
  triggerConditions?: {
    onUserCreate?: boolean;
    onStatusChange?: string[];
    onDateReached?: string;
  };
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: "task_completed" | "task_overdue" | "user_created" | "deadline_approaching";
  conditions: {
    taskCategory?: string;
    userRole?: string[];
    daysBeforeDue?: number;
  };
  actions: {
    sendNotification?: boolean;
    assignFollowUpTask?: string;
    updateTaskStatus?: string;
    escalateToManager?: boolean;
  };
  isActive: boolean;
}

const defaultTaskTemplates: TaskTemplate[] = [
  // Day 1: Critical Setup
  { 
    title: "Complete I-9 Form", 
    description: "Fill out employment eligibility verification", 
    category: "documentation", 
    daysFromStart: 1,
    priority: "high",
    estimatedHours: 0.5,
    autoAssign: true
  },
  { 
    title: "Sign NDA and Confidentiality Agreement", 
    description: "Review and sign non-disclosure agreement", 
    category: "documentation", 
    daysFromStart: 1,
    priority: "high",
    estimatedHours: 0.5,
    autoAssign: true
  },
  { 
    title: "Submit Direct Deposit Form", 
    description: "Provide banking information for payroll", 
    category: "documentation", 
    daysFromStart: 1,
    priority: "high",
    estimatedHours: 0.25,
    autoAssign: true
  },
  { 
    title: "Setup Work Email", 
    description: "Activate company email account", 
    category: "setup", 
    daysFromStart: 1,
    priority: "high",
    estimatedHours: 1,
    autoAssign: true
  },
  { 
    title: "Meet with HR Manager", 
    description: "Initial HR orientation meeting", 
    category: "meeting", 
    daysFromStart: 1,
    priority: "high",
    estimatedHours: 1,
    autoAssign: true
  },
  
  // Day 2: IT Setup & Security
  { 
    title: "Install Required Software", 
    description: "Download and install necessary tools", 
    category: "setup", 
    daysFromStart: 2,
    priority: "high",
    estimatedHours: 2,
    dependencies: [3], // depends on work email setup
    roleSpecific: ["admin", "staff", "team_lead", "intern"],
    autoAssign: true
  },
  { 
    title: "Complete IT Security Training", 
    description: "Mandatory security awareness training", 
    category: "training", 
    daysFromStart: 2,
    priority: "high",
    estimatedHours: 1.5,
    autoAssign: true
  },
  { 
    title: "Meet with Direct Manager", 
    description: "Introduction and role expectations", 
    category: "meeting", 
    daysFromStart: 2,
    priority: "high",
    estimatedHours: 1,
    autoAssign: true
  },
  
  // Week 1: Integration
  { 
    title: "Team Introduction Meeting", 
    description: "Meet your immediate team members", 
    category: "meeting", 
    daysFromStart: 3,
    priority: "medium",
    estimatedHours: 1,
    dependencies: [7], // depends on manager meeting
    autoAssign: true
  },
  { 
    title: "Department Overview Session", 
    description: "Learn about department goals and structure", 
    category: "training", 
    daysFromStart: 4,
    priority: "medium",
    estimatedHours: 2,
    dependencies: [8], // depends on team introduction
    autoAssign: true
  },
  { 
    title: "Complete Benefits Enrollment", 
    description: "Select health insurance and other benefits", 
    category: "documentation", 
    daysFromStart: 5,
    priority: "high",
    estimatedHours: 1,
    autoAssign: true
  },
  { 
    title: "Review Employee Handbook", 
    description: "Read and acknowledge company policies", 
    category: "documentation", 
    daysFromStart: 5,
    priority: "medium",
    estimatedHours: 2,
    autoAssign: true
  },
  { 
    title: "Setup Development Environment", 
    description: "Configure local development tools", 
    category: "setup", 
    daysFromStart: 5,
    priority: "medium",
    estimatedHours: 3,
    dependencies: [5], // depends on software installation
    roleSpecific: ["admin", "staff", "team_lead"],
    departmentSpecific: ["Engineering", "IT", "Product"]
  },
  
  // Week 2-3: Role-Specific Training
  { 
    title: "Complete Role-Specific Training", 
    description: "Job-specific skills and processes", 
    category: "training", 
    daysFromStart: 10,
    priority: "high",
    estimatedHours: 8,
    dependencies: [9, 11], // depends on department overview and handbook
    autoAssign: true
  },
  { 
    title: "Shadow Team Member", 
    description: "Observe daily workflows and processes", 
    category: "training", 
    daysFromStart: 12,
    priority: "medium",
    estimatedHours: 4,
    dependencies: [13], // depends on role-specific training
    autoAssign: true
  },
  { 
    title: "First Project Assignment", 
    description: "Receive and begin first project", 
    category: "other", 
    daysFromStart: 14,
    priority: "medium",
    estimatedHours: 8,
    dependencies: [14], // depends on shadowing
    roleSpecific: ["staff", "team_lead", "intern"]
  },
  
  // Week 3-4: Integration Complete
  { 
    title: "Complete First Project Milestone", 
    description: "Deliver initial project deliverable", 
    category: "other", 
    daysFromStart: 21,
    priority: "medium",
    estimatedHours: 8,
    dependencies: [15], // depends on project assignment
    roleSpecific: ["staff", "team_lead", "intern"]
  },
  { 
    title: "30-Day Check-in with Manager", 
    description: "Progress review and feedback session", 
    category: "meeting", 
    daysFromStart: 30,
    priority: "high",
    estimatedHours: 1,
    autoAssign: true
  },
];

// Predefined workflow templates
const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "full-onboarding",
    name: "Complete Onboarding Program",
    description: "Full 30-day onboarding workflow for all new hires",
    roleTargets: ["staff", "team_lead", "intern", "admin"],
    departmentTargets: [],
    tasks: defaultTaskTemplates,
    isActive: true,
    autoTrigger: true,
    triggerConditions: {
      onUserCreate: true,
      onStatusChange: ["active"]
    }
  },
  {
    id: "developer-onboarding",
    name: "Developer-Specific Onboarding",
    description: "Technical onboarding for engineering roles",
    roleTargets: ["staff", "team_lead"],
    departmentTargets: ["Engineering", "IT", "Product"],
    tasks: defaultTaskTemplates.filter(t => 
      !t.roleSpecific || 
      t.roleSpecific.some(role => ["staff", "team_lead"].includes(role))
    ),
    isActive: true,
    autoTrigger: true,
    triggerConditions: {
      onUserCreate: true
    }
  },
  {
    id: "intern-onboarding",
    name: "Intern Onboarding Program",
    description: "Streamlined onboarding for interns",
    roleTargets: ["intern"],
    departmentTargets: [],
    tasks: defaultTaskTemplates.filter(t => 
      !t.roleSpecific || 
      t.roleSpecific.includes("intern")
    ),
    isActive: true,
    autoTrigger: true,
    triggerConditions: {
      onUserCreate: true
    }
  },
  {
    id: "manager-onboarding",
    name: "Leadership Onboarding",
    description: "Enhanced onboarding for management roles",
    roleTargets: ["team_lead", "admin"],
    departmentTargets: [],
    tasks: [
      ...defaultTaskTemplates,
      {
        title: "Leadership Training Module",
        description: "Complete management and leadership fundamentals",
        category: "training",
        daysFromStart: 7,
        priority: "high",
        estimatedHours: 4,
        roleSpecific: ["team_lead", "admin"]
      },
      {
        title: "Team Management Setup",
        description: "Review team structure and management tools",
        category: "training",
        daysFromStart: 10,
        priority: "high",
        estimatedHours: 2,
        roleSpecific: ["team_lead", "admin"]
      }
    ],
    isActive: true,
    autoTrigger: true,
    triggerConditions: {
      onUserCreate: true
    }
  }
];

// Automation rules
const automationRules: AutomationRule[] = [
  {
    id: "overdue-notification",
    name: "Overdue Task Notification",
    description: "Send notification when tasks become overdue",
    trigger: "task_overdue",
    conditions: {},
    actions: {
      sendNotification: true,
      escalateToManager: true
    },
    isActive: true
  },
  {
    id: "deadline-reminder",
    name: "Deadline Approaching Reminder",
    description: "Remind users 2 days before task due date",
    trigger: "deadline_approaching",
    conditions: {
      daysBeforeDue: 2
    },
    actions: {
      sendNotification: true
    },
    isActive: true
  },
  {
    id: "training-completion-followup",
    name: "Training Completion Follow-up",
    description: "Assign practical task after training completion",
    trigger: "task_completed",
    conditions: {
      taskCategory: "training"
    },
    actions: {
      sendNotification: true,
      assignFollowUpTask: "Apply training knowledge in practical scenario"
    },
    isActive: true
  },
  {
    id: "documentation-escalation",
    name: "Critical Documentation Escalation",
    description: "Escalate overdue critical documentation to manager",
    trigger: "task_overdue",
    conditions: {
      taskCategory: "documentation"
    },
    actions: {
      escalateToManager: true,
      sendNotification: true
    },
    isActive: true
  }
];

function OnboardingPage({ user }: { user: any }) {
  const [tasks, setTasks] = useState<Array<Schema["OnboardingTask"]["type"]>>([]);
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  
  // New workflow automation state
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [bulkSelectedUsers, setBulkSelectedUsers] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const [processingWorkflow, setProcessingWorkflow] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "workflows" | "automation">("tasks");

  useEffect(() => {
    fetchData();
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
      setCurrentUserId(authUser.id);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksResponse, usersResponse] = await Promise.all([
        client.models.OnboardingTask.list(),
        client.models.User.list(),
      ]);
      setTasks(tasksResponse.data);
      
      // Filter users based on role permissions
      const filteredUsers = userRole === "admin" 
        ? usersResponse.data 
        : usersResponse.data.filter(u => u.id === currentUserId || u.role === "intern");
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTasks = async () => {
    if (!targetUserId || selectedTemplates.length === 0) return;

    try {
      const targetUser = users.find(u => u.id === targetUserId);
      const startDate = targetUser?.startDate ? new Date(targetUser.startDate) : new Date();

      const taskPromises = selectedTemplates.map(templateIndex => {
        const template = defaultTaskTemplates[parseInt(templateIndex)];
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + template.daysFromStart);

        return client.models.OnboardingTask.create({
          userId: targetUserId,
          title: template.title,
          description: template.description,
          status: "pending",
          dueDate: dueDate.toISOString().split('T')[0],
          category: template.category,
          assignedBy: currentUserId,
        });
      });

      await Promise.all(taskPromises);
      
      setShowAssignModal(false);
      setSelectedTemplates([]);
      setTargetUserId("");
      fetchData();
    } catch (error) {
      console.error("Error assigning tasks:", error);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, newStatus: any) => {
    try {
      await client.models.OnboardingTask.update({
        id: taskId,
        status: newStatus,
        completedDate: newStatus === "completed" ? new Date().toISOString().split('T')[0] : null,
      });
      fetchData();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      try {
        await client.models.OnboardingTask.delete({ id: taskId });
        fetchData();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  // New workflow automation functions
  const handleApplyWorkflow = async (workflowId: string, targetUserIds: string[]) => {
    if (targetUserIds.length === 0) return;

    try {
      setProcessingWorkflow(true);
      const workflow = workflowTemplates.find(w => w.id === workflowId);
      if (!workflow) return;

      for (const userId of targetUserIds) {
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser) continue;

        // Check if workflow applies to this user's role and department
        const roleMatches = workflow.roleTargets.length === 0 || workflow.roleTargets.includes(targetUser.role || "");
        const deptMatches = workflow.departmentTargets.length === 0 || workflow.departmentTargets.includes(targetUser.department || "");
        
        if (!roleMatches || !deptMatches) continue;

        const startDate = targetUser.startDate ? new Date(targetUser.startDate) : new Date();
        const applicableTasks = workflow.tasks.filter(task => {
          // Filter by role-specific tasks
          if (task.roleSpecific && !task.roleSpecific.includes(targetUser.role || "")) return false;
          // Filter by department-specific tasks
          if (task.departmentSpecific && !task.departmentSpecific.includes(targetUser.department || "")) return false;
          return true;
        });

        // Create tasks respecting dependencies
        const createdTasks: { [index: number]: string } = {};
        
        for (let i = 0; i < applicableTasks.length; i++) {
          const task = applicableTasks[i];
          
          // Check if dependencies are satisfied
          let canCreate = true;
          if (task.dependencies) {
            for (const depIndex of task.dependencies) {
              if (!createdTasks[depIndex]) {
                canCreate = false;
                break;
              }
            }
          }

          if (canCreate || !task.dependencies) {
            const dueDate = new Date(startDate);
            dueDate.setDate(dueDate.getDate() + task.daysFromStart);

            const newTask = await client.models.OnboardingTask.create({
              userId: userId,
              title: task.title,
              description: task.description,
              status: "pending",
              dueDate: dueDate.toISOString().split('T')[0],
              category: task.category,
              assignedBy: currentUserId,
              notes: `Auto-assigned via ${workflow.name} workflow. Estimated: ${task.estimatedHours || 1}h. Priority: ${task.priority || 'medium'}`
            });

            createdTasks[i] = newTask.data?.id || "";
          }
        }

        // Send notification about workflow assignment
        if (automationEnabled) {
          await client.models.Communication.create({
            type: "notification",
            subject: `${workflow.name} Assigned`,
            content: `Your onboarding workflow "${workflow.name}" has been automatically assigned with ${applicableTasks.length} tasks.`,
            recipientId: userId,
            recipientEmail: targetUser.email,
            senderId: currentUserId,
            status: "sent",
            sentDate: new Date().toISOString()
          });
        }
      }

      setShowWorkflowModal(false);
      setSelectedWorkflowId("");
      setBulkSelectedUsers([]);
      fetchData();
    } catch (error) {
      console.error("Error applying workflow:", error);
    } finally {
      setProcessingWorkflow(false);
    }
  };

  const handleBulkTaskUpdate = async (action: string, selectedUserIds: string[]) => {
    if (selectedUserIds.length === 0) return;

    try {
      setProcessingWorkflow(true);
      
      switch (action) {
        case "mark_completed":
          const userTasks = tasks.filter(t => 
            selectedUserIds.includes(t.userId) && 
            t.status !== "completed"
          );
          
          for (const task of userTasks) {
            await client.models.OnboardingTask.update({
              id: task.id,
              status: "completed",
              completedDate: new Date().toISOString().split('T')[0]
            });
          }
          break;

        case "send_reminder":
          for (const userId of selectedUserIds) {
            const user = users.find(u => u.id === userId);
            if (!user) continue;
            
            const pendingTasks = tasks.filter(t => 
              t.userId === userId && 
              t.status === "pending"
            );

            if (pendingTasks.length > 0) {
              await client.models.Communication.create({
                type: "email",
                subject: "Onboarding Tasks Reminder",
                content: `You have ${pendingTasks.length} pending onboarding tasks. Please log in to complete them.`,
                recipientId: userId,
                recipientEmail: user.email,
                senderId: currentUserId,
                status: "sent",
                sentDate: new Date().toISOString()
              });
            }
          }
          break;

        case "reset_overdue":
          const overdueTasks = tasks.filter(t => 
            selectedUserIds.includes(t.userId) && 
            t.status === "overdue"
          );
          
          for (const task of overdueTasks) {
            const newDueDate = new Date();
            newDueDate.setDate(newDueDate.getDate() + 7); // Give 7 more days
            
            await client.models.OnboardingTask.update({
              id: task.id,
              status: "pending",
              dueDate: newDueDate.toISOString().split('T')[0]
            });
          }
          break;
      }

      setBulkSelectedUsers([]);
      setShowBulkActions(false);
      fetchData();
    } catch (error) {
      console.error("Error performing bulk action:", error);
    } finally {
      setProcessingWorkflow(false);
    }
  };

  const checkAutomationRules = async (taskId?: string, userId?: string) => {
    if (!automationEnabled) return;

    try {
      // Check for overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (task.dueDate && task.status !== "completed") {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          return today > dueDate;
        }
        return false;
      });

      // Update overdue task status and trigger notifications
      for (const task of overdueTasks) {
        if (task.status !== "overdue") {
          await client.models.OnboardingTask.update({
            id: task.id,
            status: "overdue"
          });

          // Send overdue notification
          const user = users.find(u => u.id === task.userId);
          if (user) {
            await client.models.Communication.create({
              type: "notification",
              subject: "Task Overdue",
              content: `Your task "${task.title}" is now overdue. Please complete it as soon as possible.`,
              recipientId: task.userId,
              recipientEmail: user.email,
              senderId: "system",
              status: "sent",
              sentDate: new Date().toISOString()
            });
          }
        }
      }

      // Check for deadline approaching (2 days before due)
      const upcomingTasks = tasks.filter(task => {
        if (task.dueDate && task.status === "pending") {
          const dueDate = new Date(task.dueDate);
          const today = new Date();
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays === 2;
        }
        return false;
      });

      // Send deadline reminders
      for (const task of upcomingTasks) {
        const user = users.find(u => u.id === task.userId);
        if (user) {
          await client.models.Communication.create({
            type: "notification",
            subject: "Task Due Soon",
            content: `Reminder: Your task "${task.title}" is due in 2 days.`,
            recipientId: task.userId,
            recipientEmail: user.email,
            senderId: "system",
            status: "sent",
            sentDate: new Date().toISOString()
          });
        }
      }

    } catch (error) {
      console.error("Error checking automation rules:", error);
    }
  };

  const getWorkflowForUser = (user: Schema["User"]["type"]): WorkflowTemplate | null => {
    // Find the most specific workflow for this user
    const applicableWorkflows = workflowTemplates.filter(workflow => {
      if (!workflow.isActive) return false;
      
      const roleMatches = workflow.roleTargets.length === 0 || workflow.roleTargets.includes(user.role || "");
      const deptMatches = workflow.departmentTargets.length === 0 || workflow.departmentTargets.includes(user.department || "");
      
      return roleMatches && deptMatches;
    });

    // Prioritize more specific workflows (those with role and department targets)
    applicableWorkflows.sort((a, b) => {
      const aSpecificity = (a.roleTargets.length > 0 ? 1 : 0) + (a.departmentTargets.length > 0 ? 1 : 0);
      const bSpecificity = (b.roleTargets.length > 0 ? 1 : 0) + (b.departmentTargets.length > 0 ? 1 : 0);
      return bSpecificity - aSpecificity;
    });

    return applicableWorkflows[0] || null;
  };

  // Auto-assign workflows to new users
  useEffect(() => {
    if (automationEnabled && users.length > 0) {
      const newUsers = users.filter(user => {
        const userTasks = getTasksByUser(user.id);
        return userTasks.length === 0 && user.status === "active";
      });

      for (const user of newUsers) {
        const workflow = getWorkflowForUser(user);
        if (workflow && workflow.autoTrigger) {
          handleApplyWorkflow(workflow.id, [user.id]);
        }
      }
    }
  }, [users, automationEnabled]);

  // Periodically check automation rules
  useEffect(() => {
    const interval = setInterval(() => {
      checkAutomationRules();
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [tasks, users, automationEnabled]);

  const getTasksByUser = (userId: string) => {
    return tasks.filter(task => task.userId === userId);
  };

  const getTaskProgress = (userTasks: Array<Schema["OnboardingTask"]["type"]>) => {
    if (userTasks.length === 0) return 0;
    const completed = userTasks.filter(task => task.status === "completed").length;
    return Math.round((completed / userTasks.length) * 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "overdue":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "from-green-500 to-emerald-600";
      case "in_progress":
        return "from-yellow-500 to-amber-600";
      case "overdue":
        return "from-red-500 to-rose-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "documentation":
        return <FileText className="w-4 h-4" />;
      case "training":
        return <Users className="w-4 h-4" />;
      case "setup":
        return <Settings className="w-4 h-4" />;
      case "meeting":
        return <Calendar className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filter === "all") return true;
    const userTasks = getTasksByUser(user.id);
    const progress = getTaskProgress(userTasks);
    
    switch (filter) {
      case "completed":
        return progress === 100;
      case "in_progress":
        return progress > 0 && progress < 100;
      case "not_started":
        return progress === 0 || userTasks.length === 0;
      default:
        return true;
    }
  });

  const canManageTasks = hasPermission(userRole, "canManageOnboarding");

  return (
    <NeoLayout>
      <div className="space-y-8">
        {/* Enhanced Header with animations */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl gradient-primary shadow-glow">
              <UserCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gradient">Onboarding Management</h1>
              <p className="mt-1 text-gray-600">Advanced task assignment and workflow automation</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="glass-card rounded-xl px-4 py-2 flex items-center gap-3"
            >
              <Bot className="h-5 w-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-700">Automation:</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={automationEnabled}
                  onChange={(e) => setAutomationEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-500 peer-checked:to-purple-600"></div>
              </label>
            </motion.div>
            {canManageTasks && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowWorkflowModal(true)}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <Workflow className="h-5 w-5" />
                  <span>Apply Workflow</span>
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAssignModal(true)}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Assign Tasks</span>
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Tab Navigation with glass morphism */}
        {canManageTasks && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-2"
          >
            <nav className="flex overflow-x-auto scrollbar-hide gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("tasks")}
                className={`py-3 px-5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === "tasks"
                    ? "gradient-primary text-white shadow-soft"
                    : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  <span>Tasks & Progress</span>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("workflows")}
                className={`py-3 px-5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === "workflows"
                    ? "gradient-primary text-white shadow-soft"
                    : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Workflow className="h-4 w-4" />
                  <span>Workflow Templates</span>
                </div>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab("automation")}
                className={`py-3 px-5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === "automation"
                    ? "gradient-primary text-white shadow-soft"
                    : "text-gray-600 hover:bg-white/50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  <span>Automation Rules</span>
                </div>
              </motion.button>
            </nav>
          </motion.div>
        )}

        {/* Tab Content */}
        {activeTab === "tasks" && (
          <>
            {/* Stats Overview with modern styling */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Total Users", value: users.length, icon: Users, gradient: "from-blue-500 to-indigo-600" },
                { label: "Active Tasks", value: tasks.filter(t => t.status !== "completed").length, icon: PlayCircle, gradient: "from-emerald-500 to-teal-600" },
                { label: "Completed", value: tasks.filter(t => t.status === "completed").length, icon: CheckCircle, gradient: "from-green-500 to-emerald-600" },
                { label: "Overdue", value: tasks.filter(t => t.status === "overdue").length, icon: AlertCircle, gradient: "from-red-500 to-rose-600" },
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
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                        <motion.p 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                          className="text-3xl font-bold text-gray-900 mt-1"
                        >
                          {stat.value}
                        </motion.p>
                      </div>
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-glow opacity-80 group-hover:opacity-100 transition-opacity`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
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
                placeholder="Search by name or email..."
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
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-5 h-5 text-gray-500" />
              {["all", "not_started", "in_progress", "completed"].map((filterOption) => (
                <motion.button
                  key={filterOption}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    filter === filterOption 
                      ? "gradient-primary text-white shadow-soft" 
                      : "bg-white/50 text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  {filterOption === "all" && "All Users"}
                  {filterOption === "not_started" && "Not Started"}
                  {filterOption === "in_progress" && "In Progress"}
                  {filterOption === "completed" && "Completed"}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* User Progress Cards */}
        {loading ? (
          <div className="text-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 mx-auto"
            />
            <p className="mt-4 text-gray-600">Loading onboarding data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredUsers.map((user, index) => {
                const userTasks = getTasksByUser(user.id);
                const progress = getTaskProgress(userTasks);
                const isExpanded = selectedUser === user.id;

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.1 }}
                    layout
                    className="glass-card rounded-2xl hover-lift overflow-hidden group"
                  >
                    <motion.div
                      className="p-6 cursor-pointer"
                      onClick={() => setSelectedUser(isExpanded ? null : user.id)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getStatusColor(progress === 100 ? "completed" : progress > 0 ? "in_progress" : "pending")} flex items-center justify-center shadow-glow`}
                          >
                            <span className="text-white font-bold text-lg">
                              {user.firstName?.[0]}{user.lastName?.[0]}
                            </span>
                          </motion.div>
                          <div className="ml-4">
                            <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {user.position || user.role} • {user.department || "No Department"}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              Started {user.startDate ? new Date(user.startDate).toLocaleDateString() : "Recently"}
                            </p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 90 : 0 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </motion.div>
                      </div>

                      {/* Progress Bar with animations */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Onboarding Progress
                          </span>
                          <motion.span 
                            key={progress}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-sm font-bold text-indigo-600"
                          >
                            {progress}% ({userTasks.filter(t => t.status === "completed").length}/{userTasks.length} tasks)
                          </motion.span>
                        </div>
                        <div className="w-full bg-gray-200/50 rounded-full h-2.5 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full rounded-full gradient-primary shadow-glow"
                          />
                        </div>
                      </div>

                      {/* Task Summary with modern cards */}
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { status: "pending", icon: Circle, color: "text-gray-500" },
                          { status: "in_progress", icon: Clock, color: "text-yellow-500" },
                          { status: "completed", icon: CheckCircle, color: "text-green-500" },
                          { status: "overdue", icon: AlertCircle, color: "text-red-500" }
                        ].map((item) => {
                          const count = userTasks.filter(t => t.status === item.status).length;
                          const Icon = item.icon;
                          return (
                            <motion.div 
                              key={item.status} 
                              whileHover={{ scale: 1.05 }}
                              className="bg-white/50 rounded-xl p-3 text-center"
                            >
                              <Icon className={`w-4 h-4 ${item.color} mx-auto mb-1`} />
                              <div className="font-bold text-gray-900">{count}</div>
                              <div className="text-xs text-gray-600 capitalize">
                                {item.status.replace("_", " ")}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>

                    {/* Expanded Task List with animations */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-white/20 p-6 space-y-3 overflow-hidden"
                        >
                          {userTasks.length === 0 ? (
                            <motion.div 
                              initial={{ scale: 0.9 }}
                              animate={{ scale: 1 }}
                              className="text-center py-8"
                            >
                              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                                <Circle className="w-8 h-8 text-gray-400" />
                              </div>
                              <p className="text-gray-600 font-medium">No tasks assigned yet</p>
                              {canManageTasks && (
                                <motion.button
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTargetUserId(user.id);
                                    setShowAssignModal(true);
                                  }}
                                  className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center gap-1 mx-auto"
                                >
                                  <Plus className="w-4 h-4" />
                                  Assign Tasks
                                </motion.button>
                              )}
                            </motion.div>
                          ) : (
                            <AnimatePresence>
                              {userTasks.map((task, taskIndex) => (
                                <motion.div
                                  key={task.id}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 20 }}
                                  transition={{ delay: taskIndex * 0.05 }}
                                  className="flex items-center justify-between p-4 bg-white/50 rounded-xl hover:bg-white/70 transition-all group"
                                >
                            <div className="flex items-start space-x-3 flex-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (canManageTasks || user.id === currentUserId) {
                                    const nextStatus = 
                                      task.status === "pending" ? "in_progress" :
                                      task.status === "in_progress" ? "completed" : "pending";
                                    handleUpdateTaskStatus(task.id, nextStatus);
                                  }
                                }}
                                className="mt-0.5"
                                disabled={!canManageTasks && user.id !== currentUserId}
                              >
                                {getStatusIcon(task.status || "pending")}
                              </button>
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  {getCategoryIcon(task.category || undefined)}
                                  <span className="font-medium text-gray-900">
                                    {task.title}
                                  </span>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                )}
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  {task.dueDate && (
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </span>
                                  )}
                                  {task.completedDate && (
                                    <span>
                                      Completed: {new Date(task.completedDate).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r ${getStatusColor(
                                  task.status || "pending"
                                )} text-white shadow-soft`}
                              >
                                {task.status}
                              </motion.span>
                              {canManageTasks && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                                  </div>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No users found matching your criteria.</p>
          </div>
        )}

        {/* Assign Tasks Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Assign Onboarding Tasks</h2>
              
              {/* User Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select User
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">Choose a user...</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Templates */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Tasks
                  </label>
                  <button
                    onClick={() => {
                      if (selectedTemplates.length === defaultTaskTemplates.length) {
                        setSelectedTemplates([]);
                      } else {
                        setSelectedTemplates(defaultTaskTemplates.map((_, i) => i.toString()));
                      }
                    }}
                    className="text-sm text-black hover:text-gray-700"
                  >
                    {selectedTemplates.length === defaultTaskTemplates.length ? "Deselect All" : "Select All"}
                  </button>
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {defaultTaskTemplates.map((template, index) => (
                    <label
                      key={index}
                      className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        value={index}
                        checked={selectedTemplates.includes(index.toString())}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTemplates([...selectedTemplates, index.toString()]);
                          } else {
                            setSelectedTemplates(selectedTemplates.filter(t => t !== index.toString()));
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(template.category)}
                          <span className="font-medium text-gray-900">{template.title}</span>
                          <span className="text-xs text-gray-500">Day {template.daysFromStart}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTemplates([]);
                    setTargetUserId("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignTasks}
                  disabled={!targetUserId || selectedTemplates.length === 0}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign {selectedTemplates.length} Tasks
                </button>
              </div>
            </div>
          </div>
        )}
          </>
        )}

        {/* Workflow Templates Tab */}
        {activeTab === "workflows" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
                <div className="flex items-center gap-2">
                  <Workflow className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">{workflowTemplates.filter(w => w.isActive).length} active</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowTemplates.map((workflow) => (
                  <div key={workflow.id} className={`border rounded-lg p-4 ${workflow.isActive ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-gray-400" />
                        <span>Roles: {workflow.roleTargets.length > 0 ? workflow.roleTargets.join(", ") : "All"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-gray-400" />
                        <span>Departments: {workflow.departmentTargets.length > 0 ? workflow.departmentTargets.join(", ") : "All"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-4 w-4 text-gray-400" />
                        <span>{workflow.tasks.length} tasks</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-gray-400" />
                        <span>Auto-trigger: {workflow.autoTrigger ? "Yes" : "No"}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedWorkflowId(workflow.id);
                          setShowWorkflowModal(true);
                        }}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center justify-center gap-2"
                      >
                        <PlayCircle className="h-4 w-4" />
                        Apply to Users
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Automation Rules Tab */}
        {activeTab === "automation" && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Automation Rules</h2>
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm text-gray-600">{automationRules.filter(r => r.isActive).length} active rules</span>
                </div>
              </div>
              
              <div className="space-y-4">
                {automationRules.map((rule) => (
                  <div key={rule.id} className={`border rounded-lg p-4 ${rule.isActive ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <Bell className="h-4 w-4 text-yellow-600" />
                          {rule.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Trigger</h4>
                        <div className="bg-white rounded p-2 border">
                          <span className="capitalize">{rule.trigger.replace('_', ' ')}</span>
                          {rule.conditions.daysBeforeDue && (
                            <span className="text-gray-600"> ({rule.conditions.daysBeforeDue} days before)</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                        <div className="bg-white rounded p-2 border space-y-1">
                          {rule.actions.sendNotification && (
                            <div className="flex items-center gap-2 text-xs">
                              <MessageSquare className="h-3 w-3 text-blue-600" />
                              Send notification
                            </div>
                          )}
                          {rule.actions.escalateToManager && (
                            <div className="flex items-center gap-2 text-xs">
                              <ArrowRight className="h-3 w-3 text-red-600" />
                              Escalate to manager
                            </div>
                          )}
                          {rule.actions.assignFollowUpTask && (
                            <div className="flex items-center gap-2 text-xs">
                              <Plus className="h-3 w-3 text-green-600" />
                              Assign follow-up task
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Workflow Assignment Modal */}
        {showWorkflowModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Apply Workflow to Users</h2>
                  <button
                    onClick={() => {
                      setShowWorkflowModal(false);
                      setSelectedWorkflowId("");
                      setBulkSelectedUsers([]);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                {/* Workflow Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Workflow Template
                  </label>
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => setSelectedWorkflowId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose a workflow...</option>
                    {workflowTemplates.filter(w => w.isActive).map((workflow) => (
                      <option key={workflow.id} value={workflow.id}>
                        {workflow.name} ({workflow.tasks.length} tasks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* User Selection */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Users
                    </label>
                    <button
                      onClick={() => {
                        if (bulkSelectedUsers.length === users.length) {
                          setBulkSelectedUsers([]);
                        } else {
                          setBulkSelectedUsers(users.map(u => u.id));
                        }
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {bulkSelectedUsers.length === users.length ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  
                  <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                    {users.map((user) => (
                      <label
                        key={user.id}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={bulkSelectedUsers.includes(user.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBulkSelectedUsers([...bulkSelectedUsers, user.id]);
                            } else {
                              setBulkSelectedUsers(bulkSelectedUsers.filter(id => id !== user.id));
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                              {user.role}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowWorkflowModal(false);
                      setSelectedWorkflowId("");
                      setBulkSelectedUsers([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleApplyWorkflow(selectedWorkflowId, bulkSelectedUsers)}
                    disabled={!selectedWorkflowId || bulkSelectedUsers.length === 0 || processingWorkflow}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {processingWorkflow ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Workflow className="h-4 w-4" />
                        Apply to {bulkSelectedUsers.length} Users
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </NeoLayout>
  );
}

export default function OnboardingPageWrapper() {
  return (
    <AuthWrapper>
      {({ user }) => <OnboardingPage user={user} />}
    </AuthWrapper>
  );
}
