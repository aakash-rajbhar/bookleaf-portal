import { Router } from 'express';
import {
  bookController,
  listBooksQuerySchema,
  bookIdParamSchema,
} from '../controllers/bookController';
import { validate } from '../middleware/validate';

export const booksRouter = Router();

booksRouter.get(
  '/',
  validate({ query: listBooksQuerySchema }),
  bookController.list
);

booksRouter.get(
  '/:id',
  validate({ params: bookIdParamSchema }),
  bookController.getById
);
