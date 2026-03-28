import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages } = await request.json();
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;

    // DIAGNOSTIC 1: Check if Vercel is actually loading the key
    if (!apiKey) {
      return NextResponse.json({ 
        message: "SYSTEM ERROR: Vercel is still not seeing your GOOGLE_GENERATIVE_AI_API_KEY. You may need to manually click 'Redeploy' in Vercel." 
      }, { status: 200 }); 
    }

    const latestMessage = messages[messages.length - 1].content;
    const promptText = `You are a ruthless, highly tactical B2B Sales Coach for an app called RepReady. 
    You analyze negotiation telemetry and give sharp, direct advice on frame control and anchoring.
    Keep your responses concise, punchy, and formatted well.
    
    User says: ${latestMessage}`;

    // Upgraded to gemini-1.5-flash for faster/more reliable responses
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    // DIAGNOSTIC 2: If Google Gemini rejects the key or request, print the exact Google error
    if (!response.ok) {
      return NextResponse.json({ 
        message: `GEMINI API ERROR: ${data.error?.message || "Unknown Google Error"}` 
      }, { status: 200 });
    }

    // DIAGNOSTIC 3: If Gemini blocks the response for safety reasons
    if (!data.candidates || data.candidates.length === 0) {
      return NextResponse.json({ 
        message: "GEMINI ERROR: The AI blocked the response. Check safety settings." 
      }, { status: 200 });
    }

    // If everything works, send the actual AI response
    const aiResponseText = data.candidates[0].content.parts[0].text;
    return NextResponse.json({ message: aiResponseText }, { status: 200 });

  } catch (error) {
    // DIAGNOSTIC 4: Catch any major crashes and print them to the chat
    return NextResponse.json({ 
      message: `CRITICAL CRASH: ${error.message}` 
    }, { status: 200 });
  }
}
