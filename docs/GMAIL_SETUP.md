# Gmail API Integration Setup Guide

This guide walks you through setting up Gmail API integration for the Chinchilla Flow Portal.

## Prerequisites
- Google Cloud Console access
- Gmail account for the organization

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click **"Create Project"** or select an existing project
3. Name your project: "Chinchilla HR Portal"
4. Note your **Project ID**

## Step 2: Enable Gmail API

1. In Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for **"Gmail API"**
3. Click on Gmail API and press **"Enable"**
4. Wait for the API to be enabled

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **"Internal"** if using Google Workspace, otherwise **"External"**
3. Fill in the required fields:
   - **App name**: Chinchilla HR Portal
   - **User support email**: Your email
   - **Developer contact**: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `https://www.googleapis.com/auth/gmail.labels`
5. Add test users if in development
6. Save and continue

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"+ Create Credentials"** > **"OAuth client ID"**
3. Choose **"Web application"**
4. Configure:
   - **Name**: Chinchilla HR Portal Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (development)
     - `https://your-domain.com` (production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://your-domain.com/api/auth/callback/google`
5. Click **"Create"**
6. Copy your **Client ID** and **Client Secret**

## Step 5: Update Environment Variables

Add to your `.env.local`:

```env
# Gmail API Configuration
NEXT_PUBLIC_GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/callback/google

# Optional: Default sender email
GMAIL_DEFAULT_FROM=hr@chinchilla.ai
```

## Step 6: Initialize Gmail in Your App

```typescript
// In your app initialization
import { GmailService } from '@/lib/gmailService';

// Initialize Gmail
await GmailService.initialize({
  clientId: process.env.NEXT_PUBLIC_GMAIL_CLIENT_ID!,
  clientSecret: process.env.GMAIL_CLIENT_SECRET!,
  redirectUri: process.env.GMAIL_REDIRECT_URI!,
});

// Sign in user
const result = await GmailService.signIn();
if (result.success) {
  console.log('Signed in:', result.user);
}
```

## Step 7: Set Up Email Management

### Folder Structure
Create Gmail labels for organizing HR emails:
- **HR/Applications** - Job applications
- **HR/Interviews** - Interview communications
- **HR/Offers** - Offer letters
- **HR/Onboarding** - Onboarding emails
- **HR/Documents** - Document-related emails

### Auto-labeling
Run the auto-labeling function to organize existing emails:
```typescript
const result = await GmailService.autoLabelHREmails();
console.log(`Labeled ${result.labeled} emails`);
```

## Usage Examples

### List Inbox Messages
```typescript
const result = await GmailService.listMessages('', 20);
if (result.success) {
  console.log('Messages:', result.messages);
}
```

### Search for Applicant Emails
```typescript
const emails = await GmailService.getApplicantEmails('applicant@example.com');
if (emails.success) {
  console.log('Found emails:', emails.messages);
}
```

### Send Interview Invitation
```typescript
const template = GmailService.getEmailTemplate('interview_invite', {
  name: 'John Doe',
  position: 'Software Engineer',
  date: 'March 25, 2024',
  time: '2:00 PM PST',
  interviewType: 'Video Call',
  location: 'Zoom link will be provided',
  duration: '1 hour',
  interviewers: 'Jane Smith, Tech Lead',
  senderName: 'HR Team',
});

const result = await GmailService.sendEmail(
  'applicant@example.com',
  template.subject,
  template.body
);
```

### Create Draft Email
```typescript
const result = await GmailService.createDraft(
  'applicant@example.com',
  'Follow-up on your application',
  'Dear applicant...'
);
```

## API Quotas and Limits

Gmail API has the following quotas:
- **Daily Usage**: 1,000,000,000 quota units per day
- **Per User Rate Limit**: 250 quota units per user per second
- **Send Email**: 250 quota units per send

Quota units consumed per method:
- `messages.list`: 1 unit
- `messages.get`: 1 unit
- `messages.send`: 100 units
- `messages.modify`: 5 units

## Security Best Practices

1. **Scope Limitation**
   - Only request necessary scopes
   - Use read-only scopes when possible

2. **Token Storage**
   - Never store tokens in code
   - Use secure session storage
   - Implement token refresh

3. **Rate Limiting**
   - Implement exponential backoff
   - Cache frequently accessed data
   - Batch operations when possible

4. **Data Privacy**
   - Encrypt sensitive email content
   - Implement access controls
   - Log email access for audit

## Troubleshooting

### Common Issues:

1. **"Access blocked" error**
   - Ensure OAuth consent screen is configured
   - Add test users in development
   - Verify redirect URIs match exactly

2. **"Insufficient permission" error**
   - User needs to re-authenticate with new scopes
   - Check if scopes are added to consent screen

3. **"Quota exceeded" error**
   - Implement rate limiting
   - Check quota usage in Google Cloud Console
   - Consider batch operations

4. **"Invalid grant" error**
   - Refresh token may be expired
   - User needs to re-authenticate

### Debug Mode

Enable debug logging:
```typescript
// Add to window for debugging
(window as any).gmailDebug = true;

// Log all API calls
if ((window as any).gmailDebug) {
  console.log('Gmail API Call:', method, params);
}
```

## Gmail Filters and Rules

Create filters to automatically process HR emails:

1. **Auto-forward applications**
   ```
   From: *@*.* 
   Subject: "Application" OR "Resume" OR "CV"
   → Forward to: hr-applications@chinchilla.ai
   ```

2. **Priority interviews**
   ```
   Subject: "Interview" AND ("urgent" OR "ASAP")
   → Add label: HR/Urgent
   → Mark as important
   ```

3. **Document signatures**
   ```
   From: noreply@dropboxsign.com OR noreply@docusign.com
   → Add label: HR/Documents
   → Forward to: hr-documents@chinchilla.ai
   ```

## Integration with HR Portal

The Gmail integration enhances the HR Portal with:

1. **Unified Inbox** - View all HR emails within the portal
2. **Smart Templates** - Pre-filled email templates for common scenarios
3. **Applicant Timeline** - See all email communications with an applicant
4. **Automated Responses** - Send acknowledgments and updates
5. **Document Tracking** - Track email attachments and documents
6. **Calendar Integration** - Create calendar events from email

## Next Steps

1. Test email sending and receiving
2. Set up email templates for your organization
3. Configure auto-labeling rules
4. Train team on using Gmail integration
5. Set up email analytics and reporting