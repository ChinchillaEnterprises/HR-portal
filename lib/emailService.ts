import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { post } from "aws-amplify/api";
import { AuditService, AuditAction } from "@/lib/auditService";

const client = generateClient<Schema>();

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: 'welcome' | 'offer_letter' | 'task_reminder' | 'document_shared' | 'invitation' | 'invitation_reminder' | 'custom';
  variables?: Record<string, any>;
  htmlContent?: string;
  textContent?: string;
}

export class EmailService {
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Check if we're in production mode (SES configured)
      const isProduction = process.env.NEXT_PUBLIC_USE_AWS_SES === 'true';
      
      // First, create a communication record
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      let messageId: string | undefined;
      let status: 'sent' | 'scheduled' | 'simulated' = 'simulated';
      
      if (isProduction) {
        // Production mode - use Lambda function to send via SES
        try {
          const restOperation = post({
            apiName: 'emailAPI',
            path: '/send',
            options: {
              body: {
                to: options.to,
                subject: options.subject,
                template: options.template,
                variables: options.variables,
                htmlContent: options.htmlContent,
                textContent: options.textContent,
              }
            }
          });

          const { body } = await restOperation.response;
          const result = await body.json() as any;

          if (result.success) {
            messageId = result.messageId;
            status = 'sent';
            console.log(`✅ Email sent successfully: ${messageId}`);
          } else {
            throw new Error(result.error || 'Failed to send email');
          }
        } catch (error) {
          console.error('Failed to send email via Lambda:', error);
          throw error;
        }
      } else {
        // Development mode - simulate sending
        messageId = `simulated-${Date.now()}`;
        status = 'simulated';
        
        console.log('📧 Email Simulation:', {
          to: recipients,
          subject: options.subject,
          template: options.template,
          preview: options.textContent?.substring(0, 100) + '...',
        });
      }

      // Log to audit
      await AuditService.logSuccess({
        userId: 'system',
        userEmail: 'system@chinchilla.ai',
        action: AuditAction.EMAIL_SEND,
        resourceType: 'email',
        resourceName: options.subject,
        details: {
          recipients,
          template: options.template,
          mode: isProduction ? 'production' : 'development',
          messageId,
        },
      });
      
      // Record the communication
      for (const recipient of recipients) {
        await client.models.Communication.create({
          type: "email",
          subject: options.subject,
          content: options.htmlContent || options.textContent || '',
          recipientEmail: recipient,
          recipientId: recipient,
          senderId: "system",
          status,
          scheduledDate: new Date().toISOString(),
          sentDate: status === 'sent' ? new Date().toISOString() : undefined,
          metadata: JSON.stringify({
            messageId,
            template: options.template,
            environment: isProduction ? 'production' : 'development',
          }),
        });
      }
      
      return {
        success: true,
        messageId,
      };
    } catch (error) {
      console.error('Error sending email:', error);
      
      // Log to audit
      const recipients = Array.isArray(options.to) ? options.to : [options.to];
      await AuditService.logFailure({
        userId: 'system',
        userEmail: 'system@chinchilla.ai',
        action: AuditAction.EMAIL_SEND,
        resourceType: 'email',
        resourceName: options.subject,
        details: {
          recipients,
          template: options.template,
        },
      }, error instanceof Error ? error.message : 'Unknown error');
      
      // Log failed attempt
      try {
        for (const recipient of recipients) {
          await client.models.Communication.create({
            type: "email",
            subject: options.subject,
            content: options.htmlContent || options.textContent || '',
            recipientEmail: recipient,
            recipientId: recipient,
            senderId: "system",
            status: "failed",
            scheduledDate: new Date().toISOString(),
            metadata: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              template: options.template,
            }),
          });
        }
      } catch (logError) {
        console.error('Failed to log email error:', logError);
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Convenience methods for common email types
  static async sendWelcomeEmail(user: { email: string; firstName: string; lastName: string }) {
    return this.sendEmail({
      to: user.email,
      subject: `Welcome to Chinchilla Flow, ${user.firstName}!`,
      template: 'welcome',
      variables: {
        firstName: user.firstName,
        lastName: user.lastName,
        loginUrl: `${window.location.origin}/login`,
      },
    });
  }

  static async sendOfferLetter(data: {
    email: string;
    firstName: string;
    position: string;
    documentUrl: string;
    recruiterEmail: string;
    deadline?: string;
  }) {
    return this.sendEmail({
      to: data.email,
      subject: 'Your Offer Letter from Chinchilla Flow',
      template: 'offer_letter',
      variables: data,
    });
  }

  static async sendTaskReminder(data: {
    email: string;
    firstName: string;
    taskName: string;
    dueDate: string;
    description: string;
    taskUrl: string;
  }) {
    return this.sendEmail({
      to: data.email,
      subject: `Reminder: ${data.taskName} needs your attention`,
      template: 'task_reminder',
      variables: data,
    });
  }

  static async sendDocumentShared(data: {
    email: string;
    firstName: string;
    sharedBy: string;
    documentName: string;
    documentType: string;
    documentUrl: string;
    message?: string;
  }) {
    return this.sendEmail({
      to: data.email,
      subject: `${data.sharedBy} shared a document with you`,
      template: 'document_shared',
      variables: data,
    });
  }

  // Generate simple HTML email templates
  static generateEmailTemplate(template: string, variables: Record<string, any>): { html: string; text: string } {
    switch (template) {
      case 'invitation':
        return {
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 28px;">You're Invited!</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Join the Chinchilla HR Portal</p>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 8px 8px;">
                  <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                    Hi ${variables.firstName || 'there'},
                  </p>
                  
                  <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                    You've been invited to join our HR portal as a <strong>${variables.role || 'team member'}</strong>. 
                    ${variables.note ? `<br><br><em>"${variables.note}"</em>` : ''}
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${variables.invitationUrl || '#'}" 
                       style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      Accept Invitation
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #777; line-height: 1.6;">
                    This invitation will expire on <strong>${variables.expiresAt || 'the expiration date'}</strong>.
                    <br>If you have any questions, please contact ${variables.invitedBy || 'your administrator'}.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
                  
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    This invitation was sent by Chinchilla HR Portal<br>
                    If you believe this was sent in error, please ignore this email.
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
Hi ${variables.firstName || 'there'},

You've been invited to join our HR portal as a ${variables.role || 'team member'}.

${variables.note ? `"${variables.note}"` : ''}

To accept your invitation, click here: ${variables.invitationUrl || '#'}

This invitation will expire on ${variables.expiresAt || 'the expiration date'}.
If you have any questions, please contact ${variables.invitedBy || 'your administrator'}.

---
This invitation was sent by Chinchilla HR Portal
If you believe this was sent in error, please ignore this email.
          `
        };

      case 'invitation_reminder':
        return {
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                  <h1 style="margin: 0; font-size: 28px;">Reminder: Your Invitation</h1>
                  <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Don't miss out - join today!</p>
                </div>
                
                <div style="background: white; padding: 30px; border: 1px solid #e1e5e9; border-radius: 0 0 8px 8px;">
                  <p style="font-size: 18px; color: #333; margin-bottom: 20px;">
                    Hi ${variables.firstName || 'there'},
                  </p>
                  
                  <p style="font-size: 16px; color: #555; line-height: 1.6; margin-bottom: 20px;">
                    This is a friendly reminder that you have a pending invitation to join our HR portal as a <strong>${variables.role || 'team member'}</strong>.
                  </p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${variables.invitationUrl || '#'}" 
                       style="background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                      Accept Invitation Now
                    </a>
                  </div>
                  
                  <p style="font-size: 14px; color: #777; line-height: 1.6;">
                    <strong>⏰ This invitation expires on ${variables.expiresAt || 'the expiration date'}</strong><br>
                    After this date, you'll need to request a new invitation.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid #e1e5e9; margin: 30px 0;">
                  
                  <p style="font-size: 12px; color: #999; text-align: center;">
                    Reminder sent by ${variables.resentBy || 'your administrator'}<br>
                    Chinchilla HR Portal
                  </p>
                </div>
              </body>
            </html>
          `,
          text: `
Hi ${variables.firstName || 'there'},

This is a friendly reminder that you have a pending invitation to join our HR portal as a ${variables.role || 'team member'}.

To accept your invitation, click here: ${variables.invitationUrl || '#'}

⏰ This invitation expires on ${variables.expiresAt || 'the expiration date'}
After this date, you'll need to request a new invitation.

---
Reminder sent by ${variables.resentBy || 'your administrator'}
Chinchilla HR Portal
          `
        };

      default:
        return {
          html: `<p>Default email content</p>`,
          text: `Default email content`
        };
    }
  }
}

// Add a default export for compatibility
export const emailService = EmailService;