# Slack Integration Setup Guide

This guide walks you through setting up Slack integration for the Chinchilla Flow Portal.

## Prerequisites
- Slack workspace admin access
- Ability to create Slack apps

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter app details:
   - **App Name**: Chinchilla HR Portal
   - **Pick a workspace**: Select your workspace
5. Click **"Create App"**

## Step 2: Configure OAuth & Permissions

1. In your app settings, navigate to **OAuth & Permissions**
2. Under **Bot Token Scopes**, add these permissions:
   ```
   channels:read
   channels:write
   chat:write
   chat:write.public
   files:read
   files:write
   groups:read
   groups:write
   im:read
   im:write
   users:read
   users:read.email
   ```
3. Under **User Token Scopes**, add:
   ```
   channels:read
   chat:write
   files:read
   users:read
   ```
4. Click **"Install to Workspace"**
5. Authorize the app
6. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

## Step 3: Configure Event Subscriptions (Optional)

If you want to receive events from Slack:

1. Navigate to **Event Subscriptions**
2. Toggle **Enable Events** to "On"
3. Set Request URL: `https://your-domain.com/api/slack/events`
4. Subscribe to bot events:
   - `message.channels`
   - `message.groups`
   - `message.im`
   - `app_mention`
5. Save changes

## Step 4: Configure Interactivity (Optional)

For interactive components (buttons, menus):

1. Navigate to **Interactivity & Shortcuts**
2. Toggle **Interactivity** to "On"
3. Set Request URL: `https://your-domain.com/api/slack/interactive`
4. Save changes

## Step 5: Get App Credentials

1. Navigate to **Basic Information**
2. Under **App Credentials**, copy:
   - **Client ID**
   - **Client Secret**
   - **Signing Secret**
   - **Verification Token**

## Step 6: Update Environment Variables

Add to your `.env.local`:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
SLACK_APP_ID=your-app-id
SLACK_CLIENT_ID=your-client-id
SLACK_CLIENT_SECRET=your-client-secret

# Optional: Default channel for notifications
SLACK_DEFAULT_CHANNEL=#general
```

## Step 7: Initialize Slack in Your App

```typescript
// In your app initialization or API route
import { SlackService } from '@/lib/slackService';

// Initialize Slack
SlackService.initialize({
  botToken: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appId: process.env.SLACK_APP_ID,
  defaultChannel: process.env.SLACK_DEFAULT_CHANNEL,
});

// Test connection
const result = await SlackService.testConnection();
console.log('Slack connected:', result);
```

## Step 8: Set Up Notification Channels

Create dedicated channels for different notification types:

1. **#hr-onboarding** - New employee onboarding notifications
2. **#hr-interviews** - Interview schedules and reminders
3. **#hr-documents** - Document signature requests and updates
4. **#hr-general** - General HR notifications

## Usage Examples

### Send Onboarding Notification
```typescript
await SlackService.sendOnboardingNotification(
  'John Doe',
  'Standard Employee Onboarding',
  '#hr-onboarding'
);
```

### Send Interview Reminder
```typescript
await SlackService.sendInterviewReminder({
  applicantName: 'Jane Smith',
  position: 'Software Engineer',
  interviewers: ['interviewer1@company.com', 'interviewer2@company.com'],
  time: '2:00 PM PST',
  location: 'Zoom Link: https://zoom.us/j/123456',
  type: 'video'
}, '#hr-interviews');
```

### Create Onboarding Channel
```typescript
const result = await SlackService.createOnboardingChannel(
  'John Doe',
  ['mentor@company.com', 'hr@company.com']
);
```

## Webhook Configuration (For Incoming Messages)

If you want to receive Slack messages in your app:

1. Create an API endpoint: `/api/slack/webhook`
2. Verify Slack requests using the signing secret
3. Process incoming events

Example webhook handler:
```typescript
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const timestamp = request.headers.get('X-Slack-Request-Timestamp');
  const signature = request.headers.get('X-Slack-Signature');
  
  // Verify request
  const sigBasestring = 'v0:' + timestamp + ':' + body;
  const mySignature = 'v0=' + crypto
    .createHmac('sha256', process.env.SLACK_SIGNING_SECRET!)
    .update(sigBasestring)
    .digest('hex');
    
  if (mySignature !== signature) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Process event
  const event = JSON.parse(body);
  // Handle different event types
  
  return new Response('OK', { status: 200 });
}
```

## Troubleshooting

### Common Issues:

1. **"not_authed" error**
   - Check if bot token is correct
   - Ensure app is installed to workspace

2. **"channel_not_found" error**
   - Bot must be invited to private channels
   - Use channel ID instead of name for reliability

3. **"missing_scope" error**
   - Add required OAuth scopes
   - Reinstall app to workspace

4. **Rate limiting**
   - Slack has rate limits per method
   - Implement exponential backoff
   - Cache user lookups

### Debug Mode

Enable debug logging:
```typescript
// Add to SlackService
static enableDebug() {
  axios.interceptors.request.use(request => {
    console.log('Slack Request:', request);
    return request;
  });
  
  axios.interceptors.response.use(
    response => {
      console.log('Slack Response:', response.data);
      return response;
    },
    error => {
      console.error('Slack Error:', error.response?.data);
      return Promise.reject(error);
    }
  );
}
```

## Best Practices

1. **Use Blocks for Rich Formatting**
   - More flexible than plain text
   - Better visual presentation
   - Interactive elements support

2. **Handle Errors Gracefully**
   - Always provide fallback options
   - Log errors for debugging
   - Don't let Slack failures break your app

3. **Respect Rate Limits**
   - Cache user lookups
   - Batch messages when possible
   - Implement retry logic

4. **Security**
   - Always verify webhook signatures
   - Never expose tokens in client code
   - Use environment variables

5. **Channel Management**
   - Create naming conventions
   - Archive old channels
   - Set channel purposes/topics