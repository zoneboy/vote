import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      // Delete session from database
      await deleteSession(sessionId);
    }

    // Delete cookie
    cookieStore.delete('session');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    );
  }
}
