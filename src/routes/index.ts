import { Router } from "express";
import { userRouter } from "./user-router";
import { resumeRouter } from "./resume-router";
import { paymentRouter } from "./payment-router";
import { chatbotRouter } from "./chatbot-router";

const routes = Router()

routes.use("/users", userRouter)
routes.use("/resumes", resumeRouter)
routes.use("/payments", paymentRouter)
routes.use('/chatbot', chatbotRouter)


export default routes