import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import axios from 'axios';
import { SlackService } from "./slackService";

const client = generateClient<Schema>();

type Document = Schema["Document"]["type"];

interface DropboxSignConfig {
  apiKey: string;
  clientId: string;
  testMode?: boolean;
}

interface SignatureRequestOptions {
  documentId: string;
  signerEmail: string;
  signerName: string;
  subject?: string;
  message?: string;
  redirectUrl?: string;
  fileUrl?: string;
  testMode?: boolean;
}

interface DropboxSignResponse {
  signature_request: {
    signature_request_id: string;
    title: string;
    subject: string;
    message: string;
    is_complete: boolean;
    is_declined: boolean;
    has_error: boolean;
    signing_url: string;
    signing_redirect_url: string;
    final_copy_uri: string;
    files_url: string;
    details_url: string;
    requester_email_address: string;
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
      has_sms_auth: boolean;
      has_sms_delivery: boolean;
      sms_phone_number: string;
      reassigned_by: string;
      reassignment_reason: string;
      error: string;
    }>;
    cc_email_addresses: string[];
    custom_fields: any[];
    response_data: any[];
    metadata: any;
  };
}

export class DropboxSignService {
  private static apiKey = process.env.NEXT_PUBLIC_DROPBOX_SIGN_API_KEY;
  private static baseUrl = 'https://api.hellosign.com/v3';
  
  static async sendSignatureRequest(options: SignatureRequestOptions): Promise<{
    success: boolean;
    signatureRequestId?: string;
    signingUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Dropbox Sign API key not configured');
      }

      // Get document from database
      const document = await client.models.Document.get({ id: options.documentId });
      if (!document.data) {
        throw new Error("Document not found");
      }

      // Prepare form data for Dropbox Sign API
      const formData = new FormData();
      formData.append('client_id', process.env.NEXT_PUBLIC_DROPBOX_SIGN_CLIENT_ID || '');
      formData.append('title', document.data.name);
      formData.append('subject', options.subject || `Please sign: ${document.data.name}`);
      formData.append('message', options.message || `You have been requested to sign the document: ${document.data.name}`);
      formData.append('signers[0][email_address]', options.signerEmail);
      formData.append('signers[0][name]', options.signerName);
      formData.append('signers[0][order]', '0');
      
      if (options.testMode || process.env.NODE_ENV !== 'production') {
        formData.append('test_mode', '1');
      }

      // Add file URL or upload file
      if (options.fileUrl) {
        formData.append('file_url[0]', options.fileUrl);
      } else {
        // In production, you would fetch the file from S3 and upload it
        // For now, we'll use a placeholder
        formData.append('file_url[0]', `https://your-bucket.s3.amazonaws.com/${document.data.fileKey}`);
      }

      // Set redirect URL if provided
      if (options.redirectUrl) {
        formData.append('signing_redirect_url', options.redirectUrl);
      }

      // Add metadata
      formData.append('metadata[document_id]', options.documentId);
      formData.append('metadata[uploaded_by]', document.data.uploadedBy || 'system');

      // Send request to Dropbox Sign API
      const response = await axios.post<DropboxSignResponse>(
        `${this.baseUrl}/signature_request/send`,
        formData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      const signatureRequest = response.data.signature_request;

      // Update document with signature request info
      await client.models.Document.update({
        id: options.documentId,
        signatureStatus: "pending",
        signatureRequestId: signatureRequest.signature_request_id,
        signatureMetadata: JSON.stringify({
          requestedAt: new Date().toISOString(),
          signerEmail: options.signerEmail,
          signerName: options.signerName,
          signingUrl: signatureRequest.signing_url,
          isTestMode: options.testMode || false,
        }),
      });

      // Create a communication record
      await client.models.Communication.create({
        type: "signature_request",
        recipientEmail: options.signerEmail,
        subject: options.subject || `Please sign: ${document.data.name}`,
        content: options.message || `You have been requested to sign the document: ${document.data.name}`,
        sentDate: new Date().toISOString(),
        status: "sent",
        relatedId: options.documentId,
        relatedType: "Document",
        metadata: JSON.stringify({
          signatureRequestId: signatureRequest.signature_request_id,
          signingUrl: signatureRequest.signing_url,
          documentName: document.data.name,
          dropboxSign: true,
        }),
      });

      // Send notification to requester
      if (document.data.uploadedBy) {
        await client.models.Notification.create({
          type: "signature_required",
          title: "Signature Request Sent",
          message: `Signature request sent to ${options.signerName} for ${document.data.name}`,
          userId: document.data.uploadedBy,
          relatedId: options.documentId,
          relatedType: "Document",
          actionUrl: `/documents?highlight=${options.documentId}`,
          priority: "medium",
          read: false,
        });
      }

      // Send Slack notification
      try {
        await SlackService.sendSignatureNotification(
          document.data.name,
          options.signerName,
          options.signerEmail
        );
      } catch (error) {
        console.warn("Failed to send Slack signature notification:", error);
      }

      console.log(`✅ Signature request sent via Dropbox Sign: ${signatureRequest.signature_request_id}`);
      
      return {
        success: true,
        signatureRequestId: signatureRequest.signature_request_id,
        signingUrl: signatureRequest.signing_url,
      };
    } catch (error) {
      console.error("Error sending signature request:", error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.error?.error_msg || error.message;
        return {
          success: false,
          error: `Dropbox Sign API error: ${errorMessage}`,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send signature request",
      };
    }
  }

  static async getSignatureRequestStatus(signatureRequestId: string): Promise<{
    status: "not_sent" | "pending" | "signed" | "declined" | "cancelled";
    signedAt?: string;
    signerInfo?: any;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Dropbox Sign API key not configured');
      }

      const response = await axios.get<DropboxSignResponse>(
        `${this.baseUrl}/signature_request/${signatureRequestId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          }
        }
      );

      const signatureRequest = response.data.signature_request;
      
      let status: "not_sent" | "pending" | "signed" | "declined" | "cancelled" = "pending";
      let signedAt: string | undefined;

      if (signatureRequest.is_complete) {
        status = "signed";
        const signer = signatureRequest.signatures[0];
        if (signer && signer.signed_at) {
          signedAt = new Date(signer.signed_at * 1000).toISOString();
        }
      } else if (signatureRequest.is_declined) {
        status = "declined";
      } else if (signatureRequest.has_error) {
        status = "cancelled";
      }

      return {
        status,
        signedAt,
        signerInfo: signatureRequest.signatures[0],
      };
    } catch (error) {
      console.error("Error checking signature status:", error);
      
      if (axios.isAxiosError(error)) {
        return {
          status: "pending",
          error: error.response?.data?.error?.error_msg || error.message,
        };
      }
      
      return {
        status: "pending",
        error: error instanceof Error ? error.message : "Failed to check status",
      };
    }
  }

  static async downloadSignedDocument(signatureRequestId: string): Promise<{
    success: boolean;
    fileUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Dropbox Sign API key not configured');
      }

      // Get download URL from Dropbox Sign
      const response = await axios.get(
        `${this.baseUrl}/signature_request/files/${signatureRequestId}`,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          },
          responseType: 'blob',
        }
      );

      // In a real implementation, you would:
      // 1. Save the file to S3
      // 2. Update the document record with the signed file URL
      // 3. Return the S3 URL
      
      // For now, return a success indicator
      return {
        success: true,
        fileUrl: `signed-document-${signatureRequestId}`,
      };
    } catch (error) {
      console.error("Error downloading signed document:", error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error?.error_msg || error.message,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download document",
      };
    }
  }

  static async cancelSignatureRequest(signatureRequestId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Dropbox Sign API key not configured');
      }

      await axios.post(
        `${this.baseUrl}/signature_request/cancel/${signatureRequestId}`,
        {},
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          }
        }
      );

      // Update document status
      const documents = await client.models.Document.list({
        filter: {
          signatureRequestId: { eq: signatureRequestId },
        },
      });

      if (documents.data.length > 0) {
        const document = documents.data[0];
        await client.models.Document.update({
          id: document.id,
          signatureStatus: "cancelled",
          signatureMetadata: JSON.stringify({
            ...JSON.parse(document.signatureMetadata || "{}"),
            cancelledAt: new Date().toISOString(),
          }),
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error cancelling signature request:", error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error?.error_msg || error.message,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel request",
      };
    }
  }

  static async createEmbeddedSigningUrl(signatureRequestId: string, signatureId: string): Promise<{
    success: boolean;
    embedUrl?: string;
    error?: string;
  }> {
    try {
      if (!this.apiKey) {
        throw new Error('Dropbox Sign API key not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/embedded/sign_url/${signatureId}`,
        {},
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
          }
        }
      );

      return {
        success: true,
        embedUrl: response.data.embedded.sign_url,
      };
    } catch (error) {
      console.error("Error creating embedded signing URL:", error);
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.error?.error_msg || error.message,
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create signing URL",
      };
    }
  }
}