import { Resume, ResumeAnalysis } from "@prisma/client";

export interface AnalysisResult {
    technical: {
      skills: string[];
      experience: 'junior' | 'mid' | 'senior';
      suggestions: string[];
      summary: string;
      matchedKeywords: string[];
    };
    funny: {
      comment: string;
      roastLevel: number;
    };
  }
  
  export type ResumeWithAnalyses = Resume & {
    analyses: ResumeAnalysis[];
  };