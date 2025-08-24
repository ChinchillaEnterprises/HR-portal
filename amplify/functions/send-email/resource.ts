import { defineFunction } from '@aws-amplify/backend';

export const sendEmail = defineFunction({
  name: 'send-email',
  entry: './handler.ts',
  runtime: 20,
  timeoutSeconds: 30,
  environment: {
    EMAIL_FROM: 'noreply@chinchillaflow.com',
    EMAIL_REGION: 'us-east-1',
  }
});