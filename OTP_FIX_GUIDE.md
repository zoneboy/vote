# OTP Verification 401 Error - Fix Guide

## Problem
Users are getting a 401 Unauthorized error when trying to verify their OTP code.

## Root Causes

1. **Email normalization mismatch** - Email stored differently than verified
2. **OTP expiration** - Code expires after 15 minutes
3. **OTP not being stored** - Email sending succeeds but OTP not saved
4. **Case sensitivity** - Email case differences between storage and verification

## Solution

Replace these 4 files with improved versions that include:
- ✅ Consistent email normalization (lowercase + trim)
- ✅ Detailed logging for debugging
- ✅ Better error messages for users
- ✅ OTP debug function
- ✅ Improved error handling

## Files to Update

### 1. `lib/auth.ts` (CRITICAL)
**Replace with:** `auth-improved.ts`
**Location:** `lib/auth.ts`

**Key improvements:**
- Normalizes email to lowercase + trim everywhere
- Adds detailed console logging
- Includes `debugOTPStatus()` function
- Better error messages

### 2. `app/api/auth/login/route.ts`
**Replace with:** `login-route-improved.ts`
**Location:** `app/api/auth/login/route.ts`

**Key improvements:**
- Normalizes email before generating OTP
- Logs all steps
- Better error messages

### 3. `app/api/auth/verify/route.ts`
**Replace with:** `verify-route-improved.ts`
**Location:** `app/api/auth/verify/route.ts`

**Key improvements:**
- Normalizes email and OTP before verification
- Calls debugOTPStatus() to help troubleshoot
- Detailed error messages with error codes
- Comprehensive logging

### 4. `components/voting/LoginForm.tsx`
**Replace with:** `LoginForm-fixed.tsx`
**Location:** `components/voting/LoginForm.tsx`

**Key improvements:**
- Normalizes email before sending
- Better error display
- "Resend Code" button
- Helpful error hints

## Quick Installation

```bash
# Update auth library (MOST IMPORTANT)
cp auth-improved.ts lib/auth.ts

# Update API routes
cp login-route-improved.ts app/api/auth/login/route.ts
cp verify-route-improved.ts app/api/auth/verify/route.ts

# Update component
cp LoginForm-fixed.tsx components/voting/LoginForm.tsx

# Deploy
git add .
git commit -m "fix: OTP verification 401 error with email normalization"
git push
```

## What Changed

### Email Normalization
**Before:**
```typescript
// Login: stores "User@Example.com"
otpCodes.set(email, { code: "123456" });

// Verify: looks for "user@example.com"
otpCodes.get(email); // ❌ Not found!
```

**After:**
```typescript
// Login: normalizes to "user@example.com"
const normalized = email.toLowerCase().trim();
otpCodes.set(normalized, { code: "123456" });

// Verify: normalizes to "user@example.com"
const normalized = email.toLowerCase().trim();
otpCodes.get(normalized); // ✅ Found!
```

### Logging Added

Now you'll see detailed logs in your server console:

```
[Login] Request received: { email: 'user@example.com', method: 'otp' }
[Login] Normalized email: user@example.com
[OTP Generated] Email: user@example.com, Code: 123456, Expires: 2024-12-...
[Login] OTP sent successfully to: user@example.com

[Verify] Request received: { hasToken: false, hasOtp: true, email: 'user@example.com' }
[Verify] Attempting OTP verification
[Verify] Email (normalized): user@example.com
[Verify] OTP provided: 123456
=== OTP DEBUG ===
Email (normalized): user@example.com
OTP exists: true
Stored code: 123456
Expires at: 2024-12-...
Is expired: false
Time remaining: 847 seconds
All stored emails: [ 'user@example.com' ]
================
[OTP Verify] Success for email: user@example.com
[Verify] User authenticated: xxx-user-id user@example.com
[Verify] Session created: xxx-session-id
[Verify] Success! User: user@example.com Admin: false
```

## Testing the Fix

### Test Case 1: Normal Login
1. Enter email: `User@Example.Com`
2. Receive OTP code
3. Enter the 6-digit code
4. **Expected:** ✅ Login successful

### Test Case 2: Different Email Cases
1. Login with: `TEST@GMAIL.COM`
2. Get OTP code
3. Server normalizes to: `test@gmail.com`
4. Enter code
5. **Expected:** ✅ Login successful

### Test Case 3: Spaces in Email
1. Enter: ` user@example.com ` (with spaces)
2. Get OTP
3. Server trims and normalizes
4. Enter code
5. **Expected:** ✅ Login successful

### Test Case 4: Expired OTP
1. Request OTP
2. Wait 16 minutes
3. Try to verify
4. **Expected:** ❌ "Invalid or expired verification code" with helpful message

## Debugging Production Issues

If users still have issues after this fix, check the server logs for:

```bash
# Netlify logs
netlify logs

# Or check Functions logs in Netlify dashboard
```

Look for:
- `[OTP Generated]` - Was OTP created?
- `[OTP Verify]` - What email was used?
- `=== OTP DEBUG ===` - Does OTP exist for that email?

## Common Issues After Fix

### Issue: Still getting 401
**Check:**
1. Did you update `lib/auth.ts`? (Most important!)
2. Did you restart the server?
3. Are you using the same email in both steps?
4. Check server logs for `[OTP DEBUG]` output

### Issue: Code expired
**Solution:**
- OTPs expire after 15 minutes
- Use the "Resend Code" button
- Check email delivery speed

### Issue: Code not received
**Solution:**
- Check spam folder
- Verify Gmail App Password is set correctly
- Check server logs for email sending errors

## Error Messages Users Will See

### Before Fix
```
Invalid or expired verification code
```

### After Fix
```
Invalid or expired verification code. Please request a new code.
The code you entered is incorrect or has expired. Codes expire after 15 minutes.
```

Plus a "Resend Code" button for easy retry!

## Production Deployment

```bash
# 1. Test locally first
npm run dev
# Test login flow

# 2. Commit changes
git add lib/auth.ts
git add app/api/auth/login/route.ts
git add app/api/auth/verify/route.ts
git add components/voting/LoginForm.tsx
git commit -m "fix: OTP verification with email normalization and better logging"

# 3. Push to production
git push

# 4. Monitor Netlify logs for OTP debug output
# Look for successful verifications
```

## Verification Checklist

After deploying, test:
- [ ] Login with lowercase email works
- [ ] Login with UPPERCASE email works
- [ ] Login with Mixed Case email works
- [ ] Login with spaces in email works
- [ ] Error messages are helpful
- [ ] "Resend Code" button works
- [ ] Expired codes show proper message
- [ ] Server logs show OTP debug info

## Why This Happened

The original code didn't normalize emails consistently:
1. User enters: `John@Example.Com`
2. Login stores OTP for: `John@Example.Com`
3. Verify looks for: `john@example.com`
4. Mismatch = 401 error

The fix ensures all emails are normalized to lowercase + trimmed at every step.

## Need More Help?

Check the server logs for this pattern:

```
=== OTP DEBUG ===
Email (normalized): [email here]
OTP exists: false  ← This means OTP not found
All stored emails: [ 'different@email.com' ]  ← Shows what's actually stored
```

This will tell you exactly what's happening!
