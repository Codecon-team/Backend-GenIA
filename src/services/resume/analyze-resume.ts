// src/services/resume/analyze-resume.ts
import { generateText } from "ai";
import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import { extractJsonFromResponse } from "../../utils/json-from-response";
import { AnalysisResult } from "../../types/resume-types";
import { google } from "../../clients/ai/google-ai";
import { validateTechnicalAnalysis } from "../../validators/valid-technial";
import { calculateRoastLevel } from "../../utils/calculate-roast";
import { checkUserPlan } from "../../utils/get-premium-user";
import prisma from "../../prisma/client";

export async function analyzeResumeWithIA(resumeText: string, userId: number): Promise<AnalysisResult> {
  try {
    if (!resumeText || resumeText.trim().length < 50) {
      throw new AppError("Texto do currículo muito curto para análise", 400);
    }

    const {isPremium} = await checkUserPlan(userId);
    const resumeCount = await prisma.resume.count({
      where: { user_id: userId },
    });

    if (!isPremium && resumeCount >= 1) {
      throw new AppError("Plano gratuito só permite um currículo.", 403);
    }
    
    logger.debug("Iniciando análise de currículo com IA", {
      userId,
      textLength: resumeText.length
    });

    const technicalPrompt = `
    ANALISE ESTE CURRÍCULO E RETORNE APENAS UM OBJETO JSON VÁLIDO SEM TEXTO ADICIONAL.

    FORMATO EXIGIDO:
    {
      "skills": ["skill1", "skill2"],
      "experience": "junior|mid|senior",
      "suggestions": ["sugestão1", "sugestão2"],
      "summary": "resumo conciso em 50 palavras",
      "matchedKeywords": ["palavra1", "palavra2"]
    }

    TEXTO DO CURRÍCULO:
    ${resumeText.substring(0, 5000)}`.trim();

    const technicalResponse = await generateText({
      model: google,
      prompt: technicalPrompt,
      system: "Você é um analista técnico de RH. Retorne APENAS JSON válido, sem comentários ou markdown.",
      temperature: 0.3,
      maxTokens: 800
    });

    const funnyPrompt = `Faça uma análise HUMORADA deste currículo.
    Seja criativo e sarcástico, mas sem ofensas pessoais.
    Destaque pontos engraçados ou incomuns.
    
    Currículo: ${resumeText.substring(0, 5000)}`;
    const systemMessage = isPremium 
    ? "Você é um analista sênior de RH. Faça um comentário profissional, construtivo e direto sobre o currículo, em tom formal e respeitoso." 
    : "Você é um comediante stand-up analisando currículos. Seja debochado!"
    const funnyResponse = await generateText({
      model: google,
      prompt: funnyPrompt,
      system: systemMessage,
      temperature: 0.9,
      maxTokens: 300
    });

    const technicalAnalysis = extractJsonFromResponse(technicalResponse.text);

    if (!validateTechnicalAnalysis(technicalAnalysis)) {
      throw new AppError("A análise técnica não retornou no formato esperado", 500);
    }

    const funnyComment = funnyResponse.text.trim();

    logger.debug("Análises concluídas", {
      userId,
      technical: technicalAnalysis,
      funnyComment: funnyComment
    });

    return {
      technical: technicalAnalysis,
      funny: {
        comment: funnyComment,
        roastLevel: calculateRoastLevel(funnyComment)
      }
    };

  } catch (error) {
    logger.error("Falha na análise de currículo", {
      error: error instanceof Error ? error.message : error
    });
    
    if (error instanceof AppError) throw error;
    throw new AppError("Erro durante a análise do currículo", 500);
  }
}