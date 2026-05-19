import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeFace(base64Image: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image.split(",")[1] || base64Image,
          },
        },
        {
          text: "Analyze this face for unique identification features. Provide a detailed, unique description of facial structure, key landmarks, and distinctive marks that can be used for verification. Return ONLY the analysis text.",
        },
      ],
      config: {
        systemInstruction: "You are a professional facial recognition assistant. Your task is to extract unique facial features for secure identity verification. Be objective and precise.",
      },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Face Analysis Error:", error);
    throw new Error("Failed to analyze face features.");
  }
}

export async function verifyFace(liveBase64: string, storedBase64: string, storedFaceData: string): Promise<{ isVerified: boolean; confidence: number; reason: string }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: storedBase64.split(",")[1] || storedBase64,
          },
        },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: liveBase64.split(",")[1] || liveBase64,
          },
        },
        {
          text: `Compare these two faces. The first is the stored registration image, and its features are: ${storedFaceData}. The second is a live captured image for check-in. Determine if they are the same person. Return a JSON object with 'isVerified' (boolean), 'confidence' (number 0-1), and 'reason' (string).`,
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isVerified: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ["isVerified", "confidence", "reason"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Face Verification Error:", error);
    throw new Error("Failed to verify face identity.");
  }
}
