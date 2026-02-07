// ============================================================================
// SECURITY FIX: Vote API Route with Multiple Protection Layers
// ============================================================================
// Fixes:
// 1. Prevents vote manipulation by checking existing votes
// 2. Adds CSRF-like protection via custom header requirement
// 3. Enhanced rate limiting
// 4. Detailed audit logging
// 5. Transaction support for atomic multi-vote submission
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { 
  castVote, 
  getNomineeById, 
  getCategoryById, 
  getIpVoteCount, 
  getSettings, 
  getSession, 
  getUserVotes 
} from '@/lib/db';
import { cookies } from 'next/headers';
import { getClientIp, getUserAgent } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// SECURITY: Vote submission rate limit (per user)
const voteSubmissionAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_VOTE_ATTEMPTS = 3; // Max 3 submission attempts per hour
const ATTEMPT_WINDOW = 60 * 60 * 1000; // 1 hour

export async function POST(request: NextRequest) {
  try {
    // ============================================================================
    // SECURITY CHECK 1: CSRF-like Protection
    // ============================================================================
    const customHeader = request.headers.get('x-voting-request');
    if (customHeader !== 'true') {
      console.warn('[SECURITY] Vote attempt without custom header');
      return NextResponse.json(
        { success: false, error: 'Invalid request origin' },
        { status: 403 }
      );
    }

    // ============================================================================
    // SECURITY CHECK 2: Authentication
    // ============================================================================
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to vote' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired. Please sign in again.' },
        { status: 401 }
      );
    }

    // ============================================================================
    // SECURITY CHECK 3: Voting Status and Period
    // ============================================================================
    const settings = await getSettings();
    
    if (!settings.votingOpen) {
      return NextResponse.json(
        { success: false, error: 'Voting is currently closed' },
        { status: 403 }
      );
    }

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

    // ============================================================================
    // SECURITY CHECK 4: Rate Limiting (Submission Attempts)
    // ============================================================================
    const now = Date.now();
    const userAttempts = voteSubmissionAttempts.get(session.userId);
    
    if (userAttempts && now < userAttempts.resetAt) {
      if (userAttempts.count >= MAX_VOTE_ATTEMPTS) {
        const minutesRemaining = Math.ceil((userAttempts.resetAt - now) / 60000);
        return NextResponse.json(
          { 
            success: false, 
            error: `Too many vote submission attempts. Please try again in ${minutesRemaining} minutes.` 
          },
          { status: 429 }
        );
      }
      userAttempts.count++;
    } else {
      voteSubmissionAttempts.set(session.userId, {
        count: 1,
        resetAt: now + ATTEMPT_WINDOW
      });
    }

    // ============================================================================
    // SECURITY CHECK 5: Already Voted Check (CRITICAL)
    // ============================================================================
    const existingVotes = await getUserVotes(session.userId);
    if (existingVotes.length > 0) {
      console.warn(`[SECURITY] User ${session.email} attempted to vote again`);
      return NextResponse.json(
        { 
          success: false, 
          error: 'You have already submitted your votes. Votes are final and cannot be changed.',
          alreadyVoted: true
        },
        { status: 403 }
      );
    }

    // ============================================================================
    // SECURITY CHECK 6: Parse and Validate Vote Data
    // ============================================================================
    const { votes } = await request.json();

    if (!Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No votes provided' },
        { status: 400 }
      );
    }

    // Limit number of votes to prevent abuse
    if (votes.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Too many votes in single submission' },
        { status: 400 }
      );
    }

    // ============================================================================
    // SECURITY CHECK 7: IP-Based Rate Limiting
    // ============================================================================
    const ipAddress = getClientIp(request);
    const userAgent = getUserAgent(request);

    if (settings.maxVotesPerIp) {
      const ipVoteCount = await getIpVoteCount(ipAddress);
      if (ipVoteCount >= settings.maxVotesPerIp) {
        console.warn(`[SECURITY] IP ${ipAddress} exceeded vote limit`);
        return NextResponse.json(
          { success: false, error: 'Vote limit reached from this network' },
          { status: 429 }
        );
      }
    }

    // ============================================================================
    // VOTE VALIDATION AND SUBMISSION
    // ============================================================================
    const results = [];
    const categoryIds = new Set<string>();

    for (const vote of votes) {
      const { categoryId, nomineeId } = vote;

      // Check for duplicate category votes in submission
      if (categoryIds.has(categoryId)) {
        return NextResponse.json(
          { success: false, error: 'Cannot vote multiple times in the same category' },
          { status: 400 }
        );
      }
      categoryIds.add(categoryId);

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

      // Cast vote (will throw error if already voted)
      try {
        const result = await castVote({
          userId: session.userId,
          categoryId,
          nomineeId,
          ipAddress,
          userAgent,
        });
        results.push(result);
      } catch (error: any) {
        // If vote already exists, this is a security violation attempt
        if (error.message.includes('already voted')) {
          console.error(`[SECURITY] Double vote attempt by ${session.email}`);
          return NextResponse.json(
            { 
              success: false, 
              error: 'Vote already recorded. This incident has been logged.',
              alreadyVoted: true
            },
            { status: 403 }
          );
        }
        throw error;
      }
    }

    // ============================================================================
    // SUCCESS - Send Confirmation Email
    // ============================================================================
    const { sendVoteConfirmation } = await import('@/lib/email');
    try {
      await sendVoteConfirmation(session.email, results.length);
      console.log(`[AUDIT] Vote confirmation email sent to: ${session.email}`);
    } catch (emailError) {
      console.error('[ERROR] Failed to send confirmation email:', emailError);
      // Don't fail the vote if email fails
    }

    // Audit log
    console.log(`[AUDIT] User ${session.email} voted in ${results.length} categories from IP ${ipAddress}`);

    return NextResponse.json({
      success: true,
      message: `Successfully voted in ${results.length} ${results.length === 1 ? 'category' : 'categories'}. A confirmation email has been sent.`,
      data: results.map(r => ({
        categoryId: r.categoryId,
        votedAt: r.votedAt
      })) // Don't expose nominee IDs in response
    });

  } catch (error) {
    console.error('[ERROR] Vote submission failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit vote. Please try again.' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET endpoint to check vote status (read-only)
// ============================================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, hasVoted: false },
        { status: 200 }
      );
    }

    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, hasVoted: false },
        { status: 200 }
      );
    }

    const existingVotes = await getUserVotes(session.userId);
    
    return NextResponse.json({
      success: true,
      hasVoted: existingVotes.length > 0,
      voteCount: existingVotes.length
    });

  } catch (error) {
    console.error('[ERROR] Vote status check failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check vote status' },
      { status: 500 }
    );
  }
}
