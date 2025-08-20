"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import AuthWrapper from "@/components/AuthWrapper";
import NeoLayout from "@/components/NeoLayout";
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  Download,
  Upload,
  FileText,
  Clock,
  Users,
  Tag,
  CheckCircle,
  AlertCircle,
  Settings,
  Play,
  Pause,
  MoreHorizontal,
  Calendar,
  Briefcase,
  BookOpen,
  Target,
  Zap,
  Layers,
  Code,
  Star,
  Eye,
  ChevronDown,
  ChevronUp,
  Building,
  MapPin,
  Award,
  TrendingUp,
  Activity,
  Globe,
  Shield,
  Database,
  Workflow,
  Bot,
  Link,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";
import { useActivityLogger, ACTIVITY_TYPES } from "@/hooks/useActivityLogger";

const client = generateClient<Schema>();

// Enhanced template interfaces
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: "documentation" | "training" | "setup" | "meeting" | "other";
  daysFromStart: number;
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours: number;
  dependencies: string[]; // IDs of prerequisite tasks
  autoAssign: boolean;
  roleSpecific: string[];
  departmentSpecific: string[];
  resources: Array<{
    type: "document" | "video" | "link" | "tool";
    title: string;
    url?: string;
    description?: string;
  }>;
  completionCriteria: string[];
  tags: string[];
  customFields: Record<string, any>;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "general" | "role-specific" | "department-specific" | "custom";
  targetRoles: string[];
  targetDepartments: string[];
  targetLocations: string[];
  tasks: TaskTemplate[];
  estimatedDuration: number; // in days
  isActive: boolean;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  metadata: {
    difficulty: "beginner" | "intermediate" | "advanced";
    popularity: number;
    successRate: number;
    avgCompletionTime: number;
    reviews: Array<{
      rating: number;
      comment: string;
      reviewedBy: string;
      reviewedAt: string;
    }>;
  };
  customization: {
    allowModification: boolean;
    requiredFields: string[];
    optionalFields: string[];
    branding: {
      logo?: string;
      colors?: Record<string, string>;
      customCSS?: string;
    };
  };
}

// Predefined comprehensive templates
const defaultTemplates: OnboardingTemplate[] = [
  {
    id: "comprehensive-general",
    name: "Comprehensive General Onboarding",
    description: "Complete 30-day onboarding program suitable for all new hires across departments",
    version: "2.0",
    category: "general",
    targetRoles: ["staff", "intern", "team_lead", "admin"],
    targetDepartments: [],
    targetLocations: [],
    estimatedDuration: 30,
    isActive: true,
    isPublic: true,
    createdBy: "system",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["comprehensive", "general", "30-day", "all-roles"],
    metadata: {
      difficulty: "beginner",
      popularity: 95,
      successRate: 87,
      avgCompletionTime: 28,
      reviews: [
        {
          rating: 5,
          comment: "Excellent comprehensive program that covers everything a new hire needs to know",
          reviewedBy: "HR Manager",
          reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
    },
    customization: {
      allowModification: true,
      requiredFields: ["company-policies", "safety-training"],
      optionalFields: ["team-building", "advanced-tools"],
      branding: {
        colors: { primary: "#000000", secondary: "#6b7280" }
      }
    },
    tasks: [
      {
        id: "task-1",
        title: "Complete I-9 Employment Verification",
        description: "Fill out Form I-9 for employment eligibility verification as required by federal law",
        category: "documentation",
        daysFromStart: 1,
        priority: "critical",
        estimatedHours: 0.5,
        dependencies: [],
        autoAssign: true,
        roleSpecific: [],
        departmentSpecific: [],
        resources: [
          {
            type: "document",
            title: "I-9 Form",
            url: "/documents/i9-form.pdf",
            description: "Official I-9 employment verification form"
          },
          {
            type: "video",
            title: "How to Complete I-9",
            url: "/training/i9-completion-guide",
            description: "Step-by-step video guide"
          }
        ],
        completionCriteria: [
          "Form I-9 completed in full",
          "Required documentation provided",
          "HR verification completed"
        ],
        tags: ["legal", "required", "federal"],
        customFields: {
          legalRequirement: true,
          complianceDeadline: 3
        }
      },
      {
        id: "task-2",
        title: "Sign Company Policies and NDA",
        description: "Review and digitally sign all company policies, employee handbook, and non-disclosure agreement",
        category: "documentation",
        daysFromStart: 1,
        priority: "critical",
        estimatedHours: 1.5,
        dependencies: [],
        autoAssign: true,
        roleSpecific: [],
        departmentSpecific: [],
        resources: [
          {
            type: "document",
            title: "Employee Handbook",
            url: "/documents/employee-handbook.pdf",
            description: "Complete guide to company policies and procedures"
          },
          {
            type: "document",
            title: "NDA Agreement",
            url: "/documents/nda-template.pdf",
            description: "Non-disclosure and confidentiality agreement"
          }
        ],
        completionCriteria: [
          "Employee handbook reviewed",
          "All policies acknowledged",
          "NDA signed digitally",
          "Code of conduct accepted"
        ],
        tags: ["policies", "legal", "confidentiality"],
        customFields: {
          requiresSignature: true,
          retentionPeriod: "permanent"
        }
      },
      {
        id: "task-3",
        title: "Complete IT Security Training",
        description: "Mandatory cybersecurity awareness training covering password policies, phishing, and data protection",
        category: "training",
        daysFromStart: 2,
        priority: "high",
        estimatedHours: 2,
        dependencies: ["task-1"],
        autoAssign: true,
        roleSpecific: [],
        departmentSpecific: [],
        resources: [
          {
            type: "video",
            title: "Cybersecurity Fundamentals",
            url: "/training/cybersecurity-basics",
            description: "Interactive cybersecurity training module"
          },
          {
            type: "link",
            title: "Password Manager Setup",
            url: "/tools/password-manager",
            description: "Company-approved password manager installation"
          }
        ],
        completionCriteria: [
          "Security training module completed",
          "Quiz passed with 80% or higher",
          "Password manager configured",
          "2FA enabled on all accounts"
        ],
        tags: ["security", "training", "compliance"],
        customFields: {
          certificationRequired: true,
          renewalPeriod: 12
        }
      },
      {
        id: "task-4",
        title: "Setup Work Accounts and Tools",
        description: "Configure email, Slack, project management tools, and other essential work applications",
        category: "setup",
        daysFromStart: 2,
        priority: "high",
        estimatedHours: 3,
        dependencies: ["task-3"],
        autoAssign: true,
        roleSpecific: [],
        departmentSpecific: [],
        resources: [
          {
            type: "tool",
            title: "Email Setup Guide",
            url: "/guides/email-configuration",
            description: "Step-by-step email account setup"
          },
          {
            type: "tool",
            title: "Slack Workspace",
            url: "/tools/slack-invite",
            description: "Join company Slack workspace"
          }
        ],
        completionCriteria: [
          "Email account activated",
          "Slack profile completed",
          "Essential tools installed",
          "Account settings configured"
        ],
        tags: ["setup", "tools", "communication"],
        customFields: {
          toolsList: ["email", "slack", "calendar", "project-management"]
        }
      }
    ]
  },
  {
    id: "engineering-specialized",
    name: "Software Engineering Onboarding",
    description: "Technical onboarding program specifically designed for software engineers and developers",
    version: "1.5",
    category: "role-specific",
    targetRoles: ["staff", "team_lead"],
    targetDepartments: ["Engineering", "Technology", "Product"],
    targetLocations: [],
    estimatedDuration: 45,
    isActive: true,
    isPublic: true,
    createdBy: "tech-lead",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ["engineering", "technical", "development", "code"],
    metadata: {
      difficulty: "intermediate",
      popularity: 78,
      successRate: 92,
      avgCompletionTime: 42,
      reviews: [
        {
          rating: 4,
          comment: "Great technical depth, could use more practical examples",
          reviewedBy: "Senior Developer",
          reviewedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ],
    },
    customization: {
      allowModification: true,
      requiredFields: ["git-setup", "code-review-process"],
      optionalFields: ["advanced-architecture", "performance-optimization"],
      branding: {
        colors: { primary: "#3b82f6", secondary: "#1e40af" }
      }
    },
    tasks: [
      {
        id: "eng-task-1",
        title: "Development Environment Setup",
        description: "Configure local development environment, IDE, version control, and debugging tools",
        category: "setup",
        daysFromStart: 3,
        priority: "critical",
        estimatedHours: 4,
        dependencies: [],
        autoAssign: true,
        roleSpecific: ["staff", "team_lead"],
        departmentSpecific: ["Engineering", "Technology"],
        resources: [
          {
            type: "document",
            title: "Dev Environment Guide",
            url: "/docs/dev-environment-setup",
            description: "Complete development setup instructions"
          },
          {
            type: "tool",
            title: "IDE Configuration",
            url: "/tools/ide-setup",
            description: "Recommended IDE settings and plugins"
          }
        ],
        completionCriteria: [
          "Local environment configured",
          "Git repository access verified",
          "IDE with required plugins installed",
          "Debug configuration working"
        ],
        tags: ["development", "environment", "git", "ide"],
        customFields: {
          techStack: ["node", "react", "typescript", "aws"],
          requiredTools: ["git", "docker", "vscode"]
        }
      }
    ]
  }
];

function OnboardingTemplatesPage({ user }: { user: any }) {
  const { logActivity } = useActivityLogger();
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [templates, setTemplates] = useState<OnboardingTemplate[]>(defaultTemplates);
  const [filteredTemplates, setFilteredTemplates] = useState<OnboardingTemplate[]>(defaultTemplates);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplate | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "popularity" | "updated" | "duration">("popularity");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTabInModal, setActiveTabInModal] = useState("basic");
  const [showTaskBuilder, setShowTaskBuilder] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);
  const [taskForm, setTaskForm] = useState<Partial<TaskTemplate>>({});

  // Form state for creating/editing templates
  const [templateForm, setTemplateForm] = useState<Partial<OnboardingTemplate>>({
    name: "",
    description: "",
    category: "general",
    targetRoles: [],
    targetDepartments: [],
    estimatedDuration: 14,
    tags: [],
    tasks: []
  });

  useEffect(() => {
    fetchUserInfo();
    logActivity({
      action: ACTIVITY_TYPES.PAGE_VIEW,
      resource: "templates",
      details: { view: "template-management" }
    });
  }, []);

  const fetchUserInfo = async () => {
    const authUser = await getAuthenticatedUser();
    if (authUser) {
      setUserRole(authUser.role);
    }
  };

  // Filter and search templates
  useEffect(() => {
    let filtered = templates;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchLower) ||
        template.description.toLowerCase().includes(searchLower) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        template.targetRoles.some(role => role.toLowerCase().includes(searchLower)) ||
        template.targetDepartments.some(dept => dept.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== "all") {
      filtered = filtered.filter(template => template.metadata.difficulty === selectedDifficulty);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "popularity":
          return b.metadata.popularity - a.metadata.popularity;
        case "updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case "duration":
          return a.estimatedDuration - b.estimatedDuration;
        default:
          return 0;
      }
    });

    setFilteredTemplates(filtered);
  }, [templates, searchTerm, selectedCategory, selectedDifficulty, sortBy]);

  const handleCreateTemplate = () => {
    setTemplateForm({
      name: "",
      description: "",
      category: "general",
      targetRoles: [],
      targetDepartments: [],
      estimatedDuration: 14,
      tags: [],
      tasks: []
    });
    setShowCreateModal(true);
  };

  const handleEditTemplate = (template: OnboardingTemplate) => {
    setSelectedTemplate(template);
    setTemplateForm(template);
    setShowEditModal(true);
  };

  const handleDuplicateTemplate = (template: OnboardingTemplate) => {
    const duplicated = {
      ...template,
      id: `${template.id}-copy-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: user?.attributes?.email || "current-user"
    };
    setTemplates([...templates, duplicated]);
    
    logActivity({
      action: ACTIVITY_TYPES.TASK_CREATE,
      resource: "template",
      resourceId: duplicated.id,
      details: { action: "duplicate", originalId: template.id }
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setTemplates(templates.filter(t => t.id !== templateId));
      logActivity({
        action: ACTIVITY_TYPES.TASK_DELETE,
        resource: "template",
        resourceId: templateId,
        details: { action: "delete" }
      });
    }
  };

  const handleSaveTemplate = () => {
    if (!templateForm.name || !templateForm.description) {
      alert("Please fill in all required fields");
      return;
    }

    const templateData: OnboardingTemplate = {
      id: selectedTemplate?.id || `template-${Date.now()}`,
      name: templateForm.name!,
      description: templateForm.description!,
      version: selectedTemplate?.version || "1.0",
      category: templateForm.category!,
      targetRoles: templateForm.targetRoles || [],
      targetDepartments: templateForm.targetDepartments || [],
      targetLocations: templateForm.targetLocations || [],
      tasks: templateForm.tasks || [],
      estimatedDuration: templateForm.estimatedDuration || 14,
      isActive: templateForm.isActive ?? true,
      isPublic: templateForm.isPublic ?? false,
      createdBy: selectedTemplate?.createdBy || user?.attributes?.email || "current-user",
      createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: templateForm.tags || [],
      metadata: templateForm.metadata || {
        difficulty: "beginner",
        popularity: 0,
        successRate: 0,
        avgCompletionTime: 0,
        reviews: []
      },
      customization: templateForm.customization || {
        allowModification: true,
        requiredFields: [],
        optionalFields: [],
        branding: {}
      }
    };

    if (selectedTemplate) {
      // Update existing
      setTemplates(templates.map(t => t.id === selectedTemplate.id ? templateData : t));
      logActivity({
        action: ACTIVITY_TYPES.TASK_UPDATE,
        resource: "template",
        resourceId: templateData.id,
        details: { action: "update" }
      });
    } else {
      // Create new
      setTemplates([...templates, templateData]);
      logActivity({
        action: ACTIVITY_TYPES.TASK_CREATE,
        resource: "template",
        resourceId: templateData.id,
        details: { action: "create" }
      });
    }

    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
  };

  const handleAddTask = () => {
    setTaskForm({
      title: "",
      description: "",
      category: "documentation",
      daysFromStart: 1,
      priority: "medium",
      estimatedHours: 1,
      dependencies: [],
      autoAssign: true,
      roleSpecific: [],
      departmentSpecific: [],
      resources: [],
      completionCriteria: [],
      tags: [],
      customFields: {}
    });
    setEditingTask(null);
    setShowTaskBuilder(true);
  };

  const handleEditTask = (task: TaskTemplate) => {
    setTaskForm(task);
    setEditingTask(task);
    setShowTaskBuilder(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.title || !taskForm.description) {
      alert("Please fill in task title and description");
      return;
    }

    const newTask: TaskTemplate = {
      id: editingTask?.id || `task-${Date.now()}`,
      title: taskForm.title!,
      description: taskForm.description!,
      category: taskForm.category || "documentation",
      daysFromStart: taskForm.daysFromStart || 1,
      priority: taskForm.priority || "medium",
      estimatedHours: taskForm.estimatedHours || 1,
      dependencies: taskForm.dependencies || [],
      autoAssign: taskForm.autoAssign ?? true,
      roleSpecific: taskForm.roleSpecific || [],
      departmentSpecific: taskForm.departmentSpecific || [],
      resources: taskForm.resources || [],
      completionCriteria: taskForm.completionCriteria || [],
      tags: taskForm.tags || [],
      customFields: taskForm.customFields || {}
    };

    const currentTasks = templateForm.tasks || [];
    
    if (editingTask) {
      // Update existing task
      const updatedTasks = currentTasks.map(t => t.id === editingTask.id ? newTask : t);
      setTemplateForm({ ...templateForm, tasks: updatedTasks });
    } else {
      // Add new task
      setTemplateForm({ ...templateForm, tasks: [...currentTasks, newTask] });
    }

    setShowTaskBuilder(false);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const currentTasks = templateForm.tasks || [];
    setTemplateForm({ 
      ...templateForm, 
      tasks: currentTasks.filter(t => t.id !== taskId) 
    });
  };

  const canManageTemplates = userRole === "admin" || userRole === "mentor" || userRole === "team_lead";

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-700";
      case "intermediate": return "bg-yellow-100 text-yellow-700";
      case "advanced": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "general": return <Globe className="w-4 h-4" />;
      case "role-specific": return <Users className="w-4 h-4" />;
      case "department-specific": return <Building className="w-4 h-4" />;
      case "custom": return <Settings className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  return (
    <NeoLayout>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Onboarding Templates</h1>
            <p className="mt-2 text-gray-600">Create, manage, and customize onboarding workflows for different roles and departments</p>
          </div>
          {canManageTemplates && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleCreateTemplate}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Template</span>
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="hidden sm:inline">Import</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="role-specific">Role-Specific</option>
                <option value="department-specific">Department-Specific</option>
                <option value="custom">Custom</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="all">All Difficulties</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="popularity">Most Popular</option>
                <option value="name">Name</option>
                <option value="updated">Recently Updated</option>
                <option value="duration">Duration</option>
              </select>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredTemplates.length} of {templates.length} templates
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Template Header */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    {getCategoryIcon(template.category)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.metadata.difficulty)}`}>
                      {template.metadata.difficulty}
                    </span>
                  </div>
                  {canManageTemplates && (
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>

                {/* Template Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{template.estimatedDuration}</div>
                    <div className="text-xs text-gray-500">Days</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{template.tasks.length}</div>
                    <div className="text-xs text-gray-500">Tasks</div>
                  </div>
                </div>

                {/* Popularity and Success Rate */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium">{template.metadata.popularity}%</span>
                    <span className="text-xs text-gray-500">popular</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">{template.metadata.successRate}%</span>
                    <span className="text-xs text-gray-500">success</span>
                  </div>
                </div>

                {/* Tags */}
                {template.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                    {template.tags.length > 3 && (
                      <span className="text-xs text-gray-500">+{template.tags.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Target Roles/Departments Preview */}
                <div className="space-y-2 mb-4">
                  {template.targetRoles.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Roles: {template.targetRoles.slice(0, 2).join(", ")}
                        {template.targetRoles.length > 2 && ` +${template.targetRoles.length - 2}`}
                      </span>
                    </div>
                  )}
                  {template.targetDepartments.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Building className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">
                        Depts: {template.targetDepartments.slice(0, 2).join(", ")}
                        {template.targetDepartments.length > 2 && ` +${template.targetDepartments.length - 2}`}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Template Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                    className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                    {expandedTemplate === template.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {canManageTemplates && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Edit template"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicateTemplate(template)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Duplicate template"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete template"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedTemplate === template.id && (
                <div className="px-6 py-4 border-t bg-gray-50">
                  <div className="space-y-4">
                    {/* Task Preview */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Task Overview</h4>
                      <div className="space-y-2">
                        {template.tasks.slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center space-x-2 text-sm">
                            <div className={`w-2 h-2 rounded-full ${
                              task.priority === "critical" ? "bg-red-500" :
                              task.priority === "high" ? "bg-orange-500" :
                              task.priority === "medium" ? "bg-yellow-500" :
                              "bg-green-500"
                            }`} />
                            <span className="text-gray-600">Day {task.daysFromStart}:</span>
                            <span className="text-gray-900">{task.title}</span>
                          </div>
                        ))}
                        {template.tasks.length > 3 && (
                          <div className="text-xs text-gray-500">+{template.tasks.length - 3} more tasks</div>
                        )}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Avg. Completion:</span>
                        <span className="ml-2 font-medium">{template.metadata.avgCompletionTime} days</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Version:</span>
                        <span className="ml-2 font-medium">{template.version}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <button className="flex-1 bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center justify-center gap-2">
                        <Play className="w-4 h-4" />
                        Use Template
                      </button>
                      <button className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== "all" || selectedDifficulty !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first onboarding template"
              }
            </p>
            {canManageTemplates && (
              <button
                onClick={handleCreateTemplate}
                className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Create Your First Template
              </button>
            )}
          </div>
        )}

        {/* Create/Edit Template Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-20">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto modal-mobile">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {showEditModal ? "Edit Template" : "Create New Template"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setSelectedTemplate(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-6 pt-4 border-b">
                <div className="flex space-x-8">
                  <button
                    onClick={() => setActiveTabInModal("basic")}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTabInModal === "basic"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Basic Info
                  </button>
                  <button
                    onClick={() => setActiveTabInModal("tasks")}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTabInModal === "tasks"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tasks ({templateForm.tasks?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTabInModal("targeting")}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTabInModal === "targeting"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Targeting
                  </button>
                  <button
                    onClick={() => setActiveTabInModal("settings")}
                    className={`pb-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTabInModal === "settings"
                        ? "border-black text-black"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Settings
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information Tab */}
                {activeTabInModal === "basic" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={templateForm.name || ""}
                          onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          placeholder="Enter template name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={templateForm.category || "general"}
                          onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value as any })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        >
                          <option value="general">General</option>
                          <option value="role-specific">Role-Specific</option>
                          <option value="department-specific">Department-Specific</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={templateForm.description || ""}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Describe what this template covers and who it's for"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Estimated Duration (days)
                        </label>
                        <input
                          type="number"
                          value={templateForm.estimatedDuration || 14}
                          onChange={(e) => setTemplateForm({ ...templateForm, estimatedDuration: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          min="1"
                          max="365"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Template Status
                        </label>
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={templateForm.isActive ?? true}
                              onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
                              className="mr-2"
                            />
                            Active
                          </label>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={templateForm.isPublic ?? false}
                              onChange={(e) => setTemplateForm({ ...templateForm, isPublic: e.target.checked })}
                              className="mr-2"
                            />
                            Public
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={templateForm.tags?.join(", ") || ""}
                        onChange={(e) => setTemplateForm({ 
                          ...templateForm, 
                          tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="onboarding, technical, remote, etc."
                      />
                    </div>
                  </div>
                )}

                {/* Tasks Tab */}
                {activeTabInModal === "tasks" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-900">Template Tasks</h3>
                      <button
                        onClick={handleAddTask}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Task
                      </button>
                    </div>

                    {templateForm.tasks && templateForm.tasks.length > 0 ? (
                      <div className="space-y-3">
                        {templateForm.tasks
                          .sort((a, b) => a.daysFromStart - b.daysFromStart)
                          .map((task, index) => (
                          <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <span className="text-sm font-medium text-gray-500">Day {task.daysFromStart}</span>
                                  <div className={`w-2 h-2 rounded-full ${
                                    task.priority === "critical" ? "bg-red-500" :
                                    task.priority === "high" ? "bg-orange-500" :
                                    task.priority === "medium" ? "bg-yellow-500" :
                                    "bg-green-500"
                                  }`} />
                                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                                    {task.category}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900">{task.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span>{task.estimatedHours}h</span>
                                  {task.dependencies.length > 0 && (
                                    <span>Depends on {task.dependencies.length} task{task.dependencies.length > 1 ? 's' : ''}</span>
                                  )}
                                  {task.tags.length > 0 && (
                                    <span>{task.tags.slice(0, 2).join(", ")}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditTask(task)}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="p-1 text-gray-400 hover:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No tasks added yet</p>
                        <button
                          onClick={handleAddTask}
                          className="mt-2 text-black hover:underline"
                        >
                          Add your first task
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Targeting Tab */}
                {activeTabInModal === "targeting" && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Roles (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={templateForm.targetRoles?.join(", ") || ""}
                        onChange={(e) => setTemplateForm({ 
                          ...templateForm, 
                          targetRoles: e.target.value.split(",").map(role => role.trim()).filter(Boolean) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="staff, intern, team_lead, admin"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Departments (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={templateForm.targetDepartments?.join(", ") || ""}
                        onChange={(e) => setTemplateForm({ 
                          ...templateForm, 
                          targetDepartments: e.target.value.split(",").map(dept => dept.trim()).filter(Boolean) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Engineering, Marketing, Sales, HR"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Locations (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={templateForm.targetLocations?.join(", ") || ""}
                        onChange={(e) => setTemplateForm({ 
                          ...templateForm, 
                          targetLocations: e.target.value.split(",").map(loc => loc.trim()).filter(Boolean) 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                        placeholder="Remote, New York, San Francisco"
                      />
                    </div>
                  </div>
                )}

                {/* Settings Tab */}
                {activeTabInModal === "settings" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Customization Settings</h3>
                      <div className="space-y-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={templateForm.customization?.allowModification ?? true}
                            onChange={(e) => setTemplateForm({ 
                              ...templateForm, 
                              customization: {
                                ...templateForm.customization,
                                allowModification: e.target.checked,
                                requiredFields: templateForm.customization?.requiredFields || [],
                                optionalFields: templateForm.customization?.optionalFields || [],
                                branding: templateForm.customization?.branding || {}
                              }
                            })}
                            className="mr-2"
                          />
                          Allow template modification by users
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Template Metadata</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Difficulty Level
                          </label>
                          <select
                            value={templateForm.metadata?.difficulty || "beginner"}
                            onChange={(e) => setTemplateForm({ 
                              ...templateForm, 
                              metadata: {
                                ...templateForm.metadata,
                                difficulty: e.target.value as "beginner" | "intermediate" | "advanced",
                                popularity: templateForm.metadata?.popularity || 0,
                                successRate: templateForm.metadata?.successRate || 0,
                                avgCompletionTime: templateForm.metadata?.avgCompletionTime || 0,
                                reviews: templateForm.metadata?.reviews || []
                              }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Version
                          </label>
                          <input
                            type="text"
                            value={templateForm.version || "1.0"}
                            onChange={(e) => setTemplateForm({ ...templateForm, version: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                            placeholder="1.0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedTemplate(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {showEditModal ? "Update Template" : "Create Template"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Builder Modal */}
        {showTaskBuilder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-20">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto modal-mobile">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingTask ? "Edit Task" : "Add New Task"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowTaskBuilder(false);
                      setEditingTask(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Task Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      value={taskForm.title || ""}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter task title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={taskForm.category || "documentation"}
                      onChange={(e) => setTaskForm({ ...taskForm, category: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="documentation">Documentation</option>
                      <option value="training">Training</option>
                      <option value="setup">Setup</option>
                      <option value="meeting">Meeting</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority || "medium"}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Days from Start
                    </label>
                    <input
                      type="number"
                      value={taskForm.daysFromStart || 1}
                      onChange={(e) => setTaskForm({ ...taskForm, daysFromStart: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="1"
                      max="365"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={taskForm.estimatedHours || 1}
                      onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      min="0.5"
                      max="40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={taskForm.description || ""}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Describe what needs to be done in this task"
                  />
                </div>

                {/* Task Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role Specific (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={taskForm.roleSpecific?.join(", ") || ""}
                      onChange={(e) => setTaskForm({ 
                        ...taskForm, 
                        roleSpecific: e.target.value.split(",").map(role => role.trim()).filter(Boolean) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="admin, manager, developer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Department Specific (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={taskForm.departmentSpecific?.join(", ") || ""}
                      onChange={(e) => setTaskForm({ 
                        ...taskForm, 
                        departmentSpecific: e.target.value.split(",").map(dept => dept.trim()).filter(Boolean) 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Engineering, Sales, Marketing"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={taskForm.tags?.join(", ") || ""}
                    onChange={(e) => setTaskForm({ 
                      ...taskForm, 
                      tags: e.target.value.split(",").map(tag => tag.trim()).filter(Boolean) 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="required, legal, security, training"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Criteria (one per line)
                  </label>
                  <textarea
                    value={taskForm.completionCriteria?.join("\n") || ""}
                    onChange={(e) => setTaskForm({ 
                      ...taskForm, 
                      completionCriteria: e.target.value.split("\n").map(criteria => criteria.trim()).filter(Boolean) 
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Form completed correctly&#10;Manager approval received&#10;Documentation uploaded"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={taskForm.autoAssign ?? true}
                      onChange={(e) => setTaskForm({ ...taskForm, autoAssign: e.target.checked })}
                      className="mr-2"
                    />
                    Auto-assign to new hires
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowTaskBuilder(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTask}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingTask ? "Update Task" : "Add Task"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NeoLayout>
  );
}

export default function TemplatesPageWrapper() {
  return (
    <AuthWrapper>
      {({ user }) => <OnboardingTemplatesPage user={user} />}
    </AuthWrapper>
  );
}
