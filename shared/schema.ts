import { pgTable, text, serial, integer, numeric, jsonb, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing table definitions remain unchanged
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  firebaseUid: text("firebase_uid").notNull().unique(),
  credits: integer("credits").notNull().default(0),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
});

// Add subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  tier: text("tier").notNull(), // "basic", "professional", "enterprise"
  status: text("status").notNull(), // "active", "canceled", "past_due"
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// Add state access table
export const stateAccess = pgTable("state_access", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  state: text("state").notNull(), // e.g., "TX", "CA", "NY"
  accessUntil: timestamp("access_until").notNull(),
  purchaseDate: timestamp("purchase_date").notNull().defaultNow(),
  purchaseAmount: numeric("purchase_amount").notNull(),
});

// Add PostGIS support for parcels table
export const parcels = pgTable("parcels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  address: text("address").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  acres: text("acres").notNull(),
  price: integer("price"),
  details: jsonb("details"),
  // Add geometry column for PostGIS
  geometry: sql`geometry(Polygon, 4326)`,
  // Add point location for quick lookups
  location: sql`geometry(Point, 4326)`,
});

// Add spatial index
sql`CREATE INDEX IF NOT EXISTS parcels_geometry_idx ON parcels USING GIST (geometry)`;
sql`CREATE INDEX IF NOT EXISTS parcels_location_idx ON parcels USING GIST (location)`;

// New table for storing property analyses
export const propertyAnalyses = pgTable("property_analyses", {
  id: serial("id").primaryKey(),
  parcelId: integer("parcel_id").references(() => parcels.id),
  userId: integer("user_id").references(() => users.id),
  estimatedValue: integer("estimated_value").notNull(),
  confidenceScore: numeric("confidence_score").notNull(),
  keyFeatures: jsonb("key_features").notNull(),
  risks: jsonb("risks").notNull(),
  opportunities: jsonb("opportunities").notNull(),
  marketTrends: jsonb("market_trends").notNull(),
  comparableProperties: jsonb("comparable_properties").notNull(),
  distanceInfo: jsonb("distance_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Types for property analysis
export type PropertyAnalysis = {
  estimatedValue: number;
  confidenceScore: number;
  keyFeatures: string[];
  risks: string[];
  opportunities: string[];
  marketTrends: {
    direction: "up" | "down" | "stable";
    reasoning: string;
  };
  comparableProperties: ComparableProperty[];
  distanceInfo?: DistanceInfo;
};

export type ComparableProperty = {
  address: string;
  acres: number;
  price: number;
  distanceFromTarget: number; // in miles
  dateOfSale?: string;
  pricePerAcre: number;
};

export type DistanceInfo = {
  nearestCity: string;
  distanceText: string; // e.g. "5.2 miles"
  distanceValue: number; // in meters
  durationText: string; // e.g. "12 mins"
  durationValue: number; // in seconds
};

// Export existing types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Parcel = typeof parcels.$inferSelect;
export type InsertParcel = z.infer<typeof insertParcelSchema>;

export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;


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

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  firebaseUid: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionEndsAt:true,
});

export const insertParcelSchema = createInsertSchema(parcels).pick({
  address: true,
  latitude: true,
  longitude: true,
  acres: true,
  price: true,
  details: true,
  userId: true,
  geometry: true,
  location: true,
});

export const insertPropertyAnalysisSchema = createInsertSchema(propertyAnalyses).pick({
  parcelId: true,
  userId: true,
  estimatedValue: true,
  confidenceScore: true,
  keyFeatures: true,
  risks: true,
  opportunities: true,
  marketTrends: true,
  comparableProperties: true,
  distanceInfo: true,
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

// Add subscription tiers enum
export const SubscriptionTier = {
  FREE: "free",
  BASIC: "basic", // Texas only, limited searches
  PROFESSIONAL: "professional", // Texas + advanced features
  ENTERPRISE: "enterprise", // Multi-state access
} as const;

export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

// Add subscription features
export const subscriptionFeatures = {
  [SubscriptionTier.FREE]: {
    maxSearches: 5,
    maxAnalyses: 1,
    includesTexas: false,
    price: 0,
  },
  [SubscriptionTier.BASIC]: {
    maxSearches: 50,
    maxAnalyses: 10,
    includesTexas: true,
    price: 49,
  },
  [SubscriptionTier.PROFESSIONAL]: {
    maxSearches: 500,
    maxAnalyses: 100,
    includesTexas: true,
    price: 199,
  },
  [SubscriptionTier.ENTERPRISE]: {
    maxSearches: -1, // unlimited
    maxAnalyses: -1, // unlimited
    includesTexas: true,
    price: 999,
  },
};

// Add subscription schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions);
export const insertStateAccessSchema = createInsertSchema(stateAccess);

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

export type StateAccess = typeof stateAccess.$inferSelect;
export type InsertStateAccess = z.infer<typeof insertStateAccessSchema>;

// Add data import tracking table
export const dataImports = pgTable("data_imports", {
  id: serial("id").primaryKey(),
  sourceType: text("source_type").notNull(), // 'parcel' or 'address'
  region: text("region").notNull(), // e.g., county name or region identifier
  importedAt: timestamp("imported_at").notNull().defaultNow(),
  recordCount: integer("record_count").notNull(),
  status: text("status").notNull(), // 'pending', 'processing', 'completed', 'failed'
  errorDetails: text("error_details"),
  metadata: jsonb("metadata"), // Additional import metadata
});

// Add data source tracking
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
  updateFrequency: text("update_frequency"), // e.g., 'daily', 'weekly', 'monthly'
  costPerUpdate: numeric("cost_per_update"),
  nextUpdateDue: timestamp("next_update_due"),
  metadata: jsonb("metadata"), // Additional source metadata
});

// Export types
export type DataImport = typeof dataImports.$inferSelect;
export type InsertDataImport = z.infer<typeof insertDataImportSchema>;

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;

// Insert schemas
export const insertDataImportSchema = createInsertSchema(dataImports).pick({
  sourceType: true,
  region: true,
  recordCount: true,
  status: true,
  errorDetails: true,
  metadata: true,
});

export const insertDataSourceSchema = createInsertSchema(dataSources).pick({
  name: true,
  provider: true,
  lastUpdated: true,
  updateFrequency: true,
  costPerUpdate: true,
  nextUpdateDue: true,
  metadata: true,
});