# Dropbox Sign (HelloSign) Integration Guide

## Prerequisites
- Dropbox Sign account (formerly HelloSign)
- API key and Client ID from Dropbox Sign dashboard
- Webhook endpoint configured

## Step 1: Create Dropbox Sign Account

1. Go to [Dropbox Sign](https://www.hellosign.com/dropbox-sign)
2. Sign up for an account (free trial available)
3. Choose a plan that includes API access

## Step 2: Get API Credentials

1. Log in to Dropbox Sign
2. Navigate to **Settings** → **API**
3. Generate a new API key
4. Copy your **API Key**
5. Copy your **Client ID** (for embedded signing)

## Step 3: Configure Webhook

1. In Dropbox Sign dashboard, go to **Settings** → **API** → **Webhook**
2. Set webhook URL:
   ```
   https://your-domain.com/api/signature-webhook
   ```
3. Copy the **Webhook Key** for verification

## Step 4: Update Environment Variables

Add to your `.env.local`:
```env
# Dropbox Sign Configuration
NEXT_PUBLIC_DROPBOX_SIGN_API_KEY=your_api_key_here
NEXT_PUBLIC_DROPBOX_SIGN_CLIENT_ID=your_client_id_here
DROPBOX_SIGN_WEBHOOK_SECRET=your_webhook_key_here
```

## Step 5: Test Configuration

### Test Mode
Dropbox Sign provides a test mode for development:
- All API calls in test mode are free
- Documents are watermarked with "NOT LEGALLY BINDING"
- Perfect for development and testing

### Send Test Signature Request
```typescript
import { DropboxSignService } from '@/lib/dropboxSignService';

const result = await DropboxSignService.sendSignatureRequest({
  documentId: 'test-doc-123',
  signerEmail: 'test@example.com',
  signerName: 'Test User',
  subject: 'Test Signature Request',
  message: 'Please sign this test document',
  testMode: true, // Important for testing!
});

console.log('Signature request:', result);
```

## Step 6: Webhook Handler Setup

The webhook handler is already configured in:
`/amplify/functions/signature-webhook/handler.ts`

### Webhook Events Handled:
- `signature_request_viewed` - Document viewed by signer
- `signature_request_signed` - Document signed by one signer
- `signature_request_all_signed` - All signers completed
- `signature_request_declined` - Signature declined
- `signature_request_reassigned` - Signer changed
- `signature_request_canceled` - Request cancelled

## Step 7: Production Deployment

### Lambda Function Configuration
```typescript
// amplify/functions/signature-webhook/resource.ts
export const signatureWebhook = defineFunction({
  name: 'signature-webhook',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    WEBHOOK_SECRET: process.env.DROPBOX_SIGN_WEBHOOK_SECRET,
  }
});
```

### API Gateway Setup
The webhook endpoint needs to be publicly accessible:
```typescript
// Add to amplify/backend.ts
import { RestApi } from 'aws-cdk-lib/aws-apigateway';

// Create API Gateway for webhook
const webhookApi = new RestApi(stack, 'SignatureWebhookApi', {
  restApiName: 'signature-webhook-api',
});

const webhookResource = webhookApi.root.addResource('signature-webhook');
webhookResource.addMethod('POST', new LambdaIntegration(signatureWebhook));
```

## Step 8: Document Upload Flow

1. User uploads document to S3 via Amplify Storage
2. Document record created in DynamoDB
3. When signature requested:
   - Get S3 presigned URL for document
   - Send to Dropbox Sign API
   - Store signature request ID
4. Track status via webhooks

## Step 9: Embedded Signing (Optional)

For in-app signing experience:

```typescript
// Get embedded signing URL
const embedResult = await DropboxSignService.createEmbeddedSigningUrl(
  signatureRequestId,
  signatureId
);

// Use HelloSign.open() in frontend
if (embedResult.success && embedResult.embedUrl) {
  HelloSign.open({
    url: embedResult.embedUrl,
    clientId: process.env.NEXT_PUBLIC_DROPBOX_SIGN_CLIENT_ID,
    skipDomainVerification: true, // For development
  });
}
```

Add HelloSign embedded library:
```html
<script src="https://cdn.hellosign.com/public/js/hellosign-embedded.LATEST.min.js"></script>
```

## Step 10: Production Checklist

- [ ] API key stored securely (not in client-side code)
- [ ] Webhook endpoint configured and verified
- [ ] SSL certificate valid for webhook URL
- [ ] Error handling for API failures
- [ ] Rate limiting implemented (Dropbox Sign has limits)
- [ ] Document storage in S3 configured
- [ ] Webhook signature verification enabled
- [ ] Test mode disabled for production
- [ ] Monitoring for failed signature requests
- [ ] Backup plan for API downtime

## API Rate Limits

Dropbox Sign enforces rate limits:
- **Starter**: 50 requests/hour
- **Essentials**: 500 requests/hour
- **Business**: 2000 requests/hour

Implement exponential backoff for rate limit errors.

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check API key is correct
2. **400 Bad Request**: Validate all required fields
3. **429 Too Many Requests**: Rate limit exceeded
4. **Webhook not received**: Check firewall/security groups
5. **Test mode watermark**: Ensure `test_mode: 0` in production

### Debug Tips:
```typescript
// Enable detailed logging
axios.interceptors.request.use(request => {
  console.log('Dropbox Sign Request:', request);
  return request;
});

axios.interceptors.response.use(
  response => {
    console.log('Dropbox Sign Response:', response);
    return response;
  },
  error => {
    console.error('Dropbox Sign Error:', error.response?.data);
    return Promise.reject(error);
  }
);
```

## Security Best Practices

1. **Never expose API key in frontend code**
2. **Always verify webhook signatures**
3. **Use HTTPS for all communications**
4. **Implement access control for signature requests**
5. **Log all signature activities for audit trail**
6. **Encrypt sensitive document metadata**
7. **Set document expiration dates**
8. **Implement IP allowlisting if possible**