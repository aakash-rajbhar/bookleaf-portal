import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { sseHub } from '../sse/hub';

export class EventsController {
  /**
   * Generates a short-lived (60s) single-purpose stream token for SSE connections.
   * Requires standard Bearer auth.
   */
  createToken(req: Request, res: Response) {
    const user = req.user!;
    const streamToken = jwt.sign(
      {
        sub: user.id,
        role: user.role,
        authorId: user.authorId,
        purpose: 'sse',
      },
      env.JWT_SECRET,
      {
        algorithm: 'HS256',
        expiresIn: 60,
      }
    );

    res.status(200).json({
      streamToken,
      expiresInSeconds: 60,
    });
  }

  /**
   * Establishes a persistent Server-Sent Events stream:
   * - Authors subscribe to "author:<authorId>"
   * - Admins subscribe to "admins"
   * - Sends initial "ready" frame and 25s heartbeat pings
   * - Cleans up resources on client disconnect
   */
  subscribe(req: Request, res: Response) {
    const user = req.user!;
    const channelKey = user.role === 'admin' ? 'admins' : `author:${user.authorId}`;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    // Send initial ready event
    res.write('event: ready\ndata: {}\n\n');

    // Subscribe to hub
    sseHub.subscribe(channelKey, res);

    // Heartbeat every 25 seconds to keep connection alive across proxies/NAT
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch (_err) {
        clearInterval(heartbeatTimer);
        sseHub.unsubscribe(channelKey, res);
      }
    }, 25000);

    // Clean up when client disconnects
    req.on('close', () => {
      clearInterval(heartbeatTimer);
      sseHub.unsubscribe(channelKey, res);
    });
  }
}

export const eventsController = new EventsController();
