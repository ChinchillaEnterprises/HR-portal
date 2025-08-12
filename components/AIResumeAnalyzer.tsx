"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Brain,
  Zap,
  BarChart3,
  Target,
  Award,
  Briefcase,
  GraduationCap,
  Globe,
  Shield
} from "lucide-react";
import { aiService, type ResumeAnalysisResult } from "@/lib/ai-service";

interface AIResumeAnalyzerProps {
  applicantId: string;
  position: string;
  onAnalysisComplete?: (analysis: ResumeAnalysisResult) => void;
}

export default function AIResumeAnalyzer({ 
  applicantId, 
  position, 
  onAnalysisComplete 
}: AIResumeAnalyzerProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysisResult | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const positionRequirements = {
    position,
    requiredSkills: ["JavaScript", "React", "Node.js", "AWS"],
    preferredSkills: ["TypeScript", "GraphQL", "Docker", "CI/CD"],
    minExperience: 3,
    education: "Bachelor's in Computer Science or related field",
    certifications: ["AWS Certified", "Azure Certified"]
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFile(file);
      setError(null);
    }
  };

  const analyzeResume = async () => {
    if (!resumeFile) {
      setError("Please upload a resume first");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // In production, upload the file to S3 first
      const resumeUrl = URL.createObjectURL(resumeFile); // Mock URL

      const result = await aiService.analyzeResume(
        resumeUrl,
        positionRequirements,
        applicantId
      );

      setAnalysis(result);
      onAnalysisComplete?.(result);
    } catch (err) {
      setError("Failed to analyze resume. Please try again.");
      console.error("Resume analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-600";
    if (score >= 60) return "from-yellow-500 to-amber-600";
    return "from-red-500 to-rose-600";
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {!analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl gradient-primary shadow-glow">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold">AI Resume Analysis</h3>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer space-y-2"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center"
                >
                  <Upload className="w-8 h-8 text-gray-600" />
                </motion.div>
                <p className="text-gray-700 font-medium">
                  {resumeFile ? resumeFile.name : "Click to upload resume"}
                </p>
                <p className="text-sm text-gray-500">
                  Supports PDF, DOC, DOCX
                </p>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-red-600 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={analyzeResume}
              disabled={!resumeFile || isAnalyzing}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Analyze Resume
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="space-y-6"
          >
            {/* Match Score */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">Match Score</h3>
                <div className="relative inline-flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                    className={`w-32 h-32 rounded-full bg-gradient-to-br ${getScoreGradient(
                      analysis.matchScore
                    )} p-1 shadow-glow`}
                  >
                    <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                      <span className={`text-4xl font-bold ${getScoreColor(
                        analysis.matchScore
                      )}`}>
                        {analysis.matchScore}%
                      </span>
                    </div>
                  </motion.div>
                </div>
                <p className="text-sm text-gray-600">
                  AI Confidence: {(analysis.aiConfidence * 100).toFixed(0)}%
                </p>
              </div>
            </motion.div>

            {/* Extracted Data */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-card rounded-2xl p-6"
            >
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Extracted Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    Technical Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.extractedData.skills.map((skill, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                      >
                        {skill}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-purple-500" />
                    Experience
                  </h4>
                  <p className="text-gray-600">
                    {analysis.extractedData.experience.years} years
                  </p>
                  <div className="mt-2 space-y-1">
                    {analysis.extractedData.experience.companies.map((company, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        • {company}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Education
                  </h4>
                  <div className="space-y-1">
                    {analysis.extractedData.education.degrees.map((degree, i) => (
                      <p key={i} className="text-sm text-gray-600">
                        {degree}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Languages & Certifications */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Additional Qualifications
                  </h4>
                  <div className="space-y-2">
                    {analysis.extractedData.languages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {analysis.extractedData.languages.join(", ")}
                        </span>
                      </div>
                    )}
                    {analysis.extractedData.certifications.map((cert, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6"
              >
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Strengths
                </h4>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {strength}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-card rounded-2xl p-6"
              >
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Areas for Consideration
                </h4>
                <ul className="space-y-2">
                  {analysis.weaknesses.map((weakness, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {weakness}
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            </div>

            {/* AI Recommendation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-2xl p-6 bg-gradient-to-r from-indigo-50 to-purple-50"
            >
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                AI Recommendation
              </h4>
              <p className="text-gray-700">{analysis.recommendations}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}