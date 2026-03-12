import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { MongoUserRepository } from '../../../infra/mongoose/repositories/UserRepository';

const router = Router();

const repo       = new MongoUserRepository();
const useCase    = new LoginUseCase(repo);
const controller = new AuthController(useCase);

// POST /api/auth/login
router.post('/login', (req, res) => controller.login(req, res));

export default router;