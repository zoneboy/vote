import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, getUserById } from '@/lib/db';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get session from database
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    // Get full user info from database
    const user = await getUserById(session.userId);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
