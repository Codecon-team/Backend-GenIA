import { Request, Response, NextFunction } from "express";
import { RegisterUser } from "../types/user-type";
import { createUser } from "../service/user/create-user";
import { logger } from "../config/logger/logger";


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
export const loginUserController = async(req: Request, res:Response)=>{
    

}