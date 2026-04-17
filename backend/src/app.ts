import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { connectDatabase } from './database/connect';
import { config } from './config/env';
import { allowedOrigins } from './constants/allowedOrigins';
import './models';
import { startAutomationJobs } from './jobs';
import { authenticate } from './middlewares/auth';
import { auditMiddleware } from './middlewares/audit';
import { branchMiddleware } from './middlewares/branch';
import { apiReadLimiter, apiWriteLimiter } from './middlewares/rateLimiter';
import { ownershipMiddleware } from './middlewares/ownership';
import { routePermissionMiddleware } from './middlewares/permission';
import { csrfProtectionMiddleware, requestContextMiddleware, requestSanitizationMiddleware } from './middlewares/security';
import { errorHandler } from './middlewares/errorHandler';
import { apiRouter } from './routes';
import { systemRouter } from './routes/system.routes';
import { PermissionService } from './services/permissionService';

const app = express();
const permissionService = new PermissionService();

app.set('trust proxy', 1);

const corsOptions = {
  origin: (origin: string | undefined | null, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.error('Blocked origin:', origin);
    return callback(new Error(`CORS blocked: ${origin}`), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Authorization', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

app.use(requestContextMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestSanitizationMiddleware);
app.use(csrfProtectionMiddleware);
app.use(compression());

app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;

  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  res.header('Cache-Control', 'public, max-age=86400');

  next();
}, express.static(path.join(__dirname, '../uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(systemRouter);
app.use('/api', (req, res, next) => (
  permissionService.isPublicRoute(req.originalUrl, req.method)
    ? next()
    : authenticate(req, res, next)
));
app.use('/api', apiReadLimiter, apiWriteLimiter, routePermissionMiddleware, branchMiddleware, ownershipMiddleware, auditMiddleware, apiRouter);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

export default app;

export async function createApp() {
  await connectDatabase();
  startAutomationJobs();
  return app;
}
