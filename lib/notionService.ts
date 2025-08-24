"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import axios from 'axios';

const client = generateClient<Schema>();

interface NotionConfig {
  apiKey: string;
  databaseId?: string;
  workspaceId?: string;
}

interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  cover?: string;
  properties: Record<string, NotionProperty>;
}

interface NotionProperty {
  id: string;
  type: string;
  name: string;
  [key: string]: any;
}

interface NotionPage {
  id: string;
  title: string;
  icon?: string;
  cover?: string;
  properties: Record<string, any>;
  content?: NotionBlock[];
  createdTime: string;
  lastEditedTime: string;
  url: string;
}

interface NotionBlock {
  id: string;
  type: string;
  [key: string]: any;
}

interface ApplicantData {
  name: string;
  email: string;
  phone?: string;
  linkedinUrl?: string;
  position?: string;
  status?: string;
  source?: string;
  resumeUrl?: string;
  notes?: string;
}

export class NotionService {
  private static config: NotionConfig | null = null;
  private static baseUrl = 'https://api.notion.com/v1';
  private static version = '2022-06-28';

  /**
   * Initialize Notion configuration
   */
  static initialize(config: NotionConfig) {
    this.config = config;
  }

  /**
   * Test connection to Notion
   */
  static async testConnection(): Promise<{
    success: boolean;
    workspace?: any;
    error?: string;
  }> {
    try {
      if (!this.config?.apiKey) {
        throw new Error('Notion API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/users/me`, {
        headers: this.getHeaders(),
      });

      console.log('✅ Notion connection successful');

      return {
        success: true,
        workspace: response.data,
      };
    } catch (error) {
      console.error('Notion connection error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * List all databases the integration has access to
   */
  static async listDatabases(): Promise<{
    success: boolean;
    databases?: NotionDatabase[];
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          filter: {
            property: 'object',
            value: 'database',
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time',
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      const databases = response.data.results.map((db: any) => ({
        id: db.id,
        title: db.title[0]?.plain_text || 'Untitled',
        description: db.description[0]?.plain_text,
        icon: db.icon,
        cover: db.cover,
        properties: db.properties,
      }));

      return {
        success: true,
        databases,
      };
    } catch (error) {
      console.error('Error listing databases:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list databases',
      };
    }
  }

  /**
   * Create or get HR Applicant database
   */
  static async createHRDatabase(): Promise<{
    success: boolean;
    databaseId?: string;
    error?: string;
  }> {
    try {
      // First, check if database already exists
      const existing = await this.listDatabases();
      if (existing.success && existing.databases) {
        const hrDb = existing.databases.find(db => 
          db.title.toLowerCase().includes('hr') || 
          db.title.toLowerCase().includes('applicant')
        );
        if (hrDb) {
          this.config!.databaseId = hrDb.id;
          return {
            success: true,
            databaseId: hrDb.id,
          };
        }
      }

      // Create new database
      const response = await axios.post(
        `${this.baseUrl}/databases`,
        {
          parent: {
            type: 'workspace',
            workspace: true,
          },
          title: [
            {
              type: 'text',
              text: {
                content: 'HR Applicants',
              },
            },
          ],
          icon: {
            type: 'emoji',
            emoji: '👥',
          },
          properties: {
            Name: {
              title: {},
            },
            Email: {
              email: {},
            },
            Phone: {
              phone_number: {},
            },
            Position: {
              select: {
                options: [
                  { name: 'Software Engineer', color: 'blue' },
                  { name: 'Product Manager', color: 'green' },
                  { name: 'Designer', color: 'purple' },
                  { name: 'Sales', color: 'yellow' },
                  { name: 'Marketing', color: 'orange' },
                  { name: 'Other', color: 'gray' },
                ],
              },
            },
            Status: {
              select: {
                options: [
                  { name: 'Applied', color: 'gray' },
                  { name: 'Screening', color: 'yellow' },
                  { name: 'Interview', color: 'blue' },
                  { name: 'Offer', color: 'green' },
                  { name: 'Hired', color: 'green' },
                  { name: 'Rejected', color: 'red' },
                ],
              },
            },
            'Applied Date': {
              date: {},
            },
            'Interview Date': {
              date: {},
            },
            Source: {
              select: {
                options: [
                  { name: 'Website', color: 'blue' },
                  { name: 'LinkedIn', color: 'blue' },
                  { name: 'Referral', color: 'green' },
                  { name: 'Job Board', color: 'yellow' },
                  { name: 'Other', color: 'gray' },
                ],
              },
            },
            'LinkedIn URL': {
              url: {},
            },
            'Resume URL': {
              url: {},
            },
            'Interview Score': {
              number: {
                format: 'number',
              },
            },
            Notes: {
              rich_text: {},
            },
            Tags: {
              multi_select: {
                options: [
                  { name: 'Remote', color: 'blue' },
                  { name: 'On-site', color: 'green' },
                  { name: 'Hybrid', color: 'yellow' },
                  { name: 'Urgent', color: 'red' },
                  { name: 'Senior', color: 'purple' },
                  { name: 'Junior', color: 'orange' },
                ],
              },
            },
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      this.config!.databaseId = response.data.id;

      console.log('✅ Created HR Applicants database in Notion');

      return {
        success: true,
        databaseId: response.data.id,
      };
    } catch (error) {
      console.error('Error creating database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create database',
      };
    }
  }

  /**
   * Sync applicant to Notion
   */
  static async syncApplicant(
    applicantId: string
  ): Promise<{
    success: boolean;
    pageId?: string;
    pageUrl?: string;
    error?: string;
  }> {
    try {
      // Get applicant data
      const applicant = await client.models.Applicant.get({ id: applicantId });
      if (!applicant.data) {
        throw new Error('Applicant not found');
      }

      // Ensure database exists
      if (!this.config?.databaseId) {
        const dbResult = await this.createHRDatabase();
        if (!dbResult.success) {
          throw new Error(dbResult.error || 'Failed to create database');
        }
      }

      // Prepare properties
      const properties: Record<string, any> = {
        Name: {
          title: [
            {
              text: {
                content: applicant.data.fullName,
              },
            },
          ],
        },
        Email: {
          email: applicant.data.email,
        },
      };

      if (applicant.data.phone) {
        properties.Phone = {
          phone_number: applicant.data.phone,
        };
      }

      if (applicant.data.position) {
        properties.Position = {
          select: {
            name: applicant.data.position,
          },
        };
      }

      if (applicant.data.status) {
        properties.Status = {
          select: {
            name: this.mapStatus(applicant.data.status),
          },
        };
      }

      if (applicant.data.linkedinUrl) {
        properties['LinkedIn URL'] = {
          url: applicant.data.linkedinUrl,
        };
      }

      if (applicant.data.resumeUrl) {
        properties['Resume URL'] = {
          url: applicant.data.resumeUrl,
        };
      }

      properties['Applied Date'] = {
        date: {
          start: applicant.data.createdAt,
        },
      };

      if (applicant.data.source) {
        properties.Source = {
          select: {
            name: this.mapSource(applicant.data.source),
          },
        };
      }

      // Check if page already exists
      const existingPage = await this.findApplicantPage(applicant.data.email);
      
      if (existingPage) {
        // Update existing page
        const response = await axios.patch(
          `${this.baseUrl}/pages/${existingPage.id}`,
          {
            properties,
          },
          {
            headers: this.getHeaders(),
          }
        );

        console.log(`✅ Updated applicant in Notion: ${applicant.data.fullName}`);

        return {
          success: true,
          pageId: response.data.id,
          pageUrl: response.data.url,
        };
      } else {
        // Create new page
        const response = await axios.post(
          `${this.baseUrl}/pages`,
          {
            parent: {
              database_id: this.config.databaseId,
            },
            properties,
            icon: {
              type: 'emoji',
              emoji: '👤',
            },
          },
          {
            headers: this.getHeaders(),
          }
        );

        console.log(`✅ Created applicant in Notion: ${applicant.data.fullName}`);

        return {
          success: true,
          pageId: response.data.id,
          pageUrl: response.data.url,
        };
      }
    } catch (error) {
      console.error('Error syncing applicant:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to sync applicant',
      };
    }
  }

  /**
   * Create task in Notion
   */
  static async createTask(
    title: string,
    details: {
      description?: string;
      dueDate?: string;
      assignee?: string;
      priority?: 'low' | 'medium' | 'high';
      tags?: string[];
      relatedApplicant?: string;
    }
  ): Promise<{
    success: boolean;
    pageId?: string;
    pageUrl?: string;
    error?: string;
  }> {
    try {
      // Ensure tasks database exists
      const tasksDb = await this.createTasksDatabase();
      if (!tasksDb.success) {
        throw new Error('Failed to create tasks database');
      }

      const properties: Record<string, any> = {
        Name: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
        Status: {
          select: {
            name: 'To Do',
          },
        },
      };

      if (details.dueDate) {
        properties['Due Date'] = {
          date: {
            start: details.dueDate,
          },
        };
      }

      if (details.assignee) {
        properties.Assignee = {
          rich_text: [
            {
              text: {
                content: details.assignee,
              },
            },
          ],
        };
      }

      if (details.priority) {
        properties.Priority = {
          select: {
            name: details.priority.charAt(0).toUpperCase() + details.priority.slice(1),
          },
        };
      }

      if (details.tags && details.tags.length > 0) {
        properties.Tags = {
          multi_select: details.tags.map(tag => ({ name: tag })),
        };
      }

      if (details.relatedApplicant) {
        properties['Related Applicant'] = {
          rich_text: [
            {
              text: {
                content: details.relatedApplicant,
              },
            },
          ],
        };
      }

      const response = await axios.post(
        `${this.baseUrl}/pages`,
        {
          parent: {
            database_id: tasksDb.databaseId,
          },
          properties,
          icon: {
            type: 'emoji',
            emoji: '📋',
          },
          children: details.description ? [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: details.description,
                    },
                  },
                ],
              },
            },
          ] : undefined,
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log(`✅ Created task in Notion: ${title}`);

      return {
        success: true,
        pageId: response.data.id,
        pageUrl: response.data.url,
      };
    } catch (error) {
      console.error('Error creating task:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create task',
      };
    }
  }

  /**
   * Create tasks database
   */
  private static async createTasksDatabase(): Promise<{
    success: boolean;
    databaseId?: string;
    error?: string;
  }> {
    try {
      // Check if database already exists
      const existing = await this.listDatabases();
      if (existing.success && existing.databases) {
        const tasksDb = existing.databases.find(db => 
          db.title.toLowerCase().includes('task') || 
          db.title.toLowerCase().includes('to do')
        );
        if (tasksDb) {
          return {
            success: true,
            databaseId: tasksDb.id,
          };
        }
      }

      // Create new tasks database
      const response = await axios.post(
        `${this.baseUrl}/databases`,
        {
          parent: {
            type: 'workspace',
            workspace: true,
          },
          title: [
            {
              type: 'text',
              text: {
                content: 'HR Tasks',
              },
            },
          ],
          icon: {
            type: 'emoji',
            emoji: '✅',
          },
          properties: {
            Name: {
              title: {},
            },
            Status: {
              select: {
                options: [
                  { name: 'To Do', color: 'gray' },
                  { name: 'In Progress', color: 'yellow' },
                  { name: 'Done', color: 'green' },
                  { name: 'Cancelled', color: 'red' },
                ],
              },
            },
            'Due Date': {
              date: {},
            },
            Priority: {
              select: {
                options: [
                  { name: 'High', color: 'red' },
                  { name: 'Medium', color: 'yellow' },
                  { name: 'Low', color: 'green' },
                ],
              },
            },
            Assignee: {
              rich_text: {},
            },
            'Related Applicant': {
              rich_text: {},
            },
            Tags: {
              multi_select: {
                options: [
                  { name: 'Interview', color: 'blue' },
                  { name: 'Onboarding', color: 'green' },
                  { name: 'Documentation', color: 'purple' },
                  { name: 'Follow-up', color: 'yellow' },
                  { name: 'Urgent', color: 'red' },
                ],
              },
            },
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      return {
        success: true,
        databaseId: response.data.id,
      };
    } catch (error) {
      console.error('Error creating tasks database:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create tasks database',
      };
    }
  }

  /**
   * Create interview notes
   */
  static async createInterviewNotes(
    applicantName: string,
    interviewDetails: {
      date: string;
      interviewer: string;
      position: string;
      score?: number;
      notes: string;
      strengths?: string[];
      concerns?: string[];
      recommendation?: 'strong-hire' | 'hire' | 'no-hire' | 'undecided';
    }
  ): Promise<{
    success: boolean;
    pageId?: string;
    pageUrl?: string;
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pages`,
        {
          parent: {
            type: 'workspace',
            workspace: true,
          },
          icon: {
            type: 'emoji',
            emoji: '📝',
          },
          properties: {
            title: [
              {
                text: {
                  content: `Interview Notes: ${applicantName} - ${interviewDetails.position}`,
                },
              },
            ],
          },
          children: [
            {
              object: 'block',
              type: 'heading_1',
              heading_1: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Interview Summary',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: `Date: ${interviewDetails.date}\nInterviewer: ${interviewDetails.interviewer}\nPosition: ${interviewDetails.position}`,
                    },
                  },
                ],
              },
            },
            ...(interviewDetails.score ? [
              {
                object: 'block',
                type: 'callout',
                callout: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: `Interview Score: ${interviewDetails.score}/5`,
                      },
                    },
                  ],
                  icon: {
                    emoji: '⭐',
                  },
                },
              },
            ] : []),
            {
              object: 'block',
              type: 'heading_2',
              heading_2: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: 'Interview Notes',
                    },
                  },
                ],
              },
            },
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  {
                    type: 'text',
                    text: {
                      content: interviewDetails.notes,
                    },
                  },
                ],
              },
            },
            ...(interviewDetails.strengths && interviewDetails.strengths.length > 0 ? [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: 'Strengths',
                      },
                    },
                  ],
                },
              },
              ...interviewDetails.strengths.map(strength => ({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: strength,
                      },
                    },
                  ],
                },
              })),
            ] : []),
            ...(interviewDetails.concerns && interviewDetails.concerns.length > 0 ? [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: 'Areas of Concern',
                      },
                    },
                  ],
                },
              },
              ...interviewDetails.concerns.map(concern => ({
                object: 'block',
                type: 'bulleted_list_item',
                bulleted_list_item: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: concern,
                      },
                    },
                  ],
                },
              })),
            ] : []),
            ...(interviewDetails.recommendation ? [
              {
                object: 'block',
                type: 'heading_2',
                heading_2: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: 'Recommendation',
                      },
                    },
                  ],
                },
              },
              {
                object: 'block',
                type: 'callout',
                callout: {
                  rich_text: [
                    {
                      type: 'text',
                      text: {
                        content: this.formatRecommendation(interviewDetails.recommendation),
                      },
                    },
                  ],
                  icon: {
                    emoji: this.getRecommendationEmoji(interviewDetails.recommendation),
                  },
                  color: this.getRecommendationColor(interviewDetails.recommendation),
                },
              },
            ] : []),
          ],
        },
        {
          headers: this.getHeaders(),
        }
      );

      console.log(`✅ Created interview notes in Notion for ${applicantName}`);

      return {
        success: true,
        pageId: response.data.id,
        pageUrl: response.data.url,
      };
    } catch (error) {
      console.error('Error creating interview notes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create interview notes',
      };
    }
  }

  /**
   * Search pages in Notion
   */
  static async searchPages(
    query: string
  ): Promise<{
    success: boolean;
    pages?: NotionPage[];
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          query,
          filter: {
            property: 'object',
            value: 'page',
          },
          sort: {
            direction: 'descending',
            timestamp: 'last_edited_time',
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      const pages = response.data.results.map((page: any) => ({
        id: page.id,
        title: page.properties?.title?.title?.[0]?.plain_text || 
               page.properties?.Name?.title?.[0]?.plain_text || 
               'Untitled',
        icon: page.icon,
        cover: page.cover,
        properties: page.properties,
        createdTime: page.created_time,
        lastEditedTime: page.last_edited_time,
        url: page.url,
      }));

      return {
        success: true,
        pages,
      };
    } catch (error) {
      console.error('Error searching pages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search pages',
      };
    }
  }

  /**
   * Find applicant page by email
   */
  private static async findApplicantPage(email: string): Promise<any | null> {
    try {
      if (!this.config?.databaseId) return null;

      const response = await axios.post(
        `${this.baseUrl}/databases/${this.config.databaseId}/query`,
        {
          filter: {
            property: 'Email',
            email: {
              equals: email,
            },
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      return response.data.results[0] || null;
    } catch (error) {
      console.error('Error finding applicant page:', error);
      return null;
    }
  }

  /**
   * Get headers for API requests
   */
  private static getHeaders() {
    if (!this.config?.apiKey) {
      throw new Error('Notion API key not configured');
    }

    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
      'Notion-Version': this.version,
    };
  }

  /**
   * Map applicant status to Notion status
   */
  private static mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'applied': 'Applied',
      'screening': 'Screening',
      'interview_scheduled': 'Interview',
      'interviewed': 'Interview',
      'offer_sent': 'Offer',
      'hired': 'Hired',
      'rejected': 'Rejected',
    };

    return statusMap[status] || 'Applied';
  }

  /**
   * Map source to Notion source
   */
  private static mapSource(source: string): string {
    const sourceMap: Record<string, string> = {
      'website': 'Website',
      'linkedin': 'LinkedIn',
      'referral': 'Referral',
      'job_board': 'Job Board',
      'other': 'Other',
    };

    return sourceMap[source] || 'Other';
  }

  /**
   * Format recommendation text
   */
  private static formatRecommendation(recommendation: string): string {
    const recommendationMap: Record<string, string> = {
      'strong-hire': 'Strong Hire - Exceptional candidate, highly recommended',
      'hire': 'Hire - Good candidate, recommend moving forward',
      'no-hire': 'No Hire - Does not meet requirements',
      'undecided': 'Undecided - Need more information or additional interviews',
    };

    return recommendationMap[recommendation] || recommendation;
  }

  /**
   * Get recommendation emoji
   */
  private static getRecommendationEmoji(recommendation: string): string {
    const emojiMap: Record<string, string> = {
      'strong-hire': '🌟',
      'hire': '✅',
      'no-hire': '❌',
      'undecided': '🤔',
    };

    return emojiMap[recommendation] || '📋';
  }

  /**
   * Get recommendation color
   */
  private static getRecommendationColor(recommendation: string): string {
    const colorMap: Record<string, string> = {
      'strong-hire': 'green_background',
      'hire': 'blue_background',
      'no-hire': 'red_background',
      'undecided': 'yellow_background',
    };

    return colorMap[recommendation] || 'gray_background';
  }
}