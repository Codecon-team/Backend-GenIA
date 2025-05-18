import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import prisma from "../../prisma/client";
import { AnalysisResult } from "../../types/resume-types";
import { calculateScore } from "../../utils/calculate-score";
import { uploadResumeToCloudinary } from "../../utils/upload-cloudinary";
import * as fs from 'fs/promises';

export async function saveResumeAnalysis(
  userId: number,
  filePath: string,
  fileName: string,
  analysisResult: AnalysisResult
) {
  try {
    logger.info(`Salvando análise de currículo para usuário ${userId}`);

    const isProduction = process.env.NODE_ENV === 'prod';
    logger.debug(`Ambiente de produção: ${isProduction}`);
    const filePathToSave = isProduction
      ? await uploadResumeToCloudinary(filePath) 
      : filePath; 

    logger.debug(`Caminho do currículo salvo: ${filePathToSave}`);
    const resume = await prisma.resume.create({
      data: {
        user_id: userId,
        file_path: filePathToSave,
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
    
    if (isProduction) {
      await fs.unlink(filePath).catch(() => {});
    }

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