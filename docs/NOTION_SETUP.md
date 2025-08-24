# Notion Integration Setup Guide

This guide walks you through setting up Notion integration for the Chinchilla Flow Portal.

## Overview

The Notion integration allows you to:
- Sync applicants to a Notion database
- Create tasks and reminders
- Store interview notes
- Collaborate with your team
- Build custom workflows

## Prerequisites

- Notion account (free or paid)
- Admin access to your Notion workspace

## Step 1: Create a Notion Integration

1. Go to [Notion Integrations](https://www.notion.so/my-integrations)
2. Click **"New integration"**
3. Configure the integration:
   - **Name**: Chinchilla HR Portal
   - **Logo**: Upload your company logo (optional)
   - **Associated workspace**: Select your workspace
   - **Content Capabilities**: Check all boxes:
     - Read content
     - Update content
     - Insert content
   - **Comment Capabilities**: Check if needed
   - **User Capabilities**: No selection needed

4. Click **"Submit"**
5. Copy the **"Internal Integration Token"** (starts with `secret_`)

## Step 2: Share Pages with Integration

For the integration to access your Notion content:

1. Open Notion
2. Navigate to the page/database you want to share
3. Click **"Share"** in the top right
4. Click **"Invite"**
5. Search for "Chinchilla HR Portal" (your integration name)
6. Click **"Invite"**

## Step 3: Configure in HR Portal

1. Navigate to **Settings** > **Integrations** > **Notion**
2. Click **"Setup Notion Integration"**
3. Paste your Integration Token
4. Click **"Connect to Notion"**

The portal will automatically:
- Create an "HR Applicants" database
- Create an "HR Tasks" database
- Set up proper fields and views

## Database Schema

### HR Applicants Database

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Applicant's full name |
| Email | Email | Contact email |
| Phone | Phone | Contact number |
| Position | Select | Job position |
| Status | Select | Application status |
| Applied Date | Date | Application date |
| Interview Date | Date | Scheduled interview |
| Source | Select | Application source |
| LinkedIn URL | URL | LinkedIn profile |
| Resume URL | URL | Resume link |
| Interview Score | Number | Interview rating (1-5) |
| Notes | Text | Additional notes |
| Tags | Multi-select | Custom tags |

### HR Tasks Database

| Property | Type | Description |
|----------|------|-------------|
| Name | Title | Task title |
| Status | Select | Task status |
| Due Date | Date | Task deadline |
| Priority | Select | Task priority |
| Assignee | Text | Assigned to |
| Related Applicant | Text | Associated applicant |
| Tags | Multi-select | Task categories |

## Usage Examples

### Sync Single Applicant

```typescript
// In applicant detail page
const result = await NotionService.syncApplicant(applicantId);
if (result.success) {
  console.log('Synced to Notion:', result.pageUrl);
}
```

### Sync All Applicants

```typescript
// Bulk sync operation
const applicants = await getApplicants();
for (const applicant of applicants) {
  await NotionService.syncApplicant(applicant.id);
}
```

### Create Interview Task

```typescript
await NotionService.createTask('Interview with John Doe', {
  dueDate: '2024-03-25',
  assignee: 'HR Manager',
  priority: 'high',
  tags: ['Interview', 'Engineering'],
  relatedApplicant: 'John Doe',
  description: 'Technical interview for Senior Engineer position',
});
```

### Create Interview Notes

```typescript
await NotionService.createInterviewNotes('John Doe', {
  date: '2024-03-25',
  interviewer: 'Jane Smith',
  position: 'Senior Engineer',
  score: 4,
  notes: 'Strong technical skills, good communication...',
  strengths: [
    'Deep knowledge of React and TypeScript',
    'Experience with AWS',
    'Good problem-solving skills',
  ],
  concerns: [
    'Limited experience with our tech stack',
    'Salary expectations above budget',
  ],
  recommendation: 'hire',
});
```

## Automation Ideas

### 1. Auto-sync on Status Change
When applicant status changes, automatically sync to Notion:

```typescript
// In status update handler
if (newStatus === 'interview_scheduled') {
  await NotionService.syncApplicant(applicantId);
  await NotionService.createTask(
    `Prepare for interview with ${applicantName}`,
    {
      dueDate: interviewDate,
      priority: 'high',
      tags: ['Interview Prep'],
    }
  );
}
```

### 2. Weekly Summary
Create a weekly summary page:

```typescript
const thisWeek = {
  newApplicants: 15,
  interviews: 8,
  offers: 3,
  hires: 2,
};

await NotionService.createWeeklySummary(thisWeek);
```

### 3. Onboarding Checklist
Create onboarding tasks when applicant is hired:

```typescript
const onboardingTasks = [
  'Send welcome email',
  'Prepare workstation',
  'Schedule orientation',
  'Create accounts',
  'Assign mentor',
];

for (const task of onboardingTasks) {
  await NotionService.createTask(task, {
    relatedApplicant: applicantName,
    tags: ['Onboarding'],
    dueDate: calculateDueDate(startDate, task),
  });
}
```

## Best Practices

### 1. Database Organization
- Keep databases focused and specific
- Use views to filter by status, date, or assignee
- Create templates for common pages

### 2. Permissions
- Only share necessary pages with the integration
- Use Notion's permission system for team access
- Regularly audit integration access

### 3. Data Sync
- Sync only essential data to Notion
- Keep sensitive information in the HR portal
- Use Notion for collaboration, not as primary storage

### 4. Performance
- Batch operations when syncing multiple items
- Use webhooks for real-time updates (future feature)
- Cache Notion data when appropriate

## Troubleshooting

### "Unauthorized" Error
- Ensure the integration token is correct
- Verify the integration has access to the database
- Check if the token has expired

### "Database not found" Error
- Share the database with the integration
- Ensure the database ID is correct
- Check workspace permissions

### Sync Not Working
- Verify API key is saved correctly
- Check network connectivity
- Review browser console for errors

### Rate Limiting
Notion API has rate limits:
- 3 requests per second
- Implement retry logic with exponential backoff
- Batch operations when possible

## Advanced Features

### Custom Properties
Add custom properties to the databases:

```typescript
// In Notion UI
1. Open database
2. Click "+ Add a property"
3. Choose property type
4. Configure as needed
```

### Formula Fields
Create calculated fields:
- Days since application
- Interview success rate
- Time to hire

### Linked Databases
Link HR databases with other Notion content:
- Company wiki
- Team calendar
- Project management

### API Webhooks (Coming Soon)
Real-time sync between HR Portal and Notion:
- Instant updates
- Bi-directional sync
- Reduced API calls

## Security Considerations

1. **API Key Storage**
   - Store in environment variables
   - Never commit to version control
   - Rotate regularly

2. **Data Privacy**
   - Only sync non-sensitive data
   - Use Notion's encryption
   - Comply with data regulations

3. **Access Control**
   - Limit integration permissions
   - Use workspace access controls
   - Regular access audits

## Support

For issues or questions:
1. Check Notion's [API documentation](https://developers.notion.com)
2. Review error messages in browser console
3. Contact support with integration logs