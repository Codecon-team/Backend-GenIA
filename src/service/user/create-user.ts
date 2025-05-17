import { Request, Response } from "express";
import argon2 from "argon2";
import { RegisterUser } from "../../types/user-type";
import prisma from "../../prisma/client";
import { AppError } from "../../errors/AppError";

export async function createUser(userData: RegisterUser) {
  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === userData.username) {
        throw new AppError('Username already exists', 400);
      }
      if (existingUser.email === userData.email) {
        throw new AppError('Email already in use', 400);
      }
    }

    const newUser = await prisma.user.create({
      data: userData,
    });

    return newUser;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new AppError(`Unique constraint failed on: ${error.meta?.target}`, 400);
    }
    throw new AppError(error, 400);
  }
}

