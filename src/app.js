import express from 'express';
import userRoutes from './routes/userRoutes';
import orderRoutes from './routes/orderRoutes';
import productRoutes from './routes/productRoutes';
import { logger } from './middlewares/logger';
import { rateLimiter } from './middlewares/rateLimiter';

const app = express();

app.use(express.json());
app.use(logger);
app.use(rateLimiter);

app.use('/users', userRoutes);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);

export default app;
