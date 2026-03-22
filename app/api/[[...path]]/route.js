import { NextResponse } from 'next/server';

const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST(request) {
  try {
    const body = await request.json();
    const { messages, system, max_tokens = 300 } = body;

    if (!messages || !system) {
      return NextResponse.json({ error: "Missing messages or system" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENERATIVE_AI_KEY is not set");
      return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: messages,
        generationConfig: {
          maxOutputTokens: max_tokens,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Upstream API error" }, { status: response.status });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    
    return NextResponse.json({ text });

  } catch (err) {
    console.error("Coach API handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
