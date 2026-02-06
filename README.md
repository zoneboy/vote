# Awards Voting Platform

A modern, secure voting website built with Next.js, designed for awards programs with email-only authentication and comprehensive admin controls.

## Features

### User Features
- ✉️ Email-only authentication (magic link or OTP)
- 🗳️ One vote per email per category
- 📱 Mobile-first, responsive design
- ⚡ Fast, low-bandwidth optimized
- ✅ Vote confirmation and receipts
- 📊 Public results (when enabled)

### Admin Features
- 🔐 Secure admin dashboard
- 📝 Create/edit/delete categories and nominees
- 📈 Real-time vote counts
- 📥 Export results as CSV
- 🎚️ Control voting periods
- 👁️ Toggle public results visibility
- 🛡️ Fraud detection dashboard

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **Authentication**: Email magic links (NextAuth.js)
- **Styling**: Tailwind CSS
- **Hosting**: Netlify/Vercel
- **Email**: Resend/SendGrid

## Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Nominees table
CREATE TABLE nominees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  nominee_id UUID REFERENCES nominees(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category_id)
);

-- Settings table
CREATE TABLE settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_votes_user_category ON votes(user_id, category_id);
CREATE INDEX idx_votes_category ON votes(category_id);
CREATE INDEX idx_nominees_category ON nominees(category_id);
CREATE INDEX idx_votes_ip ON votes(ip_address);
```

## Project Structure

```
voting-platform/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── verify/
│   ├── (voting)/
│   │   ├── vote/
│   │   ├── confirmation/
│   │   └── results/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── categories/
│   │   ├── nominees/
│   │   └── settings/
│   ├── api/
│   │   ├── auth/
│   │   ├── vote/
│   │   ├── categories/
│   │   ├── nominees/
│   │   └── admin/
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── voting/
│   ├── admin/
│   └── layout/
├── lib/
│   ├── db.ts
│   ├── auth.ts
│   ├── email.ts
│   └── utils.ts
├── types/
│   └── index.ts
└── public/
    └── images/
```

## Setup Instructions

### 1. Prerequisites
- Node.js 18+
- PostgreSQL database (Neon account recommended)
- Gmail account with App Password (see GMAIL-SETUP.md)

### 2. Clone and Install
```bash
npm install
```

### 3. Environment Variables
Create a `.env.local` file:

```env
# Database
DATABASE_URL="postgresql://user:password@host/database"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-random-secret-here"

# Gmail (for sending verification emails)
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-16-char-app-password"

# Admin
ADMIN_EMAILS="admin@example.com,admin2@example.com"

# App
NEXT_PUBLIC_APP_NAME="Awards 2025"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### 4. Database Setup
```bash
# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000`

### 6. Create First Admin
```bash
npm run make-admin your@email.com
```

## Deployment

### Netlify
1. Connect your GitHub repository
2. Build command: `npm run build`
3. Publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Vercel
```bash
vercel --prod
```

## Security Features

1. **Email Verification**: Magic links expire after 15 minutes
2. **Rate Limiting**: Max 5 login attempts per hour per email
3. **IP Tracking**: Logs IP addresses for fraud detection
4. **CSRF Protection**: Built-in with NextAuth
5. **SQL Injection Prevention**: Parameterized queries
6. **One Vote Rule**: Database constraints + server validation
7. **Bot Protection**: User agent tracking, honeypot fields

## Admin Quick Guide

### Opening Voting
1. Login to `/admin/dashboard`
2. Go to Settings
3. Set "Voting Open" to Yes
4. Set start/end dates

### Adding Categories
1. Admin → Categories → Add New
2. Enter name and description
3. Set display order

### Adding Nominees
1. Admin → Nominees → Add New
2. Select category
3. Upload image (optional)
4. Enter details

### Viewing Results
1. Admin → Dashboard
2. See real-time vote counts
3. Export CSV for analysis

### Closing Voting
1. Admin → Settings
2. Set "Voting Open" to No

## API Endpoints

### Public
- `POST /api/auth/login` - Request magic link
- `POST /api/auth/verify` - Verify OTP/token
- `GET /api/categories` - Get all categories
- `GET /api/nominees/:categoryId` - Get nominees
- `POST /api/vote` - Submit vote
- `GET /api/results` - Get public results (if enabled)

### Admin (requires authentication)
- `GET /api/admin/stats` - Dashboard statistics
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `POST /api/admin/nominees` - Create nominee
- `PUT /api/admin/nominees/:id` - Update nominee
- `DELETE /api/admin/nominees/:id` - Delete nominee
- `GET /api/admin/votes` - Export votes
- `PUT /api/admin/settings` - Update settings

## Nigerian Optimization

- Optimized bundle size (<100KB initial load)
- Image optimization with WebP fallbacks
- Lazy loading for images
- Minimal JavaScript
- Works on 2G networks
- Progressive enhancement
- Offline-first approach

## Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript checks
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed initial data
npm run make-admin   # Make user admin
```

## Support

For issues or questions, contact the development team or create an issue in the repository.

## License

MIT License - see LICENSE file for details
