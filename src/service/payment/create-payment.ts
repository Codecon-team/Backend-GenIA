import { env } from "../../config/dotenv/env";
import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import axios from 'axios';
import prisma from "../../prisma/client";
import { PaymentRequest, PaymentResponse } from "../../types/payment-types";

export async function createPremiumPayment(userId: number): Promise<PaymentResponse> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          include: { plan: true },
          where: { status: 'active' }
        }
      }
    });

    if (!user) {
      logger.error("Usuário não encontrado", { userId });
      throw new AppError("Usuário não encontrado", 404);
    }

    const hasActivePremium = user.subscriptions.some(
      sub => sub.plan.name === 'Prime' && sub.status === 'active'
    );

    if (hasActivePremium) {
      throw new AppError("Usuário já possui assinatura premium ativa", 400);
    }

    const premiumPlan = await prisma.plan.findUnique({
      where: { slug: 'prime' }
    });

    if (!premiumPlan) {
      throw new AppError("Plano premium não encontrado no sistema", 500);
    }

    const subscription = await prisma.subscription.create({
      data: {
        user_id: user.id,
        plan_id: premiumPlan.id,
        status: 'pending',
        start_date: new Date(),
        stripe_subscription_id: 'temp_' + Math.random().toString(36).substring(2, 11)
      }
    });

    const paymentData: PaymentRequest = {
      transaction_amount: premiumPlan.price,
      description: `Assinatura ${premiumPlan.name} - ${premiumPlan.billing_cycle}`,
      email: user.email,
      first_name: user.firstname || '',
      last_name: user.lastname || '',
      cpf: user.cpf || '',
      userId: user.id
    };

    const response = await axios.post<PaymentResponse>(
      `${env.API_MS_PIX}/payments/`,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    const mpResponse = response.data;

    await prisma.payment.create({
      data: {
        user_id: user.id,
        subscription_id: subscription.id,
        amount: premiumPlan.price,
        currency: 'BRL',
        status: mpResponse.status,
        payment_method: mpResponse.payment_method_id,
        qr_code: mpResponse.point_of_interaction?.transaction_data?.qr_code_base64 || null,
        transaction_id: mpResponse.id.toString(),
        id_mercadopago: mpResponse.id.toString(),
      }
    });

    logger.info("Pagamento premium criado com sucesso", {
      userId,
      paymentId: mpResponse.id,
      amount: premiumPlan.price,
      status: mpResponse.status
    });

    return {
      id: mpResponse.id,
      status: mpResponse.status,
      status_detail: mpResponse.status_detail,
      date_created: mpResponse.date_created,
      date_of_expiration: mpResponse.date_of_expiration,
      payment_method_id: mpResponse.payment_method_id,
      payment_type_id: mpResponse.payment_type_id,
      transaction_amount: mpResponse.transaction_amount,
      point_of_interaction: mpResponse.point_of_interaction,
      payer: mpResponse.payer
    };

  } catch (error) {
    logger.error("Erro ao criar pagamento premium", {
      userId,
      error: error instanceof Error ? error.message : error
    });
    
    if (error instanceof AppError) throw error;
    throw new AppError("Erro ao processar pagamento premium", 500);
  }
}