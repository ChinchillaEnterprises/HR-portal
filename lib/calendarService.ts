"use client";

import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { SlackService } from "./slackService";

const client = generateClient<Schema>();

interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  type: 'interview' | 'onboarding' | 'meeting' | 'training' | 'deadline';
  relatedId?: string; // Link to applicant, onboarding, etc.
  relatedType?: string;
  priority: 'low' | 'medium' | 'high';
  isAllDay?: boolean;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  reminders?: {
    type: 'email' | 'notification';
    minutes: number;
  }[];
  metadata?: Record<string, any>;
}

interface GoogleCalendarConfig {
  apiKey: string;
  clientId: string;
  calendarId?: string;
}

interface OutlookConfig {
  clientId: string;
  tenantId: string;
}

export class CalendarService {
  private static googleConfig: GoogleCalendarConfig | null = null;
  private static outlookConfig: OutlookConfig | null = null;

  /**
   * Initialize Google Calendar integration
   */
  static initializeGoogle(config: GoogleCalendarConfig) {
    this.googleConfig = config;
  }

  /**
   * Initialize Outlook Calendar integration
   */
  static initializeOutlook(config: OutlookConfig) {
    this.outlookConfig = config;
  }

  /**
   * Create a calendar event
   */
  static async createEvent(event: CalendarEvent): Promise<{
    success: boolean;
    eventId?: string;
    externalEventId?: string;
    error?: string;
  }> {
    try {
      // Create event in our database first
      const dbEvent = await client.models.CalendarEvent.create({
        title: event.title,
        description: event.description || "",
        startTime: event.startTime,
        endTime: event.endTime,
        attendees: JSON.stringify(event.attendees),
        location: event.location || "",
        type: event.type,
        relatedId: event.relatedId || "",
        relatedType: event.relatedType || "",
        priority: event.priority,
        isAllDay: event.isAllDay || false,
        recurrence: event.recurrence ? JSON.stringify(event.recurrence) : null,
        reminders: event.reminders ? JSON.stringify(event.reminders) : null,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
      });

      if (!dbEvent.data) {
        throw new Error("Failed to create event in database");
      }

      // Try to sync with external calendars
      let externalEventId: string | undefined;
      
      if (this.googleConfig) {
        try {
          externalEventId = await this.createGoogleEvent(event);
        } catch (error) {
          console.warn("Failed to sync with Google Calendar:", error);
        }
      }

      if (this.outlookConfig && !externalEventId) {
        try {
          externalEventId = await this.createOutlookEvent(event);
        } catch (error) {
          console.warn("Failed to sync with Outlook Calendar:", error);
        }
      }

      // Update with external event ID if created
      if (externalEventId) {
        await client.models.CalendarEvent.update({
          id: dbEvent.data.id,
          externalEventId,
        });
      }

      // Schedule reminders
      if (event.reminders) {
        await this.scheduleReminders(dbEvent.data.id, event);
      }

      console.log(`✅ Calendar event created: ${event.title}`);

      return {
        success: true,
        eventId: dbEvent.data.id,
        externalEventId,
      };
    } catch (error) {
      console.error("Error creating calendar event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create event",
      };
    }
  }

  /**
   * Get events for a date range
   */
  static async getEvents(
    startDate: string,
    endDate: string,
    filters?: {
      type?: string;
      attendee?: string;
      priority?: string;
    }
  ): Promise<CalendarEvent[]> {
    try {
      let eventsQuery = client.models.CalendarEvent.list({
        filter: {
          startTime: { ge: startDate },
          endTime: { le: endDate },
        },
      });

      const events = await eventsQuery;
      let filteredEvents = events.data || [];

      // Apply filters
      if (filters?.type) {
        filteredEvents = filteredEvents.filter(e => e.type === filters.type);
      }

      if (filters?.priority) {
        filteredEvents = filteredEvents.filter(e => e.priority === filters.priority);
      }

      if (filters?.attendee) {
        filteredEvents = filteredEvents.filter(e => {
          const attendees = JSON.parse(e.attendees || "[]");
          return attendees.includes(filters.attendee);
        });
      }

      // Convert to CalendarEvent format
      return filteredEvents.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description || undefined,
        startTime: event.startTime,
        endTime: event.endTime,
        attendees: JSON.parse(event.attendees || "[]"),
        location: event.location || undefined,
        type: event.type as any,
        relatedId: event.relatedId || undefined,
        relatedType: event.relatedType || undefined,
        priority: event.priority as any,
        isAllDay: event.isAllDay || false,
        recurrence: event.recurrence ? JSON.parse(event.recurrence) : undefined,
        reminders: event.reminders ? JSON.parse(event.reminders) : undefined,
        metadata: event.metadata ? JSON.parse(event.metadata) : undefined,
      }));
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      return [];
    }
  }

  /**
   * Update an existing event
   */
  static async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const updateData: any = {};

      if (updates.title) updateData.title = updates.title;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.startTime) updateData.startTime = updates.startTime;
      if (updates.endTime) updateData.endTime = updates.endTime;
      if (updates.attendees) updateData.attendees = JSON.stringify(updates.attendees);
      if (updates.location !== undefined) updateData.location = updates.location;
      if (updates.type) updateData.type = updates.type;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.isAllDay !== undefined) updateData.isAllDay = updates.isAllDay;
      if (updates.recurrence !== undefined) {
        updateData.recurrence = updates.recurrence ? JSON.stringify(updates.recurrence) : null;
      }
      if (updates.reminders !== undefined) {
        updateData.reminders = updates.reminders ? JSON.stringify(updates.reminders) : null;
      }

      await client.models.CalendarEvent.update({
        id: eventId,
        ...updateData,
      });

      console.log(`✅ Calendar event updated: ${eventId}`);

      return { success: true };
    } catch (error) {
      console.error("Error updating calendar event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update event",
      };
    }
  }

  /**
   * Delete an event
   */
  static async deleteEvent(eventId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await client.models.CalendarEvent.delete({ id: eventId });

      console.log(`✅ Calendar event deleted: ${eventId}`);

      return { success: true };
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete event",
      };
    }
  }

  /**
   * Schedule an interview for an applicant
   */
  static async scheduleInterview(
    applicantId: string,
    interviewDetails: {
      title: string;
      startTime: string;
      endTime: string;
      interviewers: string[];
      location?: string;
      notes?: string;
      type?: 'phone' | 'video' | 'in_person';
    }
  ): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    try {
      // Get applicant details
      const applicant = await client.models.Applicant.get({ id: applicantId });
      if (!applicant.data) {
        throw new Error("Applicant not found");
      }

      const event: CalendarEvent = {
        title: interviewDetails.title,
        description: `Interview with ${applicant.data.fullName}\n\nPosition: ${applicant.data.position}\nType: ${interviewDetails.type || 'in_person'}\n\nNotes: ${interviewDetails.notes || 'N/A'}`,
        startTime: interviewDetails.startTime,
        endTime: interviewDetails.endTime,
        attendees: [applicant.data.email, ...interviewDetails.interviewers],
        location: interviewDetails.location,
        type: 'interview',
        relatedId: applicantId,
        relatedType: 'Applicant',
        priority: 'high',
        reminders: [
          { type: 'email', minutes: 60 }, // 1 hour before
          { type: 'notification', minutes: 15 }, // 15 minutes before
        ],
        metadata: {
          applicantId,
          applicantName: applicant.data.fullName,
          position: applicant.data.position,
          interviewType: interviewDetails.type || 'in_person',
        },
      };

      const result = await this.createEvent(event);

      if (result.success) {
        // Update applicant status if needed
        if (applicant.data.status === 'pending') {
          await client.models.Applicant.update({
            id: applicantId,
            status: 'interviewed',
          });
        }

        // Create notification for interviewers
        for (const interviewer of interviewDetails.interviewers) {
          await client.models.Notification.create({
            type: 'task_assigned',
            title: 'Interview Scheduled',
            message: `Interview scheduled with ${applicant.data.fullName} on ${new Date(interviewDetails.startTime).toLocaleDateString()}`,
            userId: interviewer,
            relatedId: applicantId,
            relatedType: 'Applicant',
            actionUrl: `/applicants?highlight=${applicantId}`,
            priority: 'high',
            read: false,
          });
        }

        // Send Slack notification
        try {
          await SlackService.sendInterviewReminder({
            applicantName: applicant.data.fullName,
            position: applicant.data.position || 'N/A',
            interviewers: interviewDetails.interviewers,
            time: new Date(interviewDetails.startTime).toLocaleString(),
            location: interviewDetails.location || 'TBD',
            type: interviewDetails.type || 'in_person',
          });
        } catch (error) {
          console.warn("Failed to send Slack interview notification:", error);
        }
      }

      return result;
    } catch (error) {
      console.error("Error scheduling interview:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to schedule interview",
      };
    }
  }

  /**
   * Schedule onboarding-related events
   */
  static async scheduleOnboardingEvent(
    onboardingId: string,
    eventDetails: {
      title: string;
      startTime: string;
      endTime: string;
      attendees: string[];
      location?: string;
      description?: string;
      type?: 'orientation' | 'training' | 'meeting' | 'deadline';
    }
  ): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    try {
      // Get onboarding details
      const onboarding = await client.models.Onboarding.get({ id: onboardingId });
      if (!onboarding.data) {
        throw new Error("Onboarding not found");
      }

      // Get applicant details
      const applicant = await client.models.Applicant.get({ 
        id: onboarding.data.applicantId 
      });

      const event: CalendarEvent = {
        title: eventDetails.title,
        description: eventDetails.description || `Onboarding event for ${applicant.data?.fullName}`,
        startTime: eventDetails.startTime,
        endTime: eventDetails.endTime,
        attendees: eventDetails.attendees,
        location: eventDetails.location,
        type: 'onboarding',
        relatedId: onboardingId,
        relatedType: 'Onboarding',
        priority: 'medium',
        reminders: [
          { type: 'email', minutes: 60 },
          { type: 'notification', minutes: 15 },
        ],
        metadata: {
          onboardingId,
          applicantId: onboarding.data.applicantId,
          applicantName: applicant.data?.fullName,
          eventType: eventDetails.type || 'meeting',
        },
      };

      return await this.createEvent(event);
    } catch (error) {
      console.error("Error scheduling onboarding event:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to schedule onboarding event",
      };
    }
  }

  /**
   * Get upcoming events for a user
   */
  static async getUpcomingEvents(
    userId: string,
    days: number = 7
  ): Promise<CalendarEvent[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const events = await this.getEvents(
      now.toISOString(),
      futureDate.toISOString(),
      { attendee: userId }
    );

    return events.sort((a, b) => 
      new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  /**
   * Check for scheduling conflicts
   */
  static async checkConflicts(
    attendees: string[],
    startTime: string,
    endTime: string,
    excludeEventId?: string
  ): Promise<{
    hasConflicts: boolean;
    conflicts: CalendarEvent[];
  }> {
    try {
      const events = await this.getEvents(startTime, endTime);
      
      const conflicts = events.filter(event => {
        if (excludeEventId && event.id === excludeEventId) {
          return false;
        }
        
        // Check if any attendees overlap
        return attendees.some(attendee => event.attendees.includes(attendee));
      });

      return {
        hasConflicts: conflicts.length > 0,
        conflicts,
      };
    } catch (error) {
      console.error("Error checking conflicts:", error);
      return {
        hasConflicts: false,
        conflicts: [],
      };
    }
  }

  // Private methods for external calendar integration

  private static async createGoogleEvent(event: CalendarEvent): Promise<string> {
    // This would integrate with Google Calendar API
    // For now, return a mock ID
    return `google_${Date.now()}`;
  }

  private static async createOutlookEvent(event: CalendarEvent): Promise<string> {
    // This would integrate with Microsoft Graph API
    // For now, return a mock ID
    return `outlook_${Date.now()}`;
  }

  private static async scheduleReminders(eventId: string, event: CalendarEvent): Promise<void> {
    // This would schedule reminder notifications
    // For now, just log the reminders
    console.log(`📅 Reminders scheduled for event ${eventId}:`, event.reminders);
  }

  /**
   * Generate iCal file for event
   */
  static generateICalFile(event: CalendarEvent): string {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    const formatDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const ical = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Chinchilla HR Portal//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@chinchillaflow.com`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description || ''}`,
      `LOCATION:${event.location || ''}`,
      `PRIORITY:${event.priority === 'high' ? '1' : event.priority === 'medium' ? '5' : '9'}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return ical;
  }

  /**
   * Download iCal file for event
   */
  static downloadICalFile(event: CalendarEvent): void {
    const icalContent = this.generateICalFile(event);
    const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}