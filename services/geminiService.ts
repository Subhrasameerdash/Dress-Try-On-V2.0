import { GoogleGenAI, Modality, Type } from "@google/genai";
import { TryOnItem } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}


const parseGeminiError = (error: unknown): string => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        if (message.includes("api key not valid")) {
            return "The AI service is not configured correctly. Please contact support.";
        }
         if (message.includes("requested entity was not found")) {
            return "API Key not found or invalid. Please select a valid API key and try again.";
        }
        if (message.includes("quota")) {
            return "The AI service is currently experiencing high demand. Please try again in a few minutes.";
        }
        if (message.includes("503") || message.includes("unavailable")) {
            return "The AI styling service is temporarily unavailable. Please try again later.";
        }
         if (message.includes("invalid argument") || message.includes("request was blocked")) {
            return "The request was blocked by the AI. This can happen if an image is unsuitable for processing. Please try a different photo.";
        }
    }
    return "An unexpected error occurred with the AI service. Please try again.";
};

/**
 * Uses Gemini to classify a clothing item into a specific category.
 * @param imageBase64 The base64 encoded image data.
 * @param mimeType The MIME type of the image.
 * @returns The category of the clothing item.
 */
export const classifyClothingItem = async (
  imageBase64: string,
  mimeType: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const PROMPT = `Analyze the provided image of a clothing item. Your task is to determine its category. The category must be one of the following exact string values: "outfits", "tops", "bottoms", "footwear", "headwear", "accessories". An "outfit" is a single item that covers both the top and bottom of the body, like a dress or a suit.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType } },
          { text: PROMPT },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: {
              type: Type.STRING,
              enum: ["outfits", "tops", "bottoms", "footwear", "headwear", "accessories"],
              description: "The category of the clothing item."
            }
          },
          required: ['category']
        }
      },
    });

    const jsonResponse = JSON.parse(response.text);
    const category = jsonResponse.category;
    
    if (!category) {
        throw new Error("AI could not determine a valid category.");
    }
    
    return category;

  } catch (error) {
    console.error("Error calling Gemini API for classification:", error);
    const userFriendlyError = parseGeminiError(error);
    throw new Error(userFriendlyError);
  }
};


export const virtualTryOn = async (
  userImageBase64: string,
  userImageMimeType: string,
  catalogueItems: TryOnItem[],
  gender: 'female' | 'male'
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const itemDescriptions = catalogueItems.map(item => 
    `- A '${item.category}' item named '${item.name}'`
  ).join('\n');

  const PROMPT = `Your mission is to perform a hyper-realistic virtual try-on. You will create a new, high-fidelity photorealistic image where the person from the first image (the user, a ${gender}) is wearing the provided clothing item(s). The original user image and the clothing items are provided as subsequent images:
${itemDescriptions}
**CRITICAL INSTRUCTIONS...`; // Prompt abbreviated for brevity

  const catalogueParts = catalogueItems.map(item => ({
    inlineData: {
      data: item.image.base64,
      mimeType: item.image.mimeType,
    },
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: userImageBase64, mimeType: userImageMimeType } },
          ...catalogueParts,
          { text: PROMPT },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("The AI model did not return an image. This can happen if the input is unclear or violates safety policies. Please try a different photo.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    const userFriendlyError = parseGeminiError(error);
    throw new Error(userFriendlyError);
  }
};

/**
 * Edits an image based on a text prompt using Gemini.
 */
export const editImage = async (
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: mimeType } },
          { text: prompt },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }

    throw new Error("The AI model did not return an image. Please try a different prompt or image.");

  } catch (error) {
    console.error("Error calling Gemini API for image editing:", error);
    const userFriendlyError = parseGeminiError(error);
    throw new Error(userFriendlyError);
  }
};

/**
 * Generates a video from an image and a text prompt using Veo.
 */
export const generateVideo = async (
  imageBase64: string,
  mimeType: string,
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  // FIX: Added resolution parameter to match the function call in App.tsx.
  resolution: '720p' | '1080p'
): Promise<string> => {
  // Create a new instance to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        // FIX: Use the resolution parameter instead of a hardcoded value.
        resolution: resolution,
        aspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Poll every 10 seconds
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

    if (!downloadLink) {
      throw new Error("Video generation completed, but no download link was found.");
    }

    const response = await fetch(`${downloadLink}&key=${API_KEY}`);
    if (!response.ok) {
        throw new Error(`Failed to download video: ${response.statusText}`);
    }
    const videoBlob = await response.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    return videoUrl;

  } catch (error) {
    console.error("Error calling Veo API:", error);
    const userFriendlyError = parseGeminiError(error);
    throw new Error(userFriendlyError);
  }
};