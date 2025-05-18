import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";
import argon2 from "argon2";
import { RegisterUser } from "../../types/user-type";
import prisma from "../../prisma/client";

export async function createUser(userDTO: RegisterUser) {
  const existUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: userDTO.username }, { email: userDTO.email }],
    },
  });
  const basicPlan = await prisma.plan.findUnique({
    where: { slug: "basic" },
  });

  if (!basicPlan) {
    logger.error("Basic plan not found");
    throw new AppError("Basic plan not found", 500);
  }

  if (existUser) {
    logger.error("User already exists");
    throw new AppError("User already exists", 400);
  }

  const hashedPassword = await argon2.hash(userDTO.password);

  const userData: RegisterUser = {
    username: userDTO.username,
    email: userDTO.email,
    password: hashedPassword,
  };

  const savedUser = await prisma.user.create({
    data: {
      ...userData,
      subscriptions: {
        create: {
          plan_id: basicPlan.id,
          status: "active",
          start_date: new Date(),
          stripe_subscription_id: "free-plan",
        },
      },
    },
    include: {
      subscriptions: true,
    },
  });

  return savedUser;
}
