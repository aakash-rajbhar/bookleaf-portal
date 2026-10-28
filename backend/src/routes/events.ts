import { Router } from 'express';
import { eventsController } from '../controllers/eventsController';
import { authenticate } from '../middleware/authenticate';
import { authenticateStream } from '../middleware/authenticateStream';

export const eventsRouter = Router();

// Stream token issuance requires standard Bearer auth
eventsRouter.post('/token', authenticate, (req, res) => {
  eventsController.createToken(req, res);
});

// Event stream connection authenticated via ?token=<streamToken>
eventsRouter.get('/', authenticateStream, (req, res) => {
  eventsController.subscribe(req, res);
});
