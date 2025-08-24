"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, Download, Eye, Trash2, Edit, Search, 
  Filter, Upload, FolderOpen, Clock, CheckCircle,
  AlertCircle, MoreVertical, Share2, History,
  FileSignature, Calendar, Tag, X
} from "lucide-react";
import DocumentUpload from "@/components/DocumentUpload";
import DocumentPreview from "@/components/DocumentPreview";
import SignatureRequestModal from "@/components/SignatureRequestModal";
import { getUrl } from "aws-amplify/storage";
import { SignatureService } from "@/lib/signatureService";

const client = generateClient<Schema>();

type Document = Schema["Document"]["type"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatureDoc, setSignatureDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await client.models.Document.list({
        filter: { isActive: { eq: true } }
      });
      setDocuments(response.data);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadComplete = (newDocs: Document[]) => {
    setDocuments(prev => [...newDocs, ...prev]);
    setShowUpload(false);
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "contract":
      case "offer_letter":
        return FileSignature;
      case "policy":
      case "guide":
        return FileText;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "signed":
        return "text-green-600 bg-green-50";
      case "pending":
        return "text-amber-600 bg-amber-50";
      case "expired":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const url = await getUrl({
        key: doc.fileKey,
        options: {
          download: true,
          expiresIn: 900 // 15 minutes
        }
      });
      window.open(url.url.toString(), '_blank');
    } catch (error) {
      console.error("Error downloading document:", error);
    }
  };

  const handlePreview = async (doc: Document) => {
    try {
      const url = await getUrl({
        key: doc.fileKey,
        options: {
          expiresIn: 900 // 15 minutes
        }
      });
      window.open(url.url.toString(), '_blank');
    } catch (error) {
      console.error("Error previewing document:", error);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    try {
      await client.models.Document.update({
        id: doc.id,
        isActive: false
      });
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  const handleRequestSignature = (doc: Document) => {
    setSignatureDoc(doc);
    setShowSignatureModal(true);
  };

  const handleSignatureSuccess = () => {
    loadDocuments(); // Reload to show updated status
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "signed" && doc.signatureStatus === "signed") ||
                         (filterStatus === "pending" && doc.signatureStatus === "pending") ||
                         (filterStatus === "unsigned" && !doc.signatureRequired);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Group documents by category
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    const category = doc.category || "Uncategorized";
    if (!acc[category]) acc[category] = [];
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-gray-600 mt-1">Manage and track all your documents</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload Documents
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">{documents.length}</p>
            </div>
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Signatures</p>
              <p className="text-2xl font-bold text-amber-600">
                {documents.filter(d => d.signatureStatus === "pending").length}
              </p>
            </div>
            <FileSignature className="w-8 h-8 text-amber-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signed Documents</p>
              <p className="text-2xl font-bold text-green-600">
                {documents.filter(d => d.signatureStatus === "signed").length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Expiring Soon</p>
              <p className="text-2xl font-bold text-red-600">
                {documents.filter(d => {
                  if (!d.expirationDate) return false;
                  const days = Math.floor((new Date(d.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return days <= 30 && days > 0;
                }).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Types</option>
            <option value="contract">Contracts</option>
            <option value="offer_letter">Offer Letters</option>
            <option value="nda">NDAs</option>
            <option value="policy">Policies</option>
            <option value="form">Forms</option>
            <option value="guide">Guides</option>
            <option value="certificate">Certificates</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
          >
            <option value="all">All Status</option>
            <option value="signed">Signed</option>
            <option value="pending">Pending Signature</option>
            <option value="unsigned">No Signature Required</option>
          </select>

          {/* View Toggle */}
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "list" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-1 rounded transition-colors ${
                viewMode === "grid" ? "bg-gray-900 text-white" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {/* Documents List/Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No documents found</p>
          <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or upload new documents</p>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-6">
          {Object.entries(groupedDocuments).map(([category, docs]) => (
            <div key={category} className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-medium text-gray-900">{category}</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {docs.map((doc) => {
                  const Icon = getDocumentIcon(doc.type);
                  
                  return (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Icon className="w-10 h-10 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-sm text-gray-500">{doc.type.replace(/_/g, ' ')}</span>
                              <span className="text-sm text-gray-500">
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </span>
                              {doc.fileSize && (
                                <span className="text-sm text-gray-500">
                                  {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                                </span>
                              )}
                            </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                            )}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Tag className="w-3 h-3 text-gray-400" />
                                {doc.tags.map((tag, idx) => (
                                  <span key={idx} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {doc.signatureRequired && (
                            <span className={`text-sm px-3 py-1 rounded-full ${getStatusColor(doc.signatureStatus || "not_required")}`}>
                              {doc.signatureStatus === "signed" ? "Signed" : 
                               doc.signatureStatus === "pending" ? "Pending Signature" : 
                               doc.signatureStatus === "expired" ? "Expired" : "Not Required"}
                            </span>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedDoc(doc)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Preview"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Download"
                            >
                              <Download className="w-4 h-4 text-gray-600" />
                            </button>
                            {doc.signatureRequired && doc.signatureStatus !== "signed" && (
                              <button
                                onClick={() => handleRequestSignature(doc)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Request Signature"
                              >
                                <FileSignature className="w-4 h-4 text-blue-600" />
                              </button>
                            )}
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Share"
                            >
                              <Share2 className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Version History"
                            >
                              <History className="w-4 h-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(doc)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => {
            const Icon = getDocumentIcon(doc.type);
            
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedDoc(doc)}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8 text-gray-400" />
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                
                <h4 className="font-medium text-gray-900 truncate">{doc.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{doc.type.replace(/_/g, ' ')}</p>
                
                {doc.signatureRequired && (
                  <div className="mt-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(doc.signatureStatus || "not_required")}`}>
                      {doc.signatureStatus === "signed" ? "Signed" : "Pending"}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Eye className="w-3 h-3 text-gray-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(doc);
                      }}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <Download className="w-3 h-3 text-gray-600" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Document Preview Modal */}
      <DocumentPreview
        document={selectedDoc}
        isOpen={!!selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onDownload={handleDownload}
      />

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-20 bottom-20 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-3xl bg-white rounded-lg shadow-xl z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Upload Documents</h2>
                <button
                  onClick={() => setShowUpload(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto">
                <DocumentUpload
                  onUploadComplete={handleUploadComplete}
                  category="general"
                  userId="current-user" // TODO: Get from auth context
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Signature Request Modal */}
      <SignatureRequestModal
        document={signatureDoc}
        isOpen={showSignatureModal}
        onClose={() => {
          setShowSignatureModal(false);
          setSignatureDoc(null);
        }}
        onSuccess={handleSignatureSuccess}
      />
    </div>
  );
}