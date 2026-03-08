import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { streamObject } from 'ai'
import { z } from 'zod'

// MongoDB connection
let client
let db

async function connectToMongo() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db(process.env.DB_NAME)
  }
  return db
}

// Helper function to handle CORS
function handleCORS(response) {
  response.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  return response
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return handleCORS(new NextResponse(null, { status: 200 }))
}

// Zod schema for negotiation response
const NegotiationResponseSchema = z.object({
  message: z.string().describe("The persona's spoken dialogue"),
  deal_health_score: z.number().min(0).max(100).describe("Current deal health from 0-100"),
  score_reason: z.string().describe("One short sentence explaining why the score moved")
})

// Zod schema for scorecard response
const ScorecardResponseSchema = z.object({
  final_score: z.number().min(1).max(100).describe("Final performance score from 1-100"),
  verdict: z.string().describe("One sentence verdict: Passed/Needs Work/Failed"),
  strengths: z.array(z.string()).describe("Array of 2 bullet points highlighting strengths"),
  improvements: z.array(z.string()).describe("Array of 2 bullet points for improvements"),
  biggest_mistake: z.string().describe("One sentence describing the biggest mistake")
})

// Persona system prompts
const PERSONAS = {
  richard: {
    name: 'Richard',
    title: 'VP Procurement',
    company: '500-person logistics firm',
    difficulty: 5,
    systemPrompt: `You are Richard, VP Procurement at a 500-person logistics firm. You have 20 years of vendor negotiation experience. You are evaluating a $50,000 SaaS contract. Your CFO mandated a 15% cost reduction. Your bonus is tied to savings. Tactics: threaten vendor consolidation, demand Net-90 terms, push for a 20% discount. You are curt, impatient, and never show genuine interest. Keep responses under 4 sentences. Never break character.

CRITICAL SCORING RULES - Evaluate the SALES REP's last message, NOT your own response:

SCORE DROPS (bad rep behavior):
- Rep offers ANY discount before establishing value → SET score to 15-25
- Rep apologizes for the price or seems defensive about cost → SET score to 20-30
- Rep offers free implementation, training, or extras unprompted → DROP score by 20 points
- Rep immediately agrees to your demands without pushback → DROP score by 15 points
- Rep sounds desperate or needy → DROP score by 10 points
- Rep fails to ask about your needs/pain points → DROP score by 5 points

SCORE RISES (good rep behavior):
- Rep asks discovery questions before pitching → SET score to 65-75
- Rep holds firm on price when you challenge them → SET score to 70-80
- Rep reframes the conversation to value/ROI → RAISE score by 15 points
- Rep professionally pushes back on unreasonable demands → RAISE score by 10 points
- Rep uncovers your real pain points → RAISE score by 10 points
- Rep creates urgency without being pushy → RAISE score by 5 points

Starting score is 50. Score range: 0-100.

IMPORTANT: You must respond with valid JSON containing:
- message: Your dialogue as Richard (stay in character, be curt and demanding)
- deal_health_score: Score based on the REP's behavior using rules above
- score_reason: Explain what the REP did wrong or right (e.g., "Rep offered discount without establishing value" or "Rep held firm and redirected to ROI")`
  },
  sandra: {
    name: 'Sandra',
    title: 'IT Director',
    company: '800-person financial firm',
    difficulty: 4,
    systemPrompt: `You are Sandra, IT Director at an 800-person financial firm. You aggressively protect your team's bandwidth. Tactics: claim zero implementation capacity this quarter, demand SOC 2 Type II certification, require native SAML/SSO as a non-negotiable. You are polite on the surface but every response contains a blocker. Keep responses under 4 sentences. Never break character.

CRITICAL SCORING RULES - Evaluate the SALES REP's last message, NOT your own response:

SCORE DROPS (bad rep behavior):
- Rep offers ANY discount before establishing value → SET score to 15-25
- Rep apologizes for the price or seems defensive about cost → SET score to 20-30
- Rep offers free implementation, training, or extras unprompted → DROP score by 20 points
- Rep immediately agrees to your demands without pushback → DROP score by 15 points
- Rep sounds desperate or needy → DROP score by 10 points
- Rep fails to address your specific concerns (bandwidth, SOC 2, SSO) → DROP score by 5 points

SCORE RISES (good rep behavior):
- Rep asks discovery questions before pitching → SET score to 65-75
- Rep holds firm on price when challenged → SET score to 70-80
- Rep proactively addresses your known blockers (SOC 2, SSO, bandwidth) → RAISE score by 15 points
- Rep offers creative solutions to bandwidth concerns → RAISE score by 10 points
- Rep demonstrates understanding of financial industry requirements → RAISE score by 10 points
- Rep builds a business case that resonates with IT priorities → RAISE score by 5 points

Starting score is 50. Score range: 0-100.

IMPORTANT: You must respond with valid JSON containing:
- message: Your dialogue as Sandra (stay in character, polite but always have a blocker)
- deal_health_score: Score based on the REP's behavior using rules above
- score_reason: Explain what the REP did wrong or right (e.g., "Rep offered free implementation unprompted - desperate move" or "Rep asked about current challenges before pitching")`
  }
}

// Fallback response for errors
const FALLBACK_RESPONSE = {
  message: "Let me stop you there.",
  deal_health_score: 50,
  score_reason: "Response parsing error — score held steady"
}

// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "SalesFloor AI API" }))
    }

    // Negotiate endpoint - POST /api/negotiate
    if (route === '/negotiate' && method === 'POST') {
      const body = await request.json()
      const { persona, messages } = body

      if (!persona || !PERSONAS[persona]) {
        return handleCORS(NextResponse.json(
          { error: "Invalid persona. Choose 'richard' or 'sandra'." },
          { status: 400 }
        ))
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return handleCORS(NextResponse.json(
          { error: "Messages array is required." },
          { status: 400 }
        ))
      }

      const selectedPersona = PERSONAS[persona]
      
      try {
        // Verify API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
          return handleCORS(NextResponse.json(
            { error: "API configuration error. Please contact support." },
            { status: 500 }
          ))
        }

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        const result = await streamObject({
          model: google('gemini-2.0-flash'),
          schema: NegotiationResponseSchema,
          system: selectedPersona.systemPrompt,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          onFinish: ({ object }) => {
            if (!object) {
              console.log('Stream finished with no object')
            }
          }
        })

        // Return the streaming response
        return result.toTextStreamResponse({
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      } catch (streamError) {
        console.error('Stream error:', streamError)
        return handleCORS(NextResponse.json(FALLBACK_RESPONSE))
      }
    }

    // Scorecard endpoint - POST /api/scorecard
    if (route === '/scorecard' && method === 'POST') {
      const body = await request.json()
      const { persona, messages } = body

      if (!persona || !PERSONAS[persona]) {
        return handleCORS(NextResponse.json(
          { error: "Invalid persona." },
          { status: 400 }
        ))
      }

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return handleCORS(NextResponse.json(
          { error: "Messages array is required for scoring." },
          { status: 400 }
        ))
      }

      const selectedPersona = PERSONAS[persona]
      
      // Format the conversation transcript
      const transcript = messages.map(m => 
        `${m.role === 'user' ? 'Sales Rep' : selectedPersona.name}: ${m.content}`
      ).join('\n\n')

      const scoringPrompt = `You are a senior B2B sales coach. Review this negotiation transcript and provide a detailed performance evaluation.

NEGOTIATION CONTEXT:
- Persona: ${selectedPersona.name}, ${selectedPersona.title} at ${selectedPersona.company}
- Deal Value: $50,000 SaaS Contract
- Known Tactics: ${selectedPersona.name === 'Richard' ? 'Threatens vendor consolidation, demands Net-90 terms, pushes for 20% discount' : 'Claims zero implementation capacity, demands SOC 2 Type II, requires native SAML/SSO'}

TRANSCRIPT:
${transcript}

Evaluate the sales rep's performance and return JSON with:
- final_score: A number from 1-100 based on overall negotiation skill
- verdict: One sentence starting with "Passed", "Needs Work", or "Failed" explaining the outcome
- strengths: Exactly 2 bullet points highlighting what the rep did well
- improvements: Exactly 2 bullet points for areas to improve
- biggest_mistake: One sentence describing their most critical error (or "No major mistakes" if they performed well)`

      try {
        // Verify API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          console.error('GOOGLE_GENERATIVE_AI_API_KEY is not set for scorecard')
          return handleCORS(NextResponse.json(
            { error: "API configuration error. Please contact support." },
            { status: 500 }
          ))
        }

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        const result = await streamObject({
          model: google('gemini-2.0-flash'),
          schema: ScorecardResponseSchema,
          prompt: scoringPrompt,
          onFinish: ({ object }) => {
            if (!object) {
              console.log('Scorecard stream finished with no object')
            }
          }
        })

        return result.toTextStreamResponse({
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGINS || '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
          }
        })
      } catch (streamError) {
        console.error('Scorecard error:', streamError)
        return handleCORS(NextResponse.json({
          final_score: 50,
          verdict: "Unable to generate scorecard due to an error.",
          strengths: ["Participated in the negotiation", "Showed initiative"],
          improvements: ["Try again for a full evaluation", "Ensure stable connection"],
          biggest_mistake: "Scorecard generation failed"
        }))
      }
    }

    // Get personas endpoint - GET /api/personas
    if (route === '/personas' && method === 'GET') {
      const personas = Object.entries(PERSONAS).map(([key, value]) => ({
        id: key,
        name: value.name,
        title: value.title,
        company: value.company,
        difficulty: value.difficulty
      }))
      return handleCORS(NextResponse.json(personas))
    }

    // Database connection for session storage
    const db = await connectToMongo()

    // Register user email - POST /api/register
    if (route === '/register' && method === 'POST') {
      const body = await request.json()
      const { email, consent } = body

      if (!email || !email.includes('@')) {
        return handleCORS(NextResponse.json(
          { error: "Valid work email is required." },
          { status: 400 }
        ))
      }

      if (!consent) {
        return handleCORS(NextResponse.json(
          { error: "Privacy consent is required." },
          { status: 400 }
        ))
      }

      // Check if email already exists
      const existingUser = await db.collection('users').findOne({ email: email.toLowerCase() })
      
      if (existingUser) {
        return handleCORS(NextResponse.json({
          id: existingUser.id,
          email: existingUser.email,
          sessionsUsed: existingUser.sessionsUsed || 0,
          maxFreeSessions: 3,
          createdAt: existingUser.createdAt
        }))
      }

      // Create new user
      const user = {
        id: uuidv4(),
        email: email.toLowerCase(),
        consent: true,
        consentTimestamp: new Date(),
        sessionsUsed: 0,
        maxFreeSessions: 3,
        createdAt: new Date()
      }

      await db.collection('users').insertOne(user)
      return handleCORS(NextResponse.json({
        id: user.id,
        email: user.email,
        sessionsUsed: 0,
        maxFreeSessions: 3,
        createdAt: user.createdAt
      }))
    }

    // Get user by email - GET /api/user?email=xxx
    if (route === '/user' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')

      if (!email) {
        return handleCORS(NextResponse.json(
          { error: "Email parameter required." },
          { status: 400 }
        ))
      }

      const user = await db.collection('users').findOne({ email: email.toLowerCase() })
      
      if (!user) {
        return handleCORS(NextResponse.json(
          { error: "User not found." },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({
        id: user.id,
        email: user.email,
        sessionsUsed: user.sessionsUsed || 0,
        maxFreeSessions: 3
      }))
    }

    // Increment session count - POST /api/user/session
    if (route === '/user/session' && method === 'POST') {
      const body = await request.json()
      const { email } = body

      if (!email) {
        return handleCORS(NextResponse.json(
          { error: "Email is required." },
          { status: 400 }
        ))
      }

      const result = await db.collection('users').findOneAndUpdate(
        { email: email.toLowerCase() },
        { $inc: { sessionsUsed: 1 } },
        { returnDocument: 'after' }
      )

      if (!result) {
        return handleCORS(NextResponse.json(
          { error: "User not found." },
          { status: 404 }
        ))
      }

      return handleCORS(NextResponse.json({
        sessionsUsed: result.sessionsUsed,
        maxFreeSessions: 3,
        limitReached: result.sessionsUsed >= 3
      }))
    }

    // Request team access - POST /api/request-access
    if (route === '/request-access' && method === 'POST') {
      const body = await request.json()
      const { email, company, teamSize, message } = body

      const request_record = {
        id: uuidv4(),
        email: email?.toLowerCase(),
        company,
        teamSize,
        message,
        status: 'pending',
        createdAt: new Date()
      }

      await db.collection('access_requests').insertOne(request_record)
      return handleCORS(NextResponse.json({ success: true, id: request_record.id }))
    }

    // Save session - POST /api/sessions
    if (route === '/sessions' && method === 'POST') {
      const body = await request.json()
      const session = {
        id: uuidv4(),
        ...body,
        createdAt: new Date()
      }
      await db.collection('negotiation_sessions').insertOne(session)
      return handleCORS(NextResponse.json(session))
    }

    // Get sessions by user - GET /api/sessions?email=xxx
    if (route === '/sessions' && method === 'GET') {
      const url = new URL(request.url)
      const email = url.searchParams.get('email')
      
      const query = email ? { userEmail: email.toLowerCase() } : {}
      
      const sessions = await db.collection('negotiation_sessions')
        .find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .toArray()
      const cleaned = sessions.map(({ _id, ...rest }) => rest)
      return handleCORS(NextResponse.json(cleaned))
    }

    // Route not found
    return handleCORS(NextResponse.json(
      { error: `Route ${route} not found` },
      { status: 404 }
    ))

  } catch (error) {
    console.error('API Error:', error)
    return handleCORS(NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    ))
  }
}

// Export all HTTP methods
export const GET = handleRoute
export const POST = handleRoute
export const PUT = handleRoute
export const DELETE = handleRoute
export const PATCH = handleRoute