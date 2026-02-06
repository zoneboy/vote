import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@votingapp.com';
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Awards Voting';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function sendMagicLink(email: string, token: string) {
  const magicLink = `${APP_URL}/verify?token=${token}&email=${encodeURIComponent(email)}`;

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Sign in to ${APP_NAME}`,
      html: getMagicLinkEmailHTML(magicLink),
      text: getMagicLinkEmailText(magicLink),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending magic link:', error);
    return { success: false, error };
  }
}

export async function sendOTP(email: string, otp: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your ${APP_NAME} verification code`,
      html: getOTPEmailHTML(otp),
      text: getOTPEmailText(otp),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP:', error);
    return { success: false, error };
  }
}

export async function sendVoteConfirmation(email: string, votes: number) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Vote confirmation - ${APP_NAME}`,
      html: getVoteConfirmationHTML(votes),
      text: getVoteConfirmationText(votes),
    });
    return { success: true };
  } catch (error) {
    console.error('Error sending confirmation:', error);
    return { success: false, error };
  }
}

// Email templates
function getMagicLinkEmailHTML(magicLink: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sign in to ${APP_NAME}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  
  <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #333;">Sign in to your account</h2>
    <p>Click the button below to sign in to ${APP_NAME}. This link will expire in 15 minutes.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${magicLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Sign In
      </a>
    </div>
    
    <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
    <p style="background: #f5f5f5; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 13px; color: #555;">
      ${magicLink}
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      If you didn't request this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `;
}

function getMagicLinkEmailText(magicLink: string): string {
  return `
Sign in to ${APP_NAME}

Click the link below to sign in (expires in 15 minutes):
${magicLink}

If you didn't request this email, you can safely ignore it.
  `;
}

function getOTPEmailHTML(otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your verification code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  
  <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #333;">Your verification code</h2>
    <p>Enter this code to complete your sign in:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px 40px; border-radius: 8px; font-size: 32px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">
        ${otp}
      </div>
    </div>
    
    <p style="color: #666; font-size: 14px; text-align: center;">This code expires in 15 minutes</p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      If you didn't request this code, you can safely ignore it.
    </p>
  </div>
</body>
</html>
  `;
}

function getOTPEmailText(otp: string): string {
  return `
Your ${APP_NAME} verification code

Enter this code to complete your sign in:
${otp}

This code expires in 15 minutes.

If you didn't request this code, you can safely ignore it.
  `;
}

function getVoteConfirmationHTML(votes: number): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vote Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">${APP_NAME}</h1>
  </div>
  
  <div style="background: white; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="margin-top: 0; color: #333;">✓ Your votes have been recorded</h2>
    <p>Thank you for participating in ${APP_NAME}!</p>
    
    <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #1e40af; font-weight: 600;">
        You voted in ${votes} ${votes === 1 ? 'category' : 'categories'}
      </p>
    </div>
    
    <p>Your votes are secure and have been counted. You can view the results once voting closes.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
        Return to ${APP_NAME}
      </a>
    </div>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="color: #999; font-size: 12px; margin: 0;">
      This is an automated confirmation. Please do not reply to this email.
    </p>
  </div>
</body>
</html>
  `;
}

function getVoteConfirmationText(votes: number): string {
  return `
${APP_NAME} - Vote Confirmation

Your votes have been recorded!

You voted in ${votes} ${votes === 1 ? 'category' : 'categories'}.

Your votes are secure and have been counted. You can view the results once voting closes.

Visit ${APP_URL}

This is an automated confirmation. Please do not reply to this email.
  `;
}
