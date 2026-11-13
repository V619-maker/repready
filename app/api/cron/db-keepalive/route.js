import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

// Daily keep-alive for the MongoDB Atlas free (M0) cluster.
//
// Atlas pauses free clusters after a long stretch with no activity. When that
// happens every database call fails ("querySrv ENOTFOUND") and users see
// "session history was not saved" until someone clicks Resume in Atlas.
// A once-a-day real read keeps the cluster counted as active.
//
// Auth is the same as /api/cron/purge-conversations: Vercel Cron sends
// `Authorization: Bearer $CRON_SECRET` automatically when CRON_SECRET is set.
// Without CRON_SECRET the route refuses everything (fails safe).
//
// It opens its own short-lived connection instead of sharing the app's cached
// client, so a slow or paused database can only delay this route, never the
// live user journey. It reads a single document id and returns nothing else.
// No user data leaves the database through this route.

export const dynamic = 'force-dynamic'

export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.MONGO_URL) {
    return NextResponse.json({ ok: false, error: 'MONGO_URL not configured' }, { status: 500 })
  }

  const client = new MongoClient(process.env.MONGO_URL, { serverSelectionTimeoutMS: 8000 })
  const startedAt = Date.now()
  try {
    await client.connect()
    const db = client.db(process.env.DB_NAME || 'repready')
    await db.command({ ping: 1 })
    // A real read, not just a ping, so Atlas sees genuine data access.
    await db.collection('sessions').findOne({}, { projection: { _id: 1 } })
    return NextResponse.json({ ok: true, ms: Date.now() - startedAt })
  } catch (error) {
    // Log the real error server-side (Vercel logs); return only a short label.
    console.error('DB keep-alive failed:', error)
    return NextResponse.json(
      { ok: false, error: 'Database unreachable — it may be paused. Resume it in Atlas.', ms: Date.now() - startedAt },
      { status: 503 }
    )
  } finally {
    await client.close().catch(() => {})
  }
}
