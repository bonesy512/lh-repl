import { pgTable, text, serial, integer, numeric, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table - removed all subscription-related fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  credits: integer("credits").notNull().default(0),
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Insert schema
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firebaseUid: true,
});

// Parcel table
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  address: text("address").notNull(),
  latitude: numeric("latitude").notNull(),
  longitude: numeric("longitude").notNull(),
  acres: numeric("acres").notNull(),
  price: integer("price"),
  details: jsonb("details"),
  userId: integer("user_id").references(() => users.id),
});

// Analysis table
export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").references(() => parcels.id),
  userId: integer("user_id").references(() => users.id),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  creditsUsed: integer("credits_used").notNull(),
});

// Export types
export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;

// Insert schemas
export const insertParcelSchema = createInsertSchema(parcels).pick({
  address: true,
  latitude: true,
  longitude: true,
  acres: true,
  price: true,
  details: true,
  userId: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  parcelId: true,
  userId: true,
  analysis: true,
  creditsUsed: true,
});