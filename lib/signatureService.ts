import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

type Document = Schema["Document"]["type"];

export interface SignatureRequest {
  documentId: string;
  signerEmail: string;
  signerName: string;
  subject?: string;
  message?: string;
  redirectUrl?: string;
}

export interface SignatureWebhookPayload {
  event_type: 'signature_request_sent' | 'signature_request_viewed' | 'signature_request_signed' | 'signature_request_all_signed' | 'signature_request_declined';
  signature_request: {
    signature_request_id: string;
    title: string;
    subject: string;
    message: string;
    is_complete: boolean;
    is_declined: boolean;
    has_error: boolean;
    custom_fields: any[];
    response_data: any[];
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
      signer_role: string;
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
    use_text_tags: boolean;
    use_preexisting_fields: boolean;
    expires_at: number;
    original_title: string;
    title: string;
    message: string;
    metadata: any;
    created_at: number;
    is_qualified_signature: boolean;
    custom_fields: any[];
  };
  account: {
    account_id: string;
    email_address: string;
  };
  event: {
    event_time: string;
    event_type: string;
    event_hash: string;
    event_metadata: {
      related_signature_id: string;
      reported_for_account_id: string;
      reported_for_app_id: string;
      event_message: string;
    };
  };
}

export class SignatureService {
  // For now, we'll simulate the signature service
  // In production, this would integrate with Dropbox Sign API
  
  static async sendSignatureRequest(request: SignatureRequest): Promise<{
    success: boolean;
    signatureRequestId?: string;
    signingUrl?: string;
    error?: string;
  }> {
    try {
      // Update document with signature request info
      const document = await client.models.Document.get({ id: request.documentId });
      if (!document.data) {
        throw new Error("Document not found");
      }

      // Simulate sending signature request
      const signatureRequestId = `sig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const signingUrl = `https://app.hellosign.com/sign/${signatureRequestId}`;

      // Update document status
      await client.models.Document.update({
        id: request.documentId,
        signatureStatus: "pending",
        signatureRequestId,
        signatureMetadata: JSON.stringify({
          requestedAt: new Date().toISOString(),
          signerEmail: request.signerEmail,
          signerName: request.signerName,
          signingUrl,
        }),
      });

      // Create a communication record
      await client.models.Communication.create({
        type: "signature_request",
        recipientEmail: request.signerEmail,
        subject: request.subject || `Please sign: ${document.data.name}`,
        content: request.message || `You have been requested to sign the document: ${document.data.name}`,
        sentDate: new Date().toISOString(),
        status: "sent",
        relatedId: request.documentId,
        relatedType: "Document",
        metadata: JSON.stringify({
          signatureRequestId,
          signingUrl,
          documentName: document.data.name,
        }),
      });

      // Send notification to requester
      if (document.data.uploadedBy) {
        await client.models.Notification.create({
          type: "signature_required",
          title: "Signature Request Sent",
          message: `Signature request sent to ${request.signerName} for ${document.data.name}`,
          userId: document.data.uploadedBy,
          relatedId: request.documentId,
          relatedType: "Document",
          actionUrl: `/documents?highlight=${request.documentId}`,
          priority: "medium",
          read: false,
        });
      }

      console.log(`Signature request sent for document ${request.documentId} to ${request.signerEmail}`);
      
      return {
        success: true,
        signatureRequestId,
        signingUrl,
      };
    } catch (error) {
      console.error("Error sending signature request:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to send signature request",
      };
    }
  }

  static async checkSignatureStatus(documentId: string): Promise<{
    status: "not_sent" | "pending" | "signed" | "declined" | "expired";
    signedAt?: string;
    signerInfo?: any;
  }> {
    try {
      const document = await client.models.Document.get({ id: documentId });
      if (!document.data) {
        return { status: "not_sent" };
      }

      // In production, this would check with Dropbox Sign API
      return {
        status: document.data.signatureStatus || "not_sent",
        signedAt: document.data.signedDate || undefined,
        signerInfo: document.data.signatureMetadata ? JSON.parse(document.data.signatureMetadata) : undefined,
      };
    } catch (error) {
      console.error("Error checking signature status:", error);
      return { status: "not_sent" };
    }
  }

  static async handleWebhook(payload: SignatureWebhookPayload): Promise<void> {
    try {
      const { event_type, signature_request } = payload;
      
      // Find document by signature request ID
      const documents = await client.models.Document.list({
        filter: {
          signatureRequestId: { eq: signature_request.signature_request_id },
        },
      });

      if (documents.data.length === 0) {
        console.error("No document found for signature request:", signature_request.signature_request_id);
        return;
      }

      const document = documents.data[0];
      
      switch (event_type) {
        case 'signature_request_viewed':
          // Update metadata to track viewing
          const viewedMetadata = JSON.parse(document.signatureMetadata || "{}");
          viewedMetadata.lastViewedAt = new Date().toISOString();
          
          await client.models.Document.update({
            id: document.id,
            signatureMetadata: JSON.stringify(viewedMetadata),
          });
          break;

        case 'signature_request_signed':
        case 'signature_request_all_signed':
          // Update document as signed
          await client.models.Document.update({
            id: document.id,
            signatureStatus: "signed",
            signedDate: new Date().toISOString(),
            signatureMetadata: JSON.stringify({
              ...JSON.parse(document.signatureMetadata || "{}"),
              signedAt: new Date().toISOString(),
              finalCopyUrl: signature_request.final_copy_uri,
              signatures: signature_request.signatures,
            }),
          });

          // Create notification for document owner
          if (document.uploadedBy) {
            await client.models.Notification.create({
              type: "document_shared",
              title: "Document Signed",
              message: `${document.name} has been signed by all parties`,
              userId: document.uploadedBy,
              relatedId: document.id,
              relatedType: "Document",
              actionUrl: `/documents?highlight=${document.id}`,
              priority: "high",
              read: false,
            });
          }

          // Update communication record
          await client.models.Communication.create({
            type: "signature_completed",
            recipientEmail: signature_request.signatures[0].signer_email_address,
            subject: `Document signed: ${document.name}`,
            content: `The document "${document.name}" has been successfully signed by all parties.`,
            sentDate: new Date().toISOString(),
            status: "sent",
            relatedId: document.id,
            relatedType: "Document",
          });
          break;

        case 'signature_request_declined':
          // Update document as declined
          await client.models.Document.update({
            id: document.id,
            signatureStatus: "declined",
            signatureMetadata: JSON.stringify({
              ...JSON.parse(document.signatureMetadata || "{}"),
              declinedAt: new Date().toISOString(),
              declineReason: "User declined to sign",
            }),
          });

          // Create notification for document owner
          if (document.uploadedBy) {
            await client.models.Notification.create({
              type: "system",
              title: "Signature Declined",
              message: `${document.name} signature was declined`,
              userId: document.uploadedBy,
              relatedId: document.id,
              relatedType: "Document",
              actionUrl: `/documents?highlight=${document.id}`,
              priority: "high",
              read: false,
            });
          }
          break;
      }
    } catch (error) {
      console.error("Error handling signature webhook:", error);
    }
  }

  static async downloadSignedDocument(documentId: string): Promise<{
    success: boolean;
    fileUrl?: string;
    error?: string;
  }> {
    try {
      const document = await client.models.Document.get({ id: documentId });
      if (!document.data) {
        throw new Error("Document not found");
      }

      if (document.data.signatureStatus !== "signed") {
        throw new Error("Document is not signed yet");
      }

      const metadata = JSON.parse(document.data.signatureMetadata || "{}");
      
      // In production, this would download from Dropbox Sign
      // For now, return the original document URL
      return {
        success: true,
        fileUrl: metadata.finalCopyUrl || document.data.fileKey,
      };
    } catch (error) {
      console.error("Error downloading signed document:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to download signed document",
      };
    }
  }

  static async cancelSignatureRequest(documentId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const document = await client.models.Document.get({ id: documentId });
      if (!document.data) {
        throw new Error("Document not found");
      }

      // In production, this would cancel with Dropbox Sign API
      await client.models.Document.update({
        id: documentId,
        signatureStatus: "cancelled",
        signatureMetadata: JSON.stringify({
          ...JSON.parse(document.data.signatureMetadata || "{}"),
          cancelledAt: new Date().toISOString(),
        }),
      });

      return { success: true };
    } catch (error) {
      console.error("Error cancelling signature request:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to cancel signature request",
      };
    }
  }
}