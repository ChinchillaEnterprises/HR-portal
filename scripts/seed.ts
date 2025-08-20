import { Amplify } from 'aws-amplify';
import outputs from '../amplify_outputs.json';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

async function main() {
  Amplify.configure(outputs as any);
  const client = generateClient<Schema>();

  console.log('Seeding demo data...');

  // Users
  const demoUsers = [
    { email: 'admin@chinchilla.ai', firstName: 'Ava', lastName: 'Admin', role: 'admin', status: 'active', department: 'Operations', position: 'Head of Ops' },
    { email: 'mentor@chinchilla.ai', firstName: 'Max', lastName: 'Mentor', role: 'mentor', status: 'active', department: 'Programs', position: 'Mentor' },
    { email: 'lead@chinchilla.ai', firstName: 'Lia', lastName: 'Lead', role: 'team_lead', status: 'active', department: 'Engineering', position: 'Team Lead' },
    { email: 'intern@chinchilla.ai', firstName: 'Ian', lastName: 'Intern', role: 'intern', status: 'pending', department: 'Engineering', position: 'Intern' },
    { email: 'staff@chinchilla.ai', firstName: 'Sia', lastName: 'Staff', role: 'staff', status: 'active', department: 'People', position: 'HR Generalist' },
  ] as const;

  const createdUsers: string[] = [];
  for (const u of demoUsers) {
    const { data } = await client.models.User.create({
      ...u,
      startDate: new Date().toISOString().split('T')[0] as any,
    });
    if (data?.id) createdUsers.push(data.id);
  }
  console.log(`Users: ${createdUsers.length}`);

  // Onboarding tasks for intern
  const internId = createdUsers[3];
  const tasks = [
    { title: 'Read Employee Handbook', description: 'Policies and values', status: 'in_progress', category: 'documentation', dueIn: 3 },
    { title: 'Set up laptop', description: 'Dev environment + accounts', status: 'pending', category: 'setup', dueIn: 2 },
    { title: 'Meet your mentor', description: '30 min intro', status: 'overdue', category: 'meeting', dueIn: -1 },
  ];
  for (const t of tasks) {
    const due = new Date();
    due.setDate(due.getDate() + t.dueIn);
    await client.models.OnboardingTask.create({
      userId: internId,
      title: t.title,
      description: t.description,
      status: t.status as any,
      dueDate: due.toISOString().split('T')[0] as any,
      category: t.category as any,
      assignedBy: 'SYSTEM',
    });
  }
  console.log('Onboarding tasks: 3');

  // Documents
  await client.models.Document.create({
    name: 'Employee Handbook',
    type: 'policy',
    category: 'knowledge_base',
    fileUrl: 'https://example.com/handbook.pdf',
    uploadedBy: createdUsers[0],
    description: 'Policies and procedures',
    tags: ['kb','policy'] as any,
    signatureRequired: false,
    signatureStatus: 'signed' as any,
  });
  await client.models.Document.create({
    name: 'NDA Agreement',
    type: 'nda',
    category: 'onboarding',
    fileUrl: 'https://example.com/nda.pdf',
    uploadedBy: createdUsers[0],
    userId: internId,
    description: 'Please sign on day 1',
    signatureRequired: true,
    signatureStatus: 'pending' as any,
  });
  console.log('Documents: 2');

  // Applicants
  const applicants = [
    { email: 'alice@applicant.com', firstName: 'Alice', lastName: 'Anders', position: 'Frontend Engineer', status: 'screening' },
    { email: 'bob@applicant.com', firstName: 'Bob', lastName: 'Baker', position: 'Data Analyst', status: 'interview' },
    { email: 'cara@applicant.com', firstName: 'Cara', lastName: 'Cole', position: 'Program Manager', status: 'applied' },
  ];
  for (const a of applicants) {
    await client.models.Applicant.create({
      ...a,
      appliedDate: new Date().toISOString().split('T')[0] as any,
      source: 'LinkedIn',
      rating: 4 as any,
    });
  }
  console.log('Applicants: 3');

  // Communications
  await client.models.Communication.create({
    type: 'email',
    subject: 'Welcome to Chinchilla AI',
    content: 'We are excited to have you.',
    recipientId: internId,
    recipientEmail: 'intern@chinchilla.ai',
    senderId: createdUsers[0],
    status: 'sent' as any,
    sentDate: new Date().toISOString() as any,
  });
  console.log('Communications: 1');

  console.log('Seeding complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

