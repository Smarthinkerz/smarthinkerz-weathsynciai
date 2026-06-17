import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import rateLimit from "express-rate-limit";
import { setupAuth } from "./auth";
import session from "express-session";
import { storage } from "./storage";
import { validateEnv, initErrorTracking, captureError, setupSentryErrorHandler } from "./startup-checks";

// Boot-time hardening: init error tracking first, then fail loudly if required env is missing.
initErrorTracking();
validateEnv();

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  captureError(error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  captureError(reason);
});

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many requests, please try again later"
});

app.use((req, res, next) => {
  const origin = req.headers.origin || `https://${req.headers.host}`;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Company-ID, X-Company-Auth, X-Auth-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.sendStatus(200);
  }
  
  next();
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax',
    httpOnly: true,
    path: "/"
  },
  store: storage.sessionStore,
  name: 'wealthsync.sid'
}));

(async () => {
  try {
    console.log("Initializing storage...");
    await storage.initialize();
    console.log("Storage initialized");

    console.log("Setting up authentication...");
    await setupAuth(app);
    console.log("Authentication setup completed");
    
    if (typeof global.directAuthTokens === 'undefined') {
      global.directAuthTokens = new Map();
    }

    app.use('/api', (req, res, next) => {
      res.setHeader('Content-Type', 'application/json');
      next();
    });
    
    console.log("Registering routes...");
    const server = await registerRoutes(app);
    console.log("Routes registered");
    
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
      }
      next();
    });
    
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    setupSentryErrorHandler(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Server error:", err);
      captureError(err);
      res.status(err.status || 500).json({
        error: err.message || "Internal Server Error"
      });
    });

    const port = 5000;
    const httpServer = server.listen(port, "0.0.0.0", () => {
      console.log(`Server running at http://0.0.0.0:${port}`);
    }).on('error', (err) => {
      console.error("Error during server startup:", err);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down');
      httpServer.close(() => {
        if (typeof (storage.sessionStore as any).close === 'function') {
          (storage.sessionStore as any).close(() => {
            process.exit(0);
          });
        } else {
          process.exit(0);
        }
      });
    });

  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
})();
