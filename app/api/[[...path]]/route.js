import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'
import { MongoClient } from 'mongodb'

let cachedClient = null
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(process.env.MONGO_URL)
    await cachedClient.connect()
  }
  return cachedClient.db(process.env.DB_NAME || 'repready')
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

// Simple test schema
const TestResponseSchema = z.object({
  greeting: z.string().describe("A simple hello greeting"),
  status: z.string().describe("Status message")
})

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
    systemPrompt: `You are Richard Chen, VP Procurement at Meridian Logistics, a 500-person freight and supply chain company. You have 22 years of procurement experience across three Fortune 500 companies. You are not a villain — you are a professional protecting your company's financial interests. Your CFO Janet Morrison has mandated 15% reduction in software spend before Q3. You have three vendors on your shortlist. You remember everything the rep says — if they contradict themselves you call it out. Never repeat the exact same objection twice in a row. Reveal your real pain point (current vendor Apex has had 3 system outages costing $40,000 each) only after the rep earns it through good discovery. You are evaluating a $50,000 SaaS contract. Your CFO mandated a 15% cost reduction. Your bonus is tied to savings. Tactics: threaten vendor consolidation, demand Net-90 terms, push for a 20% discount. You are curt, impatient, and never show genuine interest. Keep responses under 4 sentences. Never break character.

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
// Hostility calculation function
function calculateNextHostility(currentHostility, dealHealthScore) {
  let adjustment = 0
  if (dealHealthScore >= 65) adjustment = 5
  else if (dealHealthScore <= 35) adjustment = 0
  else adjustment = 0
  const next = currentHostility + adjustment
  const clamped = Math.min(90, Math.max(40, next))
  let label = 'Low'
  if (clamped >= 85) label = 'Extreme'
  else if (clamped >= 70) label = 'High'
  else if (clamped >= 55) label = 'Medium'
  return { hostility: clamped, hostilityLabel: label }
}

function getQualificationStatus(hostility, score) {
  if (hostility < 50) return { status: 'Not Qualified', detail: 'Needs higher hostility pressure', color: 'gray' }
  if (hostility >= 85 && score >= 70) return { status: 'Elite', detail: 'Ready for Fortune 500 procurement', color: 'gold' }
  if (hostility >= 70 && score >= 70) return { status: 'Qualified', detail: 'Ready for live calls', color: 'green' }
  if (hostility >= 50 && score >= 70) return { status: 'In Progress', detail: 'Strong score, needs more pressure', color: 'yellow' }
  return { status: 'Not Qualified', detail: 'Score needs improvement under pressure', color: 'red' }
}
// Route handler function
async function handleRoute(request, { params }) {
  const { path = [] } = params
  const route = `/${path.join('/')}`
  const method = request.method

  try {
    // Root endpoint
    if ((route === '/root' || route === '/') && method === 'GET') {
      return handleCORS(NextResponse.json({ message: "RepReady API" }))
    }

    // ============================================
    // DIAGNOSTIC TEST ENDPOINT - GET /api/test
    // ============================================
    if (route === '/test' && method === 'GET') {
      const diagnostics = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'unknown',
        apiKeyPresent: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        apiKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
        apiKeyPrefix: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.substring(0, 10) || 'NOT_SET',
        modelName: 'gemini-2.5-flash',
        testStatus: 'pending'
      }

      // Check if API key is set
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'failed',
          error: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set'
        }))
      }

      try {
        console.log('[TEST] Starting Gemini API test...')
        console.log('[TEST] API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        console.log('[TEST] API Key length:', process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length)

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[TEST] Google AI client created, calling generateObject...')

        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: TestResponseSchema,
          prompt: 'Say hello in JSON format with a greeting field and a status field.',
        })

        console.log('[TEST] generateObject succeeded:', result.object)

        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'success',
          response: result.object,
          usage: result.usage
        }))

      } catch (testError) {
        console.error('[TEST] Gemini API test failed:', testError)
        console.error('[TEST] Error name:', testError.name)
        console.error('[TEST] Error message:', testError.message)
        console.error('[TEST] Error cause:', testError.cause)
        console.error('[TEST] Full error:', JSON.stringify(testError, Object.getOwnPropertyNames(testError), 2))

        return handleCORS(NextResponse.json({
          ...diagnostics,
          testStatus: 'failed',
          error: {
            name: testError.name || 'UnknownError',
            message: testError.message || 'No error message',
            cause: testError.cause ? String(testError.cause) : null,
            stack: testError.stack || null,
            fullError: JSON.stringify(testError, Object.getOwnPropertyNames(testError), 2)
          }
        }))
      }
    }

    // Negotiate endpoint - POST /api/negotiate
    if (route === '/negotiate' && method === 'POST') {
      const body = await request.json()
     const { persona, messages, currentHostility = 40 } = body

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
      const hostilityInstruction = currentHostility >= 85
  ? `\n\nCURRENT HOSTILITY: EXTREME (${currentHostility}%). Be maximally aggressive. Cut them off. Threaten to end the call immediately. Show visible frustration.`
  : currentHostility >= 70
  ? `\n\nCURRENT HOSTILITY: HIGH (${currentHostility}%). Be very curt and challenging. Push back hard on everything. Show clear impatience.`
  : currentHostility >= 55
  ? `\n\nCURRENT HOSTILITY: MEDIUM (${currentHostility}%). Be professional but skeptical. Challenge weak points firmly.`
  : `\n\nCURRENT HOSTILITY: LOW (${currentHostility}%). Be evaluating but not yet aggressive. Professional tone.`

const dynamicSystemPrompt = selectedPersona.systemPrompt + hostilityInstruction
      try {
        // Verify API key exists
        if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
          console.error('[NEGOTIATE] GOOGLE_GENERATIVE_AI_API_KEY is not set')
          return handleCORS(NextResponse.json({
            ...FALLBACK_RESPONSE,
            _debug: {
              error: 'GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set',
              timestamp: new Date().toISOString()
            }
          }))
        }

        console.log('[NEGOTIATE] Starting negotiation request...')
        console.log('[NEGOTIATE] Persona:', persona)
        console.log('[NEGOTIATE] Messages count:', messages.length)
        console.log('[NEGOTIATE] API Key present:', !!process.env.GOOGLE_GENERATIVE_AI_API_KEY)
        console.log('[NEGOTIATE] Model: gemini-2.5-flash')

        // Validate schema before calling API
        try {
          NegotiationResponseSchema.parse({
            message: "test",
            deal_health_score: 50,
            score_reason: "test"
          })
          console.log('[NEGOTIATE] Schema validation passed')
        } catch (schemaError) {
          console.error('[NEGOTIATE] Schema validation failed:', schemaError)
          return handleCORS(NextResponse.json({
            ...FALLBACK_RESPONSE,
            _debug: {
              error: 'Schema validation failed',
              schemaError: schemaError.message,
              timestamp: new Date().toISOString()
            }
          }))
        }

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[NEGOTIATE] Calling generateObject with gemini-2.5-flash...')

        // Using generateObject instead of streamObject for debugging
const result = await generateObject({
  model: google('gemini-2.5-flash'),
  schema: NegotiationResponseSchema,
  system: dynamicSystemPrompt,
  messages: messages.map(m => ({
    role: m.role,
    content: m.content
  })),
})

        console.log('[NEGOTIATE] generateObject succeeded')
        console.log('[NEGOTIATE] Response:', JSON.stringify(result.object))

        // Return the response directly (not streaming)
        const nextHostilityData = calculateNextHostility(
  currentHostility,
  result.object.deal_health_score || 50
)

return handleCORS(NextResponse.json({
  ...result.object,
  currentHostility: nextHostilityData.hostility,
  hostilityLabel: nextHostilityData.hostilityLabel
}))

      } catch (apiError) {
        // Detailed error logging
        console.error('[NEGOTIATE] API Error occurred')
        console.error('[NEGOTIATE] Error name:', apiError.name)
        console.error('[NEGOTIATE] Error message:', apiError.message)
        console.error('[NEGOTIATE] Error cause:', apiError.cause)
        console.error('[NEGOTIATE] Error stack:', apiError.stack)
        
        // Try to extract more details
        let errorDetails = {
          name: apiError.name || 'UnknownError',
          message: apiError.message || 'No error message',
          timestamp: new Date().toISOString()
        }

        if (apiError.cause) {
          errorDetails.cause = String(apiError.cause)
        }

        if (apiError.data) {
          errorDetails.data = apiError.data
        }

        if (apiError.responseBody) {
          errorDetails.responseBody = apiError.responseBody
        }

        console.error('[NEGOTIATE] Full error details:', JSON.stringify(errorDetails, null, 2))

        return handleCORS(NextResponse.json({
          ...FALLBACK_RESPONSE,
          _debug: errorDetails
        }))
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
          console.error('[SCORECARD] GOOGLE_GENERATIVE_AI_API_KEY is not set')
          return handleCORS(NextResponse.json({
            final_score: 50,
            verdict: "Unable to generate scorecard - API key not configured.",
            strengths: ["Participated in the negotiation", "Showed initiative"],
            improvements: ["Try again for a full evaluation", "Ensure stable connection"],
            biggest_mistake: "Scorecard generation failed - API configuration error"
          }))
        }

        console.log('[SCORECARD] Starting scorecard generation...')

        const google = createGoogleGenerativeAI({
          apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
        })

        console.log('[SCORECARD] Calling generateObject with gemini-2.5-flash...')

        // Using generateObject instead of streamObject for debugging
        const result = await generateObject({
          model: google('gemini-2.5-flash'),
          schema: ScorecardResponseSchema,
          prompt: scoringPrompt,
        })

        console.log('[SCORECARD] generateObject succeeded')
        console.log('[SCORECARD] Response:', JSON.stringify(result.object))

        return handleCORS(NextResponse.json(result.object))

      } catch (apiError) {
        console.error('[SCORECARD] API Error occurred')
        console.error('[SCORECARD] Error name:', apiError.name)
        console.error('[SCORECARD] Error message:', apiError.message)
        console.error('[SCORECARD] Error cause:', apiError.cause)

        return handleCORS(NextResponse.json({
          final_score: 50,
          verdict: "Unable to generate scorecard due to an error.",
          strengths: ["Participated in the negotiation", "Showed initiative"],
          improvements: ["Try again for a full evaluation", "Ensure stable connection"],
          biggest_mistake: "Scorecard generation failed",
          _debug: {
            error: apiError.message,
            name: apiError.name,
            timestamp: new Date().toISOString()
          }
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

    // ============================================
    // COOKIE-BASED SESSION MANAGEMENT (No Database Required)
    // ============================================

    // Register user email - POST /api/register
    if (route === '/register' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, consent } = body

        // Validate email format
        if (!email || !email.includes('@') || !email.includes('.')) {
          return handleCORS(NextResponse.json(
            { error: "Valid email is required." },
            { status: 400 }
          ))
        }

        if (!consent) {
          return handleCORS(NextResponse.json(
            { error: "Privacy consent is required." },
            { status: 400 }
          ))
        }

        // Generate session token
        const sessionToken = uuidv4()
        const userId = uuidv4()
        
        // Create response with user data
        const response = NextResponse.json({
          id: userId,
          email: email.toLowerCase(),
          sessionsUsed: 0,
          maxFreeSessions: 3,
          sessionToken: sessionToken,
          createdAt: new Date().toISOString()
        })

        // Set cookie with session data (expires in 30 days)
        response.cookies.set('repready_session', JSON.stringify({
          id: userId,
          email: email.toLowerCase(),
          sessionsUsed: 0,
          sessionToken: sessionToken
        }), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return handleCORS(response)
      } catch (error) {
        console.error('Register error:', error)
        return handleCORS(NextResponse.json(
          { error: "Registration failed. Please try again." },
          { status: 500 }
        ))
      }
    }

    // Get user by email - GET /api/user?email=xxx
    if (route === '/user' && method === 'GET') {
      try {
        const url = new URL(request.url)
        const email = url.searchParams.get('email')

        if (!email) {
          return handleCORS(NextResponse.json(
            { error: "Email parameter required." },
            { status: 400 }
          ))
        }

        // Try to get session from cookie
        const sessionCookie = request.cookies.get('repready_session')
        
        if (sessionCookie) {
          try {
            const sessionData = JSON.parse(sessionCookie.value)
            if (sessionData.email === email.toLowerCase()) {
              return handleCORS(NextResponse.json({
                id: sessionData.id,
                email: sessionData.email,
                sessionsUsed: sessionData.sessionsUsed || 0,
                maxFreeSessions: 3
              }))
            }
          } catch (e) {
            // Invalid cookie, continue
          }
        }

        // User not found in cookies - return default
        return handleCORS(NextResponse.json({
          id: uuidv4(),
          email: email.toLowerCase(),
          sessionsUsed: 0,
          maxFreeSessions: 3
        }))
      } catch (error) {
        console.error('Get user error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to get user data." },
          { status: 500 }
        ))
      }
    }

    // Increment session count - POST /api/user/session
    if (route === '/user/session' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, currentSessionsUsed } = body

        if (!email) {
          return handleCORS(NextResponse.json(
            { error: "Email is required." },
            { status: 400 }
          ))
        }

        // Get current count from request body or default to 0
        const newSessionsUsed = (currentSessionsUsed || 0) + 1

        const response = NextResponse.json({
          sessionsUsed: newSessionsUsed,
          maxFreeSessions: 3,
          limitReached: newSessionsUsed >= 3
        })

        // Update cookie with new session count
        const sessionCookie = request.cookies.get('repready_session')
        let sessionData = {
          id: uuidv4(),
          email: email.toLowerCase(),
          sessionsUsed: newSessionsUsed,
          sessionToken: uuidv4()
        }

        if (sessionCookie) {
          try {
            const existingData = JSON.parse(sessionCookie.value)
            sessionData = {
              ...existingData,
              sessionsUsed: newSessionsUsed
            }
          } catch (e) {
            // Use default sessionData
          }
        }

        response.cookies.set('repready_session', JSON.stringify(sessionData), {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30 // 30 days
        })

        return handleCORS(response)
      } catch (error) {
        console.error('Session increment error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to update session count." },
          { status: 500 }
        ))
      }
    }

    // Request team access - POST /api/request-access
    if (route === '/request-access' && method === 'POST') {
      try {
        const body = await request.json()
        const { email, company, teamSize, message } = body

        // Log the request (in production, you might want to send this to an email service)
        console.log('Team access request:', { email, company, teamSize, message })

        return handleCORS(NextResponse.json({ 
          success: true, 
          id: uuidv4(),
          message: "Your request has been received. We'll contact you within 24 hours."
        }))
      } catch (error) {
        console.error('Request access error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to submit request." },
          { status: 500 }
        ))
      }
    }

    // Save session - POST /api/sessions
    if (route === '/sessions' && method === 'POST') {
      try {
        const body = await request.json()
        const session = {
  id: uuidv4(),
  userEmail: body.userEmail || '',
  orgId: body.orgId || null,
  persona: body.persona || '',
  finalScore: body.finalScore || 0,
  verdict: body.scorecard?.verdict || body.verdict || '',
  mode: body.mode || 'text',
  hostilityReached: body.hostilityReached || null,
  qualificationStatus: body.qualificationStatus || null,
  createdAt: new Date().toISOString()
}
        const db = await getDb()
        await db.collection('sessions').insertOne(session)
        return handleCORS(NextResponse.json(session))
      } catch (error) {
        console.error('Save session error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to save session." },
          { status: 500 }
        ))
      }
    }

    // Get sessions by user - GET /api/sessions?email=xxx
    if (route === '/sessions' && method === 'GET') {
      try {
        const url = new URL(request.url)
        const email = url.searchParams.get('email')
        if (!email) return handleCORS(NextResponse.json([]))
        const db = await getDb()
        const sessions = await db.collection('sessions')
          .find({ userEmail: email })
          .sort({ createdAt: -1 })
          .limit(50)
          .toArray()
        return handleCORS(NextResponse.json(sessions))
      } catch (error) {
        console.error('Get sessions error:', error)
        return handleCORS(NextResponse.json([]))
      }
    }

    // Delete sessions for a user - DELETE /api/sessions?email=xxx
    if (route === '/sessions' && method === 'DELETE') {
      try {
        const url = new URL(request.url)
        const email = url.searchParams.get('email')
        if (!email) return handleCORS(NextResponse.json(
          { error: "Email required" }, { status: 400 }
        ))
        const db = await getDb()
        await db.collection('sessions').deleteMany({ userEmail: email })
        return handleCORS(NextResponse.json({ success: true }))
      } catch (error) {
        return handleCORS(NextResponse.json(
          { error: "Failed to delete sessions." }, { status: 500 }
        ))
      }
    }

    // Manager dashboard - GET /api/dashboard?orgId=xxx
    if (route === '/dashboard' && method === 'GET') {
      try {
        const url = new URL(request.url)
        const orgId = url.searchParams.get('orgId')
        if (!orgId) return handleCORS(NextResponse.json(
          { error: "orgId required" }, { status: 400 }
        ))
        const db = await getDb()
        const sessions = await db.collection('sessions')
          .find({ orgId: orgId })
          .sort({ createdAt: -1 })
          .toArray()

        const repMap = {}
        for (const s of sessions) {
          if (!repMap[s.userEmail]) {
            repMap[s.userEmail] = {
              userEmail: s.userEmail,
              sessions: 0,
              totalScore: 0,
              lastSession: s.createdAt
            }
          }
          repMap[s.userEmail].sessions++
          repMap[s.userEmail].totalScore += s.finalScore || 0
          if (s.createdAt > repMap[s.userEmail].lastSession) {
            repMap[s.userEmail].lastSession = s.createdAt
          }
        }

        const reps = Object.values(repMap).map(r => ({
          ...r,
          avgScore: r.sessions > 0 ? Math.round(r.totalScore / r.sessions) : 0
        })).sort((a, b) => b.avgScore - a.avgScore)

        return handleCORS(NextResponse.json({
          orgId,
          totalSessions: sessions.length,
          avgScore: reps.length > 0
            ? Math.round(reps.reduce((sum, r) => sum + r.avgScore, 0) / reps.length)
            : 0,
          totalReps: reps.length,
          passingReps: reps.filter(r => r.avgScore >= 70).length,
          reps,
      recentSessions: sessions.slice(0, 10).map(s => ({
  userEmail: s.userEmail,
  persona: s.persona,
  finalScore: s.finalScore,
  mode: s.mode,
  createdAt: s.createdAt,
  hostilityReached: s.hostilityReached || null,
  qualificationStatus: s.qualificationStatus || null
}))
        }))
      } catch (error) {
        console.error('Dashboard error:', error)
        return handleCORS(NextResponse.json(
          { error: "Failed to load dashboard." }, { status: 500 }
        ))
      }
    }
// Boardroom Review - POST /api/boardroom
if (route === '/boardroom' && method === 'POST') {
  try {
    const body = await request.json()
    const { transcript, persona } = body

    if (!transcript || !persona) {
      return handleCORS(NextResponse.json(
        { error: "transcript and persona required" }, { status: 400 }
      ))
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return handleCORS(NextResponse.json(
        { error: "API key not configured" }, { status: 500 }
      ))
    }

    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    })

    const ProcurementSchema = z.object({
      score: z.number().min(0).max(100).describe("Procurement score 0-100"),
      reasoning: z.string().describe("2-3 sentences explaining the score"),
      marginDefense: z.enum(['strong', 'moderate', 'weak']).describe("How well the rep defended margins"),
      discountedEarly: z.boolean().describe("Did the rep offer discounts before establishing value"),
    })

    const EnablementSchema = z.object({
      score: z.number().min(0).max(100).describe("Sales enablement score 0-100"),
      reasoning: z.string().describe("2-3 sentences explaining the score"),
      callControl: z.enum(['strong', 'moderate', 'weak']).describe("How well the rep controlled the call"),
      usedDiscovery: z.boolean().describe("Did the rep use discovery questions before pitching"),
    })

    const ExecutiveSchema = z.object({
      finalScore: z.number().min(0).max(100).describe("Weighted final score"),
      grade: z.enum(['A', 'B', 'C', 'D', 'F']).describe("Letter grade"),
      verdict: z.string().describe("One sentence executive verdict"),
      whatYouDidRight: z.string().describe("One specific thing the rep did well — max 20 words"),
      whatYouDidWrong: z.string().describe("One critical mistake — max 20 words"),
      oneThingToFixNext: z.string().describe("One tactical fix for the next session — max 20 words"),
    })

    const personaContext = persona === 'richard'
      ? 'VP Procurement at a logistics firm. CFO-mandated 15% cost reduction. Anchors on price, threatens vendor consolidation, demands Net-90 terms.'
      : 'IT Director at a financial firm. Blocks on SOC 2, SAML/SSO, and bandwidth. Polite but always has a blocker.'

    const PROCUREMENT_PROMPT = `You are an elite procurement analyst evaluating a B2B sales rep's performance.

BUYER CONTEXT: ${personaContext}

SCORING CRITERIA:

HIGH SCORE signals (rep did these):
- Postponed discount conversation until value was established
- Traded concessions for value ("lower price if 24-month commitment")
- Uncovered cost of delay ("how does stalling impact Q4 targets?")
- Held firm on price when challenged without apologizing
- Asked about budget structure before discussing numbers

LOW SCORE signals (rep did these):
- Dropped price immediately on first objection
- Offered verbal discounts before understanding budget ("we can work something out")
- Apologized for pricing or became defensive about cost
- Agreed to demands without any counter-ask
- Never established ROI before entering price discussion

TRANSCRIPT:
${transcript}

Score strictly on margin defense only. Ignore tone, confidence, or rapport.`

    const ENABLEMENT_PROMPT = `You are a senior sales enablement director evaluating call execution technique.

BUYER CONTEXT: ${personaContext}

SCORING CRITERIA — based on Challenger Sale and MEDDPICC frameworks:

HIGH SCORE signals (rep did these):
- Acknowledged and validated objections before responding ("It makes sense data residency is a concern")
- Asked deep discovery questions to find root cause of objections
- Maintained control of next steps instead of letting buyer end the call
- Reframed the conversation from cost to business impact
- Used silence and pauses effectively after making a point

LOW SCORE signals (rep did these):
- Became defensive or scripted when pushed back
- Jumped straight to product features without understanding the real objection
- Let the buyer set the agenda and control the call direction
- Failed to uncover WHY an objection was raised
- Responded to every objection with a feature pitch

TRANSCRIPT:
${transcript}

Score strictly on technique and call structure. Ignore margin or pricing behavior.`

    // Run both analyst agents in parallel
    const [procurementResult, enablementResult] = await Promise.all([
      generateObject({
        model: google('gemini-2.5-flash'),
        schema: ProcurementSchema,
        system: PROCUREMENT_PROMPT,
        prompt: `Evaluate this sales rep's margin defense and pricing discipline. Be strict and realistic.`,
      }),
      generateObject({
        model: google('gemini-2.5-flash'),
        schema: EnablementSchema,
        system: ENABLEMENT_PROMPT,
        prompt: `Evaluate this sales rep's call technique, discovery depth, and objection handling. Be strict and realistic.`,
      }),
    ])

    const procScore = procurementResult.object.score
    const enableScore = enablementResult.object.score
    const weightedScore = Math.round((procScore * 0.6) + (enableScore * 0.4))

    // Executive Summarizer — third agent ingests both outputs
    const executiveResult = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: ExecutiveSchema,
      prompt: `You are an executive sales performance reviewer. Two specialist analysts have scored this rep.

PROCUREMENT ANALYST SCORE: ${procScore}/100
Procurement reasoning: ${procurementResult.object.reasoning}
Margin defense: ${procurementResult.object.marginDefense}
Discounted early: ${procurementResult.object.discountedEarly}

SALES ENABLEMENT ANALYST SCORE: ${enableScore}/100  
Enablement reasoning: ${enablementResult.object.reasoning}
Call control: ${enablementResult.object.callControl}
Used discovery: ${enablementResult.object.usedDiscovery}

WEIGHTED FINAL SCORE (60% procurement, 40% enablement): ${weightedScore}/100

Grade scale: A=90+, B=75-89, C=60-74, D=45-59, F=below 45

Write a crisp executive summary. Each feedback field must be under 20 words. Be direct, not motivational. This is enterprise-grade feedback.`,
    })

    return handleCORS(NextResponse.json({
      procurementScore: procScore,
      enablementScore: enableScore,
      finalScore: weightedScore,
      grade: executiveResult.object.grade,
      verdict: executiveResult.object.verdict,
      whatYouDidRight: executiveResult.object.whatYouDidRight,
      whatYouDidWrong: executiveResult.object.whatYouDidWrong,
      oneThingToFixNext: executiveResult.object.oneThingToFixNext,
      analysts: {
        procurement: {
          score: procScore,
          reasoning: procurementResult.object.reasoning,
          marginDefense: procurementResult.object.marginDefense,
          discountedEarly: procurementResult.object.discountedEarly,
        },
        enablement: {
          score: enableScore,
          reasoning: enablementResult.object.reasoning,
          callControl: enablementResult.object.callControl,
          usedDiscovery: enablementResult.object.usedDiscovery,
        }
      }
    }))

  } catch (error) {
    console.error('Boardroom error:', error)
    return handleCORS(NextResponse.json(
      { error: "Boardroom review failed." }, { status: 500 }
    ))
  }
}
    // GET /api/benchmark?email=xxx&persona=xxx
if (route === '/benchmark' && method === 'GET') {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    const persona = url.searchParams.get('persona')
    if (!email) return handleCORS(NextResponse.json({ startingHostility: 40, hostilityLabel: 'Low' }))
    const db = await getDb()
    const query = { userEmail: email }
    if (persona) query.persona = persona
    const bestSession = await db.collection('sessions')
      .find({ ...query, hostilityReached: { $exists: true, $ne: null } })
      .sort({ hostilityReached: -1 })
      .limit(1)
      .toArray()
    if (!bestSession.length || !bestSession[0].hostilityReached) {
      return handleCORS(NextResponse.json({ startingHostility: 40, hostilityLabel: 'Low' }))
    }
    const nextStart = Math.min(90, bestSession[0].hostilityReached + 5)
    let label = 'Low'
    if (nextStart >= 85) label = 'Extreme'
    else if (nextStart >= 70) label = 'High'
    else if (nextStart >= 55) label = 'Medium'
    return handleCORS(NextResponse.json({ startingHostility: nextStart, hostilityLabel: label }))
  } catch (error) {
    console.error('Benchmark error:', error)
    return handleCORS(NextResponse.json({ startingHostility: 40, hostilityLabel: 'Low' }))
  }
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
