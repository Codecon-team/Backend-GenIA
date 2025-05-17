import { Router } from "express";
import { registerUserController, loginUserController, getMeUserController } from "../controllers/user-controller";
import { checkToken } from "../utils/checkToken";

const userRouter = Router()

userRouter.post("/", registerUserController)
userRouter.post("/login", loginUserController)
userRouter.get("/me", checkToken, getMeUserController)


export { userRouter }