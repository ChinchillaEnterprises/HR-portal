"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileText, X, CheckCircle, Loader2, Sparkles } from "lucide-react";
import { AIApplicantService } from "@/lib/aiApplicantService";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

interface ResumeUploadProps {
  onComplete?: (applicantData: any) => void;
}

export default function ResumeUpload({ onComplete }: ResumeUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [error, setError] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setError("");
      parseResume(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  const parseResume = async (resumeFile: File) => {
    setParsing(true);
    setError("");

    try {
      // Parse resume with AI
      const parsed = await AIApplicantService.parseResume(resumeFile);
      setParsedData(parsed);

      // Auto-fill applicant data
      if (onComplete) {
        const applicantData = {
          name: parsed.name,
          firstName: parsed.name.split(' ')[0],
          lastName: parsed.name.split(' ').slice(1).join(' '),
          email: parsed.email,
          phone: parsed.phone,
          location: parsed.location,
          position: "Software Engineer", // Default or extract from resume
          status: "NEW",
          appliedDate: new Date().toISOString(),
          skills: JSON.stringify(parsed.skills),
          experience: JSON.stringify(parsed.experience),
          education: JSON.stringify(parsed.education),
          yearsOfExperience: calculateYearsOfExperience(parsed.experience),
          resumeUrl: "", // Will be set after upload
          coverLetter: parsed.summary,
          availability: "immediate",
          salaryExpectation: "",
          referenceChecked: false,
          notes: `Resume parsed on ${new Date().toLocaleDateString()}`,
        };

        onComplete(applicantData);
      }
    } catch (err) {
      setError("Failed to parse resume. Please try again.");
      console.error("Resume parsing error:", err);
    } finally {
      setParsing(false);
    }
  };

  const calculateYearsOfExperience = (experience: any[]): number => {
    if (!experience || experience.length === 0) return 0;
    
    // Calculate based on earliest start date to latest end date
    const dates = experience.map(exp => ({
      start: new Date(exp.startDate || new Date()),
      end: exp.endDate === "present" ? new Date() : new Date(exp.endDate || new Date())
    }));

    const earliestStart = Math.min(...dates.map(d => d.start.getTime()));
    const latestEnd = Math.max(...dates.map(d => d.end.getTime()));
    
    return Math.round((latestEnd - earliestStart) / (1000 * 60 * 60 * 24 * 365));
  };

  const removeFile = () => {
    setFile(null);
    setParsedData(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {!file && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
            isDragActive 
              ? "border-purple-600 bg-purple-50" 
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-purple-900 font-medium">Drop the resume here...</p>
          ) : (
            <div>
              <p className="text-gray-900 font-medium mb-1">
                Upload Resume for AI Parsing
              </p>
              <p className="text-sm text-gray-500">
                Drag & drop or click to select (PDF, DOC, DOCX)
              </p>
              <p className="text-xs text-purple-600 mt-2">
                AI will automatically extract candidate information
              </p>
            </div>
          )}
        </div>
      )}

      {/* File Preview */}
      {file && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div>
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Parsing Status */}
          {parsing && (
            <div className="mt-4 flex items-center gap-3 text-purple-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">AI is analyzing the resume...</span>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsedData && !parsing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 space-y-3"
            >
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Resume parsed successfully!</span>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-purple-900">Extracted Information:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-purple-700">Name:</span>
                    <span className="ml-2 text-gray-900">{parsedData.name}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Email:</span>
                    <span className="ml-2 text-gray-900">{parsedData.email}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Phone:</span>
                    <span className="ml-2 text-gray-900">{parsedData.phone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-purple-700">Location:</span>
                    <span className="ml-2 text-gray-900">{parsedData.location || "N/A"}</span>
                  </div>
                </div>
                <div>
                  <span className="text-purple-700">Skills:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {parsedData.skills.slice(0, 6).map((skill: string, idx: number) => (
                      <span key={idx} className="px-2 py-1 bg-white rounded text-xs text-gray-700">
                        {skill}
                      </span>
                    ))}
                    {parsedData.skills.length > 6 && (
                      <span className="px-2 py-1 bg-white rounded text-xs text-gray-500">
                        +{parsedData.skills.length - 6} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}