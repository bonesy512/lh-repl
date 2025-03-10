
import { expressCspHeader } from 'express-csp-header';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';

// Rate limiters
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login requests per hour
  message: 'Too many login attempts from this IP, please try again after an hour'
});

// CORS middleware
export const corsMiddleware = cors({
  origin: function (origin, callback) {
    // In production, you would want to restrict this to your domain
    // For development, allow all origins
    callback(null, true);
  },
  credentials: true
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
  console.log(`${new Date().toISOString()} [${req.method}] ${req.originalUrl}`);
  next();
};

// CSP Headers
export const cspMiddleware = expressCspHeader({
  directives: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", "https://apis.google.com"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https://*.googleusercontent.com"],
    'connect-src': ["'self'", "https://*.googleapis.com", "https://firebaseinstallations.googleapis.com"],
    'frame-src': ["'self'", "https://accounts.google.com"],
  }
});

import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import cors from 'cors';

// Create a rate limiter for general API requests
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: 'Too many requests, please try again later.' },
});

// Create a more strict rate limiter for authentication
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

// Error handling middleware
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error in request:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
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

// Update CORS configuration to handle both webview and external access
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      'http://localhost:3000',
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
  allowedHeaders: ['Content-Type', 'Authorization']
});