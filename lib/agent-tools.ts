import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
// import { aiService } from "./ai-service"; // AI service removed

const client = generateClient<Schema>();

export interface OnboardParams {
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
  startDate?: string; // ISO date
}

export async function createUser(profile: OnboardParams) {
  const res = await client.models.User.create({
    email: profile.email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    role: (profile.role as any) || "staff",
    department: profile.department,
    position: profile.position,
    startDate: profile.startDate as any,
    status: "pending",
  });
  return res.data;
}

export async function assignOnboardingTasks(userId: string, role?: string, department?: string) {
  // Task assignment removed - using external task management system
  console.log("Task assignment moved to external system");
  return [];
}

export async function sendCommunication(params: {
  recipientId?: string;
  recipientEmail?: string;
  senderId: string;
  subject: string;
  content: string;
  scheduledDate?: string; // ISO datetime
}) {
  const res = await client.models.Communication.create({
    type: "email",
    subject: params.subject,
    content: params.content,
    recipientId: params.recipientId || params.recipientEmail || "UNKNOWN",
    recipientEmail: params.recipientEmail,
    senderId: params.senderId,
    status: params.scheduledDate ? "scheduled" : "sent",
    scheduledDate: params.scheduledDate as any,
    sentDate: params.scheduledDate ? undefined : (new Date().toISOString() as any),
  });
  return res.data;
}

export async function createDocumentPack(params: {
  uploadedBy: string;
  userId?: string;
  name: string;
  url: string;
  description?: string;
}) {
  const res = await client.models.Document.create({
    name: params.name,
    type: "form",
    category: "onboarding",
    fileUrl: params.url,
    uploadedBy: params.uploadedBy,
    uploadDate: new Date().toISOString() as any,
    description: params.description,
    userId: params.userId,
  });
  return res.data;
}

export async function scheduleOrientation(params: {
  userId: string;
  organizerId: string;
  dateTimeISO: string;
}) {
  // Represent orientation as a scheduled communication invite
  return sendCommunication({
    recipientId: params.userId,
    senderId: params.organizerId,
    subject: "Orientation Session",
    content: `Orientation scheduled for ${params.dateTimeISO}`,
    scheduledDate: params.dateTimeISO,
  });
}

export async function escalateIssue(params: {
  userId: string;
  subject: string;
  content: string;
}) {
  // Route to HR_TEAM placeholder via Communication
  return sendCommunication({
    recipientId: "HR_TEAM",
    senderId: params.userId,
    subject: params.subject,
    content: params.content,
  });
}

export async function addKnowledgeDoc(params: {
  title: string;
  url: string;
  userId: string;
}) {
  const res = await client.models.Document.create({
    name: params.title,
    type: "policy",
    category: "knowledge_base",
    fileUrl: params.url,
    uploadedBy: params.userId,
    uploadDate: new Date().toISOString() as any,
    description: "Added from AI intent",
    tags: ["kb", "ai"],
  });
  return res.data;
}

