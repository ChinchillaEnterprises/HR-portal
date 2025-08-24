# LinkedIn API Integration Setup Guide

This guide walks you through setting up LinkedIn API integration for the Chinchilla Flow Portal.

## Prerequisites

- LinkedIn Developer account
- LinkedIn company page (for job posting features)
- Admin access to your organization's LinkedIn

## Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Click **"Create app"**
3. Fill in the required information:
   - **App name**: Chinchilla HR Portal
   - **LinkedIn Page**: Select your company page
   - **Privacy policy URL**: Your privacy policy URL
   - **App logo**: Upload your logo
4. Click **"Create app"**

## Step 2: Configure OAuth Settings

1. In your app dashboard, go to **"Auth"** tab
2. Add OAuth 2.0 redirect URLs:
   - Development: `http://localhost:3000/api/auth/callback/linkedin`
   - Production: `https://your-domain.com/api/auth/callback/linkedin`
3. Note your:
   - **Client ID**
   - **Client Secret**

## Step 3: Request API Access

LinkedIn requires verification for certain APIs:

### Basic Profile Access (Available Immediately)
- Sign In with LinkedIn
- Share on LinkedIn

### Additional APIs (Requires Verification)
1. Go to **"Products"** tab
2. Request access to:
   - **Sign In with LinkedIn** - For authentication
   - **Share on LinkedIn** - For posting updates
   - **Marketing Developer Platform** - For company updates (optional)

## Step 4: Update Environment Variables

Add to your `.env.local`:

```env
# LinkedIn API Configuration
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your-client-id
LINKEDIN_CLIENT_SECRET=your-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3000/api/auth/callback/linkedin

# Optional: Default company ID for job posts
LINKEDIN_COMPANY_ID=your-company-id
```

## Step 5: Initialize LinkedIn in Your App

```typescript
// In your app initialization
import { LinkedInService } from '@/lib/linkedinService';

// Initialize LinkedIn
LinkedInService.initialize({
  clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUri: process.env.LINKEDIN_REDIRECT_URI!,
});
```

## Usage Examples

### OAuth Flow

1. **Generate Authorization URL**
```typescript
const state = generateRandomString(); // CSRF protection
const authUrl = LinkedInService.getAuthorizationUrl(state);
// Redirect user to authUrl
```

2. **Handle Callback**
```typescript
// In /api/auth/callback/linkedin
const { code } = req.query;
const result = await LinkedInService.exchangeCodeForToken(code);
if (result.success) {
  // Store access token securely
  // Redirect to success page
}
```

### Import Profile

```typescript
// With access token
const result = await LinkedInService.importProfileToApplicant(accessToken);
if (result.success) {
  console.log('Created/updated applicant:', result.applicantId);
}
```

### Verify LinkedIn URL

```typescript
const result = await LinkedInService.verifyProfileUrl(
  'https://www.linkedin.com/in/johndoe'
);
if (result.valid) {
  console.log('Profile ID:', result.profileId);
}
```

### Extract LinkedIn from Resume

```typescript
const resumeText = await parseResume(file);
const linkedinUrl = LinkedInService.extractLinkedInFromResume(resumeText);
if (linkedinUrl) {
  // Found LinkedIn profile in resume
  await updateApplicant({ linkedinUrl });
}
```

### Share Job Opening

```typescript
const result = await LinkedInService.shareOnLinkedIn({
  text: 'We're hiring! Check out our new Software Engineer position.',
  title: 'Software Engineer - Chinchilla AI',
  description: 'Join our growing team...',
  url: 'https://careers.chinchilla.ai/software-engineer',
}, accessToken);
```

## Integration Features

### 1. Profile Import
- Import candidate data from LinkedIn
- Auto-fill application forms
- Verify professional information

### 2. Profile Verification
- Validate LinkedIn URLs
- Extract profile IDs
- Check profile existence

### 3. Resume Parsing
- Extract LinkedIn URLs from resumes
- Multiple pattern matching
- Intelligent parsing

### 4. Social Sharing
- Share job openings
- Post company updates
- Engage with candidates

### 5. Company Search
- Find companies by name
- Get company information
- Research candidate backgrounds

## Best Practices

### 1. Data Privacy
- Only request necessary permissions
- Store minimal data
- Allow users to disconnect
- Comply with LinkedIn's data policies

### 2. Rate Limiting
- LinkedIn has strict rate limits
- Implement caching
- Use batch operations when possible
- Handle 429 errors gracefully

### 3. Token Management
- Tokens expire after 60 days
- Implement token refresh
- Store tokens securely
- Handle expired tokens

### 4. User Experience
- Make LinkedIn optional
- Provide manual input alternatives
- Show clear value proposition
- Respect user privacy choices

## API Limitations

### Available with Basic Access
- Sign in with LinkedIn
- Basic profile data (name, email, profile picture)
- Share content

### Requires Additional Verification
- Full profile access
- Company page management
- Job posting
- InMail messaging

### Not Available
- Direct messaging (except InMail with Sales Navigator)
- Automated connection requests
- Profile scraping
- Bulk data export

## Troubleshooting

### "Unauthorized" Error
- Check if access token is valid
- Verify API permissions
- Ensure correct scope requested

### "Rate Limit Exceeded"
- Implement exponential backoff
- Cache API responses
- Reduce API calls

### "Invalid Request" Error
- Verify redirect URI matches exactly
- Check if all required parameters provided
- Ensure proper URL encoding

### Profile Import Issues
- User may have restricted profile
- Email might not be public
- Check API response for available fields

## Security Considerations

1. **OAuth State Parameter**
   - Always use state parameter for CSRF protection
   - Verify state on callback
   - Use cryptographically secure random values

2. **Token Storage**
   - Never store tokens in frontend code
   - Use secure session storage
   - Encrypt tokens at rest

3. **Scope Limitation**
   - Only request necessary scopes
   - Review permissions regularly
   - Allow users to revoke access

4. **Data Handling**
   - Minimize data storage
   - Implement data retention policies
   - Allow data deletion requests

## Compliance

### LinkedIn Platform Guidelines
- No automated profile viewing
- No unsolicited messaging
- Respect rate limits
- Proper attribution required

### GDPR Compliance
- Obtain user consent
- Provide data access
- Enable data deletion
- Document data usage

### Terms of Service
- Review LinkedIn API Terms
- Ensure compliance
- Monitor policy updates
- Implement required features

## Advanced Features

### Webhook Integration (Future)
```typescript
// Register webhook endpoint
const webhook = await LinkedInService.registerWebhook({
  url: 'https://your-domain.com/api/webhooks/linkedin',
  events: ['ORGANIZATION_SOCIAL_ACTION'],
});
```

### Analytics Integration
```typescript
// Track engagement metrics
const metrics = await LinkedInService.getPostAnalytics(postId);
console.log('Views:', metrics.views);
console.log('Likes:', metrics.likes);
```

### Batch Operations
```typescript
// Import multiple profiles
const profiles = ['profile1', 'profile2', 'profile3'];
const results = await Promise.all(
  profiles.map(url => LinkedInService.importProfile(url))
);
```

## Support Resources

1. [LinkedIn API Documentation](https://docs.microsoft.com/en-us/linkedin/)
2. [LinkedIn Developer Support](https://www.linkedin.com/help/linkedin)
3. [API Changelog](https://docs.microsoft.com/en-us/linkedin/shared/api-guide/changelog)
4. [Community Forum](https://www.linkedin.com/groups/LinkedIn-Developer-Community)