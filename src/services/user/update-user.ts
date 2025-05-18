import prisma from "../../prisma/client";
import { UpdateUser } from "../../types/user-type";
import { logger } from "../../config/logger/logger";
import { AppError } from "../../errors/AppError";

export async function updateUser(userData: UpdateUser, userId: number) {
  const findUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!findUser) {
    logger.info("Usuário com esse ID não encontrado");
    throw new AppError("Credenciais inválidas", 401);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        ...userData,
      },
    });

    return updatedUser;
  } catch (error: any) {
    // Erro de constraint ou outro erro do Prisma
    if (error.code === "P2002") {
      throw new AppError(
        "Nome ja utilizado! (e-mail ou username)",
        409
      );
    }

    logger.error("Erro ao atualizar usuário:", error);
    throw new AppError("Erro ao atualizar usuário", 500);
  }
}
