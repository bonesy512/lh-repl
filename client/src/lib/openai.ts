import OpenAI from "openai";
import { getCachedAnalysis, cacheAnalysis } from "./firebase";
import { type PropertyAnalysis, type DistanceInfo } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

async function getDistanceToCity(latitude: number, longitude: number): Promise<DistanceInfo | null> {
  try {
    const response = await apiRequest(
      "POST", 
      "/api/distance-to-city",
      {
        origins: `${latitude},${longitude}`,
        destination: "nearest" // API will find nearest major city
      }
    );

    if (!response.ok) {
      console.error("Distance API error:", await response.text());
      return null;
    }

    const data = await response.json();
    if (!data || typeof data !== 'object') {
      console.error("Invalid distance data format:", data);
      return null;
    }

    return data as DistanceInfo;
  } catch (error) {
    console.error("Failed to get distance info:", error);
    return null;
  }
}

export async function analyzeProperty(
  address: string,
  acres: number,
  latitude: number,
  longitude: number,
  currentPrice?: number
): Promise<PropertyAnalysis> {
  try {
    // Generate a safe cache key from the property details
    const cacheKey = `analysis_${Math.abs(latitude)}_${Math.abs(longitude)}_${acres}`;

    // Check cache first
    const cachedResult = await getCachedAnalysis(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      console.log('Using cached analysis');
      return cachedResult.analysis;
    }

    console.log('No valid cache found, performing new analysis');

    // Get distance to nearest city
    const distanceInfo = await getDistanceToCity(latitude, longitude);

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a real estate analysis expert specializing in land valuation. 
          Analyze properties considering location, size, and market conditions.
          Provide detailed insights including estimated value, confidence score, and comparable properties.`
        },
        {
          role: "user",
          content: `Please analyze this property:
            Address: ${address}
            Acres: ${acres}
            Location: ${latitude}, ${longitude}
            ${currentPrice ? `Listed Price: $${currentPrice}` : ''}
            ${distanceInfo ? `Distance to ${distanceInfo.nearestCity}: ${distanceInfo.distanceText} (${distanceInfo.durationText} drive)` : ''}

            Provide a detailed analysis including:
            1. Estimated market value with confidence score
            2. Key features of the property
            3. Potential risks and opportunities
            4. Market trends in the area
            5. Comparable properties with similar characteristics

            Return the analysis in JSON format matching the PropertyAnalysis type.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content) as PropertyAnalysis;

    // Add distance info to the analysis
    if (distanceInfo) {
      analysis.distanceInfo = distanceInfo;
    }

    // Cache the result
    await cacheAnalysis(cacheKey, { analysis });

    return analysis;
  } catch (error: any) {
    throw new Error(`Failed to analyze property: ${error.message}`);
  }
}

export async function generateMarketingDescription(
  propertyDetails: any,
  targetAudience: string
): Promise<string> {
  try {
    // Generate a safe cache key for marketing content
    const cacheKey = `marketing_${propertyDetails.id}_${targetAudience.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // Check cache first
    const cachedResult = await getCachedAnalysis(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      console.log('Using cached marketing description');
      return cachedResult.description;
    }

    console.log('No valid cache found, generating new marketing description');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a real estate marketing expert. Create compelling property descriptions."
        },
        {
          role: "user",
          content: `Create a marketing description for this property targeting ${targetAudience}:
            ${JSON.stringify(propertyDetails, null, 2)}`
        }
      ]
    });

    const description = response.choices[0].message.content || "";

    // Cache the result
    await cacheAnalysis(cacheKey, { description });

    return description;
  } catch (error: any) {
    throw new Error(`Failed to generate marketing description: ${error.message}`);
  }
}

export interface PropertyAnalysis {
  estimatedValue: number;
  confidenceScore: number;
  keyFeatures: string[];
  risks: string[];
  opportunities: string[];
  marketTrends: {
    direction: "up" | "down" | "stable";
    reasoning: string;
  };
  distanceInfo?: DistanceInfo;
}