import { Router } from 'express';
import passport from '../../../core/application/passaport';
import { AuthController } from '../controllers/AuthController';
import { LoginUseCase } from '../../../core/application/use-cases/LoginUseCase';
import { UserRepository } from '../../../infra/mongoose/repositories/UserRepository';
import { authenticate } from '../middlewares/auth';
import { RefreshTokenRepository } from '../../../infra/mongoose/repositories/RefreshTokenRepository';
import { RefreshTokenUseCase, RevokeTokensUseCase } from '../../../core/application/use-cases/RefreshTokenUseCase';

const router = Router();
 
const userRepo         = new UserRepository();
const refreshTokenRepo = new RefreshTokenRepository();
 
const loginUseCase = new LoginUseCase(userRepo, refreshTokenRepo);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, refreshTokenRepo);
const revokeTokensUseCase = new RevokeTokensUseCase(refreshTokenRepo);
const controller = new AuthController(loginUseCase, refreshTokenUseCase, revokeTokensUseCase);

// POST /api/auth/login 
router.post('/login', (req, res, next) => controller.login(req, res, next));

// POST /api/auth/refresh
router.post('/refresh', (req, res, next) => controller.refresh(req, res, next));

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res, next) => controller.logout(req, res, next));

// GET /api/auth/google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// GET /api/auth/google/callback
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    // req.user é o objeto retornado pelo GoogleAuthUseCase
    const user = req.user as any;
    res.json({ success: true, data: user });
  }
);

export default router;