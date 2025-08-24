# Chinchilla HR Portal - Setup Guide

## Quick Start

### 1. Choose Your Authentication Mode

This app supports two authentication modes:

#### Option A: Mock Authentication (Development/Demo)
- Quick setup, no AWS required
- Any email/password combination works
- Good for testing and demos

#### Option B: Real Authentication (Production)
- Uses AWS Cognito
- Requires AWS account and Amplify deployment
- Full security features including invitation-only access

### 2. Environment Setup

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and set your authentication mode:

For **Mock Auth** (Development):
```env
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

For **Real Auth** (Production):
```env
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

### 3. For Real Authentication (AWS Cognito)

If using real authentication, you need to deploy the AWS backend:

1. Install AWS Amplify CLI:
```bash
npm install -g @aws-amplify/cli-internal
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Deploy the backend:
```bash
npx ampx sandbox
# Or for production:
npx ampx sandbox --once
```

4. Wait for deployment to complete (5-10 minutes)

### 4. Start the Application

```bash
npm install
npm run dev
```

## Default Credentials

### Mock Authentication Mode
- **Any email/password combination works**
- Recommended test account:
  - Email: `admin@chinchilla.ai`
  - Password: `Test123!`

### Real Authentication Mode
- Initial admin account:
  - Email: `admin@chinchilla.ai`
  - Password: `Test123!`
- New users must be invited through the app

## Troubleshooting

### "Failed to load users/documents/etc"
- **Cause**: Backend not deployed or misconfigured
- **Solution**: 
  1. Check if using mock auth: `NEXT_PUBLIC_USE_MOCK_AUTH=true`
  2. Or deploy backend: `npx ampx sandbox`

### "Cannot read properties of undefined"
- **Cause**: Amplify not configured
- **Solution**: Ensure `amplify_outputs.json` exists after running `npx ampx sandbox`

### "Network error" or API failures
- **Cause**: AWS resources not accessible
- **Solution**: 
  1. Check AWS credentials: `aws sts get-caller-identity`
  2. Verify correct region in `amplify_outputs.json`
  3. Use mock auth for local development

### Login page shows Amplify UI instead of custom page
- **Cause**: AuthWrapper using real Amplify Authenticator
- **Solution**: Set `NEXT_PUBLIC_USE_MOCK_AUTH=true` for custom login UI

## Development Tips

1. **Start with Mock Auth**: Use mock authentication for initial development
2. **Test Features First**: Ensure all features work before deploying to AWS
3. **Deploy When Ready**: Switch to real auth when ready for production

## Next Steps

1. Login with test credentials
2. Navigate to "People" to add team members
3. Send invitations to new users (real auth mode only)
4. Explore all features: Documents, Onboarding, Reports, etc.

## Need Help?

- Check the [README.md](./README.md) for feature documentation
- Review error messages in browser console
- Ensure all environment variables are set correctly