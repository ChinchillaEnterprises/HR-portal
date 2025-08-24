"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, X, CheckCircle, AlertCircle, FileText, Image, FileCode } from "lucide-react";
import { uploadData } from "aws-amplify/storage";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  s3Key?: string;
}

interface DocumentUploadProps {
  onUploadComplete?: (documents: any[]) => void;
  acceptedFileTypes?: string[];
  maxFileSize?: number; // in MB
  category?: string;
  userId?: string;
}

export default function DocumentUpload({
  onUploadComplete,
  acceptedFileTypes = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg"],
  maxFileSize = 10,
  category = "general",
  userId
}: DocumentUploadProps) {
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes("image")) return Image;
    if (mimeType.includes("pdf")) return FileText;
    return FileCode;
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random()}`,
      progress: 0,
      status: "pending" as const
    }));
    setUploadQueue(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxSize: maxFileSize * 1024 * 1024
  });

  const removeFile = (id: string) => {
    setUploadQueue(prev => prev.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    setUploading(true);
    const uploadedDocs = [];

    for (const uploadFile of uploadQueue) {
      if (uploadFile.status === "success") continue;

      try {
        // Update status to uploading
        setUploadQueue(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "uploading" } : f
        ));

        // Generate unique S3 key
        const timestamp = new Date().toISOString().split('T')[0];
        const sanitizedFileName = uploadFile.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const s3Key = `documents/${category}/${timestamp}/${uploadFile.id}-${sanitizedFileName}`;

        // Upload to S3
        const result = await uploadData({
          key: s3Key,
          data: uploadFile.file,
          options: {
            contentType: uploadFile.file.type,
            onProgress: ({ transferredBytes, totalBytes }) => {
              if (totalBytes) {
                const progress = Math.round((transferredBytes / totalBytes) * 100);
                setUploadQueue(prev => prev.map(f => 
                  f.id === uploadFile.id ? { ...f, progress } : f
                ));
              }
            }
          }
        }).result;

        // Create document record in database
        const docType = getDocumentType(uploadFile.file.name);
        const docRecord = await client.models.Document.create({
          name: uploadFile.file.name,
          type: docType,
          category,
          fileUrl: result.key,
          fileKey: s3Key,
          fileSize: uploadFile.file.size,
          mimeType: uploadFile.file.type,
          uploadedBy: userId || "system",
          uploadDate: new Date().toISOString(),
          userId,
          version: 1,
          isActive: true,
          accessLevel: "internal",
          signatureRequired: docType === "contract" || docType === "offer_letter",
          signatureStatus: "not_sent"
        });

        uploadedDocs.push(docRecord.data);

        // Update status to success
        setUploadQueue(prev => prev.map(f => 
          f.id === uploadFile.id ? { ...f, status: "success", s3Key } : f
        ));

      } catch (error) {
        console.error("Upload error:", error);
        setUploadQueue(prev => prev.map(f => 
          f.id === uploadFile.id ? { 
            ...f, 
            status: "error", 
            error: error instanceof Error ? error.message : "Upload failed" 
          } : f
        ));
      }
    }

    setUploading(false);
    if (onUploadComplete && uploadedDocs.length > 0) {
      onUploadComplete(uploadedDocs);
    }
  };

  const getDocumentType = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'form';
    if (['doc', 'docx'].includes(ext || '')) return 'contract';
    if (['png', 'jpg', 'jpeg'].includes(ext || '')) return 'certificate';
    return 'other';
  };

  const hasFiles = uploadQueue.length > 0;
  const canUpload = hasFiles && !uploading && uploadQueue.some(f => f.status === "pending");

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragActive 
            ? "border-gray-900 bg-gray-50" 
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-gray-900 font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-gray-900 font-medium mb-1">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported: {acceptedFileTypes.join(", ")} (max {maxFileSize}MB)
            </p>
          </div>
        )}
      </div>

      {/* Upload Queue */}
      <AnimatePresence>
        {hasFiles && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">
                Upload Queue ({uploadQueue.length} files)
              </h3>
              {canUpload && (
                <button
                  onClick={uploadFiles}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload All
                </button>
              )}
            </div>

            {uploadQueue.map((uploadFile) => {
              const Icon = getFileIcon(uploadFile.file.type);
              
              return (
                <motion.div
                  key={uploadFile.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg"
                >
                  <Icon className="w-8 h-8 text-gray-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    {/* Progress Bar */}
                    {uploadFile.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadFile.progress}%` }}
                            className="bg-gray-900 h-1.5 rounded-full"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{uploadFile.progress}%</p>
                      </div>
                    )}

                    {uploadFile.error && (
                      <p className="text-xs text-red-600 mt-1">{uploadFile.error}</p>
                    )}
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0">
                    {uploadFile.status === "pending" && (
                      <button
                        onClick={() => removeFile(uploadFile.id)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    {uploadFile.status === "uploading" && (
                      <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                    )}
                    {uploadFile.status === "success" && (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    )}
                    {uploadFile.status === "error" && (
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}