import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertParcelSchema, insertAnalysisSchema, insertCampaignSchema } from "@shared/schema";
import { TOKEN_PACKAGES } from "../client/src/lib/stripe";
import admin from "firebase-admin";
import { generateApiDocsHtml } from './api-docs';
import { config } from "./config";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize Firebase Admin
console.log('Initializing Firebase Admin...');
try {
  // The private key is already validated in config.ts
  const privateKey = config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "landhacker-9a7c1",
      clientEmail: config.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  throw error;
}

// Middleware to verify Firebase token
async function verifyFirebaseToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Unauthorized: Missing or invalid Bearer token in header.");
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split('Bearer ')[1];
    if (!token || token === 'undefined' || token === 'null') {
      console.error("Invalid token format:", token);
      return res.status(401).json({ message: "Invalid token format" });
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      if (!decodedToken || !decodedToken.uid) {
        console.error("Token verified but missing UID");
        return res.status(401).json({ message: "Invalid token content" });
      }
      req.user = decodedToken;
      console.log("Firebase token verified successfully for user:", decodedToken.uid);
      next();
    } catch (error: any) {
      console.error('Firebase token verification failed:', error.message, error.stack);
      const errorMessage = error.message || "Invalid token";
      return res.status(401).json({ message: errorMessage });
    }
  } catch (error: any) {
    console.error('Error in auth middleware:', error.message, error.stack);
    res.status(401).json({ message: "Unauthorized" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/login", verifyFirebaseToken, async (req, res) => {
    try {
      const data = insertUserSchema.parse({
        username: req.user.name || req.user.email?.split('@')[0] || 'user',
        email: req.user.email,
        firebaseUid: req.user.uid,
      });

      let user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        user = await storage.createUser(data);
      }

      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User endpoints
  app.get("/api/user", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Parcel endpoints
  app.get("/api/parcels", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const parcels = await storage.getParcels(user.id);
      res.json(parcels);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/parcels", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertParcelSchema.parse({ ...req.body, userId: user.id });
      const parcel = await storage.createParcel(data);
      res.json(parcel);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analysis endpoints
  app.get("/api/analyses/:parcelId", verifyFirebaseToken, async (req, res) => {
    try {
      const parcelId = parseInt(req.params.parcelId);
      const analyses = await storage.getAnalysesByParcel(parcelId);
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/analyses", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.credits < req.body.creditsUsed) {
        return res.status(400).json({ message: "Insufficient credits" });
      }

      const data = insertAnalysisSchema.parse({ ...req.body, userId: user.id });
      const analysis = await storage.createAnalysis(data);

      // Deduct credits
      await storage.updateUserCredits(
        user.id,
        user.credits - data.creditsUsed
      );

      res.json(analysis);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Campaign endpoints
  app.get("/api/campaigns", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const campaigns = await storage.getCampaigns(user.id);
      res.json(campaigns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/campaigns", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const data = insertCampaignSchema.parse({ ...req.body, userId: user.id });
      const campaign = await storage.createCampaign(data);
      res.json(campaign);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Payment endpoints
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { packageId } = z.object({
        packageId: z.enum(["basic", "pro", "enterprise"])
      }).parse(req.body);

      const pkg = TOKEN_PACKAGES[packageId];

      const paymentIntent = await stripe.paymentIntents.create({
        amount: pkg.price,
        currency: "usd",
        metadata: {
          packageId,
          tokens: pkg.tokens.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Stripe webhook
  app.post("/api/webhook", async (req, res) => {
    const sig = req.headers["stripe-signature"];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );

      if (event.type === "payment_intent.succeeded") {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const tokens = parseInt(paymentIntent.metadata.tokens);
        const userId = parseInt(paymentIntent.metadata.userId);

        const user = await storage.getUser(userId);
        if (user) {
          await storage.updateUserCredits(userId, user.credits + tokens);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Add new endpoint for getting acre prices
  app.post("/api/acres-prices", verifyFirebaseToken, async (req, res) => {
    try {
      const { city, acres, zip_code } = z.object({
        city: z.string(),
        acres: z.number(),
        zip_code: z.string()
      }).parse(req.body);

      // Get similar properties from database
      const similarProperties = await storage.getSimilarProperties({
        city,
        acres: acres * 0.75, // Lower bound (within 25%)
        maxAcres: acres * 1.25, // Upper bound (within 25%)
        zipCode: zip_code
      });

      res.json({ prices: similarProperties });
    } catch (error: any) {
      console.error('Error getting acre prices:', error.message, error.stack);
      res.status(400).json({ message: error.message });
    }
  });

  // Add API documentation route
  app.get('/api/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(generateApiDocsHtml());
  });

  const httpServer = createServer(app);
  return httpServer;
}