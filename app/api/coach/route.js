import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        message: "SYSTEM ERROR: Vercel is still not seeing your API Key." 
      }, { status: 200 }); 
    }

    let promptText = "";

    // --- 1. SCORING MODE (Triggered when a simulation ends) ---
    if (body.transcript) {
      promptText = `You are a senior B2B sales coach evaluating a rep's performance.
      Review the following call transcript and score the rep from 1-100 on their overall performance, and specifically on BANT execution.
      
      Transcript:
      ${body.transcript}
      
      Respond ONLY with valid JSON, nothing else. Use this exact format:
      {
        "aggregate_score": 85,
        "discovery_score": 90,
        "objection_handling": 70,
        "value_articulation": 80,
        "executive_presence": 85,
        "verdict": "One punchy sentence summarizing their performance."
      }`;
    } 
    // --- 2. CHAT MODE (Your existing Coach interface) ---
    else if (body.messages) {
      const latestMessage = body.messages[body.messages.length - 1].content;
      promptText = `You are a ruthless, highly tactical B2B Sales Coach for an app called RepReady. 
      You analyze negotiation telemetry and give sharp, direct advice on frame control and anchoring.
      Keep your responses concise, punchy, and formatted well.
      
      User says: ${latestMessage}`;
    }

    // --- 3. SEND TO GEMINI ---
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        message: `GEMINI API ERROR: ${data.error?.message || "Unknown Google Error"}` 
      }, { status: 200 });
    }

    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ 
        message: "GEMINI ERROR: The AI blocked the response. Check safety settings." 
      }, { status: 200 });
    }

    const aiResponseText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ message: aiResponseText }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ 
      message: `CRITICAL CRASH: ${error.message}` 
    }, { status: 200 });
  }
}
