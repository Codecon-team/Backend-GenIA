import { Router } from "express";
import { userRouter } from "./user-router";

const routes = Router()

routes.use("/users",userRouter)

export default routes