import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken, verifyOTP, authenticateUser } from '@/lib/auth';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

// Session storage (use Redis in production)
const sessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, otp, email } = body;

    let verifiedEmail: string | undefined;

    // Verify magic token or OTP
    if (token) {
      const result = verifyMagicToken(token);
      if (!result.valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired token' },
          { status: 401 }
        );
      }
      verifiedEmail = result.email;
    } else if (otp && email) {
      const valid = verifyOTP(email, otp);
      if (!valid) {
        return NextResponse.json(
          { success: false, error: 'Invalid or expired verification code' },
          { status: 401 }
        );
      }
      verifiedEmail = email;
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing verification credentials' },
        { status: 400 }
      );
    }

    // Authenticate user (create if doesn't exist)
    const user = await authenticateUser(verifiedEmail);

    // Create session
    const sessionId = nanoid(32);
    sessions.set(sessionId, {
      userId: user.id,
      email: user.email,
      expiresAt: Date.now() + SESSION_EXPIRY,
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}

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

    const session = sessions.get(sessionId);
    if (!session || Date.now() > session.expiresAt) {
      sessions.delete(sessionId);
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        email: session.email,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}

// Export sessions for use in other routes
export { sessions };
