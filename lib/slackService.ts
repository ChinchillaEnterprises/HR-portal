"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import axios from 'axios';

const client = generateClient<Schema>();

interface SlackConfig {
  botToken: string;
  signingSecret?: string;
  appId?: string;
  defaultChannel?: string;
}

interface SlackMessage {
  channel: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  email: string;
  is_admin: boolean;
  is_bot: boolean;
  profile: {
    email: string;
    display_name: string;
    status_text: string;
    status_emoji: string;
    image_original?: string;
  };
}

export class SlackService {
  private static config: SlackConfig | null = null;
  private static baseUrl = 'https://slack.com/api';

  /**
   * Initialize Slack configuration
   */
  static initialize(config: SlackConfig) {
    this.config = config;
  }

  /**
   * Test Slack connection
   */
  static async testConnection(): Promise<{
    success: boolean;
    workspace?: string;
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.get(`${this.baseUrl}/auth.test`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      if (response.data.ok) {
        return {
          success: true,
          workspace: response.data.team,
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Slack connection test failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Send a Slack message
   */
  static async sendMessage(message: SlackMessage): Promise<{
    success: boolean;
    ts?: string;
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/chat.postMessage`,
        {
          channel: message.channel || this.config.defaultChannel,
          text: message.text,
          blocks: message.blocks,
          attachments: message.attachments,
          thread_ts: message.thread_ts,
          unfurl_links: message.unfurl_links ?? true,
          unfurl_media: message.unfurl_media ?? true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        console.log(`✅ Slack message sent to ${message.channel}`);
        return {
          success: true,
          ts: response.data.ts,
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error sending Slack message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message',
      };
    }
  }

  /**
   * Send onboarding notification
   */
  static async sendOnboardingNotification(
    applicantName: string,
    onboardingType: string,
    channel?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎉 New Team Member Onboarding',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${applicantName}* has started the *${onboardingType}* onboarding process!`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status:*\n🟢 In Progress`,
          },
          {
            type: 'mrkdwn',
            text: `*Started:*\n${new Date().toLocaleDateString()}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Onboarding',
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/onboarding`,
            style: 'primary',
          },
        ],
      },
    ];

    return this.sendMessage({
      channel: channel || this.config?.defaultChannel || '#general',
      text: `New team member ${applicantName} has started onboarding!`,
      blocks,
    });
  }

  /**
   * Send interview reminder
   */
  static async sendInterviewReminder(
    interviewDetails: {
      applicantName: string;
      position: string;
      interviewers: string[];
      time: string;
      location: string;
      type: 'phone' | 'video' | 'in_person';
    },
    channel?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const typeEmoji = {
      phone: '📞',
      video: '📹',
      in_person: '🏢',
    };

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${typeEmoji[interviewDetails.type]} Interview Reminder`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Interview scheduled with *${interviewDetails.applicantName}* for the *${interviewDetails.position}* position`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Time:*\n${interviewDetails.time}`,
          },
          {
            type: 'mrkdwn',
            text: `*Location:*\n${interviewDetails.location}`,
          },
          {
            type: 'mrkdwn',
            text: `*Type:*\n${interviewDetails.type.replace('_', ' ')}`,
          },
          {
            type: 'mrkdwn',
            text: `*Interviewers:*\n${interviewDetails.interviewers.join(', ')}`,
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '⏰ This is a reminder sent 1 hour before the interview',
          },
        ],
      },
    ];

    return this.sendMessage({
      channel: channel || this.config?.defaultChannel || '#hiring',
      text: `Interview reminder: ${interviewDetails.applicantName} at ${interviewDetails.time}`,
      blocks,
    });
  }

  /**
   * Send document signature request notification
   */
  static async sendSignatureNotification(
    documentName: string,
    recipientName: string,
    recipientEmail: string,
    channel?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📝 Document Signature Requested',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `A signature has been requested for *${documentName}*`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Recipient:*\n${recipientName}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${recipientEmail}`,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Document',
            },
            url: `${process.env.NEXT_PUBLIC_APP_URL}/documents`,
          },
        ],
      },
    ];

    return this.sendMessage({
      channel: channel || this.config?.defaultChannel || '#documents',
      text: `Signature requested for ${documentName}`,
      blocks,
    });
  }

  /**
   * Send task completion notification
   */
  static async sendTaskCompletionNotification(
    taskTitle: string,
    completedBy: string,
    onboardingProgress: number,
    channel?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const progressBar = '█'.repeat(Math.floor(onboardingProgress / 10)) + 
                       '░'.repeat(10 - Math.floor(onboardingProgress / 10));

    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *${completedBy}* completed: _${taskTitle}_`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Overall Progress: \`${progressBar}\` ${onboardingProgress}%`,
        },
      },
    ];

    return this.sendMessage({
      channel: channel || this.config?.defaultChannel || '#onboarding',
      text: `Task completed: ${taskTitle} by ${completedBy}`,
      blocks,
    });
  }

  /**
   * Get Slack users
   */
  static async getUsers(): Promise<{
    success: boolean;
    users?: SlackUser[];
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.get(`${this.baseUrl}/users.list`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
      });

      if (response.data.ok) {
        return {
          success: true,
          users: response.data.members.filter((user: any) => !user.is_bot && !user.deleted),
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error fetching Slack users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch users',
      };
    }
  }

  /**
   * Find Slack user by email
   */
  static async findUserByEmail(email: string): Promise<{
    success: boolean;
    user?: SlackUser;
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.get(`${this.baseUrl}/users.lookupByEmail`, {
        headers: {
          'Authorization': `Bearer ${this.config.botToken}`,
        },
        params: { email },
      });

      if (response.data.ok) {
        return {
          success: true,
          user: response.data.user,
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error finding Slack user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'User not found',
      };
    }
  }

  /**
   * Create a Slack channel
   */
  static async createChannel(
    name: string,
    isPrivate: boolean = false
  ): Promise<{
    success: boolean;
    channelId?: string;
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/conversations.create`,
        {
          name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
          is_private: isPrivate,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        return {
          success: true,
          channelId: response.data.channel.id,
        };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error creating Slack channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create channel',
      };
    }
  }

  /**
   * Invite users to a channel
   */
  static async inviteToChannel(
    channelId: string,
    userIds: string[]
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.config?.botToken) {
        throw new Error('Slack bot token not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/conversations.invite`,
        {
          channel: channelId,
          users: userIds.join(','),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        return { success: true };
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error inviting users to channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to invite users',
      };
    }
  }

  /**
   * Create onboarding channel for new employee
   */
  static async createOnboardingChannel(
    employeeName: string,
    mentorEmails: string[]
  ): Promise<{
    success: boolean;
    channelId?: string;
    error?: string;
  }> {
    try {
      // Create private channel
      const channelName = `onboarding-${employeeName.toLowerCase().replace(/\s+/g, '-')}`;
      const channelResult = await this.createChannel(channelName, true);

      if (!channelResult.success || !channelResult.channelId) {
        return channelResult;
      }

      // Find mentor user IDs
      const mentorIds: string[] = [];
      for (const email of mentorEmails) {
        const userResult = await this.findUserByEmail(email);
        if (userResult.success && userResult.user) {
          mentorIds.push(userResult.user.id);
        }
      }

      // Invite mentors to channel
      if (mentorIds.length > 0) {
        await this.inviteToChannel(channelResult.channelId, mentorIds);
      }

      // Send welcome message
      await this.sendMessage({
        channel: channelResult.channelId,
        text: `Welcome to ${employeeName}'s onboarding channel! 🎉`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `Welcome ${employeeName}! 👋`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'This is your dedicated onboarding channel. Your mentors and HR team are here to help you get started.',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Quick Links:*\n• <' + process.env.NEXT_PUBLIC_APP_URL + '/onboarding|Onboarding Portal>\n• <' + process.env.NEXT_PUBLIC_APP_URL + '/documents|Document Center>\n• <' + process.env.NEXT_PUBLIC_APP_URL + '/team|Team Directory>',
            },
          },
        ],
      });

      return {
        success: true,
        channelId: channelResult.channelId,
      };
    } catch (error) {
      console.error('Error creating onboarding channel:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create onboarding channel',
      };
    }
  }

  /**
   * Send bulk notifications
   */
  static async sendBulkNotifications(
    recipients: Array<{ email: string; message: string }>,
    fallbackChannel?: string
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors?: string[];
  }> {
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of recipients) {
      try {
        // Try to find user by email and send DM
        const userResult = await this.findUserByEmail(recipient.email);
        
        if (userResult.success && userResult.user) {
          // Send direct message
          const result = await this.sendMessage({
            channel: userResult.user.id,
            text: recipient.message,
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push(`Failed to send to ${recipient.email}: ${result.error}`);
          }
        } else {
          // Fallback to channel with mention
          if (fallbackChannel) {
            const result = await this.sendMessage({
              channel: fallbackChannel,
              text: `Message for ${recipient.email}: ${recipient.message}`,
            });

            if (result.success) {
              sent++;
            } else {
              failed++;
              errors.push(`Failed to send to channel for ${recipient.email}`);
            }
          } else {
            failed++;
            errors.push(`User not found: ${recipient.email}`);
          }
        }
      } catch (error) {
        failed++;
        errors.push(`Error processing ${recipient.email}: ${error}`);
      }
    }

    return {
      success: failed === 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}