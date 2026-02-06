import { NextRequest, NextResponse } from 'next/server';
import { isValidEmail, checkRateLimit, generateMagicToken, generateOTP } from '@/lib/auth';
import { sendMagicLink, sendOTP } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, method = 'magic' } = await request.json();

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(email);
    if (!rateLimit.allowed) {
      const resetMinutes = Math.ceil((rateLimit.resetAt! - Date.now()) / (1000 * 60));
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
      const otp = generateOTP(email);
      const result = await sendOTP(email, otp);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Failed to send verification code' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Verification code sent to your email',
        method: 'otp',
      });
    } else {
      const token = generateMagicToken(email);
      const result = await sendMagicLink(email, token);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: 'Failed to send magic link' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Magic link sent to your email',
        method: 'magic',
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
