import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/db';
import { getUserById } from '@/lib/db';

export async function requireAdmin(request: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;

  if (!sessionId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required' },
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

  // Check if user is admin
  const user = await getUserById(session.userId);
  if (!user || !user.isAdmin) {
    return NextResponse.json(
      { success: false, error: 'Admin access required' },
      { status: 403 }
    );
  }

  return { user, session };
}
