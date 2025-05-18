import { Router } from "express";
import { registerUserController, loginUserController, getMeUserController, updateUserController } from "../controllers/user-controller";
import { checkToken } from "../middlewares/checkToken";

const userRouter = Router()

userRouter.post("/", registerUserController)
userRouter.post("/login", loginUserController)
userRouter.get("/me", checkToken, getMeUserController)
userRouter.put("/", checkToken, updateUserController)


export { userRouter }