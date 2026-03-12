import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { CreateUserUseCase } from "../../../application/use-cases/CreateUserUseCase";
import { MongoUserRepository } from "../../repositories/MongoUserRepository";

const router = Router();

// Composition Root
const userRepository = new MongoUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const userController = new UserController(createUserUseCase);

/**
 * POST /users
 * Body: { name: string, email: string, password: string }
 */
router.post("/users", (req, res) => userController.createUser(req, res));

export default router;