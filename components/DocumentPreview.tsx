"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Download, Share2, Printer, ZoomIn, ZoomOut, 
  RotateCw, FileText, ExternalLink, Copy, Mail,
  Calendar, User, Tag, Shield, History, Edit
} from "lucide-react";
import { getUrl } from "aws-amplify/storage";
import type { Schema } from "@/amplify/data/resource";

type Document = Schema["Document"]["type"];

interface DocumentPreviewProps {
  document: Document | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (doc: Document) => void;
  onShare?: (doc: Document) => void;
  onEdit?: (doc: Document) => void;
}

export default function DocumentPreview({
  document,
  isOpen,
  onClose,
  onDownload,
  onShare,
  onEdit
}: DocumentPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (document && isOpen) {
      loadPreview();
    }
  }, [document, isOpen]);

  const loadPreview = async () => {
    if (!document) return;
    
    setLoading(true);
    try {
      const url = await getUrl({
        key: document.fileKey,
        options: {
          expiresIn: 900 // 15 minutes
        }
      });
      setPreviewUrl(url.url.toString());
    } catch (error) {
      console.error("Error loading preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (previewUrl) {
      const printWindow = window.open(previewUrl, '_blank');
      printWindow?.print();
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Document: ${document?.name}`);
    const body = encodeURIComponent(`Here's the document you requested: ${previewUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "public": return "bg-green-100 text-green-700";
      case "internal": return "bg-blue-100 text-blue-700";
      case "confidential": return "bg-amber-100 text-amber-700";
      case "restricted": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (!document) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Preview Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-4 md:inset-8 bg-white rounded-lg shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <FileText className="w-6 h-6 text-gray-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{document.name}</h2>
                  <p className="text-sm text-gray-500">
                    {document.type.replace(/_/g, ' ')} • {(document.fileSize! / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={handleZoomOut}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-sm text-gray-600 px-2 min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <button
                    onClick={handleZoomIn}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* Action Buttons */}
                <button
                  onClick={handlePrint}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Print"
                >
                  <Printer className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={() => onDownload(document)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-gray-600" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-4 h-4 text-gray-600" />
                  </button>

                  {/* Share Menu */}
                  <AnimatePresence>
                    {showShareMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                      >
                        <button
                          onClick={handleCopyLink}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Link
                        </button>
                        <button
                          onClick={handleEmailShare}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Mail className="w-4 h-4" />
                          Email Document
                        </button>
                        <button
                          onClick={() => window.open(previewUrl, '_blank')}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Open in New Tab
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {onEdit && (
                  <button
                    onClick={() => onEdit(document)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4 text-gray-600" />
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Document Info Bar */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Uploaded by {document.uploadedBy}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {new Date(document.uploadDate).toLocaleDateString()}
                    </span>
                  </div>
                  {document.version && document.version > 1 && (
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Version {document.version}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {document.accessLevel && (
                    <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${getAccessLevelColor(document.accessLevel)}`}>
                      <Shield className="w-3 h-3" />
                      {document.accessLevel}
                    </span>
                  )}
                  {document.tags && document.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      {document.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-xs px-2 py-1 bg-gray-200 text-gray-700 rounded">
                          {tag}
                        </span>
                      ))}
                      {document.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{document.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-hidden bg-gray-100">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading preview...</p>
                  </div>
                </div>
              ) : document.mimeType?.includes('image') ? (
                // Image Preview
                <div className="flex items-center justify-center h-full p-8">
                  <img
                    src={previewUrl}
                    alt={document.name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ transform: `scale(${zoom / 100})` }}
                  />
                </div>
              ) : document.mimeType?.includes('pdf') ? (
                // PDF Preview
                <iframe
                  src={`${previewUrl}#zoom=${zoom}`}
                  className="w-full h-full"
                  title={document.name}
                />
              ) : (
                // Other file types - show download prompt
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Preview not available for this file type
                    </p>
                    <button
                      onClick={() => onDownload(document)}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Download className="w-4 h-4" />
                      Download to View
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}