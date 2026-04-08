import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // 1. Verify the user is logged in (Clerk v6 requires await)
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

  } catch (error) {
    console.error("Credit deduction error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
