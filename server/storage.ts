import { users, parcels, analyses } from "@shared/schema";
import type { User, InsertUser, Parcel, InsertParcel, Analysis, InsertAnalysis } from "@shared/schema";
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
    try {
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firebaseUid: users.firebaseUid,
          credits: users.credits,
        })
        .from(users)
        .where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async getUserByFirebaseId(firebaseUid: string): Promise<User | undefined> {
    try {
      console.log('Fetching user by Firebase UID:', firebaseUid);
      const [user] = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firebaseUid: users.firebaseUid,
          credits: users.credits,
        })
        .from(users)
        .where(eq(users.firebaseUid, firebaseUid));
      return user;
    } catch (error) {
      console.error('Error fetching user by Firebase UID:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      console.log('Creating new user:', insertUser);
      const [user] = await db
        .insert(users)
        .values(insertUser)
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          firebaseUid: users.firebaseUid,
          credits: users.credits,
        });
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserCredits(id: number, credits: number): Promise<User> {
    try {
      const [user] = await db
        .update(users)
        .set({ credits })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          firebaseUid: users.firebaseUid,
          credits: users.credits,
        });
      return user;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }

  async getParcel(id: number): Promise<Parcel | undefined> {
    const [parcel] = await db.select().from(parcels).where(eq(parcels.id, id));
    return parcel;
  }

  async getParcels(userId: number): Promise<Parcel[]> {
    // For testing, return sample Texas parcels if no parcels exist
    const existingParcels = await db.select().from(parcels).where(eq(parcels.userId, userId));

    if (existingParcels.length === 0) {
      // Sample Texas parcels for testing
      const sampleParcels = [
        {
          id: 1,
          userId,
          address: JSON.stringify({
            street: "1234 Ranch Road",
            city: "Austin",
            state: "TX",
            zipcode: "78701"
          }),
          acres: 25.5,
          price: 750000,
          latitude: 30.2672,
          longitude: -97.7431,
          details: JSON.stringify({
            gisArea: 25.5,
            marketValue: 750000,
            landValue: 600000,
            improvementValue: 150000,
            county: "Travis"
          })
        },
        {
          id: 2,
          userId,
          address: JSON.stringify({
            street: "5678 Hill Country Blvd",
            city: "Dallas",
            state: "TX",
            zipcode: "75201"
          }),
          acres: 15.3,
          price: 450000,
          latitude: 32.7767,
          longitude: -96.7970,
          details: JSON.stringify({
            gisArea: 15.3,
            marketValue: 450000,
            landValue: 350000,
            improvementValue: 100000,
            county: "Dallas"
          })
        },
        {
          id: 3,
          userId,
          address: JSON.stringify({
            street: "910 Longhorn Lane",
            city: "Houston",
            state: "TX",
            zipcode: "77002"
          }),
          acres: 32.7,
          price: 980000,
          latitude: 29.7604,
          longitude: -95.3698,
          details: JSON.stringify({
            gisArea: 32.7,
            marketValue: 980000,
            landValue: 800000,
            improvementValue: 180000,
            county: "Harris"
          })
        }
      ];

      // Insert sample parcels into database
      await db.insert(parcels).values(sampleParcels);
      return sampleParcels;
    }

    return existingParcels;
  }

  async createParcel(insertParcel: InsertParcel): Promise<Parcel> {
    const [parcel] = await db.insert(parcels).values(insertParcel).returning();
    return parcel;
  }

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
        improvementValue: sql<number>`(${parcels.details}::jsonb->>'improvementValue')::numeric`,
        latitude: sql<number>`(${parcels.address}::jsonb->>'latitude')::numeric`,
        longitude: sql<number>`(${parcels.address}::jsonb->>'longitude')::numeric`
      })
      .from(parcels)
      .where(
        and(
          // More flexible city matching (case insensitive)
          sql`LOWER(${parcels.address}::jsonb->>'city') = ${city.toLowerCase()}`,
          // Use zip prefix for broader area search
          sql`${parcels.address}::jsonb->>'zipcode' LIKE ${zipPrefix + '%'}`,
          // Dynamic acre range based on property size
          sql`COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) >= ${acres * 0.5}`,
          sql`COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) <= ${acres * 2}`,
          // Must have either market value or price
          sql`COALESCE((${parcels.details}::jsonb->>'marketValue')::numeric, ${parcels.price}) IS NOT NULL`,
          // Filter out unreasonable prices (between $15,000 and $35,000 per acre)
          sql`COALESCE((${parcels.details}::jsonb->>'marketValue')::numeric, ${parcels.price}) / COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) BETWEEN 15000 AND 35000`
        )
      )
      .orderBy(sql`ABS(COALESCE((${parcels.details}::jsonb->>'gisArea')::numeric, ${parcels.acres}) - ${acres})`) // Order by closest acre size
      .limit(10);

    console.log("Raw query results:", query);

    const results = query.map(property => {
      const propertyAcres = property.gisArea || property.acres;
      const propertyPrice = property.marketValue || property.price;
      const pricePerAcre = propertyPrice / propertyAcres;

      // Calculate similarity score based on multiple factors
      const acreSimilarity = 1 - Math.abs(propertyAcres - acres) / Math.max(propertyAcres, acres);
      const priceSimilarity = property.landValue ? 0.2 : 0; // Bonus for having detailed value data
      const similarityScore = acreSimilarity + priceSimilarity;

      return {
        address: typeof property.address === 'string' ? JSON.parse(property.address) : property.address,
        price: propertyPrice,
        acre: propertyAcres,
        pricePerAcre,
        similarityScore,
        // Include additional data
        fipsCode: property.fipsCode,
        county: property.county,
        landValue: property.landValue,
        improvementValue: property.improvementValue,
        // Include location data
        latitude: property.latitude,
        longitude: property.longitude
      };
    });

    // Sort by similarity score and price per acre relevance
    results.sort((a, b) => {
      // Primary sort by similarity score
      if (b.similarityScore !== a.similarityScore) {
        return b.similarityScore - a.similarityScore;
      }
      // Secondary sort by price per acre (closer to median)
      const median = results.reduce((acc, curr) => acc + curr.pricePerAcre, 0) / results.length;
      return Math.abs(a.pricePerAcre - median) - Math.abs(b.pricePerAcre - median);
    });

    console.log(`Found ${results.length} similar properties:`, results);
    return results;
  }
}

export const storage = new DatabaseStorage();