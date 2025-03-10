import { getStorage } from "firebase-admin/storage";
import { storage as dbStorage } from "./storage";
import { users, parcels, campaigns, analyses, dataImports } from "@shared/schema";
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
  importGISDataFromURL(dataType: 'parcel' | 'address', url: string, region: string, processType: 'full' | 'core' | 'premium'?: 'full'):Promise<void>;
  createDataImport(data: any): Promise<any>;
  createPremiumDataJob(jobData: {
    userId: number;
    parcelId: number;
    requestType: string;
    status: string;
    createdAt: Date;
  }): Promise<number>;
  processPremiumDataJob(jobId: number): Promise<void>;
  getJobStatus(jobId: number): Promise<any>;
  processCoreGISData(filePath: string, dataType: string, region: string): Promise<number>;
  processPremiumGISData(filePath: string, dataType: string, region: string): Promise<number>;
  processFullGISData(filePath: string, dataType: string, region: string): Promise<number>;
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

  async importGISDataFromURL(dataType: 'parcel' | 'address', url: string, region: string, processType: 'full' | 'core' | 'premium' = 'full'): Promise<void> {
    let importRecord;
    try {
      // Create import record
      const [newImportRecord] = await db.insert(dataImports).values({
        sourceType: dataType,
        region: region,
        status: 'pending',
        recordCount: 0,
        metadata: { url, processType }
      }).returning();

      importRecord = newImportRecord;

      // Update status to processing
      await db
        .update(dataImports)
        .set({ status: 'processing' })
        .where(eq(dataImports.id, importRecord.id));

      // Get Firebase Storage instance
      const storage = getStorage();

      // Extract file path from Firebase Storage URL
      const filePathMatch = url.match(/\/o\/(.+?)\?/);
      if (!filePathMatch) {
        throw new Error('Invalid Firebase Storage URL format');
      }
      const filePath = decodeURIComponent(filePathMatch[1]);

      // Get file reference
      const fileRef = storage.bucket().file(filePath);
      const [exists] = await fileRef.exists();

      if (!exists) {
        throw new Error('File not found in Firebase Storage');
      }

      // Log the start of processing
      console.log(`Started import for ${dataType} data from ${filePath} for region ${region} as ${processType} data`);
      console.log('File exists in Firebase Storage, ready for processing');

      // Download the file to a temporary location for processing
      const tempFilePath = `/tmp/${Date.now()}_${filePath.split('/').pop()}`;
      await fileRef.download({ destination: tempFilePath });

      // Process based on type
      let recordCount = 0;

      if (processType === 'core') {
        // Process only core data (basic parcel boundaries and attributes)
        recordCount = await this.processCoreGISData(tempFilePath, dataType, region);
      } else if (processType === 'premium') {
        // Process premium data (detailed ownership, valuation)
        recordCount = await this.processPremiumGISData(tempFilePath, dataType, region);
      } else {
        // Process full dataset
        recordCount = await this.processFullGISData(tempFilePath, dataType, region);
      }

      // Update import record with success
      await db
        .update(dataImports)
        .set({ 
          status: 'completed',
          recordCount,
          metadata: { 
            ...importRecord.metadata, 
            completedAt: new Date().toISOString(),
            processedRecords: recordCount
          }
        })
        .where(eq(dataImports.id, importRecord.id));

      // Clean up temporary file
      const fs = require('fs');
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }

    } catch (error) {
      console.error('Error during GIS import:', error);

      // Update import record with error status
      if (importRecord) {
        await db
          .update(dataImports)
          .set({ 
            status: 'failed',
            errorDetails: error.message,
            metadata: { 
              ...importRecord.metadata, 
              error: error.message,
              errorTime: new Date().toISOString()
            }
          })
          .where(eq(dataImports.id, importRecord.id));
      }

      throw error;
    }
  }

  // Placeholder methods for GIS processing
  // In a real implementation, these would use appropriate GIS libraries
  async processCoreGISData(filePath: string, dataType: string, region: string): Promise<number> {
    console.log(`Processing core GIS data from ${filePath}`);
    // This would typically parse the GIS file format and extract basic data
    // For demo purposes, we'll just return a count
    return 100;
  }

  async processPremiumGISData(filePath: string, dataType: string, region: string): Promise<number> {
    console.log(`Processing premium GIS data from ${filePath}`);
    // This would extract detailed property information
    return 50;
  }

  async processFullGISData(filePath: string, dataType: string, region: string): Promise<number> {
    console.log(`Processing full GIS dataset from ${filePath}`);
    // Process both core and premium data
    const coreCount = await this.processCoreGISData(filePath, dataType, region);
    const premiumCount = await this.processPremiumGISData(filePath, dataType, region);
    return coreCount + premiumCount;
  }

  // Data import record management
  async createDataImport(data: any): Promise<any> {
    const [importRecord] = await db.insert(dataImports).values(data).returning();
    return importRecord;
  }

  // Premium data job management
  async createPremiumDataJob(jobData: {
    userId: number;
    parcelId: number;
    requestType: string;
    status: string;
    createdAt: Date;
  }): Promise<number> {
    // In a real implementation, this would create a record in a jobs table
    // For demo purposes, we'll just log it and return a mock job ID
    console.log('Creating premium data job:', jobData);
    return Math.floor(Math.random() * 10000);
  }

  async processPremiumDataJob(jobId: number): Promise<void> {
    console.log(`Processing premium data job ${jobId}`);
    // In a real implementation, this would retrieve the GIS data
    // and process it based on subscription level
  }

  async getJobStatus(jobId: number): Promise<any> {
    // In a real implementation, this would query a jobs table
    // For demo purposes, return mock data
    return {
      id: jobId,
      status: 'completed',
      data: {
        ownerName: 'Demo Owner',
        assessedValue: 250000,
        history: [
          { year: 2020, value: 220000 },
          { year: 2021, value: 235000 },
          { year: 2022, value: 250000 }
        ]
      }
    };
  }
}

export const storage = new DatabaseStorage();