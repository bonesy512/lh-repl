import { expressCspHeader } from 'express-csp-header';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import session from 'express-session';

// Rate limiter for API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: 'Too many requests, please try again later.' },
});

// More strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

// Updated CORS middleware to handle credentials
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      /\.replit\.dev$/,  // Allow all replit.dev subdomains
      /\.replit\.app$/   // Allow all replit.app subdomains
    ];

    // Check if the origin matches any of our allowed patterns
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`Origin: ${origin} not allowed by CORS`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-CSRF-Token',
    'X-Requested-With',
    'Accept',
    'Origin'
  ]
});

// Configure session middleware with proper cookie settings
export const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'landhacker-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
});

// CSRF protection middleware
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip for GET requests and for the token endpoint itself
  if (req.method === 'GET' || req.path === '/api/csrf-token') {
    return next();
  }

  const csrfToken = req.headers['x-csrf-token'];
  const storedToken = req.session?.csrfToken;

  if (!csrfToken || !storedToken || csrfToken !== storedToken) {
    console.error('CSRF token validation failed');
    return res.status(403).json({ message: 'CSRF token validation failed' });
  }

  next();
};

// Generate and provide CSRF token
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.csrfToken) {
    req.session.csrfToken = uuidv4();
  }
  next();
};

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
};

// CSP Headers
export const cspMiddleware = expressCspHeader({
  directives: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      "'unsafe-inline'",
      "'unsafe-eval'", // Required for some JavaScript functionality
      "https://apis.google.com",
      "https://*.stripe.com",
      "https://*.firebaseapp.com",
      "https://firebaseinstallations.googleapis.com"
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': [
      "'self'", 
      "data:", 
      "https://*.googleusercontent.com",
      "https://*.stripe.com",
      "https://api.mapbox.com",
      "https://maps.googleapis.com"
    ],
    'connect-src': [
      "'self'", 
      "https://*.googleapis.com",
      "https://firebaseinstallations.googleapis.com",
      "https://*.stripe.com",
      "https://*.firebaseio.com",
      "https://api.mapbox.com",
      "wss://*.firebaseio.com"
    ],
    'frame-src': [
      "'self'", 
      "https://accounts.google.com",
      "https://*.firebaseapp.com",
      "https://*.stripe.com"
    ],
    'frame-ancestors': ["'self'"],
    'form-action': ["'self'"]
  }
});