export interface RequestUser {
  id: string;
  role: 'author' | 'admin';
  authorId: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
