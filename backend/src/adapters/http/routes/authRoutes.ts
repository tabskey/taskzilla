import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { UserRepository } from '../../../infra/mongoose/repositories/UserRepository';

const router = Router();

const repo       = new UserRepository();
const useCase    = new LoginUseCase(repo);
const controller = new AuthController(useCase);

// POST /api/auth/login
router.post('/login', (req, res, next) => controller.login(req, res, next));

export default router;