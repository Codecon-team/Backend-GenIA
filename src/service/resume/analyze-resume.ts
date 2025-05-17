import { generateText } from "ai";
import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import { extractJsonFromResponse } from "../../utils/json-from-response";
import { AnalysisResult } from "../../types/resume-types";
import { google } from "../../clients/ai/google-ai";
import { validateTechnicalAnalysis } from "../../validators/valid-technial";

export async function analyzeResumeWithIA(resumeText: string): Promise<AnalysisResult> {
  try {
    if (!resumeText || resumeText.trim().length < 50) {
      throw new AppError("Texto do currículo muito curto para análise", 400);
    }

    logger.debug("Iniciando análise de currículo com IA", {
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

    const funnyResponse = await generateText({
      model: google,
      prompt: funnyPrompt,
      system: "Você é um comediante stand-up analisando currículos. Seja debochado!",
      temperature: 0.9,
      maxTokens: 300
    });

    const technicalAnalysis = extractJsonFromResponse(technicalResponse.text);

    if (!validateTechnicalAnalysis(technicalAnalysis)) {
      throw new AppError("A análise técnica não retornou no formato esperado", 500);
    }

    const funnyComment = funnyResponse.text.trim();

    logger.debug("Análises concluídas", {
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

function calculateRoastLevel(comment: string): number {
  const lengthScore = Math.min(Math.floor(comment.length / 50), 3);
  const keywordScore = (comment.match(/!\?|rir|kkk|haha|engraçado/gi) || []).length;
  return Math.min(lengthScore + keywordScore + 1, 5);
}