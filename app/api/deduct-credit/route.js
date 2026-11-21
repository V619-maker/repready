import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { acquireCreditLock, releaseCreditLock } from '../../../lib/creditLock.mjs';

// Same connection settings as the main API route; cached across warm invocations.
let cachedClient = null;
async function getLockCollection() {
  if (!cachedClient) {
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    cachedClient = client;
  }
  return cachedClient.db(process.env.DB_NAME || 'repready').collection('creditLocks');
}

export async function POST(req) {
  try {
    // 1. Verify the user is logged in (Clerk v6 requires await)
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1b. Take a short per-user lock so two simultaneous requests can't both
    // read the same balance and both succeed (Known Issue 0e). Fails closed:
    // if the lock cannot be taken, nobody is charged and nobody gets a call.
    let lockCol = null;
    let lockToken = null;
    try {
      lockCol = await getLockCollection();
      lockToken = await acquireCreditLock(lockCol, userId);
    } catch (lockError) {
      console.error("Credit lock unavailable:", lockError);
      return new NextResponse("Credit service unavailable, please retry", { status: 503 });
    }
    if (!lockToken) {
      return new NextResponse("Another request is in progress, please retry", { status: 409 });
    }

    try {
    // 2. Fetch the user's data from Clerk's database
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // 3. Check their current credits. If new, give them 3 free trials.
    let currentCredits = user.privateMetadata.credits;
    
    if (currentCredits === undefined) {
      currentCredits = 3; 
    }

    // 4. If they have 0 credits, reject the call (triggers your red paywall screen)
    if (currentCredits <= 0) {
      return new NextResponse("Insufficient credits", { status: 403 });
    }

    // 5. If they have credits, subtract 1 and save it back to Clerk
    await client.users.updateUserMetadata(userId, {
      privateMetadata: {
        credits: currentCredits - 1,
      },
    });

    // 6. Tell the frontend the payment was successful
    return NextResponse.json({ success: true, remaining: currentCredits - 1 });
    } finally {
      await releaseCreditLock(lockCol, userId, lockToken);
    }

  } catch (error) {
    console.error("Credit deduction error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
