# Gmail API Setup Guide for Chinchilla Flow Portal

## Prerequisites

1. Google Cloud Platform (GCP) Account
2. AWS Amplify Gen2 application
3. Domain verification (for production use)

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project: "Chinchilla Flow Portal"
3. Note the Project ID for later use

## Step 2: Enable Gmail API

1. In the GCP Console, go to "APIs & Services" → "Library"
2. Search for "Gmail API"
3. Click on Gmail API and press "Enable"

## Step 3: Configure OAuth 2.0

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen first:
   - User Type: Internal (for organization) or External (for public)
   - App name: Chinchilla Flow Portal
   - User support email: [your-email]
   - Authorized domains: [your-domain.com]
   - Developer contact: [your-email]

4. For OAuth client ID:
   - Application type: Web application
   - Name: Chinchilla Flow Portal Web Client
   - Authorized JavaScript origins:
     - http://localhost:3000 (development)
     - https://[your-amplify-domain].amplifyapp.com (production)
   - Authorized redirect URIs:
     - http://localhost:3000/api/auth/callback/google
     - https://[your-amplify-domain].amplifyapp.com/api/auth/callback/google

5. Save the Client ID and Client Secret

## Step 4: Gmail API Scopes

Required scopes for our application:
- `https://www.googleapis.com/auth/gmail.readonly` - Read emails
- `https://www.googleapis.com/auth/gmail.send` - Send emails
- `https://www.googleapis.com/auth/gmail.compose` - Create drafts
- `https://www.googleapis.com/auth/gmail.modify` - Mark as read/unread

## Step 5: Store Credentials in AWS

1. Go to AWS Systems Manager → Parameter Store
2. Create parameters:
   - `/amplify/[app-id]/[branch]/GOOGLE_CLIENT_ID`
   - `/amplify/[app-id]/[branch]/GOOGLE_CLIENT_SECRET`

## Step 6: Update Amplify Environment Variables

Add to your Amplify app environment:
```bash
GOOGLE_CLIENT_ID=[your-client-id]
GOOGLE_CLIENT_SECRET=[your-client-secret]
NEXTAUTH_URL=https://[your-domain].amplifyapp.com
NEXTAUTH_SECRET=[generate-random-string]
```

## Implementation Checklist

- [ ] Create GCP Project
- [ ] Enable Gmail API
- [ ] Configure OAuth consent screen
- [ ] Create OAuth 2.0 credentials
- [ ] Store credentials in AWS Parameter Store
- [ ] Update Amplify environment variables
- [ ] Implement OAuth flow in Next.js
- [ ] Create Gmail service wrapper
- [ ] Build email UI components

## Security Considerations

1. Never commit credentials to git
2. Use environment variables for all secrets
3. Implement proper token refresh logic
4. Add rate limiting for API calls
5. Log all email access for audit trail

## Next Steps

After completing the setup:
1. Implement NextAuth.js with Google provider
2. Create Gmail API service class
3. Build email inbox UI
4. Add email sending functionality