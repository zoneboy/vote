import { NextRequest, NextResponse } from 'next/server';
import { getAllResults, getSettings, getSession, getUserById } from '@/lib/db';
import { cookies } from 'next/headers';
import type { VoteResult } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if results are public
    const settings = await getSettings();
    
    // Check if user is admin
    let isAdmin = false;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    
    if (sessionId) {
      const session = await getSession(sessionId);
      if (session) {
        const user = await getUserById(session.userId);
        isAdmin = user?.isAdmin || false;
      }
    }
    
    // Allow access if results are public OR user is admin
    if (!settings.resultsPublic && !isAdmin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Results are not public yet. Please check back after voting closes.' 
        },
        { status: 403 }
      );
    }

    // Get all results
    const rawResults = await getAllResults();
    
    // Group by category
    const categoryMap = new Map<string, VoteResult>();
    
    rawResults.forEach((row) => {
      if (!categoryMap.has(row.categoryId)) {
        categoryMap.set(row.categoryId, {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          nominees: [],
          totalVotes: 0,
        });
      }
      
      const category = categoryMap.get(row.categoryId)!;
      const voteCount = parseInt(row.voteCount);
      
      category.nominees.push({
        nomineeId: row.nomineeId,
        nomineeName: row.nomineeName,
        voteCount,
        percentage: 0, // Will calculate after
      });
      
      category.totalVotes += voteCount;
    });
    
    // Calculate percentages
    const results: VoteResult[] = Array.from(categoryMap.values()).map((category) => ({
      ...category,
      nominees: category.nominees
        .map((nominee) => ({
          ...nominee,
          percentage: category.totalVotes > 0 
            ? Math.round((nominee.voteCount / category.totalVotes) * 100)
            : 0,
        }))
        .sort((a, b) => b.voteCount - a.voteCount), // Sort by vote count descending
    }));

    return NextResponse.json({
      success: true,
      data: results,
      isAdmin, // Include admin status in response
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}