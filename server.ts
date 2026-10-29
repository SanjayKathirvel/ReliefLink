import express, { Request, Response, NextFunction } from 'express';
import http from 'node:http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { getDb, query } from './server/db/index.js';
import authRoutes from './server/routes/auth.js';
import requestsRoutes, { setRequestsIo } from './server/routes/requests.js';
import volunteersRoutes, { setVolunteersIo } from './server/routes/volunteers.js';
import resourcesRoutes, { setResourcesIo } from './server/routes/resources.js';
import disastersRoutes, { setDisastersIo } from './server/routes/disasters.js';
import broadcastsRoutes, { setBroadcastsIo } from './server/routes/broadcasts.js';
import analyticsRoutes from './server/routes/analytics.js';
import adminRoutes from './server/routes/admin.js';
import exportRoutes from './server/routes/export.js';
import projectRoutes from './server/routes/project.js';
import { setIoInstance as setEscalationIo, startEscalationWorker } from './server/services/escalationService.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Socket.IO with cross-origin support
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
  pingTimeout: 30000,
  pingInterval: 15000,
});

// Pass real-time socket instance to route controllers & background workers
setRequestsIo(io);
setVolunteersIo(io);
setResourcesIo(io);
setDisastersIo(io);
setBroadcastsIo(io);
setEscalationIo(io);

// Security & Parsing Middleware
app.use(cors());
app.use(express.json({ limit: '15mb' })); // Support emergency photo evidence uploads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Custom Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Socket.IO Room Management and Connection Lifecycle
io.on('connection', (socket) => {
  const clientIp = socket.handshake.address;
  console.log(`[ReliefLink Socket.IO] Client connected: ${socket.id} (IP: ${clientIp})`);

  socket.on('join:room', (room: string) => {
    if (room && typeof room === 'string') {
      socket.join(room);
      console.log(`[ReliefLink Socket.IO] Socket ${socket.id} joined room: ${room}`);
    }
  });

  socket.on('leave:room', (room: string) => {
    if (room && typeof room === 'string') {
      socket.leave(room);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[ReliefLink Socket.IO] Client disconnected: ${socket.id} (${reason})`);
  });
});

// Health Checks (Production Requirement)
app.get(['/health', '/api/health'], async (req: Request, res: Response) => {
  try {
    await query('SELECT 1');
    return res.json({
      status: 'HEALTHY',
      platform: 'ReliefLink India Disaster Response Platform',
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
      database: 'CONNECTED',
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'UNHEALTHY',
      error: err.message,
      database: 'DISCONNECTED',
    });
  }
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    await getDb();
    return res.json({ ready: true });
  } catch (err: any) {
    return res.status(503).json({ ready: false, error: err.message });
  }
});

// Mount Authoritative REST APIs
app.use('/api/auth', authRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/volunteers', volunteersRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/disasters', disastersRoutes);
app.use('/api/broadcasts', broadcastsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/project', projectRoutes);

// Unread notifications endpoint
app.get('/api/notifications', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: { message: 'Token required' } });
    }
    const listRes = await query(`
      SELECT * FROM notifications
      ORDER BY created_at DESC
      LIMIT 30
    `);
    return res.json({ success: true, data: { notifications: listRes.rows } });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

app.patch('/api/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    await query('UPDATE notifications SET read = TRUE WHERE id = $1', [req.params.id]);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
});

// Centralized API Error Middleware
app.use('/api', (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[ReliefLink API Error]', err);
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: err.message || 'An unexpected error occurred while processing your emergency request.',
    },
  });
});

// Explicit attachment download routes for Review 1 PPT
app.get([
  '/ReliefLink_Review1_Sanjay_K.pptx',
  '/ReliefLink_First_Review_Sanjay_K.pptx',
  '/download/review1.pptx',
  '/download-review1',
  '/download-ppt'
], (req: Request, res: Response) => {
  const pptPath = path.resolve(process.cwd(), 'public', 'ReliefLink_Review1_Sanjay_K.pptx');
  if (fs.existsSync(pptPath)) {
    return res.download(pptPath, 'ReliefLink_Review1_Sanjay_K.pptx');
  }
  return res.status(404).send('Presentation file not found');
});

// Explicit attachment download routes for Project Report PDF
app.get([
  '/ReliefLink_Project_Report_Sanjay_K.pdf',
  '/download-report',
  '/download/report.pdf',
  '/api/project/download-report-pdf'
], (req: Request, res: Response) => {
  const pdfPath = path.resolve(process.cwd(), 'public', 'ReliefLink_Project_Report_Sanjay_K.pdf');
  if (fs.existsSync(pdfPath)) {
    return res.download(pdfPath, 'ReliefLink_Project_Report_Sanjay_K.pdf');
  }
  return res.status(404).send('Project report PDF not found');
});

// Serve static assets from public/ directory
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Configure Vite Dev Server or Production Static Files
async function setupFrontend() {
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd && fs.existsSync(path.join(distDir, 'index.html'))) {
    console.log('[ReliefLink Frontend] Serving production build from /dist');
    app.use(express.static(distDir));
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
        return next();
      }
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.log('[ReliefLink Frontend] Attaching Vite development middleware (HMR/SPA)...');
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/data/**', '**/data/pgdata/**'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // SPA catch-all fallback: transforms and serves index.html for all client-side routes
    app.use('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/socket.io')) {
        return next();
      }
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (err) {
        next(err);
      }
    });
  }
}

async function startServer() {
  try {
    // 1. Verify and initialize PostgreSQL database & migrations
    await getDb();

    // 2. Start SLA Escalation Background Worker
    startEscalationWorker(60000);

    // 3. Attach Frontend
    await setupFrontend();

    // 4. Start HTTP & WebSocket Server
    httpServer.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error();
        console.error();
      }
    });

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 RELIEFLINK REAL-TIME DISASTER RELIEF SYSTEM READY`);
      console.log(`📍 Open in Browser: http://localhost:${port}`);
      console.log(`📍 Alternative:    http://127.0.0.1:${port}`);
      console.log(`⚡ Node.js version: ${process.version}`);
      console.log(`📦 Database: PostgreSQL Engine Initialized`);
      console.log(`📡 Socket.IO: Real-Time Broadcasts Active`);
      console.log(`💡 Note: Do NOT open 0.0.0.0 directly in your browser;`);
      console.log(`   always use http://localhost:${port}`);
      console.log(`=======================================================`);
    });
  } catch (err: any) {
    console.error('[ReliefLink Fatal Boot Error]', err);
    process.exit(1);
  }
}

startServer();
