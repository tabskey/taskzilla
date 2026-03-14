import express from 'express';
import { sanitize } from './adapters/http/middlewares/sanitize';
import passport from './core/application/passaport';
import { globalErrorHandler } from './adapters/http/middlewares/globalerrorhandler ';
import userRoutes from './adapters/http/routes/userRoutes';
import authRoutes from './adapters/http/routes/authRoutes';
import groupRoutes from './adapters/http/routes/GroupRoutes';

export const app = express();

app.use(express.json());
app.use(passport.initialize());
app.use(sanitize); 
app.use('/api/users', userRoutes);
app.use('/api/auth',  authRoutes);
app.use('/api/groups', groupRoutes);
app.use(globalErrorHandler);