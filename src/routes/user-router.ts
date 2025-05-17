import { Router } from "express";
import { registerUserController, loginUserController } from "../controllers/user-controller";

const userRouter = Router()

userRouter.post("/", registerUserController)
userRouter.post("/login", loginUserController)


export { userRouter }