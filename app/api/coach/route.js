import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Receive the chat history
    const { messages } = await request.json();
    
    // 2. Grab the exact key name from your Vercel dashboard
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_KEY;

    if (!apiKey) {
      console.error("Missing API Key");
      return NextResponse.json(
        { message: "System Error: API key name mismatch." }, 
        { status: 500 }
      );
    }

    // 3. Format the prompt
    const latestMessage = messages[messages.length - 1].content;
    const promptText = `You are a ruthless, highly tactical B2B Sales Coach for an app called RepReady. 
    You analyze negotiation telemetry and give sharp, direct advice on frame control and anchoring.
    Keep your responses concise, punchy, and formatted well.
    
    User says: ${latestMessage}`;

    // 4. Call Gemini using native fetch 
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptText
          }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to fetch from Gemini");
    }

    // 5. Extract the text and send it to the frontend
    const aiResponseText = data.candidates[0].content.parts[0].text;
    
    return NextResponse.json({ message: aiResponseText });

  } catch (error) {
    console.error("Backend Brain Error:", error);
    return NextResponse.json(
      { message: "Neural link severed. Check Vercel logs." }, 
      { status: 500 }
    );
  }
}
