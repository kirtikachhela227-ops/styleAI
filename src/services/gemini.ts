import { GoogleGenAI, Type } from "@google/genai";
import { Outfit } from "../types";

export async function generateOutfit(params: {
  occasion: string;
  stylePersona: string;
  bodyType?: string;
  budgetTier: string;
  gender: string;
  season: string;
  colorPreferences: string[];
}): Promise<Outfit> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `Generate a complete, wearable outfit recommendation for a ${params.gender} for ${params.occasion}. 
  Style: ${params.stylePersona}. Body Type: ${params.bodyType || "Any"}. Budget: ${params.budgetTier}. Season: ${params.season}. Colors: ${params.colorPreferences.join(", ")}.
  
  Return a JSON object with:
  - outfitName: string
  - occasion: string
  - pieces: { top: string, bottom: string, shoes: string, bag: string, accessories: string, outerwear: string }
  - colorPalette: string[] (hex codes)
  - stylingTip: string
  - budgetRange: string
  - shopAt: string[] (Indian stores like Myntra, Ajio, Zara India)
  - season: string`;

  try {
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

    const text = response.text;
    console.log("Gemini response text:", text);
    if (!text) throw new Error("No response text from Gemini");
    
    const outfit = JSON.parse(text) as Outfit;
    
    // Generate a highly relevant fashion image using Gemini Image model
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [{ 
            text: `A professional studio fashion shot of a full-body outfit for a ${params.gender}. 
            CRITICAL: Plain neutral background ONLY. NO scenery, NO nature, NO food.
            Outfit: ${outfit.pieces.top}, ${outfit.pieces.bottom}, ${outfit.pieces.shoes}.` 
          }]
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
            imageSize: "512px" // Faster generation
          },
        },
      });

      const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        outfit.imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      } else {
        throw new Error("No image data in response");
      }
    } catch (imageError) {
      console.error("Failed to generate AI image:", imageError);
      // Fallback to a static, high-quality fashion placeholder instead of random scenery
      outfit.imageUrl = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80";
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined in the environment.");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
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
      model: "gemini-3-flash-preview",
      contents: prompt,
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

    const text = response.text;
    console.log("Weekly plan response text:", text);
    if (!text) throw new Error("No response text from Gemini");
    
    const plan = JSON.parse(text) as { [day: string]: Outfit };
    
    // Add relevant image URLs for each day in parallel, but with smaller size for speed
    const imagePromises = Object.keys(plan).map(async (day) => {
      const outfit = plan[day];
      if (outfit && outfit.outfitName) {
        try {
          const imageResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: {
              parts: [{ 
                text: `A professional studio fashion shot of a full-body outfit. 
                CRITICAL: Plain neutral background ONLY. NO scenery, NO nature, NO food.
                Outfit: ${outfit.outfitName} for ${outfit.occasion}.` 
              }]
            },
            config: {
              imageConfig: {
                aspectRatio: "3:4",
                imageSize: "512px" // Smaller size for much faster generation in weekly view
              },
            },
          });

          const imagePart = imageResponse.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imagePart?.inlineData) {
            outfit.imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
          } else {
            throw new Error("No image data");
          }
        } catch (imageError) {
          console.error(`Failed to generate AI image for ${day}:`, imageError);
          // High-quality static fashion fallback
          outfit.imageUrl = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80";
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
