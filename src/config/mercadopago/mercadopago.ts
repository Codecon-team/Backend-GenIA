import {MercadoPagoConfig} from 'mercadopago'
import { v4 as uuidv4 } from 'uuid'
import { AppError } from '../../errors/AppError'
import { logger } from '../logger/logger'

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  logger.error({ message: 'Access token não foi definido no ambiente' })
  throw new AppError('Access token não foi definido no ambiente', 500)
}

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
const client = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
    idempotencyKey: uuidv4(),
  },
})

export { client }