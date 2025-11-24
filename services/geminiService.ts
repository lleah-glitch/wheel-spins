import { GoogleGenAI, Type } from "@google/genai";
import { Prize, PrizeType } from "../types";

// Helper to get a random color not in the list to ensure variety
const getRandomColor = () => {
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const generatePrizeConfig = async (promptText: string): Promise<Prize[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a prize configuration for a lucky draw wheel based on this request: "${promptText}".
      
      Rules:
      1. Total probability MUST sum to exactly 100.
      2. Include a mix of High Value (Physical), Currency, and participation prizes.
      3. Generate 6 to 10 items.
      4. Ensure 'probability' is a number representing percentage (e.g. 0.5 for 0.5%).
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: [PrizeType.PHYSICAL, PrizeType.CURRENCY, PrizeType.EMPTY] },
              amount: { type: Type.NUMBER, description: "Amount if currency, otherwise 0 or null" },
              probability: { type: Type.NUMBER },
              icon: { type: Type.STRING, description: "A suitable simple icon name like 'Smartphone', 'Coins', 'Watch', 'Gift', 'Bike', 'Car', 'Smile'" }
            },
            required: ["name", "type", "probability", "icon"]
          }
        }
      }
    });

    const rawData = response.text;
    if (!rawData) throw new Error("No data returned");

    const parsed = JSON.parse(rawData);
    
    // Post-process to add IDs and Colors which are better handled on client for variety
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return parsed.map((item: any, index: number) => ({
      id: `gen-${Date.now()}-${index}`,
      name: item.name,
      type: item.type as PrizeType,
      amount: item.amount || 0,
      probability: item.probability,
      color: getRandomColor(),
      icon: item.icon
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};