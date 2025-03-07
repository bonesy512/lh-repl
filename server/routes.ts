import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertParcelSchema, insertAnalysisSchema, insertCampaignSchema } from "@shared/schema";
import { TOKEN_PACKAGES } from "../client/src/lib/stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
  typescript: true,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      let user = await storage.getUserByFirebaseId(data.firebaseUid);
      if (!user) {
        user = await storage.createUser(data);
      }
      
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // User endpoints
  app.get("/api/user", async (req, res) => {
    const firebaseUid = req.headers["x-firebase-uid"];
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseId(firebaseUid as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  });

  // Parcel endpoints
  app.get("/api/parcels", async (req, res) => {
    const firebaseUid = req.headers["x-firebase-uid"];
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseId(firebaseUid as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const parcels = await storage.getParcels(user.id);
    res.json(parcels);
  });

  app.post("/api/parcels", async (req, res) => {
    try {
      const firebaseUid = req.headers["x-firebase-uid"];
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseId(firebaseUid as string);
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
  app.get("/api/analyses/:parcelId", async (req, res) => {
    const parcelId = parseInt(req.params.parcelId);
    const analyses = await storage.getAnalysesByParcel(parcelId);
    res.json(analyses);
  });

  app.post("/api/analyses", async (req, res) => {
    try {
      const firebaseUid = req.headers["x-firebase-uid"];
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseId(firebaseUid as string);
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
  app.get("/api/campaigns", async (req, res) => {
    const firebaseUid = req.headers["x-firebase-uid"];
    if (!firebaseUid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUserByFirebaseId(firebaseUid as string);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const campaigns = await storage.getCampaigns(user.id);
    res.json(campaigns);
  });

  app.post("/api/campaigns", async (req, res) => {
    try {
      const firebaseUid = req.headers["x-firebase-uid"];
      if (!firebaseUid) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUserByFirebaseId(firebaseUid as string);
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

  const httpServer = createServer(app);
  return httpServer;
}