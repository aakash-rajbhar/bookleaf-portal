import type { Request, Response } from 'express';
import { z } from 'zod';
import { adminTicketService } from '../services/adminTicketService';
import {
  TICKET_STATUSES,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
} from '../constants/ticket';

export const adminListTicketsQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  category: z.enum(TICKET_CATEGORIES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  from: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  to: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  assignedTo: z
    .union([z.literal('me'), z.literal('unassigned'), z.string().uuid()])
    .optional(),
  q: z.string().trim().optional(),
  sort: z.enum(['urgency', 'newest', 'oldest']).default('urgency'),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export const adminTicketIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Ticket ID cannot be empty').max(50, 'Ticket ID too long'),
});

export const patchTicketSchema = z
  .object({
    status: z.enum(TICKET_STATUSES).optional(),
    category: z.enum(TICKET_CATEGORIES).optional(),
    priority: z.enum(TICKET_PRIORITIES).optional(),
    assignedTo: z.union([z.literal('me'), z.string().uuid(), z.null()]).optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined ||
      data.category !== undefined ||
      data.priority !== undefined ||
      data.assignedTo !== undefined,
    { message: 'At least one field must be provided to update' }
  );

export const replyTicketSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Reply message cannot be empty')
    .max(5000, 'Reply message cannot exceed 5000 characters'),
  markResolved: z.boolean().optional(),
});

export const noteTicketSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Note content cannot be empty')
    .max(2000, 'Note content cannot exceed 2000 characters'),
});

export class AdminTicketController {
  async list(req: Request, res: Response) {
    const result = await adminTicketService.listTickets(
      req.query as any,
      req.user!.id
    );
    res.status(200).json(result);
  }

  async getById(req: Request, res: Response) {
    const ticket = await adminTicketService.getTicketById(req.params.id as string);
    res.status(200).json(ticket);
  }

  async patch(req: Request, res: Response) {
    const updated = await adminTicketService.updateTicket(
      req.params.id as string,
      req.body,
      req.user!.id
    );
    res.status(200).json(updated);
  }

  async reply(req: Request, res: Response) {
    const message = await adminTicketService.replyToTicket(
      req.params.id as string,
      req.user!.id,
      req.body
    );
    res.status(200).json(message);
  }

  async addNote(req: Request, res: Response) {
    const note = await adminTicketService.addInternalNote(
      req.params.id as string,
      req.user!.id,
      req.body.body
    );
    res.status(201).json(note);
  }
}

export const adminTicketController = new AdminTicketController();
