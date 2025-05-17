import { Router } from "express";
import { userRouter } from "./user-router";
import { resumeRouter } from "./resume-router";

const routes = Router()

routes.use("/users", userRouter)
routes.use("/resumes", resumeRouter)

export default routes