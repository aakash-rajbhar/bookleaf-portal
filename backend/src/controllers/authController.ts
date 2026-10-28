import type { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/authService';

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  }

  async me(req: Request, res: Response) {
    const result = await authService.getCurrentUser(req.user!.id);
    res.status(200).json(result);
  }
}

export const authController = new AuthController();
