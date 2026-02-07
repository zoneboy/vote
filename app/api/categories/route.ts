import { NextRequest, NextResponse } from 'next/server';
import { getAllCategories, getNomineesByCategory, getUserVotes, getSession } from '@/lib/db';
import { cookies } from 'next/headers';
import { sessions } from '../auth/verify/route';
// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get categories
    const categories = await getAllCategories();

    // Get user session to check votes
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    let userId: string | null = null;

    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        userId = session.userId;
      }
    }

    // Get nominees for each category
    const categoriesWithNominees = await Promise.all(
      categories.map(async (category) => {
        const nominees = await getNomineesByCategory(category.id);

        // Get user's vote for this category if logged in
        let userVote: string | undefined;
        if (userId) {
          const votes = await getUserVotes(userId);
          const vote = votes.find((v) => v.categoryId === category.id);
          if (vote) {
            userVote = vote.nomineeId;
          }
        }

        return {
          ...category,
          nominees,
          userVote,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: categoriesWithNominees,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
