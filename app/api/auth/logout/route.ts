import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { sessions } from '../verify/route';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    if (sessionId) {
      sessions.delete(sessionId);
    }

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
