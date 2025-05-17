import { Router } from "express";
import { checkToken } from "../utils/checkToken";
import { createPaymentController } from "../controllers/payment-controller";

const paymentRouter = Router()

paymentRouter.post("/", checkToken, createPaymentController)

export {paymentRouter}