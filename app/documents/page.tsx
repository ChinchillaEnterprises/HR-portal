"use client";

import { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";
import { Authenticator } from "@aws-amplify/ui-react";
import Layout from "@/components/Layout";
import {
  FileText,
  Upload,
  Download,
  Search,
  Filter,
  Calendar,
  Tag,
  MoreVertical,
  File,
  FileCheck,
  FileClock,
  X,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Edit,
  Share2,
  FileSignature,
  FileX,
  Clock,
  User,
} from "lucide-react";
import { getAuthenticatedUser, hasPermission, type UserRole } from "@/lib/auth";

const client = generateClient<Schema>();

interface UploadFormData {
  name: string;
  type: "offer_letter" | "nda" | "contract" | "policy" | "form" | "guide";
  category: string;
  description: string;
  tags: string[];
  signatureRequired: boolean;
  targetUserId?: string;
}

function DocumentsPage({ user }: { user: any }) {
  const [documents, setDocuments] = useState<Array<Schema["Document"]["type"]>>([]);
  const [users, setUsers] = useState<Array<Schema["User"]["type"]>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Schema["Document"]["type"] | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("staff");
  const [currentUserId, setCurrentUserId] = useState("");
  const [formData, setFormData] = useState<UploadFormData>({
    name: "",
    type: "form",
    category: "",
    description: "",
    tags: [],
    signatureRequired: false,
    targetUserId: "",
  });
  const [tagInput, setTagInput] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const authUser = await getAuthenticatedUser();
      if (authUser) {
        setUserRole(authUser.role);
        setCurrentUserId(authUser.id);
      }
      
      const [docsResponse, usersResponse] = await Promise.all([
        client.models.Document.list(),
        client.models.User.list(),
      ]);
      
      // Filter documents based on role
      const filteredDocs = userRole === "admin" || userRole === "mentor" || userRole === "team_lead"
        ? docsResponse.data
        : docsResponse.data.filter(d => d.uploadedBy === currentUserId || d.userId === currentUserId);
      
      setDocuments(filteredDocs);
      setUsers(usersResponse.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      // Simulate file upload - in real app, would upload to S3
      const mockFileUrl = `https://example.com/documents/${Date.now()}_${formData.name.replace(/\s+/g, '_')}`;
      
      await client.models.Document.create({
        name: formData.name,
        type: formData.type,
        category: formData.category,
        fileUrl: mockFileUrl,
        uploadedBy: currentUserId,
        uploadDate: new Date().toISOString(),
        description: formData.description,
        tags: formData.tags.length > 0 ? formData.tags : null,
        signatureRequired: formData.signatureRequired,
        signatureStatus: formData.signatureRequired ? "pending" : null,
        userId: formData.targetUserId || null,
      });
      
      setShowUploadModal(false);
      setFormData({
        name: "",
        type: "form",
        category: "",
        description: "",
        tags: [],
        signatureRequired: false,
        targetUserId: "",
      });
      setTagInput("");
      fetchData();
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      try {
        await client.models.Document.delete({ id: docId });
        fetchData();
      } catch (error) {
        console.error("Error deleting document:", error);
      }
    }
  };

  const handleSignDocument = async (docId: string) => {
    try {
      await client.models.Document.update({
        id: docId,
        signatureStatus: "signed",
      });
      fetchData();
    } catch (error) {
      console.error("Error signing document:", error);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  const getDocumentIcon = (type?: string) => {
    switch (type) {
      case "offer_letter":
      case "contract":
        return <FileCheck className="w-5 h-5 text-green-600" />;
      case "nda":
        return <FileSignature className="w-5 h-5 text-yellow-600" />;
      case "policy":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "form":
        return <File className="w-5 h-5 text-purple-600" />;
      default:
        return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "signed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = 
      doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tags?.some(tag => tag?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || 
      (filterStatus === "signed" && doc.signatureStatus === "signed") ||
      (filterStatus === "pending" && doc.signatureStatus === "pending") ||
      (filterStatus === "no_signature" && !doc.signatureRequired);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const canUpload = hasPermission(userRole, "canUploadDocuments");
  const canDelete = userRole === "admin";

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          {canUpload && (
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center"
            >
              <Upload className="w-5 h-5 mr-2" />
              Upload Document
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Signatures</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.signatureStatus === "pending").length}
                </p>
              </div>
              <FileClock className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Signed Documents</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => d.signatureStatus === "signed").length}
                </p>
              </div>
              <FileCheck className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {documents.filter(d => {
                    const uploadDate = new Date(d.uploadDate || d.createdAt);
                    const now = new Date();
                    return uploadDate.getMonth() === now.getMonth() && 
                           uploadDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="offer_letter">Offer Letters</option>
              <option value="nda">NDAs</option>
              <option value="contract">Contracts</option>
              <option value="policy">Policies</option>
              <option value="form">Forms</option>
              <option value="guide">Guides</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="signed">Signed</option>
              <option value="pending">Pending Signature</option>
              <option value="no_signature">No Signature Required</option>
            </select>
          </div>
        </div>

        {/* Documents Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getDocumentIcon(doc.type || undefined)}
                    <h3 className="ml-3 font-semibold text-gray-900 truncate max-w-[200px]" title={doc.name}>
                      {doc.name}
                    </h3>
                  </div>
                  <div className="relative group">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 hidden group-hover:block">
                      <button
                        onClick={() => {
                          setSelectedDocument(doc);
                          setShowDetailsModal(true);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                      {doc.signatureRequired && doc.signatureStatus === "pending" && (
                        <button
                          onClick={() => handleSignDocument(doc.id)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center"
                        >
                          <FileSignature className="w-4 h-4 mr-2" />
                          Sign Document
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {doc.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(doc.uploadDate || doc.createdAt).toLocaleDateString()}
                  </div>
                  
                  {doc.userId && (
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      {users.find(u => u.id === doc.userId)?.firstName} {users.find(u => u.id === doc.userId)?.lastName}
                    </div>
                  )}
                  
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex items-center flex-wrap gap-2">
                      {doc.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {doc.signatureStatus && (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(doc.signatureStatus)}`}>
                      {doc.signatureStatus === "signed" ? (
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                      ) : doc.signatureStatus === "pending" ? (
                        <Clock className="w-3 h-3 inline mr-1" />
                      ) : (
                        <AlertCircle className="w-3 h-3 inline mr-1" />
                      )}
                      {doc.signatureStatus}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 capitalize">
                    {doc.type?.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredDocuments.length === 0 && !loading && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No documents found</p>
            {canUpload && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="mt-4 text-black hover:text-gray-700 font-medium"
              >
                Upload your first document →
              </button>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Upload Document</h2>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({
                      name: "",
                      type: "form",
                      category: "",
                      description: "",
                      tags: [],
                      signatureRequired: false,
                      targetUserId: "",
                    });
                    setTagInput("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drag and drop your file here, or click to browse</p>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    Choose File
                  </button>
                  <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX up to 10MB</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Enter document name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="offer_letter">Offer Letter</option>
                      <option value="nda">NDA</option>
                      <option value="contract">Contract</option>
                      <option value="policy">Policy</option>
                      <option value="form">Form</option>
                      <option value="guide">Guide</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="e.g., HR, Legal, Training"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Brief description of the document"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Add tags..."
                    />
                    <button
                      onClick={handleAddTag}
                      type="button"
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="ml-2 text-gray-500 hover:text-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {(userRole === "admin" || userRole === "mentor" || userRole === "team_lead") && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assign to User (Optional)
                    </label>
                    <select
                      value={formData.targetUserId}
                      onChange={(e) => setFormData({ ...formData, targetUserId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    >
                      <option value="">Select a user...</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="signatureRequired"
                    checked={formData.signatureRequired}
                    onChange={(e) => setFormData({ ...formData, signatureRequired: e.target.checked })}
                    className="w-4 h-4 text-black focus:ring-black border-gray-300 rounded"
                  />
                  <label htmlFor="signatureRequired" className="ml-2 text-sm text-gray-700">
                    This document requires a signature
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setFormData({
                      name: "",
                      type: "form",
                      category: "",
                      description: "",
                      tags: [],
                      signatureRequired: false,
                      targetUserId: "",
                    });
                    setTagInput("");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadDocument}
                  disabled={!formData.name}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Document Details Modal */}
        {showDetailsModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Document Details</h2>
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedDocument(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  {getDocumentIcon(selectedDocument.type || undefined)}
                  <div>
                    <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
                    <p className="text-sm text-gray-500 capitalize">{selectedDocument.type?.replace("_", " ")}</p>
                  </div>
                </div>

                {selectedDocument.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                    <p className="text-gray-600">{selectedDocument.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Uploaded By</h4>
                    <p className="text-gray-600">
                      {users.find(u => u.id === selectedDocument.uploadedBy)?.firstName}{" "}
                      {users.find(u => u.id === selectedDocument.uploadedBy)?.lastName}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Upload Date</h4>
                    <p className="text-gray-600">
                      {new Date(selectedDocument.uploadDate || selectedDocument.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {selectedDocument.userId && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Assigned To</h4>
                    <p className="text-gray-600">
                      {users.find(u => u.id === selectedDocument.userId)?.firstName}{" "}
                      {users.find(u => u.id === selectedDocument.userId)?.lastName}
                    </p>
                  </div>
                )}

                {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedDocument.tags.map((tag, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDocument.signatureRequired && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Signature Status</h4>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(selectedDocument.signatureStatus || undefined)}`}>
                      {selectedDocument.signatureStatus === "signed" ? (
                        <CheckCircle className="w-4 h-4 mr-1" />
                      ) : selectedDocument.signatureStatus === "pending" ? (
                        <Clock className="w-4 h-4 mr-1" />
                      ) : (
                        <AlertCircle className="w-4 h-4 mr-1" />
                      )}
                      {selectedDocument.signatureStatus}
                    </span>
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <a
                    href={selectedDocument.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                  {selectedDocument.signatureRequired && selectedDocument.signatureStatus === "pending" && (
                    <button
                      onClick={() => {
                        handleSignDocument(selectedDocument.id);
                        setShowDetailsModal(false);
                      }}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center"
                    >
                      <FileSignature className="w-4 h-4 mr-2" />
                      Sign Document
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default function DocumentsPageWrapper() {
  return (
    <Authenticator>
      {({ signOut, user }) => <DocumentsPage user={user} />}
    </Authenticator>
  );
}