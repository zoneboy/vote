import { NextRequest, NextResponse } from 'next/server';
import { getAllResults, getSettings } from '@/lib/db';
import type { VoteResult } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if results are public
    const settings = await getSettings();
    
    if (!settings.resultsPublic) {
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
    });
  } catch (error) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
