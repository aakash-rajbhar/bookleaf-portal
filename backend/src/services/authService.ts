import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../db/pool';
import { env } from '../config/env';
import { AppError } from '../utils/errors';

interface DbUser {
  id: string;
  email: string;
  password_hash: string;
  role: 'author' | 'admin';
  name: string;
  author_id: string | null;
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: 'author' | 'admin';
  authorId: string | null;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

// Generate once at startup so dummy comparisons match genuine bcrypt cost (timing attack defense)
const DUMMY_HASH = bcrypt.hashSync('bookleaf_timing_defense_salt', 10);

export class AuthService {
  async login(emailInput: string, passwordInput: string): Promise<LoginResponse> {
    const normalizedEmail = emailInput.trim().toLowerCase();

    const rows = await query<DbUser>(
      'SELECT id, email, password_hash, role, name, author_id FROM users WHERE lower(email) = $1',
      [normalizedEmail]
    );

    if (rows.length === 0) {
      // Execute dummy comparison to mitigate timing attacks on nonexistent emails
      await bcrypt.compare(passwordInput, DUMMY_HASH);
      throw AppError.unauthorized('Invalid email or password');
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(passwordInput, user.password_hash);

    if (!passwordMatch) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const token = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        authorId: user.author_id,
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: env.JWT_EXPIRES_IN as any,
      }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        authorId: user.author_id,
      },
    };
  }

  async getCurrentUser(userId: string): Promise<{ user: UserResponse }> {
    const rows = await query<DbUser>(
      'SELECT id, email, name, role, author_id FROM users WHERE id = $1',
      [userId]
    );

    if (rows.length === 0) {
      throw AppError.unauthorized('User not found');
    }

    const user = rows[0];
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        authorId: user.author_id,
      },
    };
  }
}

export const authService = new AuthService();
