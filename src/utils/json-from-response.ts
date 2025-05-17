import { ResumeAnalysis } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger/logger";

export function extractJsonFromResponse(text: string): ResumeAnalysis {
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      const jsonContent = text.slice(jsonStart, jsonEnd);

      const cleanJson = jsonContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      return JSON.parse(cleanJson);
    } catch (e) {
      logger.error("Falha ao extrair JSON", { text: text.substring(0, 200) });
      throw new AppError("Resposta da IA em formato inválido", 500);
    }
  }
