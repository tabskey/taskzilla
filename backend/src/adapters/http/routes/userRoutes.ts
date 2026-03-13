import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { BulkCreateUserUseCase } from '../../../core/application/use-cases/BulkCreateUserUseCase';
import { GetMeUseCase } from '../../../core/application/use-cases/GetmeUseCase';
import { UserRepository } from '../../../infra/mongoose/repositories/UserRepository';
import { authenticate } from '../middlewares/auth';

const router = Router();

const repo       = new UserRepository();
const useCase    = new CreateUserUseCase(repo);
const getMeUseCase     = new GetMeUseCase(repo);
const bulkCreateCase   = new BulkCreateUserUseCase(repo);
const controller = new UserController(useCase, getMeUseCase, bulkCreateCase);

// POST /api/users
router.post('/', (req, res, next) => controller.createUser(req, res, next));

// POST /api/users/bulk  — cria em lote até 1000 (pública)
router.post('/bulk',   (req, res, next) => controller.bulkCreateUser(req, res, next))
// GET /api/users/me
router.get('/me',  authenticate, (req, res, next) => controller.getMe(req, res, next));

export default router;