import { Request, Response, NextFunction } from "express";
import { RegisterUser, LoginUser, User } from "../types/user-type";
import { createUser } from "../service/user/create-user";
import { logger } from "../config/logger/logger";
import { loginUser } from "../service/user/login-user";
import { AuthenticatedRequest } from "../types/user-type";
import { getMeUser } from "../service/user/get-me-user";


export const registerUserController = async(req: Request, res:Response, next: NextFunction)=>{
    try{
    const userData: RegisterUser = req.body
    const newUser = await createUser(userData)
    logger.info("Usuario Criado ")
    res.status(201).json(newUser)
    }
    catch(error){
        next(error)
    }
}
export const loginUserController = async(req: Request, res:Response, next: NextFunction)=>{
    try{
        const userData: LoginUser = req.body
        const user = await loginUser(userData)

        res.status(201).json(user)
    }
    catch(error){
        next(error)
    }

}

export const getMeUserController = async(req: AuthenticatedRequest, res: Response, next: NextFunction)=> {
    try{
        const userData = await getMeUser(req?.user?.id)
        res.status(200).json(userData)
    }catch(error){
        next(error)
    }
}