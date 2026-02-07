# Complete Session Fix - All Files

## Build Error Fixed

**Error**: `'sessions' is not exported from '../verify/route'`  
**Cause**: Other routes still importing old in-memory sessions  
**Solution**: Update all routes to use database sessions

---

## Installation Steps

### Step 1: Database Migration

Run this SQL in your **Neon dashboard** → **SQL Editor**:

```sql
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(32) PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

---

### Step 2: Update lib/db.ts

Add these functions to the **end** of `lib/db.ts` (before `export default sql;`):

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

### Step 3: Replace All Files

Replace these **6 files** with the fixed versions:

```bash
# Auth routes
cp verify-route-db-sessions.ts app/api/auth/verify/route.ts
cp logout-route-fixed.ts app/api/auth/logout/route.ts
cp me-route-fixed.ts app/api/auth/me/route.ts

# Public routes
cp categories-route-fixed.ts app/api/categories/route.ts
cp vote-route-fixed.ts app/api/vote/route.ts

# Admin middleware
cp admin-middleware-db.ts app/api/admin/middleware.ts
```

---

### Step 4: Deploy

```bash
git add .
git commit -m "Fix: Complete database session implementation"
git push
```

---

## Quick Copy-Paste Commands

```bash
# 1. Run SQL in Neon (copy from add-sessions-table.sql)

# 2. Add session functions to lib/db.ts
# (Copy from db-session-functions.ts to end of lib/db.ts)

# 3. Replace files
cp verify-route-db-sessions.ts app/api/auth/verify/route.ts
cp logout-route-fixed.ts app/api/auth/logout/route.ts
cp me-route-fixed.ts app/api/auth/me/route.ts
cp categories-route-fixed.ts app/api/categories/route.ts
cp vote-route-fixed.ts app/api/vote/route.ts
cp admin-middleware-db.ts app/api/admin/middleware.ts

# 4. Commit and deploy
git add .
git commit -m "Fix: Complete database session implementation"
git push
```

---

## Files Being Replaced

| File | What Changed |
|------|--------------|
| `app/api/auth/verify/route.ts` | Uses `createSession()` instead of `Map` |
| `app/api/auth/logout/route.ts` | Uses `deleteSession()` instead of `Map.delete()` |
| `app/api/auth/me/route.ts` | Uses `getSession()` instead of `Map.get()` |
| `app/api/categories/route.ts` | Uses `getSession()` instead of importing `sessions` |
| `app/api/vote/route.ts` | Uses `getSession()` instead of importing `sessions` |
| `app/api/admin/middleware.ts` | Uses `getSession()` instead of importing `sessions` |

---

## What This Fixes

### Before (Broken):
```typescript
// ❌ Memory-based sessions (lost between serverless function calls)
import { sessions } from '../verify/route';  // Error: not exported
const session = sessions.get(sessionId);     // Empty on new function instance
```

### After (Working):
```typescript
// ✅ Database sessions (persist across all function calls)
import { getSession } from '@/lib/db';
const session = await getSession(sessionId);  // Always available
```

---

## Testing After Deploy

### Test 1: Build Success
```bash
# After pushing, check Netlify logs
# Should see: "✓ Compiled successfully"
# No more import errors
```

### Test 2: Login & Vote
1. Go to your site
2. Login with email + OTP
3. Select nominees
4. Click "Submit Votes"
5. **Expected**: ✅ Success! Votes submitted

### Test 3: Session Persistence
1. Login
2. Wait 5 minutes
3. Try to vote again
4. **Expected**: ✅ Still works (session persists)

### Test 4: Database Check
```sql
-- Run in Neon SQL Editor
SELECT COUNT(*) FROM sessions WHERE expires_at > NOW();
-- Should show active sessions
```

---

## File Checklist

- [ ] Run SQL to create `sessions` table
- [ ] Add session functions to `lib/db.ts`
- [ ] Replace `app/api/auth/verify/route.ts`
- [ ] Replace `app/api/auth/logout/route.ts`
- [ ] Replace `app/api/auth/me/route.ts`
- [ ] Replace `app/api/categories/route.ts`
- [ ] Replace `app/api/vote/route.ts`
- [ ] Replace `app/api/admin/middleware.ts`
- [ ] Commit and push
- [ ] Verify build succeeds
- [ ] Test login → vote flow

---

## Files Provided

**Total: 7 files**

1. `add-sessions-table.sql` - Database migration
2. `db-session-functions.ts` - Session functions for lib/db.ts
3. `verify-route-db-sessions.ts` - Fixed verify route
4. `logout-route-fixed.ts` - Fixed logout route
5. `me-route-fixed.ts` - Fixed me route
6. `categories-route-fixed.ts` - Fixed categories route
7. `vote-route-fixed.ts` - Fixed vote route
8. `admin-middleware-db.ts` - Fixed admin middleware

---

## Troubleshooting

### Build still failing?
Check that you:
1. ✅ Added session functions to `lib/db.ts`
2. ✅ Replaced ALL 6 route files
3. ✅ No files still importing `sessions` from verify route

### Sessions not working?
1. ✅ Verify sessions table exists in Neon
2. ✅ Check Netlify function logs for errors
3. ✅ Verify session cookie is being set (DevTools → Application → Cookies)

### Database errors?
```sql
-- Verify table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'sessions';
-- Should return 1 row
```

---

## Success!

After deploying these fixes:
- ✅ Build completes successfully
- ✅ No more import errors
- ✅ Sessions persist in database
- ✅ Users can login and vote
- ✅ Sessions last 7 days

**Your voting system is now fully functional!** 🎉
