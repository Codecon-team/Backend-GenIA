import jwt from 'jsonwebtoken';
import { AppError } from '../errors/AppError';
import { logger } from '../config/logger/logger';
import { User } from '@prisma/client';

export async function generateToken(user: User, secret: string) {
  try {
    const accessToken = jwt.sign({ id: user.id }, secret);
    const refreshToken = jwt.sign({ id: user.id }, secret);
    return { accessToken, refreshToken };
  } catch (error) {
    logger.error({ err: error }, 'Error generating token');
    throw new AppError('Error generating token', 500);
  }
}