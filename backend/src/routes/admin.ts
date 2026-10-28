import { Router } from 'express';
import {
  adminTicketController,
  adminListTicketsQuerySchema,
  adminTicketIdParamSchema,
  patchTicketSchema,
  replyTicketSchema,
  noteTicketSchema,
} from '../controllers/adminTicketController';
import { validate } from '../middleware/validate';
import { requireRole } from '../middleware/requireRole';

export const adminRouter = Router();

// Protect all admin routes with admin role guard
adminRouter.use(requireRole('admin'));

adminRouter.get(
  '/tickets',
  validate({ query: adminListTicketsQuerySchema }),
  adminTicketController.list
);

adminRouter.get(
  '/tickets/:id',
  validate({ params: adminTicketIdParamSchema }),
  adminTicketController.getById
);

adminRouter.patch(
  '/tickets/:id',
  validate({ params: adminTicketIdParamSchema, body: patchTicketSchema }),
  adminTicketController.patch
);

adminRouter.post(
  '/tickets/:id/reply',
  validate({ params: adminTicketIdParamSchema, body: replyTicketSchema }),
  adminTicketController.reply
);

adminRouter.post(
  '/tickets/:id/notes',
  validate({ params: adminTicketIdParamSchema, body: noteTicketSchema }),
  adminTicketController.addNote
);

adminRouter.post(
  '/tickets/:id/triage',
  validate({ params: adminTicketIdParamSchema }),
  adminTicketController.retryTriage
);
