import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import Stripe from "stripe";
import { z } from "zod";
import { insertUserSchema, insertParcelSchema, insertAnalysisSchema } from "@shared/schema";
import admin from "firebase-admin";

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
      console.log('Login attempt with data:', {
        name: req.user.name,
        email: req.user.email,
        uid: req.user.uid
      });

      const data = insertUserSchema.parse({
        username: req.user.name || req.user.email?.split('@')[0] || 'user',
        email: req.user.email,
        firebaseUid: req.user.uid,
      });

      let user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        console.log('Creating new user');
        try {
          user = await storage.createUser(data);
        } catch (createError) {
          console.error('Error creating user:', createError);
          return res.status(500).json({ 
            message: "Failed to create user account",
            error: createError instanceof Error ? createError.message : String(createError)
          });
        }
      }

      console.log('Login successful:', user);
      res.json(user);
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ message: error.message });
    }
  });

  // User endpoints
  app.get("/api/user", verifyFirebaseToken, async (req, res) => {
    try {
      console.log('Fetching user with Firebase UID:', req.user.uid);
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        console.log('User not found in database for UID:', req.user.uid);
        return res.status(404).json({ message: "User not found" });
      }
      console.log('User found:', user);
      res.json(user);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      console.error('Error details:', error.stack);
      res.status(500).json({ 
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  // Team Management endpoints
  app.get("/api/team", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Try to get team data from storage
      let teamData = await storage.getTeamByOwnerId(user.id);

      // If no team data exists, create mock data
      if (!teamData) {
        teamData = {
          ownerId: user.id,
          seats: 3,
          members: [
            {
              id: user.id,
              name: user.username,
              email: user.email,
              role: "Owner",
              allocatedCredits: user.credits
            }
            // Additional members would be fetched from storage
          ]
        };
      }

      res.json(teamData);
    } catch (error: any) {
      console.error('Error fetching team data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add seat endpoint
  app.post("/api/team/seats", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // This would connect to Stripe to process payment
      // For now, just return success response
      res.json({ success: true, message: "Seat added successfully" });
    } catch (error: any) {
      console.error('Error adding seat:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Invite team member endpoint
  app.post("/api/team/invite", verifyFirebaseToken, async (req, res) => {
    try {
      const user = await storage.getUserByFirebaseId(req.user.uid);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // This would send an invitation email and store the invitation in the database
      // For now, just return success response
      res.json({ success: true, message: `Invitation sent to ${email}` });
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}