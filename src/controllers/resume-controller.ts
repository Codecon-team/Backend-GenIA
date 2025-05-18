import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger/logger";
import { extractTextFromResume } from "../services/resume/extract-text";
import { analyzeResumeWithIA } from "../services/resume/analyze-resume";
import { saveResumeAnalysis } from "../services/resume/save-resume";
import { AuthenticatedRequest } from "../types/user-type";
import { getAllAnalyzedResumes } from "../services/resume/get-all-resume";
import { getOnlyResume } from "../services/resume/get-only-resume";
import { checkUserPlan } from "../utils/get-premium-user";

export async function analyzeResumeController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      throw new AppError("Nenhum arquivo enviado", 400);
    }
    if (!req.user?.id) {
      throw new AppError("Usuário não autenticado", 401);
    }

    logger.info(`Iniciando análise de currículo para usuário ${req.user.id}`);

    const textContent = await extractTextFromResume(req.file.path);
    logger.debug("Texto extraído do currículo", { length: textContent.length });

    const analysisResult = await analyzeResumeWithIA(textContent, req.user?.id);
    logger.debug("Resultado da análise", { 
      technical: analysisResult.technical,
      funnyComment: analysisResult.funny.comment 
    });

    const savedData = await saveResumeAnalysis(
      req.user.id,
      req.file.path,
      req.file.originalname,
      analysisResult
    );

    res.status(200).json({
      success: true,
      analysisId: savedData.analysisId,
      score: savedData.score,
      funnyComment: analysisResult.funny.comment 
    });

  } catch (error) {
    logger.error("Erro no controller de análise", {
      error: error instanceof Error ? error.message : error,
      userId: req.user?.id,
      file: req.file?.originalname
    });
    next(error);
  }
}

export async function getResumeAnalysis(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      throw new AppError("Usuário não autenticado", 401);
    }

    logger.info(`Buscando análises de currículo para usuário ${req.user.id}`);

    const analyzedResumes = await getAllAnalyzedResumes(req.user.id);
    
    logger.debug(`Encontradas ${analyzedResumes.length} análises`, {
      userId: req.user.id
    });

    const formattedResumes = analyzedResumes.map(resume => ({
      id: resume.id,
      fileName: resume.file_name,
      createdAt: resume.created_at,
      analyses: resume.analyses.map(analysis => ({
        id: analysis.id,
        score: analysis.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        funnyComment: analysis.funny_comment,
        roastLevel: analysis.roast_level,
        processedAt: analysis.processed_at
      }))
    }));

    res.status(200).json({
      success: true,
      count: formattedResumes.length,
      resumes: formattedResumes
    });

  } catch (error) {
    next(error);
  }
}

export async function getOnlyResumeController(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuário não autenticado', 401);
    }

    const resumeId = Number(req.params.id);
    if (isNaN(resumeId)) {
      throw new AppError('ID do currículo inválido', 400);
    }

    logger.info(`Buscando currículo ${resumeId} para usuário ${req.user.id}`);

    const resume = await getOnlyResume(req.user.id, resumeId);

    if (!resume) {
      throw new AppError('Currículo não encontrado ou não pertence ao usuário', 404);
    }

    const safeResume = {
      id: resume.id,
      file_name: resume.file_name,
      created_at: resume.created_at,
      analyses: resume.analyses.map((analysis) => ({
        id: analysis.id,
        score: analysis.score,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        funny_comment: analysis.funny_comment,
        roast_level: analysis.roast_level,
        processed_at: analysis.processed_at,
      })),
    };

    res.status(200).json({
      success: true,
      resume: safeResume,
    });
  } catch (error) {
     next(error);
  }
}