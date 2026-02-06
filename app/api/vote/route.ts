import { NextRequest, NextResponse } from 'next/server';
import { castVote, getNomineeById, getCategoryById, getIpVoteCount, getSettings } from '@/lib/db';
import { cookies } from 'next/headers';
import { sessions } from '../auth/verify/route';
import { getClientIp, getUserAgent } from '@/lib/auth';

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

    const session = sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt) {
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

      // Cast vote (will update if already voted in this category)
      const result = await castVote({
        userId: session.userId,
        categoryId,
        nomineeId,
        ipAddress,
        userAgent,
      });

      results.push(result);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully voted in ${results.length} ${results.length === 1 ? 'category' : 'categories'}`,
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
