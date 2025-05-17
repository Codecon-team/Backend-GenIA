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
  