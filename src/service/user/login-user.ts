import prisma from "../../prisma/client";
import { AppError } from "../../errors/AppError";
import { LoginUser } from "../../types/user-type";
import argon2  from 'argon2';
import { generateToken } from "../../utils/generateToken";

export async function loginUser(userData: LoginUser) {
    const user = await prisma.user.findUnique({
        where: { email: userData.email }
    });
    if (!user) throw new AppError("Credenciais inválidas", 401);

    const isPasswordValid = await argon2.verify(user.password, userData.password);

    if(!isPasswordValid) throw new AppError("Senha incorreta.", 401);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new AppError("JWT_SECRET não definido nas variáveis de ambiente.", 500);
    }
    const {accessToken, refreshToken} = await generateToken(user, secret);
    return {accessToken, refreshToken};
}