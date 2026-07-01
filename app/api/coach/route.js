import { NextResponse } from "next/server";
const GEMINI_MODEL = "gemini-2.5-flash";
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { transcript } = body;
  if (!transcript) {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  const systemPrompt = `You are an elite B2B sales coach. Analyze this negotiation transcript and return ONLY a valid JSON object with no markdown, no backticks, no explanation. Just raw JSON.
Return exactly this structure:
{
  "aggregate_score": <number 0-100>,
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "actionable_advice": "<one specific tactical thing to do differently next time>"
}
Scoring guide:
- 80-100: Rep held firm on price, used discovery, controlled the call
- 60-79: Rep showed some skill but had gaps
- 40-59: Rep made significant errors
- Below 40: Rep capitulated on price or lost control entirely`;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const requestBody = JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: transcript }] }],
    generationConfig: {
  maxOutputTokens: 2000,
  temperature: 0.3,
},
  });
  try {
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });
      if (response.status === 503) {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
          continue;
        }
      }
      break;
    }
    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini API error:", err);
      return NextResponse.json({ error: "Upstream API error" }, { status: response.status });
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return NextResponse.json({ message: text });
  } catch (err) {
    console.error("Coach API handler error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
