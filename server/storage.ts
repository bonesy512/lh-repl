import { users, parcels, campaigns, analyses } from "@shared/schema";
import type { User, InsertUser, Parcel, InsertParcel, Campaign, InsertCampaign, Analysis, InsertAnalysis } from "@shared/schema";
import { db } from "./db";
import { eq, gte, lte, desc, sql, and, isNotNull } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByFirebaseId(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<User>;

  // Parcel operations
  getParcel(id: number): Promise<Parcel | undefined>;
  getParcels(userId: number): Promise<Parcel[]>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;

  // Campaign operations
  getCampaign(id: number): Promise<Campaign | undefined>;
  getCampaigns(userId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaign(id: number, active: boolean): Promise<Campaign>;

  // Analysis operations 
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByParcel(parcelId: number): Promise<Analysis[]>;
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;

  // Property comparison operations
  getSimilarProperties(params: {
    city: string;
    acres: number;
    maxAcres: number;
    zipCode: string;
  }): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByFirebaseId(firebaseUid: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Parcel operations
  async getParcel(id: number): Promise<Parcel | undefined> {
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id));
    return parcel;
  }

  async getParcels(userId: number): Promise<Parcel[]> {
    return db.select().from(parcels).where(eq(parcels.userId, userId));
  }

  async createParcel(insertParcel: InsertParcel): Promise<Parcel> {
    const [parcel] = await db.insert(parcels).values(insertParcel).returning();
    return parcel;
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
    return campaign;
  }

  async getCampaigns(userId: number): Promise<Campaign[]> {
    return db.select().from(campaigns).where(eq(campaigns.userId, userId));
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const [campaign] = await db.insert(campaigns).values(insertCampaign).returning();
    return campaign;
  }

  async updateCampaign(id: number, active: boolean): Promise<Campaign> {
    const [campaign] = await db
      .update(campaigns)
      .set({ active })
      .where(eq(campaigns.id, id))
      .returning();
    return campaign;
  }

  // Analysis operations
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    const [analysis] = await db.select().from(analyses).where(eq(analyses.id, id));
    return analysis;
  }

  async getAnalysesByParcel(parcelId: number): Promise<Analysis[]> {
    return db.select().from(analyses).where(eq(analyses.parcelId, parcelId));
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const [analysis] = await db.insert(analyses).values(insertAnalysis).returning();
    return analysis;
  }

  async getSimilarProperties({
    city,
    acres,
    maxAcres,
    zipCode
  }: {
    city: string;
    acres: number;
    maxAcres: number;
    zipCode: string;
  }): Promise<any[]> {
    console.log("Searching for similar properties with params:", {
      city,
      acres,
      maxAcres,
      zipCode
    });

    // Use the first 3 digits of zipcode for broader area search
    const zipPrefix = zipCode.substring(0, 3);
    console.log("Using zip prefix for search:", zipPrefix);

    const query = await db
      .select({
        id: parcels.id,
        address: parcels.address,
        price: parcels.price,
        acres: parcels.acres,
        gisArea: sql<number>`COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres})`,
        marketValue: sql<number>`COALESCE((${parcels.details}::jsonb->>'marketValue')::numeric, ${parcels.price})`,
        fipsCode: sql<string>`${parcels.details}::jsonb->>'fipsCode'`,
        county: sql<string>`${parcels.details}::jsonb->>'county'`,
        landValue: sql<number>`(${parcels.details}::jsonb->>'landValue')::numeric`,
        improvementValue: sql<number>`(${parcels.details}::jsonb->>'improvementValue')::numeric`
      })
      .from(parcels)
      .where(
        and(
          // More flexible city matching (case insensitive)
          sql`LOWER(${parcels.address}::jsonb->>'city') = ${city.toLowerCase()}`,
          // Use zip prefix for broader area search
          sql`${parcels.address}::jsonb->>'zipcode' LIKE ${zipPrefix + '%'}`,
          // Flexible acre range (within 50% to 200% of target)
          sql`COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) > ${acres * 0.5}`,
          sql`COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) < ${acres * 2}`,
          // Must have either market value or price
          sql`COALESCE((${parcels.details}::jsonb->>'marketValue')::numeric, ${parcels.price}) IS NOT NULL`
        )
      )
      .orderBy(sql`ABS(COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) - ${acres})`) // Order by closest acre size
      .limit(10);

    console.log("Raw query results:", query);

    const results = query.map(property => ({
      address: typeof property.address === 'string' ? JSON.parse(property.address) : property.address,
      price: property.marketValue || property.price,
      acre: property.gisArea || property.acres,
      pricePerAcre: (property.marketValue || property.price) / (property.gisArea || property.acres),
      // Include additional GIS data
      fipsCode: property.fipsCode,
      county: property.county,
      landValue: property.landValue,
      improvementValue: property.improvementValue
    }));

    console.log(`Found ${results.length} similar properties:`, results);
    return results;
  }
}

export const storage = new DatabaseStorage();