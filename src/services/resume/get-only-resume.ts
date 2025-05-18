import { logger } from '../../config/logger/logger';
import { AppError } from '../../errors/AppError';
import prisma from '../../prisma/client';
import { ResumeWithAnalyses } from '../../types/resume-types';

export async function getOnlyResume(
  userId: number,
  resumeId: number
): Promise<ResumeWithAnalyses | null> {
  try {
    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        user_id: userId, 
      },
      include: {
        analyses: {
          orderBy: {
            processed_at: 'desc', 
          },
        },
      },
    });

    return resume;
  } catch (error) {
    logger.error('Error fetching resume:', error);
    throw new AppError('Failed to fetch resume');
  }
}