import { Router } from 'express';

const sseClients = new Set<any>();

export const eventsRouter = Router();

eventsRouter.get('/admin/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', timestamp: Date.now() })}\n\n`);
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

export function broadcastDbEvent(eventData: { type: string; action?: string; details?: string; timestamp?: number }) {
  const payload = `data: ${JSON.stringify({ timestamp: Date.now(), ...eventData })}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch (err) {
      sseClients.delete(res);
    }
  });
}
