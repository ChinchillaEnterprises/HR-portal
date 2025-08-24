"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface GmailConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  accessToken?: string;
  refreshToken?: string;
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: Date;
  labels: string[];
  attachments?: Array<{
    filename: string;
    mimeType: string;
    size: number;
  }>;
}

export class GmailService {
  private static config: GmailConfig | null = null;
  private static gapi: any = null;

  /**
   * Initialize Gmail API
   */
  static async initialize(config: GmailConfig) {
    this.config = config;

    // Load Google API client library
    return new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        (window as any).gapi.load('client:auth2', async () => {
          try {
            await (window as any).gapi.client.init({
              clientId: config.clientId,
              scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
              discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest'],
            });
            this.gapi = (window as any).gapi;
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      };
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  /**
   * Sign in with Google
   */
  static async signIn(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    try {
      if (!this.gapi) {
        throw new Error('Gmail API not initialized');
      }

      const auth = this.gapi.auth2.getAuthInstance();
      const user = await auth.signIn();
      const profile = user.getBasicProfile();

      return {
        success: true,
        user: {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl(),
        },
      };
    } catch (error) {
      console.error('Gmail sign in error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Sign in failed',
      };
    }
  }

  /**
   * Sign out from Google
   */
  static async signOut(): Promise<void> {
    if (this.gapi) {
      const auth = this.gapi.auth2.getAuthInstance();
      await auth.signOut();
    }
  }

  /**
   * Check if user is signed in
   */
  static isSignedIn(): boolean {
    if (!this.gapi) return false;
    const auth = this.gapi.auth2.getAuthInstance();
    return auth.isSignedIn.get();
  }

  /**
   * List messages from inbox
   */
  static async listMessages(
    query: string = '',
    maxResults: number = 20
  ): Promise<{
    success: boolean;
    messages?: EmailMessage[];
    nextPageToken?: string;
    error?: string;
  }> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in');
      }

      // List message IDs
      const response = await this.gapi.client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      if (!response.result.messages) {
        return {
          success: true,
          messages: [],
        };
      }

      // Fetch full message details
      const messages: EmailMessage[] = [];
      for (const msg of response.result.messages) {
        const fullMessage = await this.getMessage(msg.id);
        if (fullMessage) {
          messages.push(fullMessage);
        }
      }

      return {
        success: true,
        messages,
        nextPageToken: response.result.nextPageToken,
      };
    } catch (error) {
      console.error('Error listing Gmail messages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list messages',
      };
    }
  }

  /**
   * Get a single message
   */
  static async getMessage(messageId: string): Promise<EmailMessage | null> {
    try {
      const response = await this.gapi.client.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
      });

      const msg: GmailMessage = response.result;
      const headers = msg.payload.headers;

      const getHeader = (name: string): string => {
        const header = headers.find(h => h.name === name);
        return header?.value || '';
      };

      // Extract body
      let body = '';
      if (msg.payload.body?.data) {
        body = this.decodeBase64(msg.payload.body.data);
      } else if (msg.payload.parts) {
        const textPart = msg.payload.parts.find(
          part => part.mimeType === 'text/plain' || part.mimeType === 'text/html'
        );
        if (textPart?.body?.data) {
          body = this.decodeBase64(textPart.body.data);
        }
      }

      // Extract attachments
      const attachments = msg.payload.parts
        ?.filter(part => part.mimeType !== 'text/plain' && part.mimeType !== 'text/html')
        .map(part => ({
          filename: part.filename || 'attachment',
          mimeType: part.mimeType,
          size: part.body?.size || 0,
        }));

      return {
        id: msg.id,
        threadId: msg.threadId,
        from: getHeader('From'),
        to: getHeader('To'),
        subject: getHeader('Subject'),
        body,
        date: new Date(parseInt(msg.internalDate)),
        labels: msg.labelIds || [],
        attachments,
      };
    } catch (error) {
      console.error('Error getting message:', error);
      return null;
    }
  }

  /**
   * Send an email
   */
  static async sendEmail(
    to: string,
    subject: string,
    body: string,
    cc?: string,
    bcc?: string
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in');
      }

      // Create email in RFC 2822 format
      const email = [
        `To: ${to}`,
        cc ? `Cc: ${cc}` : '',
        bcc ? `Bcc: ${bcc}` : '',
        `Subject: ${subject}`,
        '',
        body,
      ]
        .filter(Boolean)
        .join('\r\n');

      // Encode email
      const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: encodedEmail,
        },
      });

      // Store sent email in our database
      await client.models.Communication.create({
        type: 'email',
        recipientEmail: to,
        subject,
        content: body,
        sentDate: new Date().toISOString(),
        status: 'sent',
        metadata: JSON.stringify({
          messageId: response.result.id,
          threadId: response.result.threadId,
          cc,
          bcc,
          sentVia: 'gmail',
        }),
      });

      console.log(`✅ Email sent via Gmail: ${response.result.id}`);

      return {
        success: true,
        messageId: response.result.id,
      };
    } catch (error) {
      console.error('Error sending Gmail:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  /**
   * Search emails
   */
  static async searchEmails(
    query: string,
    maxResults: number = 50
  ): Promise<{
    success: boolean;
    messages?: EmailMessage[];
    error?: string;
  }> {
    return this.listMessages(query, maxResults);
  }

  /**
   * Get emails related to an applicant
   */
  static async getApplicantEmails(
    applicantEmail: string
  ): Promise<{
    success: boolean;
    messages?: EmailMessage[];
    error?: string;
  }> {
    const query = `from:${applicantEmail} OR to:${applicantEmail}`;
    return this.searchEmails(query);
  }

  /**
   * Mark email as read
   */
  static async markAsRead(messageId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          removeLabelIds: ['UNREAD'],
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark as read',
      };
    }
  }

  /**
   * Add label to email
   */
  static async addLabel(
    messageId: string,
    labelName: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // First, get or create the label
      const labels = await this.gapi.client.gmail.users.labels.list({
        userId: 'me',
      });

      let labelId = labels.result.labels.find(
        (l: any) => l.name === labelName
      )?.id;

      if (!labelId) {
        // Create label if it doesn't exist
        const newLabel = await this.gapi.client.gmail.users.labels.create({
          userId: 'me',
          resource: {
            name: labelName,
            labelListVisibility: 'labelShow',
            messageListVisibility: 'show',
          },
        });
        labelId = newLabel.result.id;
      }

      // Add label to message
      await this.gapi.client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        resource: {
          addLabelIds: [labelId],
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error adding label:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add label',
      };
    }
  }

  /**
   * Create draft email
   */
  static async createDraft(
    to: string,
    subject: string,
    body: string
  ): Promise<{
    success: boolean;
    draftId?: string;
    error?: string;
  }> {
    try {
      if (!this.isSignedIn()) {
        throw new Error('User not signed in');
      }

      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        '',
        body,
      ].join('\r\n');

      const encodedEmail = btoa(email)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await this.gapi.client.gmail.users.drafts.create({
        userId: 'me',
        resource: {
          message: {
            raw: encodedEmail,
          },
        },
      });

      return {
        success: true,
        draftId: response.result.id,
      };
    } catch (error) {
      console.error('Error creating draft:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create draft',
      };
    }
  }

  /**
   * Auto-label HR-related emails
   */
  static async autoLabelHREmails(): Promise<{
    success: boolean;
    labeled: number;
    error?: string;
  }> {
    try {
      let labeled = 0;

      // Define HR-related queries and their labels
      const labelRules = [
        { query: 'subject:"interview" OR subject:"Interview"', label: 'HR/Interviews' },
        { query: 'subject:"application" OR subject:"Application"', label: 'HR/Applications' },
        { query: 'subject:"offer" OR subject:"Offer"', label: 'HR/Offers' },
        { query: 'subject:"onboarding" OR subject:"Onboarding"', label: 'HR/Onboarding' },
        { query: 'subject:"document" OR subject:"signature"', label: 'HR/Documents' },
      ];

      for (const rule of labelRules) {
        const result = await this.searchEmails(rule.query, 100);
        if (result.success && result.messages) {
          for (const message of result.messages) {
            const labelResult = await this.addLabel(message.id, rule.label);
            if (labelResult.success) {
              labeled++;
            }
          }
        }
      }

      return {
        success: true,
        labeled,
      };
    } catch (error) {
      console.error('Error auto-labeling emails:', error);
      return {
        success: false,
        labeled: 0,
        error: error instanceof Error ? error.message : 'Failed to auto-label',
      };
    }
  }

  /**
   * Decode base64 email content
   */
  private static decodeBase64(data: string): string {
    const decoded = atob(data.replace(/-/g, '+').replace(/_/g, '/'));
    return decodeURIComponent(escape(decoded));
  }

  /**
   * Generate email templates
   */
  static getEmailTemplate(
    type: 'interview_invite' | 'offer_letter' | 'welcome' | 'rejection',
    data: Record<string, any>
  ): { subject: string; body: string } {
    const templates = {
      interview_invite: {
        subject: `Interview Invitation - ${data.position} at Chinchilla AI`,
        body: `Dear ${data.name},

Thank you for your interest in the ${data.position} position at Chinchilla AI.

We are pleased to invite you for an interview on ${data.date} at ${data.time}.

Interview Details:
- Type: ${data.interviewType}
- Location: ${data.location}
- Duration: ${data.duration}
- Interviewer(s): ${data.interviewers}

Please confirm your availability by replying to this email.

Best regards,
${data.senderName}
Chinchilla AI HR Team`,
      },
      offer_letter: {
        subject: `Job Offer - ${data.position} at Chinchilla AI`,
        body: `Dear ${data.name},

We are delighted to offer you the position of ${data.position} at Chinchilla AI.

Please find the offer details attached. We would appreciate your response by ${data.deadline}.

Welcome to the team!

Best regards,
${data.senderName}
Chinchilla AI HR Team`,
      },
      welcome: {
        subject: 'Welcome to Chinchilla AI! 🎉',
        body: `Dear ${data.name},

Welcome to Chinchilla AI! We're thrilled to have you join our team.

Your onboarding process will begin on ${data.startDate}. You'll receive additional information about your first day soon.

If you have any questions, please don't hesitate to reach out.

Best regards,
${data.senderName}
Chinchilla AI HR Team`,
      },
      rejection: {
        subject: `Application Update - ${data.position}`,
        body: `Dear ${data.name},

Thank you for your interest in the ${data.position} position at Chinchilla AI and for taking the time to interview with us.

After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate your interest in Chinchilla AI and wish you the best in your job search.

Best regards,
${data.senderName}
Chinchilla AI HR Team`,
      },
    };

    return templates[type] || { subject: '', body: '' };
  }
}