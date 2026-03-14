import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { generateObject } from 'ai'
import { z } from 'zod'

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
        modelName: 'gemini-2.0-flash',
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
          model: google('gemini-2.0-flash'),
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
        console.log('[NEGOTIATE] Model: gemini-2.0-flash')

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

        console.log('[NEGOTIATE] Calling generateObject with gemini-2.0-flash...')

        // Using generateObject instead of streamObject for debugging
        const result = await generateObject({
          model: google('gemini-2.0-flash'),
          schema: NegotiationResponseSchema,
          system: selectedPersona.systemPrompt,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
        })

        console.log('[NEGOTIATE] generateObject succeeded')
        console.log('[NEGOTIATE] Response:', JSON.stringify(result.object))

        // Return the response directly (not streaming)
        return handleCORS(NextResponse.json(result.object))

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

        console.log('[SCORECARD] Calling generateObject with gemini-2.0-flash...')

        // Using generateObject instead of streamObject for debugging
        const result = await generateObject({
          model: google('gemini-2.0-flash'),
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

    // Save session - POST /api/sessions (stores in cookie for now)
    if (route === '/sessions' && method === 'POST') {
      try {
        const body = await request.json()
        const session = {
          id: uuidv4(),
          ...body,
          createdAt: new Date().toISOString()
        }
        
        // For now, just return success - sessions are tracked in localStorage on frontend
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
      // Return empty array - sessions are stored in localStorage on frontend
      return handleCORS(NextResponse.json([]))
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
