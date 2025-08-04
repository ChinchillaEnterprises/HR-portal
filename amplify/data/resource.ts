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

  OnboardingTask: a
    .model({
      userId: a.string().required(),
      title: a.string().required(),
      description: a.string(),
      status: a.enum(["pending", "in_progress", "completed", "overdue"]),
      dueDate: a.date(),
      completedDate: a.date(),
      category: a.enum(["documentation", "training", "setup", "meeting", "other"]),
      assignedBy: a.string(),
      attachmentUrl: a.string(),
      notes: a.string(),
    })
    .authorization((allow) => [
      allow.owner(),
      allow.groups(["Admin", "Mentor", "TeamLead"]).to(["read", "update"]),
    ]),

  Document: a
    .model({
      name: a.string().required(),
      type: a.enum(["offer_letter", "nda", "contract", "policy", "form", "guide"]),
      category: a.string(),
      fileUrl: a.string().required(),
      uploadedBy: a.string().required(),
      uploadDate: a.datetime(),
      description: a.string(),
      tags: a.string().array(),
      signatureRequired: a.boolean(),
      signatureStatus: a.enum(["pending", "signed", "expired"]),
      dropboxSignId: a.string(),
      userId: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]).to(["create", "read", "update", "delete"]),
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
    })
    .authorization((allow) => [
      allow.groups(["Admin", "Mentor", "TeamLead"]).to(["create", "read", "update", "delete"]),
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
      allow.groups(["Admin", "Mentor", "TeamLead"]).to(["create", "read", "update", "delete"]),
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
      allow.authenticated().to(["read"]),
      allow.groups(["Admin"]).to(["create", "read", "update", "delete"]),
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
      allow.groups(["Admin", "Mentor", "TeamLead"]).to(["create", "read", "update", "delete"]),
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
