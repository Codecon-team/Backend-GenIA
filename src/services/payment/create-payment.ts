import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import axios from 'axios';
import prisma from "../../prisma/client";
import { PaymentRequest, PaymentResponse } from "../../types/payment-types";
import { env } from '../../config/dotenv/env';
import { startPaymentVerification } from "./verify-payment";

export async function createPremiumPayment(userId: number): Promise<PaymentResponse> {
  logger.info(`Iniciando criação de pagamento premium para usuário ${userId}`);

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

    logger.debug(`Usuário encontrado`, {
      userId: user.id,
      email: user.email,
      currentSubscriptions: user.subscriptions.map(s => ({
        id: s.id,
        plan: s.plan.name,
        status: s.status
      }))
    });

    const hasActivePremium = user.subscriptions.some(
      sub => sub.plan.name === 'Prime' && sub.status === 'active'
    );

    if (hasActivePremium) {
      logger.warn(`Tentativa de criar nova assinatura premium para usuário que já possui uma ativa`, {
        userId,
        existingSubscriptions: user.subscriptions
      });
      throw new AppError("Usuário já possui assinatura premium ativa", 400);
    }

    const premiumPlan = await prisma.plan.findUnique({
      where: { slug: 'prime' }
    });

    if (!premiumPlan) {
      logger.error("Plano premium não encontrado no banco de dados");
      throw new AppError("Plano premium não encontrado no sistema", 500);
    }

    logger.debug(`Plano premium encontrado`, {
      planId: premiumPlan.id,
      planName: premiumPlan.name,
      price: premiumPlan.price
    });

    const subscription = await prisma.subscription.create({
      data: {
        user_id: user.id,
        plan_id: premiumPlan.id,
        status: 'pending',
        start_date: new Date(),
        stripe_subscription_id: 'temp_' + Math.random().toString(36).substring(2, 11)
      }
    });

    logger.info(`Nova assinatura criada`, {
      subscriptionId: subscription.id,
      status: subscription.status,
      planId: premiumPlan.id
    });

    const paymentData: PaymentRequest = {
      transaction_amount: 1, // premiumPlan.price
      description: `Assinatura ${premiumPlan.name} - ${premiumPlan.billing_cycle}`,
      email: user.email,
      first_name: user.firstname || '',
      last_name: user.lastname || '',
      cpf: user.cpf || '',
      userId: user.id
    };

    logger.debug(`Enviando requisição de pagamento para API do Mercado Pago`, {
      paymentData: {
        ...paymentData,
        cpf: paymentData.cpf ? '***masked***' : null 
      }
    });

    const response = await axios.post<PaymentResponse>(
      `${env.API_MS_PIX}/payments/`,
      paymentData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 50000
      }
    );

    const mpResponse = response.data;

    logger.info(`Resposta recebida do Mercado Pago`, {
      paymentId: mpResponse.id,
      status: mpResponse.status,
      statusDetail: mpResponse.status_detail
    });

    const dbPayment = await prisma.payment.create({
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

    logger.debug(`Pagamento salvo no banco de dados`, {
      dbPaymentId: dbPayment.id,
      status: dbPayment.status
    });

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: { 
        stripe_subscription_id: mpResponse.id.toString() 
      }
    });

    logger.info(`Assinatura atualizada com ID do Mercado Pago`, {
      subscriptionId: updatedSubscription.id,
      stripeSubscriptionId: updatedSubscription.stripe_subscription_id
    });

    logger.info("Processo de criação de pagamento premium concluído com sucesso", {
      userId,
      paymentId: mpResponse.id,
      amount: premiumPlan.price,
      status: mpResponse.status,
      nextStep: "Iniciando verificação de status do pagamento"
    });

    startPaymentVerification(mpResponse.id.toString(), userId, subscription.id);

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
    logger.error("Falha no processo de criação de pagamento premium", {
      userId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      time: new Date().toISOString()
    });
    
    if (error instanceof AppError) throw error;
    throw new AppError("Erro ao processar pagamento premium", 500);
  }
}