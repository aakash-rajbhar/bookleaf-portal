import type { Request, Response } from 'express';
import { z } from 'zod';
import { bookService } from '../services/bookService';

export const listBooksQuerySchema = z.object({
  authorId: z.string().trim().min(1, 'authorId cannot be empty').max(50, 'authorId too long').optional(),
});

export const bookIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Book ID cannot be empty').max(50, 'Book ID too long'),
});

export class BookController {
  async list(req: Request, res: Response) {
    const query = req.query as { authorId?: string };
    const books = await bookService.listBooks(req.user!, query.authorId);
    res.status(200).json(books);
  }

  async getById(req: Request, res: Response) {
    const book = await bookService.getBookById(req.user!, req.params.id as string);
    res.status(200).json(book);
  }
}

export const bookController = new BookController();
