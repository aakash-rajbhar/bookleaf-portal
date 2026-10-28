import type { Request, Response } from 'express';
import { z } from 'zod';
import { ticketService } from '../services/ticketService';
import { AppError } from '../utils/errors';

export const createTicketSchema = z.object({
  bookId: z.string().trim().min(1).nullable().optional(),
  subject: z
    .string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(150, 'Subject cannot exceed 150 characters'),
  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters')
    .max(5000, 'Description cannot exceed 5000 characters'),
});

export const listTicketsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ticketIdParamSchema = z.object({
  id: z.string().trim().min(1, 'Ticket ID cannot be empty').max(50, 'Ticket ID too long'),
});

export class TicketController {
  async create(req: Request, res: Response) {
    const authorId = req.user?.authorId;
    if (!authorId) {
      throw AppError.forbidden('Only authors can create tickets');
    }

    const ticket = await ticketService.createAuthorTicket(authorId, req.body);
    res.status(201).json(ticket);
  }

  async list(req: Request, res: Response) {
    const authorId = req.user?.authorId;
    if (!authorId) {
      throw AppError.forbidden('Only authors can view author tickets');
    }

    const { limit, offset } = req.query as unknown as { limit: number; offset: number };
    const tickets = await ticketService.listAuthorTickets(authorId, limit, offset);
    res.status(200).json(tickets);
  }

  async getById(req: Request, res: Response) {
    const authorId = req.user?.authorId;
    if (!authorId) {
      throw AppError.forbidden('Only authors can view author tickets');
    }

    const ticket = await ticketService.getAuthorTicketById(
      authorId,
      req.params.id as string
    );
    res.status(200).json(ticket);
  }
}

export const ticketController = new TicketController();
