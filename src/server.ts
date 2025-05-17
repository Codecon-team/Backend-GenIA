import express from 'express';
import { errorHandler } from './middlewares/error-handle';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', routes)
app.use(errorHandler)

app.listen(PORT, () => {
    console.log("Server has started")
})

