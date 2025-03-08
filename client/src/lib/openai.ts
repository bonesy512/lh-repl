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
    console.log('Starting property analysis:', {
      address,
      acres,
      latitude,
      longitude,
      currentPrice
    });

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

    return analysis;
  } catch (error: any) {
    console.error('Analysis error:', error);
    throw new Error(`Failed to analyze property: ${error.message}`);
  }
}

export async function generateMarketingDescription(
  propertyDetails: any,
  targetAudience: string
): Promise<string> {
  try {
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

    return response.choices[0].message.content || "";
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