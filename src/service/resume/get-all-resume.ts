import {Resume, ResumeAnalysis } from '@prisma/client';
import prisma from '../../prisma/client';
import { logger } from '../../config/logger/logger';
import { AppError } from '../../errors/AppError';

type AnalyzedResume = Resume & {
  analyses: ResumeAnalysis[];
};

export async function getAllAnalyzedResumes(userId: number): Promise<AnalyzedResume[]> {
  try {
    const resumes = await prisma.resume.findMany({
      where: {
        user_id: userId,
        analyses: {
          some: {} 
        }
      },
      include: {
        analyses: {
          orderBy: {
            processed_at: 'desc'
          }
        }
      },
      orderBy: {
        created_at: 'desc' 
      }
    });

    if (!resumes || resumes.length === 0) {
      throw new AppError('No analyzed resumes found for this user', 404);
    }

    return resumes;
  } catch (error) {
    logger.error('Error fetching analyzed resumes:', error);
    throw new Error('Failed to fetch analyzed resumes');
  } 
}