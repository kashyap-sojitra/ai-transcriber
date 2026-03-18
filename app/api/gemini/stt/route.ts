import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

function resolveGeminiApiKey() {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const apiKey = rawKey.trim();

  if (!apiKey) {
    return {
      ok: false as const,
      error: "Gemini API key is missing. Set GEMINI_API_KEY in .env",
    };
  }

  const lower = apiKey.toLowerCase();
  if (
    lower === "add-your-gemini-api-key" ||
    lower === "your-gemini-api-key" ||
    lower === "your_api_key" ||
    lower.includes("replace-me")
  ) {
    return {
      ok: false as const,
      error: "Gemini API key looks like a placeholder. Replace it with a real key in .env",
    };
  }

  return { ok: true as const, apiKey };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get("audio") as Blob | null;

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }

    const keyResult = resolveGeminiApiKey();
    if (!keyResult.ok) {
      return NextResponse.json({ error: keyResult.error }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(keyResult.apiKey);
    
    // First, let's dynamically find an available model that supports our needs
    // If gemini-1.5-pro or gemini-1.5-flash fail, we will fallback dynamically.
    // The google generative ai sdk exposes a way to use specific models. Let's start with gemini-2.5-flash or gemini-1.5-flash
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.5-flash"; 
    const model = genAI.getGenerativeModel({ model: modelName });

    // Convert Blob to ArrayBuffer to Base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");

    const prompt = "Transcribe the following audio precisely. Respond ONLY with the transcription and nothing else. Do not add markdown or quotes.";
    
    // Ensure we only pass the base mimeType (e.g. 'audio/webm') without codecs
    let mimeType = audioFile.type || "audio/webm";
    if (mimeType.includes(";")) {
      mimeType = mimeType.split(";")[0];
    }

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Audio
        }
      }
    ]);

    const transcript = result.response.text();

    return NextResponse.json({ transcript });
  } catch (error: any) {
    console.error("STT Error:", error);
    
    // Auto-fetch the available models if a 404 is thrown, and pass them back so they can be viewed
    if (error.message && error.message.includes("404") && error.message.includes("is not found for API version")) {
      try {
        const keyResult = resolveGeminiApiKey();
        if (!keyResult.ok) {
          return NextResponse.json({ error: keyResult.error }, { status: 500 });
        }

        const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyResult.apiKey}`);
        const modelsData = await modelsRes.json();
        
        const availableTextModels = modelsData.models
          ?.filter((m: any) => m.supportedGenerationMethods.includes("generateContent"))
          .map((m: any) => m.name.replace("models/", ""))
          .join(", ");
          
        return NextResponse.json(
          { error: `${error.message}. AVAILABLE MODELS FOR YOUR KEY: ${availableTextModels}. Please set GEMINI_MODEL_NAME in .env to one of these.` },
          { status: 500 }
        );
      } catch (listError) {
         // fallback
      }
    }

    return NextResponse.json({ error: error.message || "Failed to transcribe audio" }, { status: 500 });
  }
}
