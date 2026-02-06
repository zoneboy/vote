# ✅ DEPLOYMENT CHECKLIST

## Before You Start
- [ ] Download all 7 fixed files from Claude
- [ ] Have your code editor open
- [ ] Have your project directory ready

---

## Step-by-Step (5 minutes)

### Step 1: Root Files (2 files)
- [ ] Replace `next.config.js` with downloaded `next.config.js`
- [ ] Replace `styles/globals.css` with downloaded `globals.css`

### Step 2: App Files (1 file)
- [ ] Replace `app/layout.tsx` with downloaded `layout.tsx`

### Step 3: Lib Files (1 file)
- [ ] Replace `lib/db.ts` with downloaded `db.ts`

### Step 4: API Routes (3 files)
- [ ] Replace `app/api/auth/verify/route.ts` with `verify-route.ts`
- [ ] Replace `app/api/categories/route.ts` with `categories-route.ts`  
- [ ] Replace `app/api/vote/route.ts` with `vote-route.ts`

### Step 5: Deploy
```bash
git add .
git commit -m "Fix: Complete deployment fixes"
git push
```

- [ ] Push to GitHub
- [ ] Watch Netlify build (should succeed!)
- [ ] Visit your deployed site

---

## Quick Commands

```bash
# Check what changed
git status

# Add all changes
git add .

# Commit
git commit -m "Fix: Complete deployment fixes - types, dynamic routes, CSS, viewport"

# Push
git push origin main
```

---

## Build Should Show

```
✓ Compiled successfully
✓ Linting and checking validity of types  
✓ Generating static pages (13/13)
✓ Build completed
```

---

## If You Get Stuck

1. **Make sure ALL 7 files are updated**
2. **Check file paths are exactly correct**
3. **Look at DEPLOYMENT_FIX_GUIDE.md for details**

---

## Files Overview

| # | Your File | Replace With | Size |
|---|-----------|--------------|------|
| 1 | `next.config.js` | `next.config.js` | 297 B |
| 2 | `styles/globals.css` | `globals.css` | 3 KB |
| 3 | `app/layout.tsx` | `layout.tsx` | 844 B |
| 4 | `lib/db.ts` | `db.ts` | 12 KB |
| 5 | `app/api/auth/verify/route.ts` | `verify-route.ts` | 3.4 KB |
| 6 | `app/api/categories/route.ts` | `categories-route.ts` | 1.7 KB |
| 7 | `app/api/vote/route.ts` | `vote-route.ts` | 3.7 KB |

**Total**: 7 files, ~25 KB of changes

---

## Done? 🎉

- [ ] All 7 files replaced
- [ ] Changes committed
- [ ] Pushed to GitHub
- [ ] Netlify build succeeded
- [ ] Site is live!

**Next**: Set up your database and create your first admin user!
