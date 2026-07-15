import express from 'express';
import path from 'path';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';
import { loadUsersFromFirestore } from './server_modules/db';
import { authRouter } from './server_modules/auth';
import { adminRouter } from './server_modules/admin';
import { historyRouter } from './server_modules/history';
import { extractionRouter } from './server_modules/extraction';

async function startServer() {
  console.log('🔄 Initializing High-Speed Core Synchronization Engine...');
  await loadUsersFromFirestore();

  const app = express();
  const PORT = 3000;

  // Security headers & Parsers
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route Registration
  app.use('/api', authRouter);
  app.use('/api', adminRouter);
  app.use('/api', historyRouter);
  app.use('/api', extractionRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Serve Frontend with Vite Middleware (Development) or Static files (Production)
  if (process.env.NODE_ENV !== 'production') {
    console.log('🚀 Mounting Vite Live-Reload Development Middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('📦 Serving Production Optimized Static Files...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Bind and Listen
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`📡 Core Server bound to 0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);

    // Render Keep-Alive Trick (Self-ping to avoid spin-down)
    const externalUrl = process.env.RENDER_EXTERNAL_URL;
    if (externalUrl) {
      console.log(`Render external URL detected: ${externalUrl}. Initializing self-ping keep-alive...`);
      // Ping every 10 minutes (600,000 ms) to keep the service warm
      setInterval(async () => {
        try {
          const response = await fetch(`${externalUrl}/api/health`);
          console.log(`[Keep-Alive] Self-ping successful: ${response.status} - ${response.statusText}`);
        } catch (error: any) {
          console.error(`[Keep-Alive] Self-ping failed:`, error.message);
        }
      }, 10 * 60 * 1000);
    } else {
      console.log("No RENDER_EXTERNAL_URL environment variable found. Keep-alive self-ping is ready but disabled.");
    }
  });
}

startServer();
