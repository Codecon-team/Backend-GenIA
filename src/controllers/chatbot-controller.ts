import { NextFunction, Request, Response } from 'express'
import { answerUserMessage } from '../services/chatbot/chatbot-message-ai'

export const sendMessageController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {message} = req.body
        const {response} = await answerUserMessage({message})
        res.status(200).json({
            status: 'success',
            message: response,
        })
    } catch (error) {
        next(error)
    }
}