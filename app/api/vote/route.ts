import { NextRequest, NextResponse } from 'next/server';
import { castVote, getNomineeById, getCategoryById, getIpVoteCount, getSettings, getSession, getUserVotes } from '@/lib/db';
import { cookies } from 'next/headers';
import { getClientIp, getUserAgent } from '@/lib/auth';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to vote' },
        { status: 401 }
      );
    }

    // Get session from database
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // Check if voting is open
    const settings = await getSettings();
    if (!settings.votingOpen) {
      return NextResponse.json(
        { success: false, error: 'Voting is currently closed' },
        { status: 403 }
      );
    }

    // Check voting period
    if (settings.votingEndDate && new Date() > settings.votingEndDate) {
      return NextResponse.json(
        { success: false, error: 'Voting period has ended' },
        { status: 403 }
      );
    }

    if (settings.votingStartDate && new Date() < settings.votingStartDate) {
      return NextResponse.json(
        { success: false, error: 'Voting has not started yet' },
        { status: 403 }
      );
    }

    const { votes } = await request.json();

    if (!Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No votes provided' },
        { status: 400 }
      );
    }

    // Check if user has already voted (votes are final)
    const existingVotes = await getUserVotes(session.userId);
    if (existingVotes.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already submitted your votes. Votes are final and cannot be changed.',
          alreadyVoted: true
        },
        { status: 403 }
      );
    }

    // Get IP address for fraud detection
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    // Check IP-based rate limiting if configured
    if (settings.maxVotesPerIp) {
      const ipVoteCount = await getIpVoteCount(ipAddress);
      if (ipVoteCount >= settings.maxVotesPerIp) {
        return NextResponse.json(
          { success: false, error: 'Vote limit reached from this network' },
          { status: 429 }
        );
      }
    }

    // Validate and cast votes
    const results = [];
    for (const vote of votes) {
      const { categoryId, nomineeId } = vote;

      // Validate category exists
      const category = await getCategoryById(categoryId);
      if (!category) {
        return NextResponse.json(
          { success: false, error: `Invalid category: ${categoryId}` },
          { status: 400 }
        );
      }

      // Validate nominee exists and belongs to category
      const nominee = await getNomineeById(nomineeId);
      if (!nominee || nominee.categoryId !== categoryId) {
        return NextResponse.json(
          { success: false, error: `Invalid nominee for category` },
          { status: 400 }
        );
      }

      // Cast vote (insert only, no updates)
      const result = await castVote({
        userId: session.userId,
        categoryId,
        nomineeId,
        ipAddress,
        userAgent,
      });

      results.push(result);
    }

    // Send confirmation email
    const { sendVoteConfirmation } = await import('@/lib/email');
    try {
      await sendVoteConfirmation(session.email, results.length);
      console.log('[Vote] Confirmation email sent to:', session.email);
    } catch (emailError) {
      console.error('[Vote] Failed to send confirmation email:', emailError);
      // Don't fail the vote if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Successfully voted in ${results.length} ${results.length === 1 ? 'category' : 'categories'}. A confirmation email has been sent.`,
      data: results,
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
