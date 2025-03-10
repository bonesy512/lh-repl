import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { exec } from "child_process";
import { promisify } from "util";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { createServer } from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting server initialization...');

const execAsync = promisify(exec);

// Function to check if port is in use
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
      .once('error', () => {
        resolve(true);
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Function to find available port
async function findAvailablePort(startPort: number): Promise<number> {
  let port = startPort;
  while (await isPortInUse(port)) {
    port++;
  }
  return port;
}

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

    // Find available port starting from 5000
    const port = await findAvailablePort(5000);
    console.log(`Using port ${port}`);

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