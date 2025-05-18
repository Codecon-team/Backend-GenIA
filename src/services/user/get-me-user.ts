import { AppError } from "../../errors/AppError";
import prisma from "../../prisma/client";

export async function getMeUser(userId: number) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscriptions: {
          include: {
            plan: true,
            payments: true,
          },
        },
        resumes: {
          include: {
            analyses: true,
          },
        },
        payments: {
          include: {
            subscription: true,
          },
        },
      },
    });
    return user;
  } catch (error: any) {
    throw new AppError(error.message || error, 400);
  }
}
