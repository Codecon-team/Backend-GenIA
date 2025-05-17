import { AppError } from "../../errors/AppError";
import prisma from "../../prisma/client";


export async function getMeUser(userId: any ){
    try{
        const user = prisma.user.findUnique({
            where:{
                id: userId
            }
        })
        return user
    }catch(error: any){
        throw new AppError(error, 400);
    }
}