import 'dotenv/config'
import express from 'express';
import { errorHandler } from './middlewares/error-handle';
import routes from './routes';
import cors from 'cors'

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors())
app.use(express.json());
app.use('/api', routes)
app.use(errorHandler)

app.listen(PORT, '0.0.0.0',() => {
    console.log(`🚀🚀🚀 Server is running on http://localhost:${PORT}`)
})

