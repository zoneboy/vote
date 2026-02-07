# Fix Session Expiry Issue - Complete Guide

## Problem

**Error**: "Session expired. Please sign in again." when trying to vote  
**Cause**: Serverless functions don't share memory, so in-memory sessions are lost between API calls

## Solution

Store sessions in the **database** instead of memory so they persist across serverless function instances.

---

## Installation Steps

### Step 1: Add Sessions Table to Database

Run this SQL in your Neon database:

```sql
-- Add sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(32) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

**How to run this**:
1. Go to your Neon dashboard
2. Open the SQL Editor
3. Paste the SQL above
4. Click "Run"

---

### Step 2: Update lib/db.ts

Add these session functions to `lib/db.ts` (at the end of the file, before `export default sql;`):

```typescript
// Session operations
export async function createSession(data: {
  id: string;
  userId: string;
  email: string;
  expiresAt: Date;
}) {
  await sql`
    INSERT INTO sessions (id, user_id, email, expires_at)
    VALUES (${data.id}, ${data.userId}, ${data.email}, ${data.expiresAt})
  `;
}

export async function getSession(sessionId: string) {
  const [session] = await sql<Array<{
    id: string;
    userId: string;
    email: string;
    expiresAt: Date;
  }>>`
    SELECT id, user_id as "userId", email, expires_at as "expiresAt"
    FROM sessions
    WHERE id = ${sessionId} AND expires_at > NOW()
  `;
  return session || null;
}

export async function deleteSession(sessionId: string) {
  await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
}

export async function cleanupExpiredSessions() {
  await sql`DELETE FROM sessions WHERE expires_at < NOW()`;
}
```

---

### Step 3: Replace Files

Replace these 2 files with the fixed versions:

#### File 1: `app/api/auth/verify/route.ts`
**Replace with**: `verify-route-db-sessions.ts`

```bash
cp verify-route-db-sessions.ts app/api/auth/verify/route.ts
```

#### File 2: `app/api/admin/middleware.ts`
**Replace with**: `admin-middleware-db.ts`

```bash
cp admin-middleware-db.ts app/api/admin/middleware.ts
```

---

### Step 4: Deploy

```bash
git add .
git commit -m "Fix: Use database sessions instead of memory"
git push
```

---

## Quick Installation Commands

```bash
# 1. Run the SQL in Neon dashboard (copy from add-sessions-table.sql)

# 2. Add session functions to lib/db.ts
# (Copy the functions from db-session-functions.ts to the end of lib/db.ts)

# 3. Replace the verify route
cp verify-route-db-sessions.ts app/api/auth/verify/route.ts

# 4. Replace the admin middleware
cp admin-middleware-db.ts app/api/admin/middleware.ts

# 5. Deploy
git add .
git commit -m "Fix: Use database sessions instead of memory"
git push
```

---

## What Changed

### Before (Memory Sessions - BROKEN on Netlify):
```typescript
// app/api/auth/verify/route.ts
const sessions = new Map(); // ❌ Lost between function calls
sessions.set(sessionId, data);
```

### After (Database Sessions - WORKS on Netlify):
```typescript
// app/api/auth/verify/route.ts
await createSession({  // ✅ Stored in database
  id: sessionId,
  userId: user.id,
  email: user.email,
  expiresAt: new Date(Date.now() + SESSION_EXPIRY),
});
```

---

## Why This Happened

**Serverless Functions** (like Netlify/Vercel) create a new container for each request:

```
User Login:
  ┌─────────────────┐
  │ Function #1     │
  │ creates session │ → Stores in memory
  │ returns cookie  │
  └─────────────────┘

User Votes (30 seconds later):
  ┌─────────────────┐
  │ Function #2     │  ← NEW container
  │ checks session  │ → Memory is empty!
  │ 401 Error ❌    │
  └─────────────────┘
```

**Solution**: Database persists across all function calls:

```
User Login:
  Function #1 → Writes session to Database

User Votes:
  Function #2 → Reads session from Database ✅
```

---

## Testing the Fix

### Test 1: Login and Vote
1. Clear cookies (DevTools → Application → Clear site data)
2. Go to your site
3. Login with email + OTP
4. Select nominees in categories
5. Click "Submit Votes"
6. **Expected**: ✅ Success! Redirects to confirmation page

### Test 2: Check Session Duration
1. Login
2. Wait 5 minutes
3. Try to vote
4. **Expected**: ✅ Still works (session persists)

### Test 3: Database Verification
Run this in Neon SQL Editor:
```sql
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;
```
**Expected**: See your sessions with future `expires_at` dates

---

## Files Provided

1. **`add-sessions-table.sql`** - SQL to create sessions table
2. **`db-session-functions.ts`** - Functions to add to lib/db.ts
3. **`verify-route-db-sessions.ts`** - Fixed verify route (replaces app/api/auth/verify/route.ts)
4. **`admin-middleware-db.ts`** - Fixed admin middleware (replaces app/api/admin/middleware.ts)

---

## Checklist

- [ ] Run SQL to create `sessions` table in Neon
- [ ] Add session functions to `lib/db.ts`
- [ ] Replace `app/api/auth/verify/route.ts`
- [ ] Replace `app/api/admin/middleware.ts`
- [ ] Commit and push to deploy
- [ ] Test login → vote flow
- [ ] Verify sessions appear in database

---

## Troubleshooting

### Issue: Still getting session expired
**Check**:
```sql
-- In Neon SQL Editor
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();
```
If 0, sessions aren't being created. Check server logs.

### Issue: Database error on login
**Check**: Make sure you ran the SQL to create the sessions table
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'sessions';
```
Should return 1 row.

### Issue: Sessions not persisting
**Check**: Verify the session functions were added to lib/db.ts:
```typescript
// Should be able to import:
import { createSession, getSession } from '@/lib/db';
```

---

## Performance Note

The sessions table will grow over time. You can clean up expired sessions with:

```sql
-- Run this occasionally (or set up as cron job)
DELETE FROM sessions WHERE expires_at < NOW();
```

Or add this to your admin dashboard as a button.

---

## Summary

**Problem**: Memory-based sessions don't work on serverless  
**Solution**: Database-based sessions persist across function calls  
**Result**: Users can stay logged in and vote successfully! 🎉

---

**Files**: 4 files provided  
**Installation Time**: ~5 minutes  
**Difficulty**: Easy (copy/paste SQL and files)
