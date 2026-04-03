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
      model: "gemini-3.1-flash-lite-preview",
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
    
    // Generate a highly realistic fashion image using Gemini Image model
    try {
      const imageResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-image-preview",
        contents: {
          parts: [{ 
            text: `You are an AI fashion stylist and image generator.
            Generate a realistic full-body outfit image based strictly on the following user inputs:
            Occasion: ${params.occasion}
            Style Persona: ${params.stylePersona}
            Body Type: ${params.bodyType || "standard"}
            Budget: ${params.budgetTier}
            Gender: ${params.gender}
            Season: ${params.season}
            Color Preference: ${params.colorPreferences.join(", ")}
            Outfit Details: ${outfit.pieces.top}, ${outfit.pieces.bottom}, ${outfit.pieces.shoes}, ${outfit.pieces.accessories}.

            Instructions:
            - Create a complete outfit (top, bottom, footwear, accessories).
            - Ensure the outfit matches the OCCASION appropriately.
            - Reflect the STYLE PERSONA in silhouette, fabrics, and overall aesthetic.
            - Adapt the outfit to flatter the given BODY TYPE.
            - Respect the BUDGET:
              - Low budget → simple fabrics, minimal accessories
              - Mid-range → balanced styling
              - Luxe → premium fabrics, detailed styling, statement pieces
            - Match the SEASON (fabric, layering, colors).
            - Strictly follow the COLOR PREFERENCE in the outfit.

            Output Requirements:
            - Generate a highly realistic, full-body fashion model image.
            - Clean background (studio or relevant to occasion).
            - Model pose should clearly show the outfit.
            - Include accurate textures (cotton, silk, denim, etc.).
            - Ensure modern, trendy, and wearable styling.
            - STRICTLY FORBIDDEN: No food, no scenery, no nature, no trees, no lakes, no mountains, no outdoor backgrounds.` 
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
    } catch (imageError: any) {
      console.error("Failed to generate AI image:", imageError);
      
      // Handle Quota Exceeded or other errors with a dynamic keyword-based fallback
      const keywords = [
        params.gender,
        params.occasion,
        params.stylePersona,
        "fashion",
        "outfit"
      ].map(k => k.toLowerCase().replace(/\s+/g, '')).join(',');
      
      // Use LoremFlickr for keyword-based dynamic fashion images when AI quota is hit
      outfit.imageUrl = `https://loremflickr.com/800/1200/${keywords}/all`;
    }
    
    return outfit;
  } catch (err: any) {
    console.error("Error in generateOutfit:", err);
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("AI Quota Exceeded: You've reached the daily limit for free AI generations. Please try again in a few hours or tomorrow.");
    }
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
      model: "gemini-3.1-flash-lite-preview",
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
    const imagePromises = Object.keys(plan).map(async (day, index) => {
      const outfit = plan[day];
      if (outfit && outfit.outfitName) {
        try {
          // Add a small staggered delay to help avoid hitting per-minute rate limits
          await new Promise(resolve => setTimeout(resolve, index * 500));
          
          const imageResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: {
              parts: [{ 
                text: `You are an AI fashion stylist and image generator.
                Generate a realistic full-body outfit image based strictly on the following user inputs:
                Occasion: ${outfit.occasion}
                Outfit Name: ${outfit.outfitName}
                Outfit Details: ${outfit.pieces.top}, ${outfit.pieces.bottom}, ${outfit.pieces.shoes}, ${outfit.pieces.accessories}.
                Season: ${outfit.season}
                Color Palette: ${outfit.colorPalette.join(", ")}

                Instructions:
                - Create a complete outfit (top, bottom, footwear, accessories).
                - Ensure the outfit matches the OCCASION appropriately.
                - Reflect the STYLE PERSONA in silhouette, fabrics, and overall aesthetic.
                - Match the SEASON (fabric, layering, colors).
                - Strictly follow the COLOR PALETTE in the outfit.

                Output Requirements:
                - Generate a highly realistic, full-body fashion model image.
                - Clean background (studio or relevant to occasion).
                - Model pose should clearly show the outfit.
                - Include accurate textures (cotton, silk, denim, etc.).
                - Ensure modern, trendy, and wearable styling.
                - STRICTLY FORBIDDEN: No food, no scenery, no nature, no trees, no lakes, no mountains, no outdoor backgrounds.` 
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
        } catch (imageError: any) {
          console.error(`Failed to generate AI image for ${day}:`, imageError);
          
          // Handle Quota Exceeded or other errors with a dynamic keyword-based fallback
          const keywords = [
            outfit.occasion,
            "fashion",
            "outfit"
          ].map(k => k.toLowerCase().replace(/\s+/g, '')).join(',');
          
          // Use LoremFlickr for keyword-based dynamic fashion images when AI quota is hit
          outfit.imageUrl = `https://loremflickr.com/800/1200/${keywords}/all`;
        }
      }
    });

    await Promise.all(imagePromises);
    return plan;
  } catch (err: any) {
    console.error("Error in generateWeeklyPlan:", err);
    if (err.message?.includes("429") || err.message?.includes("quota")) {
      throw new Error("AI Quota Exceeded: You've reached the daily limit for free AI generations. Please try again in a few hours or tomorrow.");
    }
    throw err;
  }
}
