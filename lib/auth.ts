import { nanoid } from 'nanoid';
import { getUserByEmail, createUser } from './db';

// Token storage (use Redis in production)
const tokens = new Map<
  string,
  { email: string; expiresAt: number; type: 'magic' | 'otp' }
>();

const otpCodes = new Map<string, { code: string; expiresAt: number }>();

// Rate limiting (use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

const TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_ATTEMPTS = 5;

export function generateMagicToken(email: string): string {
  const token = nanoid(32);
  tokens.set(token, {
    email,
    expiresAt: Date.now() + TOKEN_EXPIRY,
    type: 'magic',
  });

  // Clean up expired tokens
  cleanupExpiredTokens();

  return token;
}

export function generateOTP(email: string): string {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpCodes.set(email, {
    code: otp,
    expiresAt: Date.now() + TOKEN_EXPIRY,
  });

  // Clean up expired OTPs
  cleanupExpiredOTPs();

  return otp;
}

export function verifyMagicToken(token: string): { valid: boolean; email?: string } {
  const data = tokens.get(token);

  if (!data) {
    return { valid: false };
  }

  if (Date.now() > data.expiresAt) {
    tokens.delete(token);
    return { valid: false };
  }

  // Token is valid, delete it (one-time use)
  tokens.delete(token);
  return { valid: true, email: data.email };
}

export function verifyOTP(email: string, code: string): boolean {
  const data = otpCodes.get(email);

  if (!data) {
    return false;
  }

  if (Date.now() > data.expiresAt) {
    otpCodes.delete(email);
    return false;
  }

  if (data.code !== code) {
    return false;
  }

  // OTP is valid, delete it (one-time use)
  otpCodes.delete(email);
  return true;
}

export function checkRateLimit(email: string): {
  allowed: boolean;
  remaining?: number;
  resetAt?: number;
} {
  const now = Date.now();
  const limit = rateLimits.get(email);

  if (!limit || now > limit.resetAt) {
    // First attempt or window expired
    rateLimits.set(email, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1 };
  }

  if (limit.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: limit.resetAt,
    };
  }

  // Increment count
  limit.count++;
  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - limit.count,
    resetAt: limit.resetAt,
  };
}

export function cleanupExpiredTokens() {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (now > data.expiresAt) {
      tokens.delete(token);
    }
  }
}

export function cleanupExpiredOTPs() {
  const now = Date.now();
  for (const [email, data] of otpCodes.entries()) {
    if (now > data.expiresAt) {
      otpCodes.delete(email);
    }
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export async function authenticateUser(email: string) {
  let user = await getUserByEmail(email);

  if (!user) {
    user = await createUser(email);
  }

  return user;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export function getUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'unknown';
}

// Clean admin emails from environment
export function getAdminEmails(): string[] {
  const emails = process.env.ADMIN_EMAILS || '';
  return emails.split(',').map(e => e.trim()).filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const adminEmails = getAdminEmails();
  return adminEmails.includes(email.toLowerCase());
}
