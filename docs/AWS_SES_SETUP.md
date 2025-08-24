# AWS SES Configuration Guide

## Prerequisites
- AWS Account with appropriate IAM permissions
- Access to your domain's DNS settings
- AWS CLI configured (optional but recommended)

## Step 1: Domain Verification

### Via AWS Console:
1. Navigate to AWS SES in the AWS Console
2. Go to "Verified identities" → "Create identity"
3. Choose "Domain" and enter your domain (e.g., `chinchillaflow.com`)
4. Click "Create identity"

### Add DNS Records:
AWS will provide DNS records to add to your domain:

```
Type: TXT
Name: _amazonses.chinchillaflow.com
Value: [AWS will provide this]

Type: CNAME (for DKIM)
Name: [3 CNAME records provided by AWS]
Value: [3 corresponding values]
```

### Via AWS CLI:
```bash
# Verify domain
aws ses verify-domain-identity --domain chinchillaflow.com --region us-east-1

# Get verification token
aws ses get-identity-verification-attributes --identities chinchillaflow.com --region us-east-1
```

## Step 2: Enable DKIM Signing

```bash
# Enable DKIM
aws ses put-identity-dkim-attributes \
  --identity chinchillaflow.com \
  --dkim-enabled \
  --region us-east-1

# Get DKIM tokens
aws ses get-identity-dkim-attributes --identities chinchillaflow.com --region us-east-1
```

## Step 3: Configure Email Addresses

For the "From" address:
```bash
# Verify specific email address
aws ses verify-email-identity --email-address noreply@chinchillaflow.com --region us-east-1
```

## Step 4: Move Out of Sandbox (Production)

By default, SES is in sandbox mode. To send to unverified addresses:

1. Go to AWS SES Console
2. Click "Request production access"
3. Fill out the form with:
   - Use case description
   - Expected sending volume
   - How you handle bounces/complaints

## Step 5: Set Up Configuration Set (Recommended)

```bash
# Create configuration set for tracking
aws ses put-configuration-set \
  --configuration-set Name=chinchilla-flow-emails \
  --region us-east-1

# Add event publishing for tracking
aws ses put-configuration-set-event-destination \
  --configuration-set-name chinchilla-flow-emails \
  --event-destination Name=email-tracking \
    Enabled=true \
    CloudWatchDestination='{
      "DimensionConfigurations": [{
        "DimensionName": "MessageTag",
        "DimensionValueSource": "messageTag",
        "DefaultDimensionValue": "default"
      }]
    }' \
  --region us-east-1
```

## Step 6: Update Application Configuration

### Environment Variables:
```bash
# .env.local
EMAIL_FROM=noreply@chinchillaflow.com
EMAIL_REGION=us-east-1
SES_CONFIGURATION_SET=chinchilla-flow-emails
```

### Update Lambda Function:
The send-email Lambda function is already configured to use SES. Update the environment variables:

```typescript
// amplify/functions/send-email/resource.ts
export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@chinchillaflow.com',
    EMAIL_REGION: process.env.EMAIL_REGION || 'us-east-1',
    SES_CONFIGURATION_SET: process.env.SES_CONFIGURATION_SET || 'chinchilla-flow-emails'
  }
});
```

## Step 7: Handle Bounces and Complaints

### Create SNS Topics:
```bash
# Create bounce topic
aws sns create-topic --name ses-bounces --region us-east-1

# Create complaint topic
aws sns create-topic --name ses-complaints --region us-east-1

# Subscribe to topics (replace with your email)
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-bounces \
  --protocol email \
  --notification-endpoint admin@chinchillaflow.com

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-complaints \
  --protocol email \
  --notification-endpoint admin@chinchillaflow.com
```

### Configure SES Notifications:
```bash
# Set bounce notifications
aws ses put-identity-notification-topic \
  --identity chinchillaflow.com \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-bounces

# Set complaint notifications
aws ses put-identity-notification-topic \
  --identity chinchillaflow.com \
  --notification-type Complaint \
  --sns-topic arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:ses-complaints
```

## Step 8: Testing

### Test Email Sending:
```javascript
// test-email.js
import { generateClient } from 'aws-amplify/data';
import { EmailService } from './lib/emailService';

// Send test email
const result = await EmailService.sendWelcomeEmail({
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User'
});

console.log('Email sent:', result);
```

### Monitor in CloudWatch:
- Check CloudWatch Logs for Lambda function execution
- Monitor SES sending metrics
- Track bounce/complaint rates

## Step 9: Email Templates Best Practices

1. **SPF Record**: Add to DNS
   ```
   Type: TXT
   Name: @
   Value: "v=spf1 include:amazonses.com ~all"
   ```

2. **DMARC Record**: Add to DNS
   ```
   Type: TXT
   Name: _dmarc
   Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@chinchillaflow.com"
   ```

3. **Suppression List**: SES automatically manages this for bounces/complaints

## Step 10: Production Checklist

- [ ] Domain verified in SES
- [ ] DKIM enabled and DNS records added
- [ ] SPF record added
- [ ] DMARC record added (optional but recommended)
- [ ] Moved out of SES sandbox
- [ ] Configuration set created
- [ ] Bounce/complaint handling configured
- [ ] CloudWatch alarms set for high bounce rates
- [ ] Email templates tested
- [ ] Rate limiting implemented (SES limits apply)

## Troubleshooting

### Common Issues:
1. **554 Message rejected**: Email address not verified (sandbox mode)
2. **Invalid domain**: DNS records not propagated yet (wait 24-48 hours)
3. **Rate exceeded**: Implement exponential backoff
4. **Access denied**: Check IAM permissions for Lambda role

### Debug Commands:
```bash
# Check domain verification status
aws ses get-identity-verification-attributes --identities chinchillaflow.com

# Check sending statistics
aws ses get-send-statistics --region us-east-1

# Check current sending rate
aws ses describe-configuration-set --configuration-set-name chinchilla-flow-emails
```