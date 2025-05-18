import { generateText, tool } from "ai";
import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import { AnswerUserMessageParams } from "../../types/chatbot-types";
import { postgresTools } from "../../ai/tools/postgres-tools";
import { google } from "../../clients/ai/google-ai";

export async function answerUserMessage({ message }: AnswerUserMessageParams) {
  try {
    logger.info('Iniciando resposta para mensagem do usuário', { 
      message,
      timestamp: new Date().toISOString() 
    });

    if (!message || message.trim().length === 0) {
      throw new AppError('Mensagem do usuário vazia', 400);
    }

    logger.debug('Chamando modelo de IA para gerar resposta', { message });
    
    const answer = await generateText({
      model: google,
      prompt: message,
      tools: {
        postgresTools,
      },
      system: `
        Você é um assistente de IA para um evento de programação. 
        - Sempre verifique os nomes exatos das colunas no banco de dados
        - Use apenas os nomes de colunas definidos em ALLOWED_COLUMNS_BY_TABLE
        - Responda de forma concisa, usando markdown sem blocos de código
      `.trim(),
      maxSteps: 5,
    });

    if (!answer.text) {
      logger.error('Resposta vazia da IA', { answer });
      throw new AppError('A IA não retornou uma resposta válida', 500);
    }

    logger.info('Resposta gerada com sucesso', { 
      inputLength: message.length,
      outputLength: answer.text.length,
      truncatedOutput: answer.text.substring(0, 100) + (answer.text.length > 100 ? '...' : '') 
    });

    return { response: answer.text };

  } catch (error) {
    logger.error('Erro ao processar mensagem do usuário', { 
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error,
      originalMessage: message,
      timestamp: new Date().toISOString()
    });

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError('Ocorreu um erro ao processar sua mensagem', 500);
  }
}