import { logger } from "../config/logger/logger";
import { AppError } from "../errors/AppError";
import prisma from "../prisma/client";

export async function checkUserPlan(userId: number) {
  try {
    const activeSubscription = await prisma.subscription.findFirst({
      where: {
        user_id: userId,
        status: 'active',
        plan: {
          slug: 'prime'
        }
      },
      include: {
        plan: true
      }
    });

    const isPremium = !!activeSubscription;

    let analysisLimit = 1; 
    if (isPremium) {
      analysisLimit = activeSubscription.plan.analysis_limit || Infinity;
    } else {
      const basicPlan = await prisma.plan.findUnique({
        where: { slug: 'basic' }
      });
      analysisLimit = basicPlan?.analysis_limit || 1;
    }

    const analysisCount = await prisma.resumeAnalysis.count({
      where: {
        resume: {
          user_id: userId
        },
        processed_at: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      }
    });

    return {
      isPremium,
      analysisLimit,
      analysisCount,
      canAnalyze: isPremium || analysisCount < analysisLimit
    };
  } catch (error) {
    logger.error('Erro ao verificar plano do usuário', { userId, error });
    throw error;
  }
}

