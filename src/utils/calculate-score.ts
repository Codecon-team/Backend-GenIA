export function calculateScore(technical: {
    skills: string[];
    experience: 'junior' | 'mid' | 'senior';
  }): number {
    const baseScore = technical.skills.length * 2 + 
                     (technical.experience === 'senior' ? 30 : 0) +
                     (technical.experience === 'mid' ? 20 : 10);
    
    return Math.min(baseScore, 100);
  }