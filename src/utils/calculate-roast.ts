export function calculateRoastLevel(comment: string): number {
    const lengthScore = Math.min(Math.floor(comment.length / 50), 3);
    const keywordScore = (comment.match(/!\?|rir|kkk|haha|engraçado/gi) || []).length;
    return Math.min(lengthScore + keywordScore + 1, 5);
  }