import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

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
}

export const aiService = new AIService();