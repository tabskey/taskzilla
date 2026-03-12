import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { CreateUserUseCase } from '../../../core/application/use-cases/CreateUserUseCase';
import { MongoUserRepository } from '../../../infra/mongoose/repositories/UserRepository';

const router = Router();

const repo       = new MongoUserRepository();
const useCase    = new CreateUserUseCase(repo);
const controller = new UserController(useCase);

// POST /api/users
router.post('/', (req, res) => controller.createUser(req, res));

export default router;