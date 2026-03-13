import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { GetMeUseCase } from '../../../core/application/use-cases/GetmeUseCase';
import { MongoUserRepository } from '../../../infra/mongoose/repositories/UserRepository';
import { authenticate } from '../middlewares/auth';

const router = Router();

const repo       = new MongoUserRepository();
const useCase    = new CreateUserUseCase(repo);
const getMeUseCase     = new GetMeUseCase(repo);
const controller = new UserController(useCase, getMeUseCase);

// POST /api/users
router.post('/', (req, res) => controller.createUser(req, res));

// GET /api/users/me
router.get('/me', authenticate, (req, res) => controller.getMe(req, res));

export default router;