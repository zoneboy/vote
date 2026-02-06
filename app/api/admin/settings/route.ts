import { NextRequest, NextResponse } from 'next/server';
import { getSettings, setSetting } from '@/lib/db';
import { requireAdmin } from '../middleware';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

// GET settings
export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const settings = await getSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT update settings
export async function PUT(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck instanceof NextResponse) {
    return authCheck;
  }

  try {
    const body = await request.json();
    const {
      votingOpen,
      votingStartDate,
      votingEndDate,
      resultsPublic,
      maintenanceMode,
      maxVotesPerIp,
    } = body;

    // Update each setting
    if (votingOpen !== undefined) {
      await setSetting('voting_open', votingOpen.toString());
    }
    
    if (votingStartDate !== undefined) {
      await setSetting('voting_start_date', votingStartDate || '');
    }
    
    if (votingEndDate !== undefined) {
      await setSetting('voting_end_date', votingEndDate || '');
    }
    
    if (resultsPublic !== undefined) {
      await setSetting('results_public', resultsPublic.toString());
    }
    
    if (maintenanceMode !== undefined) {
      await setSetting('maintenance_mode', maintenanceMode.toString());
    }
    
    if (maxVotesPerIp !== undefined) {
      await setSetting('max_votes_per_ip', maxVotesPerIp?.toString() || '');
    }

    // Return updated settings
    const settings = await getSettings();
    return NextResponse.json({
      success: true,
      data: settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
