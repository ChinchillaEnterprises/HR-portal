import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.string(),
      profilePicture: a.string(),
      role: a.enum(["admin", "mentor", "team_lead", "intern", "staff"]),
      status: a.enum(["active", "inactive", "pending"]),
      department: a.string(),
      position: a.string(),
      startDate: a.date(),
      onboardingCompleted: a.date(),
      linkedinUrl: a.string(),
      cohortId: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
      allow.owner(),
    ]),


  Document: a
    .model({
      name: a.string().required(),
      type: a.enum(["offer_letter", "nda", "contract", "policy", "form", "guide", "resume", "certificate", "other"]),
      category: a.string(),
      fileUrl: a.string().required(),
      fileKey: a.string().required(), // S3 key
      fileSize: a.integer(), // in bytes
      mimeType: a.string(),
      uploadedBy: a.string().required(),
      uploadDate: a.datetime(),
      description: a.string(),
      tags: a.string().array(),
      signatureRequired: a.boolean(),
      signatureStatus: a.enum(["pending", "signed", "expired", "not_required"]),
      signedDate: a.datetime(),
      signedBy: a.string(),
      dropboxSignId: a.string(),
      userId: a.string(),
      expirationDate: a.date(),
      version: a.integer(),
      parentDocumentId: a.string(), // for versioning
      isActive: a.boolean(),
      accessLevel: a.enum(["public", "internal", "confidential", "restricted"]),
      department: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
      allow.owner(),
    ]),

  Applicant: a
    .model({
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      phoneNumber: a.string(),
      linkedinUrl: a.string(),
      resumeUrl: a.string(),
      coverLetterUrl: a.string(),
      status: a.enum(["applied", "screening", "interview", "offer", "rejected", "hired"]),
      stage: a.string(),
      appliedDate: a.date().required(),
      notes: a.string(),
      rating: a.integer(),
      assignedRecruiter: a.string(),
      position: a.string().required(),
      source: a.string(),
      // AI fields
      aiAnalyzed: a.boolean(),
      aiMatchScore: a.float(),
      aiRecommendation: a.enum(["strong_yes", "yes", "maybe", "no", "strong_no"]),
      aiInsights: a.json(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Communication: a
    .model({
      type: a.enum(["email", "slack", "notification"]),
      subject: a.string().required(),
      content: a.string().required(),
      recipientId: a.string().required(),
      recipientEmail: a.string(),
      senderId: a.string().required(),
      status: a.enum(["sent", "delivered", "failed", "scheduled"]),
      scheduledDate: a.datetime(),
      sentDate: a.datetime(),
      templateId: a.string(),
      attachments: a.string().array(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
      allow.owner().to(["read"]),
    ]),

  Cohort: a
    .model({
      name: a.string().required(),
      startDate: a.date().required(),
      endDate: a.date(),
      status: a.enum(["planning", "active", "completed"]),
      description: a.string(),
      mentorIds: a.string().array(),
      participantCount: a.integer(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Report: a
    .model({
      title: a.string().required(),
      type: a.enum(["onboarding_progress", "applicant_conversion", "team_performance", "custom"]),
      generatedBy: a.string().required(),
      generatedDate: a.datetime().required(),
      data: a.json(),
      filters: a.json(),
      cohortId: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  DocumentShare: a
    .model({
      documentId: a.string().required(),
      sharedWith: a.string().required(), // user email or id
      sharedBy: a.string().required(),
      sharedDate: a.datetime().required(),
      expiresAt: a.datetime(),
      accessType: a.enum(["view", "download", "edit"]),
      accessCount: a.integer(),
      lastAccessed: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  DocumentTemplate: a
    .model({
      name: a.string().required(),
      type: a.enum(["offer_letter", "nda", "contract", "policy", "form"]),
      templateUrl: a.string().required(),
      variables: a.json(), // template variables
      description: a.string(),
      isActive: a.boolean(),
      createdBy: a.string().required(),
      createdDate: a.datetime(),
      lastModified: a.datetime(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  Notification: a
    .model({
      type: a.enum(["new_applicant", "document_shared", "task_assigned", "signature_required", "onboarding_update", "onboarding_started", "onboarding_complete", "system"]),
      title: a.string().required(),
      message: a.string().required(),
      userId: a.string().required(),
      relatedId: a.string(), // ID of related entity (applicant, document, etc.)
      relatedType: a.string(), // Type of related entity
      actionUrl: a.string(), // URL to navigate to
      priority: a.enum(["low", "medium", "high"]),
      read: a.boolean(),
      readAt: a.datetime(),
      metadata: a.json(), // Additional data
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
      allow.owner(),
    ]),

  Onboarding: a
    .model({
      applicantId: a.string().required(),
      workflowId: a.string().required(),
      workflowName: a.string().required(),
      status: a.enum(["not_started", "in_progress", "paused", "completed", "cancelled"]),
      startDate: a.datetime().required(),
      expectedCompletionDate: a.datetime(),
      completedAt: a.datetime(),
      completionPercentage: a.integer(),
      metadata: a.json(), // Additional workflow data
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  OnboardingTask: a
    .model({
      onboardingId: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      type: a.enum(["document_upload", "form_completion", "email_send", "approval_required", "system_check"]),
      status: a.enum(["pending", "active", "completed", "skipped", "failed"]),
      priority: a.enum(["low", "medium", "high"]),
      assignedRole: a.enum(["HR", "Manager", "Employee", "System"]),
      dueDate: a.datetime(),
      completedAt: a.datetime(),
      completedBy: a.string(),
      completionNote: a.string(),
      order: a.integer(), // Task order in workflow
      dependencies: a.json(), // Array of task titles this depends on
      metadata: a.json(), // Task-specific data (documents, email templates, etc.)
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  CalendarEvent: a
    .model({
      title: a.string().required(),
      description: a.string(),
      startTime: a.datetime().required(),
      endTime: a.datetime().required(),
      attendees: a.json(), // Array of attendee emails/IDs
      location: a.string(),
      type: a.enum(["interview", "onboarding", "meeting", "training", "deadline"]),
      relatedId: a.string(), // Link to applicant, onboarding, etc.
      relatedType: a.string(), // Type of related entity
      priority: a.enum(["low", "medium", "high"]),
      isAllDay: a.boolean(),
      recurrence: a.json(), // Recurrence rules
      reminders: a.json(), // Reminder settings
      externalEventId: a.string(), // Google/Outlook event ID
      metadata: a.json(), // Additional event data
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
    ]),

  UserInvitation: a
    .model({
      email: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      role: a.enum(["admin", "mentor", "team_lead", "intern", "staff"]),
      department: a.string(),
      position: a.string(),
      invitationToken: a.string().required(),
      invitedBy: a.string().required(),
      invitedAt: a.datetime().required(),
      expiresAt: a.datetime().required(),
      status: a.enum(["pending", "accepted", "expired", "cancelled"]),
      acceptedAt: a.datetime(),
      reminderSentAt: a.datetime(),
      note: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["create", "read", "update", "delete"]),
      allow.guest().to(["read"]), // Allow unauthenticated users to read invitations during signup
    ]),

});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
