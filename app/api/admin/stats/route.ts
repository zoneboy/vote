import { NextRequest, NextResponse } from 'next/server';
import { getAdminStats, getSettings } from '@/lib/db';
import { requireAdmin } from '../middleware';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const stats = await getAdminStats();
    const settings = await getSettings();

    let votingStatus: 'open' | 'closed' | 'upcoming' = 'closed';
    if (settings.votingOpen) {
      const now = new Date();
      if (settings.votingStartDate && now < settings.votingStartDate) {
        votingStatus = 'upcoming';
      } else if (!settings.votingEndDate || now <= settings.votingEndDate) {
        votingStatus = 'open';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...stats,
        votingStatus,
        settings,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
