"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Brain, TrendingUp, Users, Target, Lightbulb, 
  ChevronRight, Sparkles, BarChart3, Award
} from "lucide-react";
import { AIApplicantService } from "@/lib/aiApplicantService";
import type { Schema } from "@/amplify/data/resource";

type Applicant = Schema["Applicant"]["type"];

interface AIInsightsPanelProps {
  position?: string;
  applicants: Applicant[];
}

export default function AIInsightsPanel({ position, applicants }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [candidateScore, setCandidateScore] = useState<any>(null);

  useEffect(() => {
    if (position) {
      loadInsights();
    }
  }, [position]);

  const loadInsights = async () => {
    if (!position) return;
    
    setLoading(true);
    try {
      const data = await AIApplicantService.getAIInsights(position);
      setInsights(data);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCandidate = async (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setCandidateScore(null);
    
    try {
      const score = await AIApplicantService.matchCandidate(applicant, {
        title: position || "Software Engineer",
        requiredSkills: ["React", "TypeScript", "Node.js"],
        preferredSkills: ["AWS", "GraphQL", "Docker"],
        minExperience: 3,
        description: "Full-stack developer position"
      });
      setCandidateScore(score);
    } catch (error) {
      console.error("Error analyzing candidate:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-600 animate-pulse" />
            <span className="text-purple-600 font-medium">Analyzing candidates...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Header */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
              <p className="text-sm text-gray-600">Smart analysis of your candidate pool</p>
            </div>
          </div>
          <button
            onClick={loadInsights}
            className="px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Refresh Analysis
          </button>
        </div>

        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Skill Analysis */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Top Skills</h4>
              </div>
              <div className="space-y-2">
                {insights.skillGapAnalysis.commonSkills.slice(0, 5).map((skill: string, idx: number) => (
                  <div key={skill} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{skill}</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${100 - idx * 15}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Insights */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">Market Trends</h4>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Avg Experience</span>
                  <span className="text-sm font-medium">{insights.marketInsights.averageExperience} years</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Salary Range</span>
                  <span className="text-sm font-medium">{insights.marketInsights.salaryExpectations}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Applicant Pool</span>
                  <span className="text-sm font-medium">{applicants.length} candidates</span>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-5 h-5 text-purple-600" />
                <h4 className="font-medium text-gray-900">AI Recommendations</h4>
              </div>
              <ul className="space-y-2">
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Focus on React expertise in interviews</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Consider remote candidates for wider pool</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Competitive salary needed for top talent</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Candidate Quick Analysis */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Candidate Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Candidate Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Candidate
            </label>
            <select
              value={selectedApplicant?.id || ""}
              onChange={(e) => {
                const applicant = applicants.find(a => a.id === e.target.value);
                if (applicant) analyzeCandidate(applicant);
              }}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            >
              <option value="">Choose a candidate...</option>
              {applicants.map(applicant => (
                <option key={applicant.id} value={applicant.id}>
                  {applicant.name} - {applicant.position}
                </option>
              ))}
            </select>
          </div>

          {/* Score Display */}
          {candidateScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">Match Score</h4>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">{candidateScore.overallScore}%</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Position Match</span>
                  <span className="text-sm font-medium">{candidateScore.positionMatch}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Skills Match</span>
                  <span className="text-sm font-medium">{candidateScore.skillsMatch}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Experience Match</span>
                  <span className="text-sm font-medium">{candidateScore.experienceMatch}%</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Detailed Analysis */}
        {candidateScore && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {/* Strengths */}
            <div className="bg-green-50 rounded-xl p-4">
              <h5 className="font-medium text-green-900 mb-2">Strengths</h5>
              <ul className="space-y-1">
                {candidateScore.strengths.map((strength: string, idx: number) => (
                  <li key={idx} className="text-sm text-green-700">• {strength}</li>
                ))}
              </ul>
            </div>

            {/* Gaps */}
            <div className="bg-amber-50 rounded-xl p-4">
              <h5 className="font-medium text-amber-900 mb-2">Development Areas</h5>
              <ul className="space-y-1">
                {candidateScore.gaps.map((gap: string, idx: number) => (
                  <li key={idx} className="text-sm text-amber-700">• {gap}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h5 className="font-medium text-blue-900 mb-2">Next Steps</h5>
              <ul className="space-y-1">
                {candidateScore.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="text-sm text-blue-700">• {rec}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}