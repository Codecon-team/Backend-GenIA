import fs from 'fs/promises';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { AppError } from '../../errors/AppError';
import { logger } from '../../config/logger/logger';

const EXTRACTORS = {
  pdf: async (buffer: Buffer) => (await pdf(buffer)).text,
  doc: async (buffer: Buffer) => (await mammoth.extractRawText({ buffer })).value,
  docx: async (buffer: Buffer) => (await mammoth.extractRawText({ buffer })).value
};

const SUPPORTED_EXTENSIONS = Object.keys(EXTRACTORS);

export async function extractTextFromResume(filePath: string): Promise<string> {
  try {
    const extension = filePath.split('.').pop()?.toLowerCase();
    
    if (!extension || !SUPPORTED_EXTENSIONS.includes(extension)) {
      throw new AppError('Formato de arquivo não suportado. Use PDF, DOC ou DOCX.', 400);
    }

    const dataBuffer = await fs.readFile(filePath);
    const text = await EXTRACTORS[extension as keyof typeof EXTRACTORS](dataBuffer);
    
    return cleanText(text);

  } catch (error) {
    logger.error('Erro na extração de texto', {
      filePath,
      error: error instanceof Error ? error.message : error
    });

    await fs.unlink(filePath).catch(() => {});

    if (error instanceof AppError) throw error;
    throw new AppError('Falha ao processar arquivo do currículo', 500);
  }
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')          
    .replace(/\n{3,}/g, '\n\n')      
    .replace(/[^\x00-\x7F]+/g, ' ')  
    .trim();
}