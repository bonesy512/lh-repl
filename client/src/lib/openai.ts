import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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

export async function analyzeProperty(
  address: string,
  acres: number,
  currentPrice?: number
): Promise<PropertyAnalysis> {
  try {
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

    return JSON.parse(response.choices[0].message.content) as PropertyAnalysis;
  } catch (error: any) {
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
