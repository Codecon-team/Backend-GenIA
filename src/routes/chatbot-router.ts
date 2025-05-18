import { Router } from "express";
import { sendMessageController } from "../controllers/chatbot-controller";

const chatbotRouter = Router()

chatbotRouter.post('/messages', sendMessageController)

export {chatbotRouter}