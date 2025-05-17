import { ResumeAnalysis } from "@prisma/client";

export function isValidAnalysis(obj: any): obj is ResumeAnalysis {
    return (
      obj &&
      Array.isArray(obj.skills) &&
      ['junior', 'mid', 'senior'].includes(obj.experience) &&
      Array.isArray(obj.suggestions) &&
      typeof obj.summary === 'string'
    );
  }