import { Router } from 'express';
import passport from '../../../core/application/passaport';
import { AuthController } from '../controllers/AuthController';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { UserRepository } from '../../../infra/mongoose/repositories/UserRepository';

const router = Router();

const repo       = new UserRepository();
const useCase    = new LoginUseCase(repo);
const controller = new AuthController(useCase);

// POST /api/auth/login — login com email/senha
router.post('/login', (req, res, next) => controller.login(req, res, next));

// GET /api/auth/google — inicia o fluxo OAuth
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// GET /api/auth/google/callback — Google redireciona aqui
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // req.user é o objeto retornado pelo GoogleAuthUseCase
    const user = req.user as any;
    res.json({ success: true, data: user });
  }
);

export default router;