import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '../middleware';
import sql from '@/lib/db';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// GET all votes for export
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    // Get all votes with user, category, and nominee information
    const votes = await sql<Array<{
      voteId: string;
      email: string;
      categoryName: string;
      nomineeName: string;
      votedAt: string;
      ipAddress: string;
    }>>`
      SELECT 
        v.id as "voteId",
        u.email,
        c.name as "categoryName",
        n.name as "nomineeName",
        v.voted_at as "votedAt",
        v.ip_address as "ipAddress"
      FROM votes v
      JOIN users u ON u.id = v.user_id
      JOIN categories c ON c.id = v.category_id
      JOIN nominees n ON n.id = v.nominee_id
      ORDER BY v.voted_at DESC
    `;

    // Format for CSV export
    const csvData = votes.map(vote => ({
      'Vote ID': vote.voteId,
      'Email': vote.email,
      'Category': vote.categoryName,
      'Nominee': vote.nomineeName,
      'Voted At': new Date(vote.votedAt).toLocaleString(),
      'IP Address': vote.ipAddress || 'N/A',
    }));

    return NextResponse.json({
      success: true,
      data: csvData,
      count: votes.length,
    });
  } catch (error) {
    console.error('Export votes error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export votes' },
      { status: 500 }
    );
  }
}
