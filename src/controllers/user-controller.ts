import { Request, Response, NextFunction } from "express";
import { RegisterUser, LoginUser } from "../types/user-type";
import { createUser } from "../service/user/create-user";
import { logger } from "../config/logger/logger";
import { loginUser } from "../service/user/login-user";


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
    console.log("controller")
    try{
        const userData: LoginUser = req.body
        const user = await loginUser(userData)

        res.status(201).json(user)
    }
    catch(error){
        next(error)
    }

}