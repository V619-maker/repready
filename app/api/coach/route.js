// app/api/coach/route.js — Next.js route handler
// Proxies Gemini API calls so GEMINI_API_KEY never touches the browser.

import { NextResponse } from "next/server";

const GEMINI_MODEL = "gemini-2.0-flash";

export async function POST(request) {
  const origin = request.headers.get("origin") || "";
  const allowed = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://repready.site",
    "https://repready.vercel.app",
  ];
  if (process.env.NODE_ENV === "production" && !allowed.includes(origin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, system, max_tokens = 300 } = body;

  if (!messages || !system) {
    return NextResponse.json({ error: "Missing messages or system" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  try {
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
