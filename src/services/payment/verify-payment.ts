import { Payment } from "mercadopago";
import { logger } from "../../config/logger/logger";
import prisma from "../../prisma/client";
import { client } from "../../config/mercadopago/mercadopago";

export function startPaymentVerification(paymentId: string, userId: number, subscriptionId: number) {
  logger.info(`Iniciando verificação de pagamento`, {
    paymentId,
    userId,
    subscriptionId,
    time: new Date().toISOString()
  });

  const checkInterval = setInterval(async () => {
    try {
      logger.debug(`Verificando status do pagamento ${paymentId}`, {
        attempt: new Date().toISOString()
      });

      const paymentInstance = new Payment(client);
      const payment = await paymentInstance.get({ id: paymentId });

      logger.debug(`Status recebido do Mercado Pago para pagamento ${paymentId}: ${payment.status}`, {
        fullStatus: payment
      });

      const updatedPayment = await prisma.payment.update({
        where: { id_mercadopago: paymentId },
        data: { status: payment.status }
      });

      logger.debug(`Pagamento atualizado no banco de dados`, {
        dbPayment: updatedPayment
      });

      if (payment.status === 'approved') {
        logger.info(`Pagamento ${paymentId} foi aprovado, atualizando assinatura`, {
          subscriptionId
        });

        const updatedSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { 
            status: 'active',
            start_date: new Date(),
            renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
          }
        });

        logger.info(`Assinatura atualizada para ativa`, {
          subscription: updatedSubscription
        });

        const userAfterUpdate = await prisma.user.findUnique({
          where: { id: userId },
          include: { subscriptions: { include: { plan: true } } }
        });

        logger.info(`Estado do usuário após atualização de assinatura`, {
          user: {
            id: userAfterUpdate?.id,
            currentPlan: userAfterUpdate?.subscriptions.find(s => s.status === 'active')?.plan.name
          }
        });

        clearInterval(checkInterval);
      }

      if (payment.status && ['cancelled', 'rejected', 'expired'].includes(payment.status)) {
        logger.warn(`Pagamento ${paymentId} falhou com status: ${payment.status}`);

        const canceledSubscription = await prisma.subscription.update({
          where: { id: subscriptionId },
          data: { status: 'canceled' }
        });

        logger.warn(`Assinatura cancelada devido a pagamento falho`, {
          subscription: canceledSubscription
        });

        clearInterval(checkInterval); 
      }
    } catch (error) {
      logger.error(`Erro ao verificar pagamento ${paymentId}`, {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }, 5 * 60 * 1000);

  setTimeout(() => {
    clearInterval(checkInterval);
    logger.info(`Verificação de pagamento ${paymentId} encerrada após 24h`, { 
      userId,
      endTime: new Date().toISOString()
    });
  }, 24 * 60 * 60 * 1000);
}