import { NextFunction, Request, Response } from "express";
import { AppError } from "../errors/AppError";
import { logger } from "../config/logger/logger";
import { AuthenticatedRequest } from "../types/user-type";
import { createPremiumPayment } from "../services/payment/create-payment";

export const createPaymentController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.id) {
      logger.error("Usuário não autenticado")
      throw new AppError("Usuário não autenticado", 401);
    }
    const userId = req.user.id;

    const payment = await createPremiumPayment(userId);
    logger.info("Pagamento criado com sucesso", { userId });
    res.status(201).json({
      status: "success",
      message: "Pagamento criado com sucesso",
      payment,
    }); 
  } catch (error) {
    next(error)
  }
};