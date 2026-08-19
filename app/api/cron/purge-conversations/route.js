import { NextResponse } from 'next/server'

// DPDP-compliant conversation retention — automated 90-day purge.
//
// Your /deck consent screen tells every user their ElevenLabs voice
// conversation data is retained and deleted after 90 days. Nothing in the
// codebase actually enforced that until this file — it was a manual,
// never-actually-done process. This closes that gap.
//
// !!! IMPORTANT — READ BEFORE ENABLING LIVE MODE !!!
// The ElevenLabs endpoint paths, field names (start_time_unix_secs,
// conversation_id, pagination shape) and auth header used below are
// written from general knowledge of ElevenLabs' Conversational AI API and
// have NOT been verified against their current live docs — this sandbox
// has no network access to elevenlabs.io to confirm them. Before this can
// safely run in live mode:
//   1. Deploy with ELEVENLABS_RETENTION_LIVE unset (or 'false') — this is
//      the default and means DRY RUN: nothing gets deleted, only logged.
//   2. Trigger it manually (see below) and check the response JSON —
//      does `eligibleForDeletion` look like a sane list of real,
//      >90-day-old conversations? Do the field names in the raw response
//      match what's expected?
//   3. Cross-check the endpoint/response shape against
//      https://elevenlabs.io/docs/conversational-ai — fix anything that
//      doesn't match before going further.
//   4. Only once verified, set ELEVENLABS_RETENTION_LIVE=true in Vercel's
//      environment variables to let it actually delete.
//
// Manual trigger for testing (from your own terminal, not this sandbox):
//   curl -X GET "https://repready.site/api/cron/purge-conversations" \
//        -H "Authorization: Bearer YOUR_CRON_SECRET"

const RETENTION_DAYS = 90
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1/convai'

export async function GET(request) {
  // Vercel Cron sends this header automatically when CRON_SECRET is set
  // in the project's env vars — this also lets you trigger it manually
  // for testing with the same secret.
  const authHeader = request.headers.get('authorization')
  const expectedAuth = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expectedAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY not configured' },
      { status: 500 }
    )
  }

  const isLive = process.env.ELEVENLABS_RETENTION_LIVE === 'true'
  const cutoffUnixSecs = Math.floor(Date.now() / 1000) - RETENTION_DAYS * 24 * 60 * 60

  try {
    const allConversations = []
    let cursor = null
    let hasMore = true

    // Paginate through every conversation on the account. If your
    // ElevenLabs account has agents beyond RepReady's four personas, this
    // will also see those — narrow with an agent_id filter per request if
    // that's ever a concern.
    while (hasMore) {
      const url = new URL(`${ELEVENLABS_API_BASE}/conversations`)
      url.searchParams.set('page_size', '100')
      if (cursor) url.searchParams.set('cursor', cursor)

      const res = await fetch(url.toString(), {
        headers: { 'xi-api-key': apiKey }
      })

      if (!res.ok) {
        const errText = await res.text()
        return NextResponse.json(
          { error: 'Failed to list conversations from ElevenLabs', status: res.status, detail: errText },
          { status: 502 }
        )
      }

      const data = await res.json()
      const conversations = data.conversations || data.items || []
      allConversations.push(...conversations)

      hasMore = Boolean(data.has_more)
      cursor = data.next_cursor || data.cursor || null
      if (!cursor) hasMore = false
    }

    const eligibleForDeletion = allConversations.filter((c) => {
      const startedAt = c.start_time_unix_secs || c.created_at_unix_secs || null
      return startedAt != null && startedAt < cutoffUnixSecs
    })

    const deletionResults = []
    if (isLive) {
      for (const convo of eligibleForDeletion) {
        const convoId = convo.conversation_id || convo.id
        try {
          const delRes = await fetch(`${ELEVENLABS_API_BASE}/conversations/${convoId}`, {
            method: 'DELETE',
            headers: { 'xi-api-key': apiKey }
          })
          deletionResults.push({ conversationId: convoId, deleted: delRes.ok, status: delRes.status })
        } catch (err) {
          deletionResults.push({ conversationId: convoId, deleted: false, error: String(err) })
        }
      }
    }

    return NextResponse.json({
      mode: isLive ? 'live' : 'dry-run',
      retentionDays: RETENTION_DAYS,
      totalConversationsChecked: allConversations.length,
      eligibleForDeletionCount: eligibleForDeletion.length,
      eligibleForDeletion: eligibleForDeletion.map((c) => ({
        conversationId: c.conversation_id || c.id,
        startTimeUnixSecs: c.start_time_unix_secs || c.created_at_unix_secs || null
      })),
      deletionResults: isLive ? deletionResults : 'DRY RUN — nothing deleted. Set ELEVENLABS_RETENTION_LIVE=true once verified.'
    })
  } catch (error) {
    console.error('Retention purge error:', error)
    return NextResponse.json(
      { error: 'Retention purge failed', detail: String(error) },
      { status: 500 }
    )
  }
}
