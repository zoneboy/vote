# Complete Deployment Fix Guide

## All Files That Need to be Updated

### 1. Root Files

#### `next.config.js`
Replace entire file with:
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
    formats: ['image/webp'],
  },
  compress: true,
  poweredByHeader: false,
  output: 'standalone',
};

module.exports = nextConfig;
```
**Changes**: Removed `experimental.optimizeCss` which requires the critters package

---

### 2. Styles

#### `styles/globals.css`
**Line 11** - Remove this block:
```css
  * {
    @apply border-border;
  }
```

**After fix, the @layer base section should look like**:
```css
@layer base {
  :root {
    --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  }

  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }

  html {
    scroll-behavior: smooth;
  }
}
```

---

### 3. App Layout

#### `app/layout.tsx`
Update the imports and add viewport export:
```typescript
import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Awards 2025 - Voting Platform',
  description: 'Cast your votes for the best of the year',
};

// ADD THIS - fixes viewport warning
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
```
**Changes**: 
- Import `Viewport` type
- Remove viewport from metadata
- Export separate `viewport` const

---

### 4. Database Layer

#### `lib/db.ts`
Add type annotations to all SQL queries. Key changes:

```typescript
// Example changes (apply to ALL database functions):

export async function createUser(email: string): Promise<User> {
  const [user] = await sql<User[]>`  // ADD <User[]>
    INSERT INTO users (email, is_admin, created_at)
    VALUES (${email}, false, NOW())
    ON CONFLICT (email) DO UPDATE
    SET last_login = NOW()
    RETURNING id, email, is_admin as "isAdmin", created_at as "createdAt", last_login as "lastLogin"
  `;
  return user as User;  // ADD: as User
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await sql<User[]>`  // ADD <User[]>
    SELECT id, email, is_admin as "isAdmin", created_at as "createdAt", last_login as "lastLogin"
    FROM users
    WHERE email = ${email}
  `;
  return user || null;
}
```

**Apply this pattern to ALL functions**:
- `getAllCategories()` → `sql<Category[]>`
- `getNomineesByCategory()` → `sql<Nominee[]>`
- `getUserVotes()` → `sql<Vote[]>`
- `getAdminStats()` → Add proper typing for the stats object
- All COUNT queries → `sql<{ count: string }[]>`

---

### 5. API Routes - Add Dynamic Export

#### `app/api/auth/verify/route.ts`
Add these lines near the top (after imports, before functions):
```typescript
// Export sessions so other routes can use it
export const sessions = new Map<string, { userId: string; email: string; expiresAt: number }>();

const SESSION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

// ADD THIS LINE - marks route as dynamic
export const dynamic = 'force-dynamic';
```

Also add null check for verifiedEmail (around line 43):
```typescript
    // Check that verifiedEmail is defined before proceeding
    if (!verifiedEmail) {
      return NextResponse.json(
        { success: false, error: 'Email verification failed' },
        { status: 401 }
      );
    }

    // Authenticate user (create if doesn't exist)
    const user = await authenticateUser(verifiedEmail);
```

#### `app/api/categories/route.ts`
Add at the top after imports:
```typescript
// Mark this route as dynamic
export const dynamic = 'force-dynamic';
```

#### `app/api/vote/route.ts`
Add at the top after imports:
```typescript
// Mark route as dynamic
export const dynamic = 'force-dynamic';
```

#### `app/api/admin/stats/route.ts`
Add at the top after imports:
```typescript
// Mark route as dynamic
export const dynamic = 'force-dynamic';
```

---

## Quick Command to Apply All Fixes

```bash
# 1. Update next.config.js
# Copy the new version from above

# 2. Fix globals.css
# Remove the border-border block

# 3. Update app/layout.tsx
# Add viewport export as shown

# 4. Update lib/db.ts
# Add type annotations to all SQL queries

# 5. Add dynamic export to ALL these files:
#    - app/api/auth/verify/route.ts (also add null check and export sessions)
#    - app/api/categories/route.ts
#    - app/api/vote/route.ts
#    - app/api/admin/stats/route.ts

# 6. Commit everything
git add .
git commit -m "Fix: Complete deployment issues - types, dynamic routes, CSS, viewport"
git push
```

---

## Summary of All Issues Fixed

1. ✅ **CSS Error**: Removed undefined `border-border` class from globals.css
2. ✅ **TypeScript Type Errors**: Added generic type parameters to all postgres SQL queries
3. ✅ **Null Check**: Added validation for `verifiedEmail` before use
4. ✅ **Dynamic Routes**: Marked all API routes that use cookies as `force-dynamic`
5. ✅ **Critters Error**: Removed `experimental.optimizeCss` from next.config.js
6. ✅ **Viewport Warning**: Separated viewport config into its own export
7. ✅ **Session Export**: Made sessions exportable from verify route for other routes to use

---

## Expected Result

After these changes, your build should complete successfully with:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
✓ Finalizing page optimization
```

Then Netlify will deploy your site! 🎉
