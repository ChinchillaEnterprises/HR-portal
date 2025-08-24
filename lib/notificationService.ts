import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

export type NotificationType = Schema["Notification"]["type"]["type"];
export type NotificationPriority = Schema["Notification"]["type"]["priority"];
export type Notification = Schema["Notification"]["type"];

export interface CreateNotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  relatedId?: string;
  relatedType?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export class NotificationService {
  // Create a new notification
  static async create(options: CreateNotificationOptions): Promise<Notification | null> {
    try {
      const notification = await client.models.Notification.create({
        ...options,
        priority: options.priority || "medium",
        read: false,
      });
      
      return notification.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Get all notifications for a user
  static async getForUser(userId: string, unreadOnly = false): Promise<Notification[]> {
    try {
      const filter: any = { userId: { eq: userId } };
      if (unreadOnly) {
        filter.read = { eq: false };
      }

      const response = await client.models.Notification.list({
        filter,
        limit: 100,
      });

      return response.data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await client.models.Notification.update({
        id: notificationId,
        read: true,
        readAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read for a user
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const unreadNotifications = await this.getForUser(userId, true);
      
      await Promise.all(
        unreadNotifications.map(notification =>
          client.models.Notification.update({
            id: notification.id,
            read: true,
            readAt: new Date().toISOString(),
          })
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete a notification
  static async delete(notificationId: string): Promise<boolean> {
    try {
      await client.models.Notification.delete({ id: notificationId });
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Subscribe to new notifications (GraphQL subscription)
  static subscribeToNewNotifications(userId: string, callback: (notification: Notification) => void) {
    const subscription = client.models.Notification.onCreate({
      filter: { userId: { eq: userId } }
    }).subscribe({
      next: ({ data }) => {
        if (data) {
          callback(data);
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
      }
    });

    return subscription;
  }

  // Convenience methods for creating specific notification types
  static async notifyNewApplicant(data: {
    userId: string;
    applicantName: string;
    position: string;
    applicantId: string;
  }) {
    return this.create({
      type: "new_applicant",
      title: "New Applicant",
      message: `${data.applicantName} has applied for ${data.position}`,
      userId: data.userId,
      relatedId: data.applicantId,
      relatedType: "Applicant",
      actionUrl: `/applicants?id=${data.applicantId}`,
      priority: "high",
    });
  }

  static async notifyDocumentShared(data: {
    userId: string;
    documentName: string;
    sharedBy: string;
    documentId: string;
  }) {
    return this.create({
      type: "document_shared",
      title: "Document Shared",
      message: `${data.sharedBy} shared "${data.documentName}" with you`,
      userId: data.userId,
      relatedId: data.documentId,
      relatedType: "Document",
      actionUrl: `/documents?id=${data.documentId}`,
      priority: "medium",
    });
  }

  static async notifyTaskAssigned(data: {
    userId: string;
    taskName: string;
    dueDate?: string;
    taskId: string;
  }) {
    const dueDateText = data.dueDate ? ` (Due: ${new Date(data.dueDate).toLocaleDateString()})` : '';
    return this.create({
      type: "task_assigned",
      title: "New Task Assigned",
      message: `You have been assigned: ${data.taskName}${dueDateText}`,
      userId: data.userId,
      relatedId: data.taskId,
      relatedType: "Task",
      actionUrl: `/onboarding?task=${data.taskId}`,
      priority: "high",
    });
  }

  static async notifySignatureRequired(data: {
    userId: string;
    documentName: string;
    documentId: string;
    deadline?: string;
  }) {
    const deadlineText = data.deadline ? ` by ${new Date(data.deadline).toLocaleDateString()}` : '';
    return this.create({
      type: "signature_required",
      title: "Signature Required",
      message: `Please sign "${data.documentName}"${deadlineText}`,
      userId: data.userId,
      relatedId: data.documentId,
      relatedType: "Document",
      actionUrl: `/documents?id=${data.documentId}&sign=true`,
      priority: "high",
    });
  }

  static async notifyOnboardingUpdate(data: {
    userId: string;
    employeeName: string;
    status: string;
    employeeId: string;
  }) {
    return this.create({
      type: "onboarding_update",
      title: "Onboarding Update",
      message: `${data.employeeName}'s onboarding status: ${data.status}`,
      userId: data.userId,
      relatedId: data.employeeId,
      relatedType: "User",
      actionUrl: `/onboarding?user=${data.employeeId}`,
      priority: "medium",
    });
  }

  static async notifySystem(data: {
    userId: string;
    title: string;
    message: string;
    priority?: NotificationPriority;
  }) {
    return this.create({
      type: "system",
      title: data.title,
      message: data.message,
      userId: data.userId,
      priority: data.priority || "low",
    });
  }
}