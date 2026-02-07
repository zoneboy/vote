import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicToken, verifyOTP, authenticateUser, debugOTPStatus } from '@/lib/auth';
import { createSession, getSession, deleteSession } from '@/lib/db';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, otp, email } = body;

    console.log('[Verify] Request received:', { 
      hasToken: !!token, 
      hasOtp: !!otp, 
      email: email 
    });

    let verifiedEmail: string | undefined;

    // Verify magic token or OTP
    if (token) {
      console.log('[Verify] Attempting magic token verification');
      const result = verifyMagicToken(token);
      if (!result.valid) {
        console.log('[Verify] Magic token invalid or expired');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired verification link. Please request a new one.',
            errorCode: 'INVALID_TOKEN'
          },
          { status: 401 }
        );
      }
      verifiedEmail = result.email;
      console.log('[Verify] Magic token verified for:', verifiedEmail);
    } else if (otp && email) {
      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();
      const normalizedOtp = otp.trim();
      
      console.log('[Verify] Attempting OTP verification');
      console.log('[Verify] Email (normalized):', normalizedEmail);
      console.log('[Verify] OTP provided:', normalizedOtp);
      
      // Debug OTP status before verification
      debugOTPStatus(normalizedEmail);
      
      const valid = verifyOTP(normalizedEmail, normalizedOtp);
      
      if (!valid) {
        console.log('[Verify] OTP verification failed');
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid or expired verification code. Please request a new code.',
            errorCode: 'INVALID_OTP',
            details: 'The code you entered is incorrect or has expired. Codes expire after 15 minutes.'
          },
          { status: 401 }
        );
      }
      verifiedEmail = normalizedEmail;
      console.log('[Verify] OTP verified for:', verifiedEmail);
    } else {
      console.log('[Verify] Missing credentials');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing verification credentials',
          errorCode: 'MISSING_CREDENTIALS'
        },
        { status: 400 }
      );
    }

    // Check that verifiedEmail is defined before proceeding
    if (!verifiedEmail) {
      console.log('[Verify] Email verification failed - no email returned');
      return NextResponse.json(
        { 
          success: false, 
          error: 'Email verification failed',
          errorCode: 'VERIFICATION_FAILED'
        },
        { status: 401 }
      );
    }

    console.log('[Verify] Authenticating user:', verifiedEmail);

    // Authenticate user (create if doesn't exist)
    const user = await authenticateUser(verifiedEmail);
    console.log('[Verify] User authenticated:', user.id, user.email);

    // Create session in database
    const sessionId = nanoid(32);
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY);
    
    await createSession({
      id: sessionId,
      userId: user.id,
      email: user.email,
      expiresAt,
    });
    
    console.log('[Verify] Session created in database:', sessionId);
    console.log('[Verify] Session expires at:', expiresAt.toISOString());

    // Set cookie
    const cookieStore = await cookies();
    const url = new URL(request.url);
    const isProduction = url.hostname !== 'localhost';
    
    cookieStore.set('session', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });
    
    console.log('[Verify] Cookie set');
    console.log('[Verify] Success! User:', user.email, 'Admin:', user.isAdmin);

    // Return user info
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin,
      },
    });

    // Also set cookie on response
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: SESSION_EXPIRY / 1000,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Verify] Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Verification failed. Please try again.',
        errorCode: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;

    console.log('[Verify GET] Checking session:', sessionId ? sessionId.substring(0, 8) + '...' : 'missing');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get session from database
    const session = await getSession(sessionId);
    
    if (!session) {
      console.log('[Verify GET] Session not found or expired');
      return NextResponse.json(
        { success: false, error: 'Session expired' },
        { status: 401 }
      );
    }

    console.log('[Verify GET] Valid session for:', session.email);
    console.log('[Verify GET] Session expires at:', session.expiresAt.toISOString());

    return NextResponse.json({
      success: true,
      session: {
        userId: session.userId,
        email: session.email,
      },
    });
  } catch (error) {
    console.error('[Verify GET] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to verify session' },
      { status: 500 }
    );
  }
}
