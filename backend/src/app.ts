import express from 'express';
import { sanitize } from './adapters/http/middlewares/sanitize';
import userRoutes from './adapters/http/routes/userRoutes';
import authRoutes from './adapters/http/routes/authRoutes';

export const app = express();

app.use(express.json());
app.use(sanitize); 
app.use('/api/users', userRoutes);
app.use('/api/auth',  authRoutes);