"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, FileText, Save, CheckCircle } from "lucide-react";

interface OnboardingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  step: {
    id: string;
    title: string;
    category: string;
  } | null;
}

export default function OnboardingFormModal({
  isOpen,
  onClose,
  onSubmit,
  step,
}: OnboardingFormModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Simulate upload/submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSubmit({
        ...formData,
        file: uploadedFile,
        submittedAt: new Date().toISOString(),
      });
      
      // Reset form
      setFormData({});
      setUploadedFile(null);
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setUploading(false);
    }
  };

  const renderFormContent = () => {
    if (!step) return null;

    switch (step.title) {
      case 'Sign Offer Letter':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I acknowledge that I have read and agree to the terms of the offer letter
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.acknowledged || false}
                  onChange={(e) => setFormData({ ...formData, acknowledged: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-sm text-gray-700">I agree to the terms</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature
              </label>
              <input
                type="text"
                placeholder="Type your full name"
                value={formData.signature || ""}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </>
        );

      case 'Complete NDA':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I agree to maintain confidentiality of all proprietary information
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.ndaAgreed || false}
                  onChange={(e) => setFormData({ ...formData, ndaAgreed: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-sm text-gray-700">I agree to the NDA terms</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digital Signature
              </label>
              <input
                type="text"
                placeholder="Type your full name"
                value={formData.signature || ""}
                onChange={(e) => setFormData({ ...formData, signature: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </>
        );

      case 'Submit Tax Forms':
        return (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filing Status
              </label>
              <select
                value={formData.filingStatus || ""}
                onChange={(e) => setFormData({ ...formData, filingStatus: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Select filing status</option>
                <option value="single">Single</option>
                <option value="married">Married filing jointly</option>
                <option value="married-separate">Married filing separately</option>
                <option value="head">Head of household</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Allowances
              </label>
              <input
                type="number"
                min="0"
                value={formData.allowances || 0}
                onChange={(e) => setFormData({ ...formData, allowances: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </>
        );

      default:
        if (step.category === 'documentation') {
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Document
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-2">
                  {uploadedFile ? uploadedFile.name : "Drag and drop or click to upload"}
                </p>
                <input
                  type="file"
                  onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-block px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  Select File
                </label>
              </div>
            </div>
          );
        } else {
          return (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mark as Complete
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.completed || false}
                  onChange={(e) => setFormData({ ...formData, completed: e.target.checked })}
                  className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-900"
                />
                <span className="ml-2 text-sm text-gray-700">I have completed this task</span>
              </label>
            </div>
          );
        }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && step && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-lg shadow-xl z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{step.title}</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              {renderFormContent()}
              
              {/* Submit Button */}
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Submit
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}