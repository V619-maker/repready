import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // 1. Receive the chat history from our new frontend
    const { messages } = await request.json();
    
    // 2. Check if your API key is missing
    if (!process.env.GEMINI_API_KEY) {
      console.error("Missing GEMINI_API_KEY");
      return NextResponse.json(
        { message: "System Error: Gemini API key is missing in Vercel." }, 
        { status: 500 }
      );
    }

    // 3. Initialize the Gemini AI Brain
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 4. Format the conversation for the Coach persona
    const latestMessage = messages[messages.length - 1].content;
    const prompt = `You are a ruthless, highly tactical B2B Sales Coach for an app called RepReady. 
    You analyze negotiation telemetry and give sharp, direct advice on frame control and anchoring.
    Keep your responses concise, punchy, and formatted well.
    
    User says: ${latestMessage}`;

    // 5. Generate the response
    const result = await model.generateContent(prompt);
    const aiResponseText = result.response.text();

    // 6. Send it back to the frontend in the exact format it expects
    return NextResponse.json({ message: aiResponseText });

  } catch (error) {
    console.error("Backend Brain Error:", error);
    return NextResponse.json(
      { message: "Neural link severed. Check Vercel logs." }, 
      { status: 500 }
    );
  }
}
