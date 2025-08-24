"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { EmailService } from "./emailService";
import { SlackService } from "./slackService";

const client = generateClient<Schema>();

type Applicant = Schema["Applicant"]["type"];
type Document = Schema["Document"]["type"];
type OnboardingTask = Schema["OnboardingTask"]["type"];

interface OnboardingWorkflow {
  id: string;
  name: string;
  description: string;
  tasks: OnboardingTaskTemplate[];
  triggerCondition: "application_accepted" | "manual" | "scheduled";
  isActive: boolean;
}

interface OnboardingTaskTemplate {
  title: string;
  description: string;
  type: "document_upload" | "form_completion" | "email_send" | "approval_required" | "system_check";
  priority: "low" | "medium" | "high";
  daysFromStart: number;
  assignedRole?: "HR" | "Manager" | "Employee" | "System";
  requiredDocuments?: string[];
  emailTemplate?: string;
  dependencies?: string[];
  autoComplete?: boolean;
}

interface OnboardingProgress {
  applicantId: string;
  workflowId: string;
  status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled";
  startDate: string;
  expectedCompletionDate?: string;
  completedTasks: string[];
  currentTasks: string[];
  completionPercentage: number;
}

export class OnboardingService {
  // Predefined workflows
  private static defaultWorkflows: OnboardingWorkflow[] = [
    {
      id: "standard-employee",
      name: "Standard Employee Onboarding",
      description: "Complete onboarding process for new employees",
      triggerCondition: "application_accepted",
      isActive: true,
      tasks: [
        {
          title: "Welcome Email",
          description: "Send welcome email with first day information",
          type: "email_send",
          priority: "high",
          daysFromStart: 0,
          assignedRole: "HR",
          emailTemplate: "welcome_email",
          autoComplete: true,
        },
        {
          title: "Tax Forms (W-4, I-9)",
          description: "Complete required tax and employment forms",
          type: "document_upload",
          priority: "high",
          daysFromStart: 1,
          assignedRole: "Employee",
          requiredDocuments: ["W-4", "I-9", "ID Verification"],
        },
        {
          title: "Employee Handbook Acknowledgment",
          description: "Review and acknowledge employee handbook",
          type: "document_upload",
          priority: "medium",
          daysFromStart: 2,
          assignedRole: "Employee",
          requiredDocuments: ["Handbook Signature"],
        },
        {
          title: "IT Equipment Setup",
          description: "Request and setup necessary IT equipment",
          type: "form_completion",
          priority: "high",
          daysFromStart: 3,
          assignedRole: "HR",
          dependencies: ["Tax Forms (W-4, I-9)"],
        },
        {
          title: "Benefits Enrollment",
          description: "Complete health insurance and benefits enrollment",
          type: "form_completion",
          priority: "medium",
          daysFromStart: 5,
          assignedRole: "Employee",
        },
        {
          title: "Security Training",
          description: "Complete mandatory security awareness training",
          type: "form_completion",
          priority: "high",
          daysFromStart: 7,
          assignedRole: "Employee",
        },
        {
          title: "Direct Supervisor Introduction",
          description: "Schedule meeting with direct supervisor",
          type: "approval_required",
          priority: "medium",
          daysFromStart: 7,
          assignedRole: "Manager",
        },
        {
          title: "Office Tour & Workspace Setup",
          description: "Physical office tour and workspace assignment",
          type: "approval_required",
          priority: "medium",
          daysFromStart: 8,
          assignedRole: "HR",
        },
        {
          title: "30-Day Check-in",
          description: "Schedule 30-day performance and satisfaction check-in",
          type: "approval_required",
          priority: "low",
          daysFromStart: 30,
          assignedRole: "Manager",
        },
      ],
    },
    {
      id: "contractor-onboarding",
      name: "Contractor Onboarding",
      description: "Streamlined onboarding process for contractors",
      triggerCondition: "application_accepted",
      isActive: true,
      tasks: [
        {
          title: "Contractor Agreement",
          description: "Review and sign contractor agreement",
          type: "document_upload",
          priority: "high",
          daysFromStart: 0,
          assignedRole: "Employee",
          requiredDocuments: ["Contractor Agreement", "W-9 Form"],
        },
        {
          title: "Project Brief",
          description: "Receive project requirements and timeline",
          type: "email_send",
          priority: "high",
          daysFromStart: 1,
          assignedRole: "Manager",
          emailTemplate: "project_brief",
          autoComplete: true,
        },
        {
          title: "System Access Setup",
          description: "Setup limited system access for project",
          type: "approval_required",
          priority: "high",
          daysFromStart: 2,
          assignedRole: "HR",
          dependencies: ["Contractor Agreement"],
        },
        {
          title: "Security Briefing",
          description: "Complete contractor security briefing",
          type: "form_completion",
          priority: "medium",
          daysFromStart: 3,
          assignedRole: "Employee",
        },
      ],
    },
    {
      id: "executive-onboarding",
      name: "Executive Onboarding",
      description: "Comprehensive onboarding for executive-level positions",
      triggerCondition: "manual",
      isActive: true,
      tasks: [
        {
          title: "Executive Welcome Package",
          description: "Send executive welcome package with company overview",
          type: "email_send",
          priority: "high",
          daysFromStart: 0,
          assignedRole: "HR",
          emailTemplate: "executive_welcome",
          autoComplete: true,
        },
        {
          title: "Legal Documentation",
          description: "Complete executive-level legal agreements",
          type: "document_upload",
          priority: "high",
          daysFromStart: 1,
          assignedRole: "Employee",
          requiredDocuments: ["Executive Agreement", "Non-Disclosure", "Non-Compete"],
        },
        {
          title: "Board Introduction",
          description: "Schedule introductory meeting with board members",
          type: "approval_required",
          priority: "high",
          daysFromStart: 3,
          assignedRole: "HR",
        },
        {
          title: "Leadership Team Meetings",
          description: "Individual meetings with key leadership team members",
          type: "approval_required",
          priority: "high",
          daysFromStart: 5,
          assignedRole: "HR",
        },
        {
          title: "Strategic Planning Session",
          description: "Participate in strategic planning session",
          type: "approval_required",
          priority: "medium",
          daysFromStart: 14,
          assignedRole: "Manager",
          dependencies: ["Board Introduction", "Leadership Team Meetings"],
        },
        {
          title: "90-Day Strategic Review",
          description: "Comprehensive 90-day performance and strategic review",
          type: "approval_required",
          priority: "high",
          daysFromStart: 90,
          assignedRole: "Manager",
        },
      ],
    },
  ];

  /**
   * Start onboarding workflow for an applicant
   */
  static async startOnboarding(
    applicantId: string, 
    workflowId?: string
  ): Promise<{
    success: boolean;
    onboardingId?: string;
    error?: string;
  }> {
    try {
      // Get applicant details
      const applicant = await client.models.Applicant.get({ id: applicantId });
      if (!applicant.data) {
        return { success: false, error: "Applicant not found" };
      }

      // Determine workflow based on position or use default
      const selectedWorkflow = workflowId 
        ? this.defaultWorkflows.find(w => w.id === workflowId)
        : this.selectWorkflowForApplicant(applicant.data);

      if (!selectedWorkflow) {
        return { success: false, error: "No suitable workflow found" };
      }

      // Create onboarding record
      const onboarding = await client.models.Onboarding.create({
        applicantId,
        workflowId: selectedWorkflow.id,
        workflowName: selectedWorkflow.name,
        status: "in_progress",
        startDate: new Date().toISOString(),
        expectedCompletionDate: this.calculateExpectedCompletion(selectedWorkflow),
        completionPercentage: 0,
        metadata: JSON.stringify({
          workflowTasks: selectedWorkflow.tasks,
          applicantName: applicant.data.fullName,
          position: applicant.data.position,
        }),
      });

      if (!onboarding.data) {
        return { success: false, error: "Failed to create onboarding record" };
      }

      // Create individual tasks
      const taskPromises = selectedWorkflow.tasks.map(async (taskTemplate, index) => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + taskTemplate.daysFromStart);

        return client.models.OnboardingTask.create({
          onboardingId: onboarding.data!.id,
          title: taskTemplate.title,
          description: taskTemplate.description,
          type: taskTemplate.type,
          status: index === 0 ? "active" : "pending",
          priority: taskTemplate.priority,
          assignedRole: taskTemplate.assignedRole || "HR",
          dueDate: dueDate.toISOString(),
          order: index,
          dependencies: taskTemplate.dependencies ? JSON.stringify(taskTemplate.dependencies) : null,
          metadata: JSON.stringify({
            requiredDocuments: taskTemplate.requiredDocuments || [],
            emailTemplate: taskTemplate.emailTemplate,
            autoComplete: taskTemplate.autoComplete || false,
          }),
        });
      });

      const tasks = await Promise.all(taskPromises);
      const failedTasks = tasks.filter(t => !t.data);
      
      if (failedTasks.length > 0) {
        console.warn(`${failedTasks.length} tasks failed to create`);
      }

      // Send welcome notification
      await client.models.Notification.create({
        type: "onboarding_started",
        title: "Onboarding Started",
        message: `Welcome to ${selectedWorkflow.name}! Your onboarding journey has begun.`,
        userId: applicant.data.userId || applicantId,
        relatedId: onboarding.data.id,
        relatedType: "Onboarding",
        actionUrl: `/onboarding/${onboarding.data.id}`,
        priority: "high",
        read: false,
      });

      // Send Slack notification
      try {
        await SlackService.sendOnboardingNotification(
          applicant.data.fullName,
          selectedWorkflow.name
        );
      } catch (error) {
        console.warn("Failed to send Slack notification:", error);
      }

      // Auto-complete first task if it's an automated email
      const firstTask = tasks[0]?.data;
      if (firstTask && selectedWorkflow.tasks[0]?.autoComplete) {
        await this.completeTask(firstTask.id, "System auto-completion");
      }

      console.log(`✅ Onboarding started for ${applicant.data.fullName} with workflow: ${selectedWorkflow.name}`);

      return {
        success: true,
        onboardingId: onboarding.data.id,
      };
    } catch (error) {
      console.error("Error starting onboarding:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start onboarding",
      };
    }
  }

  /**
   * Complete a specific onboarding task
   */
  static async completeTask(
    taskId: string, 
    completionNote?: string,
    completedBy?: string
  ): Promise<{
    success: boolean;
    nextTaskId?: string;
    error?: string;
  }> {
    try {
      // Get the task
      const task = await client.models.OnboardingTask.get({ id: taskId });
      if (!task.data) {
        return { success: false, error: "Task not found" };
      }

      // Update task as completed
      await client.models.OnboardingTask.update({
        id: taskId,
        status: "completed",
        completedAt: new Date().toISOString(),
        completedBy: completedBy || "System",
        completionNote: completionNote || "",
      });

      // Get onboarding record
      const onboarding = await client.models.Onboarding.get({ 
        id: task.data.onboardingId 
      });

      if (!onboarding.data) {
        return { success: false, error: "Onboarding record not found" };
      }

      // Get all tasks for this onboarding
      const allTasks = await client.models.OnboardingTask.list({
        filter: {
          onboardingId: { eq: task.data.onboardingId },
        },
      });

      const tasks = allTasks.data || [];
      const completedTasks = tasks.filter(t => t.status === "completed");
      const completionPercentage = Math.round((completedTasks.length / tasks.length) * 100);

      // Check if there's a next task to activate
      let nextTaskId: string | undefined;
      const currentOrder = task.data.order || 0;
      const nextTask = tasks.find(t => 
        (t.order || 0) === currentOrder + 1 && 
        t.status === "pending"
      );

      if (nextTask) {
        // Check dependencies
        const metadata = nextTask.metadata ? JSON.parse(nextTask.metadata) : {};
        const dependencies = metadata.dependencies || [];
        
        const dependenciesMet = dependencies.every((dep: string) =>
          tasks.some(t => t.title === dep && t.status === "completed")
        );

        if (dependenciesMet) {
          await client.models.OnboardingTask.update({
            id: nextTask.id,
            status: "active",
          });
          nextTaskId = nextTask.id;

          // Send notification for new active task
          const applicant = await client.models.Applicant.get({ 
            id: onboarding.data.applicantId 
          });

          if (applicant.data?.userId) {
            await client.models.Notification.create({
              type: "task_assigned",
              title: "New Onboarding Task",
              message: `New task available: ${nextTask.title}`,
              userId: applicant.data.userId,
              relatedId: nextTask.id,
              relatedType: "OnboardingTask",
              actionUrl: `/onboarding/${onboarding.data.id}?task=${nextTask.id}`,
              priority: nextTask.priority === "high" ? "high" : "medium",
              read: false,
            });
          }
        }
      }

      // Update onboarding progress
      const isCompleted = completionPercentage === 100;
      await client.models.Onboarding.update({
        id: onboarding.data.id,
        completionPercentage,
        status: isCompleted ? "completed" : "in_progress",
        completedAt: isCompleted ? new Date().toISOString() : null,
      });

      // Send completion notification if onboarding is done
      if (isCompleted) {
        const applicant = await client.models.Applicant.get({ 
          id: onboarding.data.applicantId 
        });

        if (applicant.data?.userId) {
          await client.models.Notification.create({
            type: "onboarding_complete",
            title: "Onboarding Complete! 🎉",
            message: `Congratulations! You have successfully completed your onboarding process.`,
            userId: applicant.data.userId,
            relatedId: onboarding.data.id,
            relatedType: "Onboarding",
            actionUrl: `/onboarding/${onboarding.data.id}`,
            priority: "high",
            read: false,
          });
        }

        // Send Slack notification for completion
        try {
          await SlackService.sendMessage({
            channel: '#hr-onboarding',
            text: `🎉 ${applicant.data?.fullName} has completed onboarding!`,
            blocks: [
              {
                type: 'header',
                text: {
                  type: 'plain_text',
                  text: '🎉 Onboarding Complete!',
                },
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*${applicant.data?.fullName}* has successfully completed the *${onboarding.data.workflowName}* onboarding process!`,
                },
              },
              {
                type: 'section',
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Started:*\n${new Date(onboarding.data.startDate).toLocaleDateString()}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Completed:*\n${new Date().toLocaleDateString()}`,
                  },
                ],
              },
            ],
          });
        } catch (error) {
          console.warn("Failed to send Slack completion notification:", error);
        }
      } else {
        // Send task completion notification
        try {
          await SlackService.sendTaskCompletionNotification(
            task.data.title,
            completedBy || "System",
            completionPercentage
          );
        } catch (error) {
          console.warn("Failed to send Slack task notification:", error);
        }
      }

      console.log(`✅ Task completed: ${task.data.title} (${completionPercentage}% overall)`);

      return {
        success: true,
        nextTaskId,
      };
    } catch (error) {
      console.error("Error completing task:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to complete task",
      };
    }
  }

  /**
   * Get onboarding progress for an applicant
   */
  static async getOnboardingProgress(applicantId: string): Promise<OnboardingProgress | null> {
    try {
      const onboarding = await client.models.Onboarding.list({
        filter: {
          applicantId: { eq: applicantId },
        },
      });

      const activeOnboarding = onboarding.data?.[0];
      if (!activeOnboarding) {
        return null;
      }

      const tasks = await client.models.OnboardingTask.list({
        filter: {
          onboardingId: { eq: activeOnboarding.id },
        },
      });

      const allTasks = tasks.data || [];
      const completedTasks = allTasks.filter(t => t.status === "completed");
      const currentTasks = allTasks.filter(t => t.status === "active");

      return {
        applicantId,
        workflowId: activeOnboarding.workflowId,
        status: activeOnboarding.status as any,
        startDate: activeOnboarding.startDate,
        expectedCompletionDate: activeOnboarding.expectedCompletionDate || undefined,
        completedTasks: completedTasks.map(t => t.id),
        currentTasks: currentTasks.map(t => t.id),
        completionPercentage: activeOnboarding.completionPercentage || 0,
      };
    } catch (error) {
      console.error("Error getting onboarding progress:", error);
      return null;
    }
  }

  /**
   * Get available workflows
   */
  static getAvailableWorkflows(): OnboardingWorkflow[] {
    return this.defaultWorkflows.filter(w => w.isActive);
  }

  /**
   * Select appropriate workflow based on applicant details
   */
  private static selectWorkflowForApplicant(applicant: Applicant): OnboardingWorkflow | undefined {
    const position = applicant.position?.toLowerCase() || "";
    
    if (position.includes("ceo") || position.includes("cto") || position.includes("vp") || position.includes("director")) {
      return this.defaultWorkflows.find(w => w.id === "executive-onboarding");
    }
    
    if (position.includes("contractor") || position.includes("freelance") || position.includes("consultant")) {
      return this.defaultWorkflows.find(w => w.id === "contractor-onboarding");
    }
    
    return this.defaultWorkflows.find(w => w.id === "standard-employee");
  }

  /**
   * Calculate expected completion date based on workflow
   */
  private static calculateExpectedCompletion(workflow: OnboardingWorkflow): string {
    const maxDays = Math.max(...workflow.tasks.map(t => t.daysFromStart));
    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + maxDays + 5); // Add 5 day buffer
    return completionDate.toISOString();
  }

  /**
   * Send reminder for overdue tasks
   */
  static async sendTaskReminders(): Promise<{
    success: boolean;
    remindersSent: number;
    error?: string;
  }> {
    try {
      const today = new Date();
      const overdueTasks = await client.models.OnboardingTask.list({
        filter: {
          status: { eq: "active" },
          dueDate: { lt: today.toISOString() },
        },
      });

      let remindersSent = 0;

      for (const task of overdueTasks.data || []) {
        // Get onboarding and applicant info
        const onboarding = await client.models.Onboarding.get({ 
          id: task.onboardingId 
        });
        
        if (!onboarding.data) continue;

        const applicant = await client.models.Applicant.get({ 
          id: onboarding.data.applicantId 
        });

        if (!applicant.data?.email) continue;

        // Send reminder email
        const emailResult = await EmailService.sendEmail({
          to: applicant.data.email,
          subject: `Reminder: ${task.title} - Overdue`,
          template: "task_reminder",
          data: {
            applicantName: applicant.data.fullName,
            taskTitle: task.title,
            taskDescription: task.description,
            dueDate: new Date(task.dueDate).toLocaleDateString(),
            onboardingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding/${onboarding.data.id}`,
          },
        });

        if (emailResult.success) {
          remindersSent++;
          
          // Create notification
          if (applicant.data.userId) {
            await client.models.Notification.create({
              type: "task_assigned",
              title: "Task Overdue",
              message: `Task "${task.title}" is overdue. Please complete it as soon as possible.`,
              userId: applicant.data.userId,
              relatedId: task.id,
              relatedType: "OnboardingTask",
              actionUrl: `/onboarding/${onboarding.data.id}?task=${task.id}`,
              priority: "high",
              read: false,
            });
          }
        }
      }

      console.log(`📧 Sent ${remindersSent} task reminders`);

      return {
        success: true,
        remindersSent,
      };
    } catch (error) {
      console.error("Error sending task reminders:", error);
      return {
        success: false,
        remindersSent: 0,
        error: error instanceof Error ? error.message : "Failed to send reminders",
      };
    }
  }
}