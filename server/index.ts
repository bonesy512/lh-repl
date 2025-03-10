import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting server initialization...');

const execAsync = promisify(exec);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enhanced logging middleware
app.use((req, res, next) => {
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

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Kill any existing process on port 5000
    try {
      console.log('Checking for existing process on port 5000...');
      await execAsync('fuser -k 5000/tcp');
      console.log('Killed existing process on port 5000');
    } catch (error) {
      // Ignore error if no process was found
      console.log('No existing process found on port 5000');
    }

    console.log('Registering routes...');
    const server = await registerRoutes(app);

    // Enhanced error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error in request:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Skip Vite middleware in Replit environment
    if (process.env.REPL_ID) {
      console.log('Running in Replit environment...');

      // Create public directory if it doesn't exist
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }

      // Serve static files
      serveStatic(app);
    } else if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static serving for production...');
      serveStatic(app);
    }

    const port = 5000;
    console.log(`Starting server on port ${port}...`);

    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`Server started successfully, listening on port ${port}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
})();