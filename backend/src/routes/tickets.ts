import { Router } from 'express';
import {
  ticketController,
  createTicketSchema,
  listTicketsQuerySchema,
  ticketIdParamSchema,
} from '../controllers/ticketController';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/requireRole';

export const ticketsRouter = Router();

// Restrict all /tickets endpoints to authors
ticketsRouter.use(requireRole('author'));

ticketsRouter.post(
  '/',
  validate({ body: createTicketSchema }),
  ticketController.create
);

ticketsRouter.get(
  '/',
  validate({ query: listTicketsQuerySchema }),
  ticketController.list
);

ticketsRouter.get(
  '/:id',
  validate({ params: ticketIdParamSchema }),
  ticketController.getById
);
