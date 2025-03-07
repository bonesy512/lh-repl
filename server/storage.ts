import { users, parcels, campaigns, analyses } from "@shared/schema";
import type { User, InsertUser, Parcel, InsertParcel, Campaign, InsertCampaign, Analysis, InsertAnalysis } from "@shared/schema";

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private parcels: Map<number, Parcel>;
  private campaigns: Map<number, Campaign>;
  private analyses: Map<number, Analysis>;
  private currentId: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.parcels = new Map();
    this.campaigns = new Map();
    this.analyses = new Map();
    this.currentId = {
      users: 1,
      parcels: 1,
      campaigns: 1,
      analyses: 1
    };
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByFirebaseId(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { ...insertUser, id, credits: 0 };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, credits };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Parcel operations
  async getParcel(id: number): Promise<Parcel | undefined> {
    return this.parcels.get(id);
  }

  async getParcels(userId: number): Promise<Parcel[]> {
    return Array.from(this.parcels.values()).filter(
      (parcel) => parcel.userId === userId
    );
  }

  async createParcel(insertParcel: InsertParcel): Promise<Parcel> {
    const id = this.currentId.parcels++;
    const parcel: Parcel = { 
      ...insertParcel, 
      id,
      details: insertParcel.details || null,
      price: insertParcel.price || null,
      userId: insertParcel.userId || null
    };
    this.parcels.set(id, parcel);
    return parcel;
  }

  // Campaign operations
  async getCampaign(id: number): Promise<Campaign | undefined> {
    return this.campaigns.get(id);
  }

  async getCampaigns(userId: number): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(
      (campaign) => campaign.userId === userId
    );
  }

  async createCampaign(insertCampaign: InsertCampaign): Promise<Campaign> {
    const id = this.currentId.campaigns++;
    const now = new Date();
    const campaign: Campaign = {
      ...insertCampaign,
      id,
      createdAt: now,
      userId: insertCampaign.userId || null,
      parcelId: insertCampaign.parcelId || null,
      active: insertCampaign.active || false
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async updateCampaign(id: number, active: boolean): Promise<Campaign> {
    const campaign = await this.getCampaign(id);
    if (!campaign) throw new Error("Campaign not found");

    const updatedCampaign = { ...campaign, active };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  // Analysis operations
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }

  async getAnalysesByParcel(parcelId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).filter(
      (analysis) => analysis.parcelId === parcelId
    );
  }

  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.currentId.analyses++;
    const now = new Date();
    const analysis: Analysis = {
      ...insertAnalysis,
      id,
      createdAt: now,
      userId: insertAnalysis.userId || null,
      parcelId: insertAnalysis.parcelId || null
    };
    this.analyses.set(id, analysis);
    return analysis;
  }
}

export const storage = new MemStorage();