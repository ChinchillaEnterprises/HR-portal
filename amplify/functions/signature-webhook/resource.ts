import { defineFunction } from '@aws-amplify/backend';

export const signatureWebhook = defineFunction({
  name: 'signature-webhook',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    WEBHOOK_SECRET: process.env.DROPBOX_SIGN_WEBHOOK_SECRET || 'webhook-secret',
    // Note: Table names will be accessed via data client
  }
});