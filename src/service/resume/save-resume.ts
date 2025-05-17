import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import prisma from "../../prisma/client";
import { AnalysisResult } from "../../types/resume-types";
import { calculateScore } from "../../utils/calculate-score";

export async function saveResumeAnalysis(
  userId: number,
  filePath: string,
  fileName: string,
  analysisResult: AnalysisResult
) {
  try {
    logger.info(`Salvando análise de currículo para usuário ${userId}`);

    const resume = await prisma.resume.create({
      data: {
        user_id: userId,
        file_path: filePath,
        file_name: fileName,
        analysis_data: JSON.parse(JSON.stringify(analysisResult)) 
      }
    });

    logger.debug(`Currículo criado com ID: ${resume.id}`);

    const analysis = await prisma.resumeAnalysis.create({
      data: {
        resume_id: resume.id,
        score: calculateScore(analysisResult.technical),
        strengths: analysisResult.technical.skills.join(', '),
        weaknesses: analysisResult.technical.suggestions.join(', '),
        suggestions: analysisResult.technical.summary,
        keywords: analysisResult.technical.matchedKeywords,
        funny_comment: analysisResult.funny.comment, 
        roast_level: analysisResult.funny.roastLevel, 
        processed_at: new Date()
      },
      include: {
        resume: true
      }
    });

    logger.info(`Análise salva com sucesso. ID: ${analysis.id}`);
    
    return {
      resumeId: resume.id,
      analysisId: analysis.id,
      score: analysis.score
    };

  } catch (error) {
    logger.error('Erro ao salvar análise de currículo', {
      error,
      userId,
      filePath
    });
    
    throw new AppError('Falha ao salvar análise no banco de dados', 500);
  }
}