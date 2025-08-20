import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import {
  createUser,
  assignOnboardingTasks,
  sendCommunication,
  createDocumentPack,
  scheduleOrientation,
  escalateIssue,
  addKnowledgeDoc,
  type OnboardParams,
} from "./agent-tools";

const client = generateClient<Schema>();

// AI Service Configuration
const AI_API_ENDPOINT = process.env.NEXT_PUBLIC_AI_API_ENDPOINT || "https://api.openai.com/v1";
const AI_API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY || "";

export interface ResumeAnalysisResult {
  matchScore: number;
  extractedData: {
    skills: string[];
    experience: {
      years: number;
      companies: string[];
      roles: string[];
    };
    education: {
      degrees: string[];
      institutions: string[];
    };
    languages: string[];
    certifications: string[];
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
  aiConfidence: number;
}

export interface ChatResponse {
  response: string;
  intent: string;
  sentiment: "positive" | "neutral" | "negative";
  suggestedActions?: string[];
  needsEscalation: boolean;
}

export interface PerformanceAnalysis {
  engagementScore: number;
  retentionProbability: number;
  predictedTrajectory: "improving" | "stable" | "declining";
  riskFactors: string[];
  recommendations: string[];
}

export type Intent =
  | "onboard_person"
  | "approve_leave"
  | "create_job_posting"
  | "schedule_orientation"
  | "generate_offer"
  | "policy_qna"
  | "analyze_retention"
  | "escalate_sensitive"
  | "add_kb_doc"
  | "general";

export interface PlanStep { title: string; status: "pending" | "running" | "done"; details?: string }
export interface IntentPlan {
  intent: Intent;
  params: Record<string, any>;
  missing: string[];
  steps: PlanStep[];
  summary: string;
}

class AIService {
  // Resume Analysis using AI
  async analyzeResume(
    resumeUrl: string, 
    positionRequirements: any,
    applicantId: string
  ): Promise<ResumeAnalysisResult> {
    try {
      // In a real implementation, this would:
      // 1. Download and parse the resume (PDF/DOCX)
      // 2. Send to AI for analysis
      // 3. Compare with position requirements
      
      const mockAnalysis: ResumeAnalysisResult = {
        matchScore: Math.floor(Math.random() * 40) + 60, // 60-100
        extractedData: {
          skills: ["JavaScript", "React", "Node.js", "AWS", "Python"],
          experience: {
            years: 5,
            companies: ["Tech Corp", "StartupXYZ"],
            roles: ["Senior Developer", "Full Stack Engineer"]
          },
          education: {
            degrees: ["BS Computer Science"],
            institutions: ["University of Technology"]
          },
          languages: ["English", "Spanish"],
          certifications: ["AWS Certified Developer"]
        },
        strengths: [
          "Strong technical background in required technologies",
          "Leadership experience in previous roles",
          "Excellent educational qualifications"
        ],
        weaknesses: [
          "Limited experience in our specific industry",
          "No direct experience with our tech stack version"
        ],
        recommendations: "Strong candidate for technical interview. Consider for senior position.",
        aiConfidence: 0.92
      };

      // Save analysis to database
      await client.models.AIResumeAnalysis.create({
        applicantId,
        resumeUrl,
        extractedData: mockAnalysis.extractedData,
        matchScore: mockAnalysis.matchScore,
        strengths: mockAnalysis.strengths,
        weaknesses: mockAnalysis.weaknesses,
        recommendations: mockAnalysis.recommendations,
        analyzedAt: new Date().toISOString(),
        positionRequirements,
        aiConfidence: mockAnalysis.aiConfidence
      });

      return mockAnalysis;
    } catch (error) {
      console.error("Resume analysis error:", error);
      throw error;
    }
  }

  // AI Chat for Employee Support
  async processChat(
    userId: string,
    sessionId: string,
    message: string,
    context: "onboarding" | "benefits" | "policies" | "general"
  ): Promise<ChatResponse> {
    try {
      // Detect intent and generate response
      const intent = this.detectIntent(message);
      const sentiment = this.analyzeSentiment(message);
      
      // Generate contextual response
      let response = "";
      let needsEscalation = false;
      let suggestedActions: string[] = [];

      switch (intent) {
        case "question_benefits":
          response = "I can help you with benefits information. Our company offers comprehensive health insurance, 401k matching up to 6%, and flexible PTO. What specific benefit would you like to know more about?";
          suggestedActions = ["View Benefits Guide", "Schedule HR Meeting", "Access Benefits Portal"];
          break;
        
        case "technical_issue":
          response = "I understand you're experiencing a technical issue. Let me help you troubleshoot. Can you describe what specific problem you're encountering?";
          suggestedActions = ["Submit IT Ticket", "View IT FAQ", "Contact IT Support"];
          break;
        
        case "onboarding_help":
          response = "I'm here to guide you through the onboarding process. You can check your onboarding tasks in the dashboard. Is there a specific task you need help with?";
          suggestedActions = ["View Onboarding Tasks", "Download Forms", "Schedule Orientation"];
          break;
        
        case "urgent_concern":
          response = "I understand this is urgent. I'm escalating your concern to HR immediately. Someone will reach out within the next hour.";
          needsEscalation = true;
          suggestedActions = ["Call HR Directly", "Send Email to Manager"];
          break;
        
        default:
          response = "I'm here to help! Could you please provide more details about what you need assistance with?";
          suggestedActions = ["Browse FAQs", "Contact HR", "View Resources"];
      }

      // Save chat to database
      await client.models.AIChat.create({
        userId,
        sessionId,
        message,
        response,
        context,
        intent,
        sentiment,
        resolved: !needsEscalation,
        timestamp: new Date().toISOString()
      });

      return {
        response,
        intent,
        sentiment,
        suggestedActions,
        needsEscalation
      };
    } catch (error) {
      console.error("Chat processing error:", error);
      throw error;
    }
  }

  // Performance Analytics and Predictions
  async analyzePerformance(userId: string, period: string): Promise<PerformanceAnalysis> {
    try {
      // Gather user data: tasks, communications, activities
      const tasks = await client.models.OnboardingTask.list({
        filter: { userId: { eq: userId } }
      });

      // Calculate metrics
      const completedTasks = tasks.data.filter(t => t.status === "completed").length;
      const totalTasks = tasks.data.length;
      const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      // Mock AI analysis (in production, this would use ML models)
      const analysis: PerformanceAnalysis = {
        engagementScore: Math.round(taskCompletionRate * 100),
        retentionProbability: 0.85,
        predictedTrajectory: taskCompletionRate > 0.7 ? "improving" : "stable",
        riskFactors: [
          taskCompletionRate < 0.5 ? "Low task completion rate" : null,
          "Limited peer interactions",
        ].filter(Boolean) as string[],
        recommendations: [
          "Schedule regular 1-on-1 meetings",
          "Assign a mentor for guidance",
          "Provide additional training resources"
        ]
      };

      // Save insights
      await client.models.AIPerformanceInsight.create({
        userId,
        period,
        metrics: {
          taskCompletionRate,
          avgResponseTime: 24, // hours
          collaborationScore: 75
        },
        predictedTrajectory: analysis.predictedTrajectory,
        riskFactors: analysis.riskFactors,
        recommendations: analysis.recommendations,
        engagementScore: analysis.engagementScore,
        retentionProbability: analysis.retentionProbability,
        generatedAt: new Date().toISOString()
      });

      return analysis;
    } catch (error) {
      console.error("Performance analysis error:", error);
      throw error;
    }
  }

  // Workflow Optimization
  async optimizeWorkflow(workflowType: string, currentProcess: any): Promise<any> {
    try {
      // Analyze current workflow and suggest improvements
      const optimization = {
        workflowType,
        currentProcess,
        optimizedProcess: {
          // AI-suggested optimizations
          steps: currentProcess.steps?.filter((s: any) => s.necessary),
          automations: [
            "Auto-assign tasks based on role",
            "Automated reminder emails",
            "Smart document routing"
          ]
        },
        estimatedTimeSaving: 120, // minutes
        automationOpportunities: [
          "Replace manual approval with conditional automation",
          "Implement smart task routing based on workload",
          "Add predictive deadline adjustments"
        ],
        implementationSteps: [
          "Configure automation rules",
          "Set up trigger conditions",
          "Test with pilot group",
          "Roll out to all users"
        ],
        priority: "high" as const,
        status: "proposed" as const
      };

      await client.models.AIWorkflowOptimization.create({
        ...optimization,
        createdAt: new Date().toISOString()
      });

      return optimization;
    } catch (error) {
      console.error("Workflow optimization error:", error);
      throw error;
    }
  }

  // Helper methods
  private detectIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes("benefit") || lowerMessage.includes("insurance") || lowerMessage.includes("401k")) {
      return "question_benefits";
    } else if (lowerMessage.includes("error") || lowerMessage.includes("broken") || lowerMessage.includes("not working")) {
      return "technical_issue";
    } else if (lowerMessage.includes("onboard") || lowerMessage.includes("new") || lowerMessage.includes("start")) {
      return "onboarding_help";
    } else if (lowerMessage.includes("urgent") || lowerMessage.includes("emergency") || lowerMessage.includes("asap")) {
      return "urgent_concern";
    }
    
    return "general_inquiry";
  }

  private analyzeSentiment(message: string): "positive" | "neutral" | "negative" {
    const positiveWords = ["thank", "great", "excellent", "happy", "good"];
    const negativeWords = ["problem", "issue", "bad", "angry", "frustrated", "difficult"];
    
    const lowerMessage = message.toLowerCase();
    let score = 0;
    
    positiveWords.forEach(word => {
      if (lowerMessage.includes(word)) score++;
    });
    
    negativeWords.forEach(word => {
      if (lowerMessage.includes(word)) score--;
    });
    
    if (score > 0) return "positive";
    if (score < 0) return "negative";
    return "neutral";
  }

  // Smart Task Assignment
  async assignTasksIntelligently(userId: string, role: string, department?: string): Promise<string[]> {
    try {
      // Get user profile and history
      const userProfile = await client.models.User.get({ id: userId });
      
      // Determine relevant tasks based on AI analysis
      const recommendedTasks = [
        {
          title: "Complete Company Culture Training",
          priority: role === "intern" ? "high" : "medium",
          dueInDays: 7
        },
        {
          title: "Set up Development Environment",
          priority: "high",
          dueInDays: 2,
          condition: department === "Engineering"
        },
        {
          title: "Review Sales Playbook",
          priority: "high",
          dueInDays: 3,
          condition: department === "Sales"
        },
        {
          title: "Complete Security Training",
          priority: "high",
          dueInDays: 1,
          condition: true
        }
      ];

      const assignedTaskIds: string[] = [];

      for (const task of recommendedTasks) {
        if (task.condition === false) continue;

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.dueInDays);

        const created = await client.models.OnboardingTask.create({
          userId,
          title: task.title,
          description: `AI-assigned task based on ${role} role in ${department || 'company'}`,
          status: "pending",
          dueDate: dueDate.toISOString().split('T')[0],
          category: "training",
          assignedBy: "AI_SYSTEM"
        });

        if (created.data) {
          assignedTaskIds.push(created.data.id);
        }
      }

      return assignedTaskIds;
    } catch (error) {
      console.error("Task assignment error:", error);
      throw error;
    }
  }

  // Intent parsing + planning
  planIntent(userId: string, message: string): IntentPlan {
    const parsed = this.parseIntent(message);
    const { intent, params } = parsed;
    const missing = this.missingParams(intent, params);

    let steps: PlanStep[] = [];
    let summary = "";

    switch (intent) {
      case "onboard_person":
        steps = [
          { title: "Create user profile", status: "pending" },
          { title: "Assign onboarding tasks", status: "pending" },
          { title: "Send welcome email", status: "pending" },
          { title: "Schedule orientation", status: "pending" },
          { title: "Attach starter docs", status: "pending" },
        ];
        summary = "Prepare profile, tasks, comms, orientation, and docs.";
        break;
      case "approve_leave":
        steps = [
          { title: "Notify employee", status: "pending" },
          { title: "Inform manager", status: "pending" },
        ];
        summary = "Send approval notifications.";
        break;
      case "schedule_orientation":
        steps = [
          { title: "Invite employee", status: "pending" },
          { title: "Calendar hold", status: "pending" },
        ];
        summary = "Schedule orientation and send invite.";
        break;
      case "add_kb_doc":
        steps = [{ title: "Save policy to knowledge base", status: "pending" }];
        summary = "Add document for grounding answers.";
        break;
      default:
        steps = [{ title: "Draft helpful response", status: "pending" }];
        summary = "General assistance.";
    }

    return { intent, params, missing, steps, summary };
  }

  async executeIntent(userId: string, plan: IntentPlan): Promise<{ outputs: any; steps: PlanStep[] }>{
    const steps = plan.steps.map(s => ({ ...s }));
    const outputs: any = {};

    const setStep = (i: number, status: PlanStep["status"], details?: string) => {
      steps[i].status = status;
      if (details) steps[i].details = details;
    };

    switch (plan.intent) {
      case "onboard_person": {
        const p = plan.params as Partial<OnboardParams>;
        // 0. Create user
        setStep(0, "running");
        const user = await createUser({
          firstName: p.firstName!,
          lastName: p.lastName!,
          email: p.email!,
          role: p.role,
          department: p.department,
          position: p.position,
          startDate: p.startDate,
        });
        setStep(0, "done", `User ${user?.id}`);
        outputs.userId = user?.id;

        // 1. Tasks
        setStep(1, "running");
        const taskIds = await assignOnboardingTasks(user!.id, p.role, p.department);
        setStep(1, "done", `${taskIds.length} tasks assigned`);
        outputs.taskIds = taskIds;

        // 2. Welcome email
        setStep(2, "running");
        const welcome = await sendCommunication({
          recipientId: user!.id,
          senderId: userId,
          subject: "Welcome to the team!",
          content: `Hi ${p.firstName}, welcome aboard! Here are your first steps...`,
        });
        setStep(2, "done", `Comm ${welcome?.id}`);
        outputs.welcomeCommId = welcome?.id;

        // 3. Orientation
        setStep(3, "running");
        const when = p.startDate ? new Date(p.startDate) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
        when.setHours(14, 0, 0, 0);
        const orient = await scheduleOrientation({ userId: user!.id, organizerId: userId, dateTimeISO: when.toISOString() });
        setStep(3, "done", `Invite ${orient?.id}`);
        outputs.orientationId = orient?.id;

        // 4. Docs
        setStep(4, "running");
        const doc = await createDocumentPack({
          uploadedBy: userId,
          userId: user!.id,
          name: "Starter Pack",
          url: "https://example.com/starter-pack.pdf",
          description: "Employee handbook and onboarding forms",
        });
        setStep(4, "done", `Doc ${doc?.id}`);
        outputs.docId = doc?.id;
        break;
      }

      case "approve_leave": {
        setStep(0, "running");
        const emp = plan.params.employeeId || plan.params.employeeEmail || "UNKNOWN";
        const appr = await sendCommunication({
          recipientId: emp,
          senderId: userId,
          subject: "Leave Approved",
          content: "Your leave request has been approved.",
        });
        setStep(0, "done", `Comm ${appr?.id}`);
        setStep(1, "running");
        const mgr = plan.params.managerId || "MANAGER";
        const mgrNote = await sendCommunication({
          recipientId: mgr,
          senderId: userId,
          subject: "Leave Approval Notice",
          content: `Leave approved for ${emp}.`,
        });
        setStep(1, "done", `Comm ${mgrNote?.id}`);
        outputs.commIds = [appr?.id, mgrNote?.id];
        break;
      }

      case "schedule_orientation": {
        setStep(0, "running");
        const invite = await scheduleOrientation({
          userId: plan.params.userId,
          organizerId: userId,
          dateTimeISO: plan.params.dateTimeISO,
        });
        setStep(0, "done", `Invite ${invite?.id}`);
        setStep(1, "done", "Calendar hold created");
        outputs.inviteId = invite?.id;
        break;
      }

      case "add_kb_doc": {
        setStep(0, "running");
        const doc = await addKnowledgeDoc({ title: plan.params.title, url: plan.params.url, userId });
        setStep(0, "done", `Doc ${doc?.id}`);
        outputs.docId = doc?.id;
        break;
      }

      default: {
        // No-op for general
        break;
      }
    }

    return { outputs, steps };
  }

  private parseIntent(message: string): { intent: Intent; params: Record<string, any> } {
    const m = message.toLowerCase();
    // Onboard detection and simple param extraction
    if (/(onboard|hire|bring on)/.test(m)) {
      const nameMatch = message.match(/onboard\s+(\w+)\s+(\w+)/i);
      const emailMatch = message.match(/([\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/);
      const startMatch = message.match(/start(?:s|ing)?\s+on\s+(\d{4}-\d{2}-\d{2})/i);
      return {
        intent: "onboard_person",
        params: {
          firstName: nameMatch?.[1],
          lastName: nameMatch?.[2],
          email: emailMatch?.[0],
          startDate: startMatch?.[1],
        },
      };
    }
    if (/approve\s+(pto|leave|time off)/.test(m)) {
      return { intent: "approve_leave", params: {} };
    }
    if (/schedule\s+orientation/.test(m)) {
      return { intent: "schedule_orientation", params: {} };
    }
    if (/add\s+(policy|kb)\s+doc/.test(m)) {
      return { intent: "add_kb_doc", params: {} };
    }
    if (/(harass|discriminat|bully|threat|assault)/.test(m)) {
      return { intent: "escalate_sensitive", params: {} };
    }
    return { intent: "general", params: {} };
  }

  private missingParams(intent: Intent, params: Record<string, any>): string[] {
    switch (intent) {
      case "onboard_person": {
        const need = ["firstName", "lastName", "email"];
        return need.filter(k => !params[k]);
      }
      case "schedule_orientation":
        return ["userId", "dateTimeISO"].filter(k => !params[k]);
      case "add_kb_doc":
        return ["title", "url"].filter(k => !params[k]);
      default:
        return [];
    }
  }
}

export const aiService = new AIService();
