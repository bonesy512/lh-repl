import OpenAI from "openai";
import { getCachedAnalysis, cacheAnalysis } from "./firebase";
import { type PropertyAnalysis } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export async function analyzeProperty(
  address: string,
  acres: number,
  currentPrice?: number
): Promise<PropertyAnalysis> {
  try {
    // Generate a cache key from the property details
    const cacheKey = `${address}_${acres}_${currentPrice || 'no_price'}`;

    // Check cache first
    const cachedResult = await getCachedAnalysis(cacheKey);
    if (cachedResult && cachedResult.expiresAt > Date.now()) {
      console.log('Using cached analysis');
      return cachedResult.analysis;
    }

    console.log('No valid cache found, performing new analysis');

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a real estate analysis expert. Analyze the given property and provide detailed insights."
        },
        {
          role: "user",
          content: `Please analyze this property:
            Address: ${address}
            Acres: ${acres}
            ${currentPrice ? `Listed Price: $${currentPrice}` : ""}

            Provide a detailed analysis including estimated value, confidence score, key features, risks, opportunities, and market trends.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const analysis = JSON.parse(response.choices[0].message.content) as PropertyAnalysis;

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
    // Generate a cache key for marketing content
    const cacheKey = `marketing_${propertyDetails.id}_${targetAudience}`;

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
}