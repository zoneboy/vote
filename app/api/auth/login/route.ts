import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, checkRateLimit, generateMagicToken, generateOTP } from '@/lib/auth';
import { sendMagicLink, sendOTP } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, method = 'magic' } = body;

    console.log('[Login] Request received:', { email, method });

    // Validate email
    if (!email || !isValidEmail(email)) {
      console.log('[Login] Invalid email:', email);
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    console.log('[Login] Normalized email:', normalizedEmail);

    // Check rate limit
    const rateLimit = checkRateLimit(normalizedEmail);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil((rateLimit.resetAt! - Date.now()) / (1000 * 60));
      console.log('[Login] Rate limited:', normalizedEmail, 'Reset in:', resetMinutes, 'minutes');
      return NextResponse.json(
        {
          success: false,
          error: `Too many attempts. Please try again in ${resetMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // Generate and send verification
    if (method === 'otp') {
      const otp = generateOTP(normalizedEmail);
      console.log('[Login] OTP generated for:', normalizedEmail);
      
      const result = await sendOTP(normalizedEmail, otp);

      if (!result.success) {
        console.error('[Login] Failed to send OTP:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to send verification code. Please try again.' },
          { status: 500 }
        );
      }

      console.log('[Login] OTP sent successfully to:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        method: 'otp',
      });
    } else {
      const token = generateMagicToken(normalizedEmail);
      console.log('[Login] Magic token generated for:', normalizedEmail);
      
      const result = await sendMagicLink(normalizedEmail, token);

      if (!result.success) {
        console.error('[Login] Failed to send magic link:', result.error);
        return NextResponse.json(
          { success: false, error: 'Failed to send magic link. Please try again.' },
          { status: 500 }
        );
      }

      console.log('[Login] Magic link sent successfully to:', normalizedEmail);
      return NextResponse.json({
        success: true,
        message: 'Magic link sent to your email',
        method: 'magic',
      });
    }
  } catch (error) {
    console.error('[Login] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
