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

// Parse JSON for all routes except the Stripe webhook
// Import middleware
import { apiLimiter, authLimiter, errorHandler, requestLogger } from './middleware';

// Parse JSON for all routes except the Stripe webhook
app.use((req, res, next) => {
  if (req.originalUrl === '/api/webhook') {
    next();
  } else {
    express.json()(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false }));

// Add raw body parser for Stripe webhook
app.post('/api/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.body = req.body.toString();
  next();
});

// Apply request logging middleware
app.use(requestLogger);

// Apply rate limiters
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

(async () => {
  try {
    console.log('Registering routes...');
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error in request:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Skip Vite middleware in Replit environment
    if (process.env.REPL_ID) {
      console.log('Running in Replit environment...');
      console.log('Building client...');
      try {
        // Ensure the public directory exists
        const publicDir = path.resolve(__dirname, 'public');
        const distDir = path.resolve(__dirname, '..', 'dist', 'public');

        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }

        // Change to root directory before running build
        const rootDir = path.resolve(__dirname, '..');
        console.log('Root directory:', rootDir);
        process.chdir(rootDir);

        // Build the client
        await execAsync('npm run build');
        console.log('Client built successfully');

        // Copy dist to public
        if (fs.existsSync(distDir)) {
          await execAsync(`cp -r ${distDir}/* ${publicDir}/`);
          console.log('Static files copied successfully');
        } else {
          console.log(`Checking alternative build directory locations...`);
          const altDistDir = path.resolve(__dirname, '..', 'dist');
          if (fs.existsSync(altDistDir)) {
            await execAsync(`cp -r ${altDistDir}/* ${publicDir}/`);
            console.log('Static files copied from alternate location successfully');
          } else {
            throw new Error(`Build directory not found: ${distDir} or ${altDistDir}`);
          }
        }

        serveStatic(app);
      } catch (buildError) {
        console.error('Failed to build client:', buildError);
        console.error('Error details:', buildError instanceof Error ? buildError.stack : buildError);
        throw buildError;
      }
    } else if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static serving for production...');
      serveStatic(app);
    }

    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Server started successfully, listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error details:', error instanceof Error ? error.stack : error);
    process.exit(1);
  }
})();