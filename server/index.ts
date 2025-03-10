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

async function initializeServer() {
  try {
    console.log('Creating Express application...');
    const app = express();

    // Set trust proxy first before any other middleware
    app.set('trust proxy', 1);

    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).send('OK');
    });

    // Import middleware
    console.log('Importing and configuring middleware...');
    const { 
      apiLimiter, 
      authLimiter, 
      errorHandler, 
      requestLogger, 
      corsMiddleware, 
      sessionMiddleware,
      generateCsrfToken,
      cspMiddleware,
      csrfProtection
    } = await import('./middleware');

    // Setup middleware
    console.log('Setting up middleware...');

    // Apply CORS middleware first
    app.use(corsMiddleware);

    // Add session support
    app.use(sessionMiddleware);

    // Generate CSRF token for all requests
    app.use(generateCsrfToken);

    // Add CSP headers
    app.use(cspMiddleware);

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

    console.log('Registering routes...');
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use(errorHandler);

    // Handle static file serving based on environment
    if (process.env.REPL_ID) {
      console.log('Running in Replit environment...');

      // Skip build if files already exist
      const publicDir = path.resolve(__dirname, 'public');
      if (!fs.existsSync(publicDir) || !fs.readdirSync(publicDir).length) {
        try {
          console.log('Building client...');
          const distDir = path.resolve(__dirname, '..', 'dist', 'public');

          if (!fs.existsSync(publicDir)) {
            fs.mkdirSync(publicDir, { recursive: true });
          }

          const rootDir = path.resolve(__dirname, '..');
          process.chdir(rootDir);

          await execAsync('npm run build');
          console.log('Client built successfully');

          if (fs.existsSync(distDir)) {
            await execAsync(`cp -r ${distDir}/* ${publicDir}/`);
            console.log('Static files copied successfully');
          } else {
            console.log('Checking alternative build directory...');
            const altDistDir = path.resolve(__dirname, '..', 'dist');
            if (fs.existsSync(altDistDir)) {
              await execAsync(`cp -r ${altDistDir}/* ${publicDir}/`);
              console.log('Static files copied from alternate location');
            } else {
              throw new Error('Build directory not found');
            }
          }
        } catch (buildError) {
          console.error('Build process failed:', buildError);
          throw buildError;
        }
      } else {
        console.log('Static files already exist, skipping build step');
      }

      serveStatic(app);
    } else if (app.get("env") === "development") {
      console.log('Setting up Vite for development...');
      await setupVite(app, server);
    } else {
      console.log('Setting up static serving for production...');
      serveStatic(app);
    }

    return server;
  } catch (error) {
    console.error('Server initialization failed:', error);
    throw error;
  }
}

// Kill any existing process on port 5000 before starting
async function killExistingProcess() {
  try {
    console.log('Checking for existing process on port 5000...');
    await execAsync('lsof -t -i:5000 | xargs kill -9');
    console.log('Killed existing process on port 5000');
  } catch (error) {
    // Ignore error if no process was found
    console.log('No existing process found on port 5000');
  }
}

// Modify the startServer function to try alternative ports
async function startServer(retries = 3, delay = 1000) {
  let lastError;
  const ports = [5000, 3000, 8080]; // Try these ports in order

  for (let attempt = 1; attempt <= retries; attempt++) {
    for (const port of ports) {
      try {
        await killExistingProcess();
        const server = await initializeServer();

        await new Promise((resolve, reject) => {
          server.listen({
            port,
            host: "0.0.0.0",
            reusePort: true,
          })
          .once('error', (err) => {
            console.error(`Server start attempt ${attempt} on port ${port} failed:`, err);
            reject(err);
          })
          .once('listening', () => {
            console.log(`Server started successfully on port ${port} (attempt ${attempt})`);
            // Set the port for Vite to use
            process.env.PORT = port.toString();
            resolve(true);
          });
        });

        return; // Success, exit both loops
      } catch (error) {
        lastError = error;
        console.error(`Start attempt ${attempt} on port ${port} failed:`, error);

        if (port === ports[ports.length - 1] && attempt < retries) {
          console.log(`All ports failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
  }

  // If we get here, all retries on all ports failed
  console.error('Failed to start server after', retries, 'attempts on ports:', ports);
  console.error('Last error:', lastError);
  process.exit(1);
}

// Start the server with retries
startServer().catch(error => {
  console.error('Fatal error starting server:', error);
  console.error('Error details:', error instanceof Error ? error.stack : error);
  process.exit(1);
});