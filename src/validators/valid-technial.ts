import { AnalysisResult } from "../types/resume-types";

export function validateTechnicalAnalysis(
  data: any
): data is AnalysisResult["technical"] {
  return (
    data &&
    Array.isArray(data.skills) &&
    ["junior", "mid", "senior"].includes(data.experience) &&
    Array.isArray(data.suggestions) &&
    typeof data.summary === "string" &&
    Array.isArray(data.matchedKeywords)
  );
}
