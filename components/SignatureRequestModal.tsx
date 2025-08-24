"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, FileSignature, Send, AlertCircle, User, Mail, MessageSquare } from "lucide-react";
import { SignatureService } from "@/lib/signatureService";
import { DropboxSignService } from "@/lib/dropboxSignService";
import type { Schema } from "@/amplify/data/resource";

type Document = Schema["Document"]["type"];

interface SignatureRequestModalProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SignatureRequestModal({
  document,
  isOpen,
  onClose,
  onSuccess,
}: SignatureRequestModalProps) {
  const [formData, setFormData] = useState({
    signerName: "",
    signerEmail: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    setLoading(true);
    setError("");

    try {
      // Check if Dropbox Sign is configured
      const useDropboxSign = process.env.NEXT_PUBLIC_DROPBOX_SIGN_API_KEY ? true : false;
      
      let result;
      if (useDropboxSign) {
        // Use real Dropbox Sign API
        result = await DropboxSignService.sendSignatureRequest({
          documentId: document.id,
          signerEmail: formData.signerEmail,
          signerName: formData.signerName,
          subject: formData.subject || `Please sign: ${document.name}`,
          message: formData.message || `You have been requested to sign the document: ${document.name}`,
          redirectUrl: `${window.location.origin}/documents?signed=${document.id}`,
          testMode: process.env.NODE_ENV !== 'production',
        });
      } else {
        // Use mock service
        result = await SignatureService.sendSignatureRequest({
          documentId: document.id,
          signerEmail: formData.signerEmail,
          signerName: formData.signerName,
          subject: formData.subject || `Please sign: ${document.name}`,
          message: formData.message || `You have been requested to sign the document: ${document.name}`,
        });
      }

      if (result.success) {
        onSuccess?.();
        onClose();
        // Reset form
        setFormData({
          signerName: "",
          signerEmail: "",
          subject: "",
          message: "",
        });
      } else {
        setError(result.error || "Failed to send signature request");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !document) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg bg-white rounded-lg shadow-xl z-50 flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Request Signature</h2>
            <p className="text-sm text-gray-600 mt-1">Send {document.name} for signature</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">Error</p>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Signer Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                Signer Name *
              </label>
              <input
                type="text"
                required
                value={formData.signerName}
                onChange={(e) => setFormData(prev => ({ ...prev, signerName: e.target.value }))}
                placeholder="John Doe"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Signer Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Signer Email *
              </label>
              <input
                type="email"
                required
                value={formData.signerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, signerEmail: e.target.value }))}
                placeholder="john@example.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder={`Please sign: ${document.name}`}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Message
              </label>
              <textarea
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Add a personal message to the signer..."
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send for Signature
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}