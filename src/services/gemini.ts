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

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ parts: [{ text: prompt }] }],
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
                outerwear: { type: Type.STRING },
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

    const outfit = JSON.parse(response.text || "{}") as Outfit;
    
    // Generate a highly relevant fashion image using Gemini Image model
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: [{ 
          parts: [{ 
            text: `A professional fashion photography shot of a ${params.gender} wearing a ${outfit.outfitName}. 
            The outfit consists of: ${outfit.pieces.top}, ${outfit.pieces.bottom}, ${outfit.pieces.shoes}. 
            Style: ${params.stylePersona}. Occasion: ${params.occasion}. Season: ${params.season}.
            High quality, editorial style.` 
          }] 
        }],
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          },
        },
      });

      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          outfit.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (imageError) {
      console.error("Failed to generate AI image:", imageError);
      const seed = `${params.gender}-${params.occasion}-${outfit.outfitName}`.toLowerCase().replace(/\s+/g, '-');
      outfit.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1200`;
    }
    
    return outfit;
  } catch (err) {
    console.error("Error in generateOutfit:", err);
    throw err;
  }
}

export async function generateWeeklyPlan(params: {
  tripType: string;
  context: string;
}): Promise<{ [day: string]: Outfit }> {
  const prompt = `Generate a 7-day weekly outfit plan (Mon-Sun) for: ${params.tripType}. Context: ${params.context}.
  For each day, provide a complete outfit including name, pieces, color palette (hex codes), styling tip, budget range, and shopping platforms.
  Ensure the outfits are varied and appropriate for the context.`;

  const outfitSchema = {
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
          outerwear: { type: Type.STRING },
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
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            Monday: outfitSchema,
            Tuesday: outfitSchema,
            Wednesday: outfitSchema,
            Thursday: outfitSchema,
            Friday: outfitSchema,
            Saturday: outfitSchema,
            Sunday: outfitSchema,
          },
          required: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        },
      },
    });

    const plan = JSON.parse(response.text || "{}") as { [day: string]: Outfit };
    
    // Add relevant image URLs for each day in parallel to avoid timeouts
    const imagePromises = Object.keys(plan).map(async (day) => {
      const outfit = plan[day];
      if (outfit && outfit.outfitName) {
        try {
          const imageResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: [{ 
              parts: [{ 
                text: `A professional fashion photography shot of a person wearing a ${outfit.outfitName} for a ${outfit.occasion}. 
                High quality, editorial style.` 
              }] 
            }],
            config: {
              imageConfig: {
                aspectRatio: "3:4",
              },
            },
          });

          for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              outfit.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
              break;
            }
          }
        } catch (imageError) {
          console.error(`Failed to generate AI image for ${day}:`, imageError);
          const seed = `outfit-${day}-${outfit.outfitName}`.toLowerCase().replace(/\s+/g, '-');
          outfit.imageUrl = `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/1200`;
        }
      }
    });

    await Promise.all(imagePromises);
    return plan;
  } catch (err) {
    console.error("Error in generateWeeklyPlan:", err);
    throw err;
  }
}
