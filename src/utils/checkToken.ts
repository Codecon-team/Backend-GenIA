import { Request, NextFunction, Response } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger/logger';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/user-type';



export function checkToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];

  if (!token) {
    logger.warn('Tentativa de acesso sem token');
    return next(new AppError('Acesso não autorizado', 401));
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new AppError("JWT_SECRET não definido nas variáveis de ambiente.", 500);
    }
    const decoded = jwt.verify(token, secret ) as JwtPayload;
    req.user = { id: Number(decoded.id) }; 
    logger.debug(`Token válido para usuário ${decoded.id}`);
    next();
  } catch (error) {
    logger.error({ error }, 'Falha na verificação do token');
    return next(new AppError('Token inválido ou expirado', 401));
  }
}