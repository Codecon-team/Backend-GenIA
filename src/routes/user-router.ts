import { Router } from "express";
import { registerUserController } from "../controllers/user-controller";

const userRouter = Router()

userRouter.post("/", registerUserController)


export { userRouter }