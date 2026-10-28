import { Router } from 'express';
import { authController, loginSchema } from '../controllers/authController';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';

export const authRouter = Router();

authRouter.post('/login', validate({ body: loginSchema }), authController.login);
authRouter.get('/me', authenticate, authController.me);
