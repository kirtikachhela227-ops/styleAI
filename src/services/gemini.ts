import { GoogleGenAI, Type } from "@google/genai";
import { Outfit } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateOutfit(params: {
  occasion: string;
  stylePersona: string;
  bodyType?: string;
  budgetTier: string;
  gender: string;
  season: string;
  colorPreferences: string[];
}): Promise<Outfit> {
  const prompt = `Generate a complete, wearable outfit recommendation based on the following context:
  - Occasion: ${params.occasion}
  - Style Persona: ${params.stylePersona}
  - Body Type: ${params.bodyType || "Any"}
  - Budget Tier: ${params.budgetTier}
  - Gender: ${params.gender}
  - Season/Weather: ${params.season}
  - Color Preferences: ${params.colorPreferences.join(", ")}
  
  Provide a creative title, complete look (top, bottom, shoes, bag, accessories, outerwear), color palette (hex codes), styling tip, budget range in ₹, and suggested Indian shopping platforms (Myntra, Ajio, Nykaa Fashion, Meesho, Zara India).`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          outfitName: { type: Type.STRING },
          occasion: { type: Type.STRING },
          pieces: {
            type: Type.OBJECT,
            properties: {
              top: { type: Type.STRING },
              bottom: { type: Type.STRING },
              shoes: { type: Type.STRING },
              bag: { type: Type.STRING },
              accessories: { type: Type.STRING },
              outerwear: { type: Type.STRING, nullable: true },
            },
            required: ["top", "bottom", "shoes", "bag", "accessories"],
          },
          colorPalette: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          stylingTip: { type: Type.STRING },
          budgetRange: { type: Type.STRING },
          shopAt: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          season: { type: Type.STRING },
        },
        required: ["outfitName", "occasion", "pieces", "colorPalette", "stylingTip", "budgetRange", "shopAt", "season"],
      },
    },
  });

  return JSON.parse(response.text || "{}") as Outfit;
}

export async function generateWeeklyPlan(params: {
  tripType: string;
  context: string;
}): Promise<{ [day: string]: Outfit }> {
  const prompt = `Generate a 7-day weekly outfit plan (Mon-Sun) for: ${params.tripType}. Context: ${params.context}.
  For each day, provide a complete outfit in the specified JSON format.`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          Monday: { $ref: "#/definitions/outfit" },
          Tuesday: { $ref: "#/definitions/outfit" },
          Wednesday: { $ref: "#/definitions/outfit" },
          Thursday: { $ref: "#/definitions/outfit" },
          Friday: { $ref: "#/definitions/outfit" },
          Saturday: { $ref: "#/definitions/outfit" },
          Sunday: { $ref: "#/definitions/outfit" },
        },
        definitions: {
          outfit: {
            type: Type.OBJECT,
            properties: {
              outfitName: { type: Type.STRING },
              pieces: {
                type: Type.OBJECT,
                properties: {
                  top: { type: Type.STRING },
                  bottom: { type: Type.STRING },
                  shoes: { type: Type.STRING },
                  bag: { type: Type.STRING },
                  accessories: { type: Type.STRING },
                  outerwear: { type: Type.STRING, nullable: true },
                },
              },
              stylingTip: { type: Type.STRING },
            },
          },
        },
      },
    },
  });

  return JSON.parse(response.text || "{}");
}
