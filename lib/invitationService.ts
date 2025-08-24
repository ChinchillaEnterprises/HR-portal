"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { emailService } from "./emailService";
import { AuditService, AuditAction } from "./auditService";

const client = generateClient<Schema>();

export interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "mentor" | "team_lead" | "intern" | "staff";
  department?: string;
  position?: string;
  note?: string;
}

export interface InvitationValidation {
  isValid: boolean;
  invitation?: any;
  error?: string;
}

export class InvitationService {
  
  /**
   * Generate a secure invitation token
   */
  static generateToken(): string {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create and send an invitation
   */
  static async createInvitation(
    invitationData: InvitationData,
    invitedBy: string
  ): Promise<{ success: boolean; invitation?: any; error?: string }> {
    try {
      // Check if invitation already exists for this email
      const existingInvitations = await client.models.UserInvitation.list({
        filter: {
          email: { eq: invitationData.email },
          status: { eq: "pending" }
        }
      });

      if (existingInvitations.data && existingInvitations.data.length > 0) {
        return {
          success: false,
          error: "An active invitation already exists for this email address"
        };
      }

      // Generate invitation token and expiration date (7 days from now)
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation record
      const invitation = await client.models.UserInvitation.create({
        email: invitationData.email,
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        role: invitationData.role,
        department: invitationData.department,
        position: invitationData.position,
        invitationToken: token,
        invitedBy,
        invitedAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        status: "pending",
        note: invitationData.note,
      });

      if (!invitation.data) {
        throw new Error("Failed to create invitation");
      }

      // Send invitation email
      const invitationUrl = `${window.location.origin}/signup?token=${token}`;
      const emailTemplate = emailService.generateEmailTemplate("invitation", {
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        role: invitationData.role,
        invitationUrl,
        expiresAt: expiresAt.toLocaleDateString(),
        invitedBy,
        note: invitationData.note || ""
      });
      
      await emailService.sendEmail({
        to: invitationData.email,
        subject: "You're invited to join Chinchilla HR Portal",
        template: "invitation",
        variables: {
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          role: invitationData.role,
          invitationUrl,
          expiresAt: expiresAt.toLocaleDateString(),
          invitedBy,
          note: invitationData.note || ""
        },
        htmlContent: emailTemplate.html,
        textContent: emailTemplate.text
      });

      // Log audit event
      await AuditService.logSuccess({
        userId: invitedBy,
        userEmail: invitedBy,
        action: AuditAction.USER_INVITE,
        resourceType: 'invitation',
        resourceId: invitation.data.id,
        resourceName: `${invitationData.firstName} ${invitationData.lastName}`,
        metadata: {
          email: invitationData.email,
          role: invitationData.role,
          department: invitationData.department,
          position: invitationData.position
        }
      });

      return {
        success: true,
        invitation: invitation.data
      };

    } catch (error) {
      console.error("Failed to create invitation:", error);
      
      // Log audit failure
      await AuditService.logFailure({
        userId: invitedBy,
        userEmail: invitedBy,
        action: AuditAction.USER_INVITE,
        resourceType: 'invitation',
        resourceName: `${invitationData.firstName} ${invitationData.lastName}`,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: { email: invitationData.email }
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create invitation"
      };
    }
  }

  /**
   * Validate an invitation token
   */
  static async validateToken(token: string): Promise<InvitationValidation> {
    try {
      if (!token) {
        return { isValid: false, error: "Invitation token is required" };
      }

      // Find invitation by token
      const invitations = await client.models.UserInvitation.list({
        filter: {
          invitationToken: { eq: token }
        }
      });

      const invitation = invitations.data?.[0];

      if (!invitation) {
        return { isValid: false, error: "Invalid invitation token" };
      }

      // Check if invitation is still pending
      if (invitation.status !== "pending") {
        return { 
          isValid: false, 
          error: invitation.status === "accepted" 
            ? "This invitation has already been used" 
            : "This invitation is no longer valid" 
        };
      }

      // Check if invitation has expired
      const now = new Date();
      const expiresAt = new Date(invitation.expiresAt);

      if (now > expiresAt) {
        // Mark as expired
        await client.models.UserInvitation.update({
          id: invitation.id,
          status: "expired"
        });

        return { isValid: false, error: "This invitation has expired" };
      }

      return { isValid: true, invitation };

    } catch (error) {
      console.error("Failed to validate invitation token:", error);
      return { 
        isValid: false, 
        error: "Failed to validate invitation token" 
      };
    }
  }

  /**
   * Accept an invitation (mark as used)
   */
  static async acceptInvitation(
    token: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const validation = await this.validateToken(token);
      
      if (!validation.isValid || !validation.invitation) {
        return { success: false, error: validation.error };
      }

      // Mark invitation as accepted
      await client.models.UserInvitation.update({
        id: validation.invitation.id,
        status: "accepted",
        acceptedAt: new Date().toISOString()
      });

      // Create user record in User table
      await client.models.User.create({
        email: validation.invitation.email,
        firstName: validation.invitation.firstName,
        lastName: validation.invitation.lastName,
        role: validation.invitation.role,
        department: validation.invitation.department,
        position: validation.invitation.position,
        status: "active",
        startDate: new Date().toISOString(),
      });

      // Log audit event
      await AuditService.logSuccess({
        userId,
        userEmail: validation.invitation.email,
        action: AuditAction.USER_CREATE,
        resourceType: 'user',
        resourceName: `${validation.invitation.firstName} ${validation.invitation.lastName}`,
        metadata: {
          invitationId: validation.invitation.id,
          role: validation.invitation.role,
          invitedBy: validation.invitation.invitedBy
        }
      });

      return { success: true };

    } catch (error) {
      console.error("Failed to accept invitation:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to accept invitation" 
      };
    }
  }

  /**
   * Cancel an invitation
   */
  static async cancelInvitation(
    invitationId: string, 
    cancelledBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await client.models.UserInvitation.get({ id: invitationId });
      
      if (!invitation.data) {
        return { success: false, error: "Invitation not found" };
      }

      if (invitation.data.status !== "pending") {
        return { success: false, error: "Can only cancel pending invitations" };
      }

      // Mark as cancelled
      await client.models.UserInvitation.update({
        id: invitationId,
        status: "cancelled"
      });

      // Log audit event
      await AuditService.logSuccess({
        userId: cancelledBy,
        userEmail: cancelledBy,
        action: AuditAction.USER_DELETE,
        resourceType: 'invitation',
        resourceId: invitationId,
        resourceName: `${invitation.data.firstName} ${invitation.data.lastName}`,
        metadata: {
          email: invitation.data.email,
          originalInvitedBy: invitation.data.invitedBy
        }
      });

      return { success: true };

    } catch (error) {
      console.error("Failed to cancel invitation:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to cancel invitation" 
      };
    }
  }

  /**
   * Resend an invitation
   */
  static async resendInvitation(
    invitationId: string,
    resentBy: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const invitation = await client.models.UserInvitation.get({ id: invitationId });
      
      if (!invitation.data) {
        return { success: false, error: "Invitation not found" };
      }

      if (invitation.data.status !== "pending") {
        return { success: false, error: "Can only resend pending invitations" };
      }

      // Generate new token and extend expiration
      const newToken = this.generateToken();
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 7);

      // Update invitation with new token
      await client.models.UserInvitation.update({
        id: invitationId,
        invitationToken: newToken,
        expiresAt: newExpiresAt.toISOString(),
        reminderSentAt: new Date().toISOString()
      });

      // Send new invitation email
      const invitationUrl = `${window.location.origin}/signup?token=${newToken}`;
      const emailTemplate = emailService.generateEmailTemplate("invitation_reminder", {
        firstName: invitation.data.firstName,
        lastName: invitation.data.lastName,
        role: invitation.data.role,
        invitationUrl,
        expiresAt: newExpiresAt.toLocaleDateString(),
        resentBy,
        note: invitation.data.note || ""
      });
      
      await emailService.sendEmail({
        to: invitation.data.email,
        subject: "Reminder: You're invited to join Chinchilla HR Portal",
        template: "invitation_reminder",
        variables: {
          firstName: invitation.data.firstName,
          lastName: invitation.data.lastName,
          role: invitation.data.role,
          invitationUrl,
          expiresAt: newExpiresAt.toLocaleDateString(),
          resentBy,
          note: invitation.data.note || ""
        },
        htmlContent: emailTemplate.html,
        textContent: emailTemplate.text
      });

      // Log audit event
      await AuditService.logSuccess({
        userId: resentBy,
        userEmail: resentBy,
        action: AuditAction.EMAIL_SEND,
        resourceType: 'invitation',
        resourceId: invitationId,
        resourceName: `${invitation.data.firstName} ${invitation.data.lastName}`,
        metadata: {
          email: invitation.data.email,
          type: 'invitation_reminder'
        }
      });

      return { success: true };

    } catch (error) {
      console.error("Failed to resend invitation:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to resend invitation" 
      };
    }
  }

  /**
   * Get all pending invitations
   */
  static async getPendingInvitations() {
    try {
      const invitations = await client.models.UserInvitation.list({
        filter: {
          status: { eq: "pending" }
        }
      });

      return invitations.data || [];
    } catch (error) {
      console.error("Failed to get pending invitations:", error);
      return [];
    }
  }

  /**
   * Get all invitations (with pagination)
   */
  static async getAllInvitations(limit: number = 50) {
    try {
      const invitations = await client.models.UserInvitation.list({
        limit,
        // Sort by most recent first
      });

      return invitations.data || [];
    } catch (error) {
      console.error("Failed to get invitations:", error);
      return [];
    }
  }

  /**
   * Clean up expired invitations
   */
  static async cleanupExpiredInvitations(): Promise<number> {
    try {
      const now = new Date().toISOString();
      
      // Get all pending invitations that have expired
      const expiredInvitations = await client.models.UserInvitation.list({
        filter: {
          status: { eq: "pending" },
          expiresAt: { lt: now }
        }
      });

      let cleanedCount = 0;

      // Mark each as expired
      if (expiredInvitations.data) {
        for (const invitation of expiredInvitations.data) {
          await client.models.UserInvitation.update({
            id: invitation.id,
            status: "expired"
          });
          cleanedCount++;
        }
      }

      return cleanedCount;
    } catch (error) {
      console.error("Failed to cleanup expired invitations:", error);
      return 0;
    }
  }
}