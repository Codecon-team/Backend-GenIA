import { logger } from "../../config/logger/logger";
import { analyzeResumeWithIA } from "./analyze-resume";
import { saveResumeAnalysis } from "./save-resume";
import { extractTextFromResume } from "./extract-text";
import { checkUserPlan } from "../../utils/get-premium-user";

export async function handleResumeSubmission(
  userId: number,
  filePath: string,
  fileName: string
) {
  try {
    logger.info(`Processando envio de currículo para usuário ${userId}`);

    await checkUserPlan(userId);

    const textContent = await extractTextFromResume(filePath);
    logger.debug("Texto extraído do currículo", { 
      userId,
      length: textContent.length 
    });

    const analysisResult = await analyzeResumeWithIA(textContent, userId);

    const savedData = await saveResumeAnalysis(
      userId,
      filePath,
      fileName,
      analysisResult
    );

    return {
      analysisId: savedData.analysisId,
      score: savedData.score,
      funnyComment: analysisResult.funny.comment
    };

  } catch (error) {
    logger.error("Erro no processamento de currículo", {
      error: error instanceof Error ? error.message : error,
      userId
    });
    throw error;
  }
}