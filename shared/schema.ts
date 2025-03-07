import { pgTable, text, serial, integer, numeric, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  credits: integer("credits").notNull().default(0),
});

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

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  name: text("name").notNull(),
  parcelId: integer("parcel_id").references(() => parcels.id),
  templateData: jsonb("template_data").notNull(),
  active: boolean("active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").references(() => parcels.id),
  userId: integer("user_id").references(() => users.id),
  analysis: jsonb("analysis").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  creditsUsed: integer("credits_used").notNull(),
});

// Insert types
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firebaseUid: true,
});

export const insertParcelSchema = createInsertSchema(parcels).pick({
  address: true,
  latitude: true,
  longitude: true,
  acres: true,
  price: true,
  details: true,
  userId: true,
});

export const insertCampaignSchema = createInsertSchema(campaigns).pick({
  name: true,
  userId: true,
  parcelId: true,
  templateData: true,
  active: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  parcelId: true,
  userId: true,
  analysis: true,
  creditsUsed: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
