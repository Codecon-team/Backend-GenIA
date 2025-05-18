import { Request, Response, NextFunction } from 'express'
import { AuthenticatedRequest } from '../types/user-type'
import { checkUserPlan } from '../utils/get-premium-user'

export async function premiumMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id 
    
    if (!userId) {
      return res.status(401).json({ error: 'Não autorizado' })
    }
    const { isPremium } = await checkUserPlan(userId)
    req.isPremiumUser = isPremium
    next()
  } catch (error) {
    next(error)
  }
}