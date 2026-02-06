# Deployment Guide

This guide covers deploying the voting platform to Netlify (or Vercel).

## Prerequisites

1. A Neon PostgreSQL database
2. A Gmail account with App Password (FREE!)
3. A Netlify or Vercel account
4. Your code in a Git repository (GitHub, GitLab, etc.)

## Step 1: Database Setup (Neon)

1. Go to [Neon](https://neon.tech) and create a free account
2. Create a new project
3. Copy your connection string (it looks like `postgresql://user:pass@host/db`)
4. Save this for the DATABASE_URL environment variable

## Step 2: Gmail App Password Setup

1. Enable 2-Step Verification on your Gmail:
   - Go to [myaccount.google.com](https://myaccount.google.com)
   - Security → 2-Step Verification → Enable it
2. Generate App Password:
   - Go to [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Other (Custom name)"
   - Name it "Voting Platform"
   - Copy the 16-character password (remove spaces)
3. Save for environment variables

**See GMAIL-SETUP.md for detailed instructions**

## Step 3: Deploy to Netlify

### Option A: Using Netlify UI

1. Go to [Netlify](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your Git repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Framework:** Next.js
5. Add environment variables (Settings → Environment variables):
   ```
   DATABASE_URL=postgresql://...
   NEXTAUTH_URL=https://your-site.netlify.app
   NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
   RESEND_API_KEY=re_...
   EMAIL_FROM=noreply@yourdomain.com
   NEXT_PUBLIC_APP_NAME=Awards 2025
   NEXT_PUBLIC_APP_URL=https://your-site.netlify.app
   ADMIN_EMAILS=admin@example.com
   ```
6. Click "Deploy site"

### Option B: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize project
netlify init

# Set environment variables
netlify env:set DATABASE_URL "postgresql://..."
netlify env:set NEXTAUTH_URL "https://your-site.netlify.app"
netlify env:set NEXTAUTH_SECRET "your-secret"
netlify env:set RESEND_API_KEY "re_..."
netlify env:set EMAIL_FROM "noreply@yourdomain.com"
netlify env:set NEXT_PUBLIC_APP_NAME "Awards 2025"
netlify env:set NEXT_PUBLIC_APP_URL "https://your-site.netlify.app"
netlify env:set ADMIN_EMAILS "admin@example.com"

# Deploy
netlify deploy --prod
```

## Step 4: Run Database Migrations

After deployment, run migrations:

```bash
# Using Netlify CLI
netlify env:import .env.local  # Import your local env
npm run db:migrate

# Or SSH into Netlify (if available)
# and run: npm run db:migrate
```

Alternatively, you can run migrations locally if your DATABASE_URL is accessible:

```bash
# Set DATABASE_URL in .env.local
npm run db:migrate
npm run db:seed  # Optional: Add sample data
```

## Step 5: Create Admin User

```bash
# Local with DATABASE_URL
npm run make-admin admin@example.com

# Or update directly in database
```

## Step 6: Configure Custom Domain (Optional)

1. In Netlify dashboard, go to Domain settings
2. Add custom domain
3. Update DNS records as instructed
4. Enable HTTPS (automatic)
5. Update NEXTAUTH_URL and NEXT_PUBLIC_APP_URL to use your domain

## Deploy to Vercel (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Or use: vercel env add
```

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Admin user created
- [ ] Email sending works (send test)
- [ ] Can sign in with email
- [ ] Can vote
- [ ] Admin dashboard accessible
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] Voting settings configured

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| NEXTAUTH_URL | Yes | Your site URL |
| NEXTAUTH_SECRET | Yes | Random secret (32+ chars) |
| RESEND_API_KEY | Yes | Resend API key |
| EMAIL_FROM | Yes | From email address |
| NEXT_PUBLIC_APP_NAME | No | App name (default: Awards 2025) |
| NEXT_PUBLIC_APP_URL | Yes | Public site URL |
| ADMIN_EMAILS | Yes | Comma-separated admin emails |

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require` for Neon
- Check if IP is whitelisted (Neon allows all by default)

### Email Not Sending
- Verify Resend API key is correct
- Check domain is verified in Resend
- Use resend.dev domain for testing

### Build Failures
- Check Node.js version (use 18+)
- Verify all dependencies in package.json
- Check build logs for specific errors

### Sessions Not Persisting
- Verify NEXTAUTH_URL matches your domain exactly
- Check browser cookies are enabled
- Ensure NEXTAUTH_SECRET is set

## Scaling Considerations

For production with high traffic:

1. **Database**: Upgrade Neon plan or use dedicated PostgreSQL
2. **Sessions**: Use Redis instead of in-memory storage
3. **Email**: Consider SendGrid or AWS SES for higher volume
4. **CDN**: Enable Netlify CDN or CloudFlare
5. **Monitoring**: Add Sentry for error tracking
6. **Analytics**: Add Google Analytics or Plausible

## Security Notes

- Never commit `.env.local` to Git
- Rotate NEXTAUTH_SECRET regularly
- Monitor admin access logs
- Enable rate limiting for production
- Use strong admin passwords
- Keep dependencies updated

## Support

For issues:
1. Check deployment logs
2. Review environment variables
3. Test database connection
4. Verify email configuration
5. Check browser console for errors
