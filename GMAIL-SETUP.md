# Gmail Setup Guide for Email Verification

This guide shows you how to use your Gmail account to send verification emails instead of Resend.

## Why Gmail?

✅ **Free** - No cost, uses your existing Gmail account  
✅ **Easy** - Just need your Gmail and an App Password  
✅ **Reliable** - Gmail's infrastructure handles delivery  
✅ **No Domain Required** - Works immediately without domain verification  

## Step-by-Step Setup

### Step 1: Enable 2-Step Verification (Required)

Gmail App Passwords only work if you have 2-Step Verification enabled.

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Click **Security** in the left sidebar
3. Under "How you sign in to Google," click **2-Step Verification**
4. Click **Get Started** and follow the prompts
5. Complete the setup with your phone number

### Step 2: Generate Gmail App Password

**Important:** This is NOT your regular Gmail password! App Passwords are special 16-character codes.

1. Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Or: Google Account → Security → 2-Step Verification → App passwords
2. You may need to sign in again
3. Under "Select app," choose **Mail**
4. Under "Select device," choose **Other (Custom name)**
5. Enter a name like "Voting Platform"
6. Click **Generate**
7. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)
8. **Save it** - you won't see it again!

### Step 3: Update Your Environment Variables

In your `.env.local` file, add:

```env
# Gmail Configuration
GMAIL_USER="yourname@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"  # Remove spaces from the 16-char password
```

**Full example:**
```env
# Database
DATABASE_URL="postgresql://user:pass@host/database?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret"

# Gmail (instead of Resend)
GMAIL_USER="yourname@gmail.com"
GMAIL_APP_PASSWORD="abcdefghijklmnop"

# Application
NEXT_PUBLIC_APP_NAME="Awards 2025"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_EMAILS="admin@example.com"
```

### Step 4: Update Your Code

The project now uses `lib/email-gmail.ts` instead of `lib/email.ts`.

Update the import in your API routes:

**In `/app/api/auth/login/route.ts`:**
```typescript
// Change this:
import { sendMagicLink, sendOTP } from '@/lib/email';

// To this:
import { sendMagicLink, sendOTP } from '@/lib/email-gmail';
```

Or simply rename the file:
```bash
mv lib/email-gmail.ts lib/email.ts
```

### Step 5: Test Email Sending

```bash
npm run dev
```

1. Go to `http://localhost:3000`
2. Click "Start Voting"
3. Enter your email address
4. Click "Send Verification Code"
5. Check your email - you should receive a 6-digit code!

## For Netlify Deployment

Add these environment variables in Netlify:

```bash
# Using Netlify CLI
netlify env:set GMAIL_USER "yourname@gmail.com"
netlify env:set GMAIL_APP_PASSWORD "your-16-char-password"

# Or in Netlify Dashboard:
# Site settings → Environment variables → Add a variable
```

**Complete Netlify Environment Variables:**
```
DATABASE_URL = postgresql://your-neon-connection
NEXTAUTH_URL = https://yoursite.netlify.app
NEXTAUTH_SECRET = your-random-secret
GMAIL_USER = yourname@gmail.com
GMAIL_APP_PASSWORD = your-16-char-password
NEXT_PUBLIC_APP_NAME = Awards 2025
NEXT_PUBLIC_APP_URL = https://yoursite.netlify.app
ADMIN_EMAILS = admin@example.com
```

## Troubleshooting

### "Invalid login" or "Username and Password not accepted"

**Solution:** Make sure you:
- Enabled 2-Step Verification first
- Used the **App Password**, not your regular Gmail password
- Removed all spaces from the 16-character App Password
- Used the correct Gmail address

### "Less secure app access"

This error doesn't apply to App Passwords. App Passwords work even with "Less secure apps" disabled.

### Emails going to spam

1. **Send from a professional address** - Use a Gmail that matches your domain if possible
2. **Ask users to whitelist** - Tell users to add your Gmail to contacts
3. **Keep sending volume reasonable** - Gmail has daily sending limits (~500/day for regular accounts)

### Gmail Daily Sending Limits

- **Free Gmail:** ~500 emails/day
- **Google Workspace:** 2,000 emails/day

For larger voting events, consider:
- Multiple Gmail accounts (rotate senders)
- Upgrade to Google Workspace
- Use a dedicated email service (SendGrid, Mailgun, etc.)

## Security Best Practices

1. **Never commit** `.env.local` to Git (already in `.gitignore`)
2. **Use environment variables** for all credentials
3. **Rotate App Passwords** periodically
4. **Revoke unused App Passwords** at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
5. **Monitor sending activity** in your Gmail Sent folder

## Alternative: Gmail with OAuth2 (Advanced)

For production systems with high volume, consider OAuth2 instead of App Passwords:
- More secure
- Higher sending limits
- Better monitoring
- Requires more setup

See `GMAIL-OAUTH.md` for advanced setup (optional).

## Comparison: Gmail vs. Resend

| Feature | Gmail (Free) | Resend |
|---------|--------------|---------|
| Cost | Free | Free tier, then paid |
| Setup Time | 5 minutes | 10 minutes |
| Daily Limit | ~500 emails | 100/day (free), then unlimited |
| Custom Domain | Optional | Required for production |
| Deliverability | Good | Excellent |
| Best For | Small/medium events | Large-scale production |

For most voting events with <500 participants, **Gmail is perfect**!

## Need Help?

Common issues:
- ✅ Forgot to enable 2-Step Verification → [Enable it here](https://myaccount.google.com/signinoptions/two-step-verification)
- ✅ Can't find App Passwords → Must enable 2-Step Verification first
- ✅ Wrong password format → Remove ALL spaces from the 16-char password
- ✅ Still not working → Try generating a new App Password

---

**Quick Reference:**

1. Enable 2-Step Verification: [myaccount.google.com/signinoptions/two-step-verification](https://myaccount.google.com/signinoptions/two-step-verification)
2. Generate App Password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add to `.env.local`:
   ```
   GMAIL_USER="your@gmail.com"
   GMAIL_APP_PASSWORD="16charpassword"
   ```
4. Test it!
