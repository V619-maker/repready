import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        message: "SYSTEM ERROR: Vercel is still not seeing your API Key.",
        text: "SYSTEM ERROR: Vercel is still not seeing your API Key."
      }, { status: 200 }); 
    }

    let promptText = "";

    // --- MODE 1: REP-READY COACH (Handles Buyer responses, Coach Tips, and JSON Debriefs) ---
    if (body.system && body.messages) {
      // Safely extract text whether it's in standard format or Gemini's 'parts' format
      const conversation = body.messages.map(m => {
        const text = m.content || (m.parts && m.parts[0]?.text) || JSON.stringify(m);
        return `${m.role || 'user'}: ${text}`;
      }).join('\n\n');
      
      promptText = `System Instructions:\n${body.system}\n\nConversation Context:\n${conversation}`;
    } 
    // --- MODE 2: ELEVENLABS SCORING (Triggered when the voice simulation ends in app/page.js) ---
    else if (body.transcript) {
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
    // --- MODE 3: BASIC CHAT FALLBACK ---
    else if (body.messages) {
      const latestMessage = body.messages[body.messages.length - 1].content 
        || body.messages[body.messages.length - 1].parts[0].text;
        
      promptText = `You are a ruthless, highly tactical B2B Sales Coach for an app called RepReady. 
      You analyze negotiation telemetry and give sharp, direct advice on frame control and anchoring.
      Keep your responses concise, punchy, and formatted well.
      
      User says: ${latestMessage}`;
    }

    // --- SEND TO GEMINI ---
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = `GEMINI API ERROR: ${data.error?.message || "Unknown Google Error"}`;
      return NextResponse.json({ message: errorMsg, text: errorMsg }, { status: 200 });
    }

    if (!data.candidates || data.candidates.length === 0) {
      const blockMsg = "GEMINI ERROR: The AI blocked the response. Check safety settings.";
      return NextResponse.json({ message: blockMsg, text: blockMsg }, { status: 200 });
    }

    // Extract the AI's response text
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    // RETURN BOTH 'message' and 'text' so all frontends work flawlessly
    return NextResponse.json({ 
      message: aiResponseText, 
      text: aiResponseText 
    }, { status: 200 });

  } catch (error) {
    const crashMsg = `CRITICAL CRASH: ${error.message}`;
    return NextResponse.json({ message: crashMsg, text: crashMsg }, { status: 200 });
  }
}
