import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertParcelSchema, insertAnalysisSchema, insertCampaignSchema } from "@shared/schema";
import { TOKEN_PACKAGES } from "../client/src/lib/stripe";
import admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

// Initialize Firebase Admin
console.log('Initializing Firebase Admin...');
try {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error('Missing required Firebase credentials');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "landhacker-9a7c1",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
    storageBucket: "landhacker-9a7c1.appspot.com" // Add bucket configuration
  });
  console.log('Firebase Admin initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase Admin:', error);
  throw error;
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

// Middleware to verify Firebase token
async function verifyFirebaseToken(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split('Bearer ')[1];
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = decodedToken;
      next();
    } catch (error) {
      console.error('Firebase token verification failed:', error);
      return res.status(401).json({ message: "Invalid token" });
    }
  } catch (error) {
    console.error('Error in auth middleware:', error);
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
      console.error('Login error:', error);
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
      console.error('Error fetching user:', error);
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
      console.error('Error fetching parcels:', error);
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
      console.error('Error getting acre prices:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Update the import route to handle directory paths
  app.post("/api/import-gis-data", verifyFirebaseToken, async (req, res) => {
    try {
      const { dataType, url, region, processType } = z.object({
        dataType: z.enum(["parcel", "address"]),
        url: z.string()
          .url()
          .refine(
            (url) => url.startsWith('https://firebasestorage.googleapis.com/'),
            'Only Firebase Storage URLs are supported'
          ),
        region: z.string(),
        processType: z.enum(["full", "core", "premium"]).default("full")
      }).parse(req.body);

      // Get user to associate with import
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Only allow admins/staff to import data
      if (user.subscriptionTier !== "enterprise") {
        return res.status(403).json({ message: "Unauthorized to import data" });
      }

      // Create an import job record
      const importJob = await storage.createDataImport({
        sourceType: dataType,
        region: region,
        status: 'processing',
        recordCount: 0,
        metadata: { 
          url,
          processType,
          startedBy: user.id,
          startTime: new Date().toISOString()
        }
      });

      // Process based on the requested type
      await storage.importGISDataFromURL(dataType, url, region, processType);
      
      res.json({ 
        message: "Import started successfully",
        jobId: importJob.id,
        note: "Upload your GIS files to Firebase Storage and use the download URL in this endpoint",
        processNotes: `Processing as ${processType} dataset: ` + 
          (processType === "core" ? "Only basic data will be processed for all users" : 
           processType === "premium" ? "Premium data will be processed for subscribers" : 
           "Complete dataset will be processed"),
        example: {
          downloadUrl: "https://firebasestorage.googleapis.com/v0/b/landhacker-9a7c1.appspot.com/o/Texas%2FAddresses%2Fyour-file.gdbtable",
          usage: "Get the download URL for each .gdbtable file from Firebase Console"
        }
      });
    } catch (error: any) {
      console.error('Error starting GIS data import:', error);
      res.status(400).json({ message: error.message });
    }
  });
  
  // Add endpoint for premium data access
  app.post("/api/premium-gis-data", verifyFirebaseToken, async (req, res) => {
    try {
      const { parcelId, dataType } = z.object({
        parcelId: z.number(),
        dataType: z.enum(["ownership", "valuation", "history"])
      }).parse(req.body);

      // Get user to check subscription
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check subscription for premium access
      if (user.subscriptionTier === "free") {
        return res.status(403).json({ 
          message: "Premium subscription required",
          requiredTier: "basic" 
        });
      }

      // Create a processing job
      const jobId = await storage.createPremiumDataJob({
        userId: user.id,
        parcelId,
        requestType: dataType,
        status: "queued",
        createdAt: new Date()
      });

      // For demo, immediately process the job
      // In production, this would be handled by a worker
      setTimeout(() => {
        storage.processPremiumDataJob(jobId);
      }, 100);

      res.json({
        message: "Premium data request queued",
        jobId,
        status: "queued"
      });
    } catch (error: any) {
      console.error('Error requesting premium data:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // Add endpoint to check job status
  app.get("/api/job-status/:jobId", verifyFirebaseToken, async (req, res) => {
    try {
      const jobId = parseInt(req.params.jobId);
      const job = await storage.getJobStatus(jobId);
      
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Check if user has access to this job
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user || (job.userId !== user.id && user.subscriptionTier !== "enterprise")) {
        return res.status(403).json({ message: "Unauthorized access to job" });
      }

      res.json(job);
    } catch (error: any) {
      console.error('Error checking job status:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}