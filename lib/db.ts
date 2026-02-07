// ============================================================================
// SECURITY FIX: Vote Manipulation Prevention
// ============================================================================
// Issue: Original code allowed vote changes via ON CONFLICT DO UPDATE
// Fix: Reject duplicate votes entirely - votes are truly final
// ============================================================================

import postgres from 'postgres';
import type { Vote } from '@/types';

const sql = postgres(process.env.DATABASE_URL!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

/**
 * Cast a vote - FINAL and IMMUTABLE
 * Throws error if user has already voted in this category
 */
export async function castVote(data: {
  userId: string;
  categoryId: string;
  nomineeId: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<Vote> {
  // SECURITY: Check if already voted BEFORE attempting insert
  const existing = await hasUserVotedInCategory(data.userId, data.categoryId);
  if (existing) {
    throw new Error('You have already voted in this category. Votes are final and cannot be changed.');
  }

  // SECURITY: Use INSERT-only with NO UPDATE clause
  // This prevents any vote manipulation even if check is bypassed
  try {
    const [vote] = await sql<Vote[]>`
      INSERT INTO votes (user_id, category_id, nominee_id, ip_address, user_agent)
      VALUES (${data.userId}, ${data.categoryId}, ${data.nomineeId}, 
              ${data.ipAddress || null}, ${data.userAgent || null})
      RETURNING id, user_id as "userId", category_id as "categoryId", 
                nominee_id as "nomineeId", ip_address as "ipAddress",
                user_agent as "userAgent", voted_at as "votedAt"
    `;
    
    return vote as Vote;
  } catch (error: any) {
    // Catch unique constraint violation
    if (error.code === '23505') { // PostgreSQL unique violation
      throw new Error('Vote already recorded for this category');
    }
    throw error;
  }
}

/**
 * Check if user has voted in a specific category
 */
export async function hasUserVotedInCategory(
  userId: string,
  categoryId: string
): Promise<boolean> {
  const [result] = await sql<{ count: string }[]>`
    SELECT COUNT(*) as count
    FROM votes
    WHERE user_id = ${userId} AND category_id = ${categoryId}
  `;
  return parseInt(result.count) > 0;
}

/**
 * Get all votes for a user (for verification/audit)
 */
export async function getUserVotes(userId: string): Promise<Vote[]> {
  const votes = await sql<Vote[]>`
    SELECT id, user_id as "userId", category_id as "categoryId",
           nominee_id as "nomineeId", ip_address as "ipAddress",
           user_agent as "userAgent", voted_at as "votedAt"
    FROM votes
    WHERE user_id = ${userId}
    ORDER BY voted_at DESC
  `;
  return votes;
}

/**
 * ADMIN ONLY: Delete a specific vote (for corrections/disputes)
 * Should be logged and require admin authentication
 */
export async function deleteVote(voteId: string, adminUserId: string): Promise<boolean> {
  // TODO: Add audit logging
  console.log(`[AUDIT] Admin ${adminUserId} deleting vote ${voteId}`);
  
  const result = await sql`
    DELETE FROM votes 
    WHERE id = ${voteId}
  `;
  
  return result.count > 0;
}

export default sql;
