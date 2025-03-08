import OpenAI from "openai";
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
        latitude,
        longitude
      }
    );

    if (!response.ok) {
      console.error("Distance API error:", await response.text());
      return null;
    }

    const data = await response.json();
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

    // Sanitize inputs
    const sanitizedAddress = address.replace(/[^\w\s,.-]/g, '');
    const sanitizedAcres = Math.max(0.1, Math.min(10000, acres));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a conservative real estate analysis expert specializing in land valuation in Texas. 
          Analyze properties considering location, size, and realistic market conditions.
          Be cautious with valuations - it's better to underestimate than overestimate.
          Typical undeveloped land in Manor, TX ranges from $15,000 to $35,000 per acre.
          Return the analysis in the exact format specified.`
        },
        {
          role: "user",
          content: `Analyze this property:
            Address: ${sanitizedAddress}
            Acres: ${sanitizedAcres}
            Location: ${latitude}, ${longitude}
            ${currentPrice ? `Current Market Value: $${currentPrice.toLocaleString()}` : ''}
            ${distanceInfo ? `Distance to ${distanceInfo.nearestCity}: ${distanceInfo.distanceText}` : ''}

            Consider:
            - Undeveloped land in Manor typically sells for $15,000-$35,000 per acre
            - Location relative to Austin affects value significantly
            - Recent similar sales in the area average $25,000 per acre
            - Larger parcels often sell for less per acre

            Return the analysis as a JSON object with exactly these fields:
            {
              "estimatedValue": number (whole dollars),
              "confidenceScore": number (between 0 and 1),
              "keyFeatures": string[],
              "risks": string[],
              "opportunities": string[],
              "marketTrends": {
                "direction": "up" | "down" | "stable",
                "reasoning": string
              }
            }`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response content from OpenAI");
    }

    console.log("Raw OpenAI response:", response.choices[0].message.content);

    const analysis = JSON.parse(response.choices[0].message.content) as PropertyAnalysis;

    // Validate the response format and price range
    if (!analysis.estimatedValue || !analysis.confidenceScore || !analysis.marketTrends) {
      throw new Error("Invalid analysis format from OpenAI");
    }

    // Validate the price is within reasonable range ($15,000-$35,000 per acre)
    const pricePerAcre = analysis.estimatedValue / sanitizedAcres;
    if (pricePerAcre < 15000 || pricePerAcre > 35000) {
      console.warn("Price per acre outside expected range:", pricePerAcre);
      // Adjust to a reasonable value
      analysis.estimatedValue = Math.round(sanitizedAcres * 25000); // Use average value
      analysis.confidenceScore = Math.min(analysis.confidenceScore, 0.7); // Reduce confidence
    }

    // Add distance info if available
    if (distanceInfo) {
      analysis.distanceInfo = distanceInfo;
    }

    console.log("Final analysis:", analysis);
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
          content: "You are a real estate marketing expert specializing in crafting compelling property descriptions. Create engaging and persuasive content that highlights the unique features and value propositions of the property."
        },
        {
          role: "user",
          content: `Create a marketing description for this property targeting ${targetAudience}:
            Property Details:
            ${JSON.stringify(propertyDetails, null, 2)}
            
            Focus on:
            1. Location advantages
            2. Property features and potential
            3. Investment opportunities
            4. Unique selling points`
        }
      ]
    });

    return response.choices[0].message.content || "No description generated.";
  } catch (error: any) {
    console.error('Marketing description error:', error);
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