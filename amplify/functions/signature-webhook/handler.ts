import { APIGatewayProxyHandler } from 'aws-lambda';
import crypto from 'crypto';

interface SignatureWebhookPayload {
  event: {
    event_time: string;
    event_type: string;
    event_hash: string;
    event_metadata: any;
  };
  signature_request: {
    signature_request_id: string;
    title: string;
    subject: string;
    message: string;
    is_complete: boolean;
    is_declined: boolean;
    has_error: boolean;
    signatures: Array<{
      signature_id: string;
      signer_email_address: string;
      signer_name: string;
      order: number;
      status_code: string;
      signed_at: number;
      last_viewed_at: number;
      last_reminded_at: number;
      has_pin: boolean;
      error?: string;
    }>;
    final_copy_uri?: string;
    files_url?: string;
    details_url?: string;
  };
  account: {
    account_id: string;
    email_address: string;
  };
}

// Verify webhook signature from Dropbox Sign
const verifyWebhookSignature = (eventTime: string, eventType: string, secret: string, signature: string): boolean => {
  // Dropbox Sign uses: sha256(event_time + event_type + webhook_key)
  const dataToSign = eventTime + eventType;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(dataToSign)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Parse the webhook payload
    const payload: SignatureWebhookPayload = JSON.parse(event.body || '{}');
    
    // Verify webhook signature
    const signature = event.headers['X-HelloSign-Signature'] || '';
    const webhookSecret = process.env.WEBHOOK_SECRET || '';
    const eventTime = payload.event.event_time;
    const eventType = payload.event.event_type;
    
    if (!verifyWebhookSignature(eventTime, eventType, webhookSecret, signature)) {
      console.error('Invalid webhook signature');
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const { signature_request } = payload;
    const signatureRequestId = signature_request.signature_request_id;

    // Log the webhook event
    console.log(`Received webhook event: ${eventType} for signature request: ${signatureRequestId}`);

    // Handle different event types
    switch (eventType) {
      case 'signature_request_viewed':
        console.log(`Document viewed by signer for request: ${signatureRequestId}`);
        // TODO: Update document status to "viewed"
        // TODO: Create notification for document owner
        break;

      case 'signature_request_signed':
        console.log(`Document signed by one signer for request: ${signatureRequestId}`);
        // TODO: Update document status to "partially_signed"
        // TODO: Create notification for document owner
        break;

      case 'signature_request_all_signed':
        console.log(`All signatures completed for request: ${signatureRequestId}`);
        // TODO: Update document status to "signed"
        // TODO: Download signed document and store in S3
        // TODO: Create notification for document owner
        // TODO: Update communication record
        break;

      case 'signature_request_declined':
        console.log(`Document signature declined for request: ${signatureRequestId}`);
        // TODO: Update document status to "declined"
        // TODO: Create notification for document owner
        // TODO: Log decline reason if available
        break;

      case 'signature_request_canceled':
        console.log(`Signature request canceled: ${signatureRequestId}`);
        // TODO: Update document status to "cancelled"
        // TODO: Create notification for relevant users
        break;

      case 'signature_request_reminded':
        console.log(`Reminder sent for signature request: ${signatureRequestId}`);
        // TODO: Log reminder activity
        break;

      case 'signature_request_reassigned':
        console.log(`Signature request reassigned: ${signatureRequestId}`);
        // TODO: Update signer information
        // TODO: Create notification for new signer
        break;

      default:
        console.log(`Unknown event type: ${eventType} for request: ${signatureRequestId}`);
        break;
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Webhook processed successfully',
        event_type: eventType,
        signature_request_id: signatureRequestId,
      }),
    };
  } catch (error) {
    console.error('Error processing Dropbox Sign webhook:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};