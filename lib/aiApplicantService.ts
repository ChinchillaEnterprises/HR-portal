import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>();

type Applicant = Schema["Applicant"]["type"];
type User = Schema["User"]["type"];

export interface ResumeParseResult {
  name: string;
  email: string;
  phone?: string;
  location?: string;
  summary?: string;
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    startDate?: string;
    endDate?: string;
    description: string;
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field?: string;
    graduationDate?: string;
  }>;
  certifications?: string[];
  languages?: string[];
}

export interface CandidateMatchResult {
  applicantId: string;
  positionMatch: number; // 0-100
  skillsMatch: number; // 0-100
  experienceMatch: number; // 0-100
  overallScore: number; // 0-100
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface AIInsights {
  topCandidates: CandidateMatchResult[];
  skillGapAnalysis: {
    requiredSkills: string[];
    commonSkills: string[];
    rareSkills: string[];
  };
  marketInsights: {
    averageExperience: number;
    commonPositions: string[];
    salaryExpectations?: string;
  };
}

export class AIApplicantService {
  // Simulate AI resume parsing
  static async parseResume(fileContent: string | File): Promise<ResumeParseResult> {
    // In production, this would call AWS Textract or a similar service
    // For now, we'll simulate parsing with some mock data
    
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    
    // Mock parsed data - in production, this would be extracted from the actual resume
    return {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 (555) 123-4567",
      location: "San Francisco, CA",
      summary: "Experienced software engineer with 5+ years in full-stack development",
      skills: [
        "JavaScript", "TypeScript", "React", "Node.js", "AWS", 
        "Python", "PostgreSQL", "MongoDB", "Docker", "Kubernetes"
      ],
      experience: [
        {
          company: "Tech Corp",
          position: "Senior Software Engineer",
          startDate: "2021-01",
          endDate: "present",
          description: "Led development of microservices architecture serving 1M+ users"
        },
        {
          company: "StartupXYZ",
          position: "Full Stack Developer",
          startDate: "2019-03",
          endDate: "2020-12",
          description: "Built and maintained React/Node.js applications"
        }
      ],
      education: [
        {
          institution: "University of California, Berkeley",
          degree: "Bachelor of Science",
          field: "Computer Science",
          graduationDate: "2018"
        }
      ],
      certifications: ["AWS Certified Developer", "React Native Certification"],
      languages: ["English (Native)", "Spanish (Conversational)"]
    };
  }

  // Match candidate to position
  static async matchCandidate(
    applicant: Applicant,
    positionRequirements: {
      title: string;
      requiredSkills: string[];
      preferredSkills: string[];
      minExperience: number;
      description: string;
    }
  ): Promise<CandidateMatchResult> {
    // Simulate AI matching algorithm
    await new Promise(resolve => setTimeout(resolve, 800));

    // Mock scoring - in production, this would use ML models
    const positionMatch = Math.floor(Math.random() * 30) + 70; // 70-100
    const skillsMatch = Math.floor(Math.random() * 25) + 75; // 75-100
    const experienceMatch = Math.floor(Math.random() * 20) + 80; // 80-100
    const overallScore = Math.floor((positionMatch + skillsMatch + experienceMatch) / 3);

    const strengths = [
      "Strong technical background in required technologies",
      "Relevant industry experience",
      "Good cultural fit based on values alignment"
    ];

    const gaps = [
      "Limited experience with Kubernetes",
      "No direct experience in fintech industry"
    ];

    const recommendations = [
      "Schedule technical interview to assess React proficiency",
      "Consider for senior position given strong experience",
      "Pair with mentor for Kubernetes knowledge transfer"
    ];

    return {
      applicantId: applicant.id,
      positionMatch,
      skillsMatch,
      experienceMatch,
      overallScore,
      strengths,
      gaps,
      recommendations
    };
  }

  // Get AI insights for all applicants
  static async getAIInsights(position: string): Promise<AIInsights> {
    const applicants = await client.models.Applicant.list({
      filter: { position: { eq: position } }
    });

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1200));

    // Analyze skills across all applicants
    const allSkills: string[] = [];
    applicants.data.forEach(app => {
      if (app.skills) {
        allSkills.push(...JSON.parse(app.skills));
      }
    });

    const skillFrequency = allSkills.reduce((acc, skill) => {
      acc[skill] = (acc[skill] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sortedSkills = Object.entries(skillFrequency)
      .sort(([, a], [, b]) => b - a)
      .map(([skill]) => skill);

    return {
      topCandidates: [], // Would be populated with actual matching results
      skillGapAnalysis: {
        requiredSkills: ["React", "Node.js", "AWS", "TypeScript"],
        commonSkills: sortedSkills.slice(0, 5),
        rareSkills: sortedSkills.slice(-5)
      },
      marketInsights: {
        averageExperience: 5.2,
        commonPositions: ["Software Engineer", "Full Stack Developer", "Frontend Developer"],
        salaryExpectations: "$120,000 - $180,000"
      }
    };
  }

  // Generate interview questions based on resume
  static async generateInterviewQuestions(
    applicant: Applicant,
    position: string
  ): Promise<{
    technical: string[];
    behavioral: string[];
    roleSpecific: string[];
  }> {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      technical: [
        "Explain your experience with React hooks and when you would use useCallback vs useMemo",
        "How would you design a scalable microservices architecture?",
        "Walk me through your approach to database optimization",
        "Describe a challenging bug you've encountered and how you resolved it"
      ],
      behavioral: [
        "Tell me about a time you had to work with a difficult team member",
        "How do you prioritize tasks when facing multiple deadlines?",
        "Describe a project where you took initiative beyond your assigned responsibilities",
        "How do you stay updated with new technologies?"
      ],
      roleSpecific: [
        "How would you improve our current onboarding process?",
        "What's your experience with AWS Lambda and serverless architectures?",
        "How would you approach building a real-time collaboration feature?",
        "Describe your experience with CI/CD pipelines"
      ]
    };
  }

  // Score and rank applicants
  static async scoreApplicants(
    positionId: string
  ): Promise<Array<{
    applicant: Applicant;
    score: number;
    summary: string;
  }>> {
    const applicants = await client.models.Applicant.list();
    
    // Simulate scoring
    await new Promise(resolve => setTimeout(resolve, 1500));

    const scored = applicants.data.map(applicant => {
      const score = Math.floor(Math.random() * 30) + 70; // 70-100
      return {
        applicant,
        score,
        summary: `Strong candidate with ${score}% match. Key strengths in technical skills and relevant experience.`
      };
    });

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  // Extract contact info from unstructured text
  static extractContactInfo(text: string): {
    emails: string[];
    phones: string[];
    linkedIn?: string;
    github?: string;
  } {
    const emails = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    const phones = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{4,6}/g) || [];
    const linkedIn = text.match(/linkedin\.com\/in\/[a-zA-Z0-9-]+/i)?.[0];
    const github = text.match(/github\.com\/[a-zA-Z0-9-]+/i)?.[0];

    return { emails, phones, linkedIn, github };
  }

  // Generate candidate summary
  static async generateCandidateSummary(applicant: Applicant): Promise<string> {
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 800));

    const years = applicant.yearsOfExperience || 0;
    const skills = applicant.skills ? JSON.parse(applicant.skills).slice(0, 3).join(", ") : "various technologies";
    
    return `${applicant.name} is an experienced professional with ${years} years in ${applicant.position || 'the industry'}. ` +
           `Key strengths include ${skills}. ` +
           `Located in ${applicant.location || 'unspecified location'} and available for ${applicant.availability || 'immediate start'}.`;
  }
}