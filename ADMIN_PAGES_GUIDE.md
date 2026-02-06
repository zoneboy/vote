# Admin Pages Installation Guide

## Overview
This update adds the missing admin pages for managing categories, nominees, and voting settings.

## Files to Install

### Pages (2 files)
1. **`admin-categories-page.tsx`** → `app/admin/categories/page.tsx`
2. **`admin-settings-page.tsx`** → `app/admin/settings/page.tsx`

### API Routes (5 files)
3. **`admin-categories-route.ts`** → `app/api/admin/categories/route.ts`
4. **`admin-category-id-route.ts`** → `app/api/admin/categories/[id]/route.ts`
5. **`admin-nominees-route.ts`** → `app/api/admin/nominees/route.ts`
6. **`admin-nominee-id-route.ts`** → `app/api/admin/nominees/[id]/route.ts`
7. **`admin-settings-route.ts`** → `app/api/admin/settings/route.ts`

## Quick Installation

```bash
# Create directories
mkdir -p app/admin/categories
mkdir -p app/admin/settings
mkdir -p app/api/admin/categories/[id]
mkdir -p app/api/admin/nominees/[id]
mkdir -p app/api/admin/settings

# Copy page files
cp admin-categories-page.tsx app/admin/categories/page.tsx
cp admin-settings-page.tsx app/admin/settings/page.tsx

# Copy API routes
cp admin-categories-route.ts app/api/admin/categories/route.ts
cp admin-category-id-route.ts app/api/admin/categories/[id]/route.ts
cp admin-nominees-route.ts app/api/admin/nominees/route.ts
cp admin-nominee-id-route.ts app/api/admin/nominees/[id]/route.ts
cp admin-settings-route.ts app/api/admin/settings/route.ts

# Commit and deploy
git add .
git commit -m "feat: Add admin categories and settings pages"
git push
```

## Features

### 📁 Manage Categories Page (`/admin/categories`)
**Features:**
- ✅ View all categories and nominees
- ✅ Create new categories
- ✅ Edit existing categories
- ✅ Delete categories (with confirmation)
- ✅ Add nominees to categories
- ✅ Edit nominees
- ✅ Delete nominees
- ✅ Set display order for categories and nominees
- ✅ Modal dialogs for create/edit operations

**What You Can Do:**
1. **Create Categories**: Click "+ Add Category" button
2. **Edit Categories**: Click "Edit Category" on any category
3. **Delete Categories**: Click "Delete" (warns about deleting nominees too)
4. **Add Nominees**: Click "+ Add Nominee" within a category
5. **Edit Nominees**: Click "Edit" on any nominee
6. **Delete Nominees**: Click "Delete" on any nominee

### ⚙️ Voting Settings Page (`/admin/settings`)
**Features:**
- ✅ Quick toggle for opening/closing voting
- ✅ Set voting start date/time (optional)
- ✅ Set voting end date/time (optional)
- ✅ Toggle public results visibility
- ✅ Set max votes per IP address
- ✅ Enable maintenance mode
- ✅ Status summary showing current configuration

**What You Can Do:**
1. **Open/Close Voting**: Big toggle switch at the top
2. **Schedule Voting**: Set start and end dates
3. **Control Results**: Make results public or private
4. **Fraud Prevention**: Limit votes per IP address
5. **Maintenance**: Put site in maintenance mode

## API Endpoints Created

### Categories Management
```
GET    /api/admin/categories          - List all categories
POST   /api/admin/categories          - Create category
GET    /api/admin/categories/[id]     - Get single category
PUT    /api/admin/categories/[id]     - Update category
DELETE /api/admin/categories/[id]     - Delete category
```

### Nominees Management
```
GET    /api/admin/nominees?categoryId=xxx  - List nominees by category
POST   /api/admin/nominees                 - Create nominee
PUT    /api/admin/nominees/[id]            - Update nominee
DELETE /api/admin/nominees/[id]            - Delete nominee
```

### Settings Management
```
GET    /api/admin/settings     - Get all settings
PUT    /api/admin/settings     - Update settings
```

## Testing the Pages

### Test Categories Page
1. Login as admin
2. Go to `/admin/categories`
3. **Expected**: See list of categories (or empty state)
4. Click "+ Add Category"
5. **Expected**: Modal opens
6. Fill in category name and click "Create Category"
7. **Expected**: Category created and appears in list
8. Click "+ Add Nominee" on a category
9. **Expected**: Nominee modal opens
10. Add a nominee
11. **Expected**: Nominee appears under category

### Test Settings Page
1. Login as admin
2. Go to `/admin/settings`
3. **Expected**: See all voting settings
4. Toggle "Voting Status" switch
5. **Expected**: Status changes immediately
6. Set start/end dates
7. Click "Save All Settings"
8. **Expected**: Success message appears
9. Refresh page
10. **Expected**: Settings are persisted

## File Structure After Installation

```
app/
├── admin/
│   ├── categories/
│   │   └── page.tsx           ← Categories management page
│   ├── dashboard/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx           ← Settings management page
└── api/
    └── admin/
        ├── categories/
        │   ├── [id]/
        │   │   └── route.ts   ← Update/delete category
        │   └── route.ts       ← List/create categories
        ├── nominees/
        │   ├── [id]/
        │   │   └── route.ts   ← Update/delete nominee
        │   └── route.ts       ← List/create nominees
        ├── settings/
        │   └── route.ts       ← Get/update settings
        ├── stats/
        │   └── route.ts
        └── middleware.ts
```

## Security Notes

All admin routes are protected by the `requireAdmin` middleware which:
1. ✅ Checks for valid session
2. ✅ Verifies user has `isAdmin: true`
3. ✅ Returns 401/403 for unauthorized access

## Navigation Flow

```
Admin Dashboard (/admin/dashboard)
  ├─→ Manage Categories (/admin/categories)
  │     ├─→ Create Category (modal)
  │     ├─→ Edit Category (modal)
  │     ├─→ Add Nominee (modal)
  │     └─→ Edit Nominee (modal)
  │
  └─→ Voting Settings (/admin/settings)
        ├─→ Toggle voting on/off
        ├─→ Set voting period
        ├─→ Configure results visibility
        └─→ Set fraud prevention rules
```

## Common Tasks

### Creating Your First Category
1. Go to `/admin/categories`
2. Click "+ Add Category"
3. Enter: Name = "Best Artist"
4. Enter: Description = "Vote for your favorite artist"
5. Click "Create Category"
6. ✅ Category created!

### Adding Nominees to a Category
1. Find the category in the list
2. Click "+ Add Nominee"
3. Enter nominee name (e.g., "Burna Boy")
4. Add description (optional)
5. Set display order (0, 1, 2...)
6. Click "Add Nominee"
7. ✅ Nominee added!

### Opening Voting
1. Go to `/admin/settings`
2. Click the big toggle switch to "ON"
3. ✅ Voting is now open!

### Scheduling Voting Period
1. Go to `/admin/settings`
2. Set "Start Date & Time" (e.g., Dec 1, 2024 12:00 AM)
3. Set "End Date & Time" (e.g., Dec 31, 2024 11:59 PM)
4. Click "Save All Settings"
5. ✅ Voting will automatically open/close at those times!

## Troubleshooting

### Issue: 404 on admin pages
**Solution**: 
- Make sure all 7 files are in the correct locations
- Check folder structure matches the guide
- Restart dev server: `npm run dev`

### Issue: "Not authorized" error
**Solution**:
- Verify you're logged in as admin
- Check `is_admin` flag in database
- Run: `npm run make-admin your@email.com`

### Issue: Changes not saving
**Solution**:
- Check browser console for errors
- Verify API routes are accessible
- Check database connection
- Look at server logs

### Issue: Categories not appearing
**Solution**:
- Check if categories exist in database
- Open browser DevTools → Network tab
- Look for failed API calls
- Check `/api/admin/categories` returns data

## Default Settings

After running migrations, these default settings are created:
- `voting_open`: false
- `results_public`: false
- `maintenance_mode`: false

All other settings are optional and can be configured through the UI.

## Next Steps

After installing these pages, you can:
1. ✅ Create categories for your voting
2. ✅ Add nominees to each category
3. ✅ Configure voting period
4. ✅ Open voting to the public
5. ✅ Monitor votes from the dashboard
6. ✅ Close voting when done
7. ✅ Make results public

## Complete Deployment Checklist

- [ ] All 7 files copied to correct locations
- [ ] Folders created with correct names
- [ ] Categories page accessible at `/admin/categories`
- [ ] Settings page accessible at `/admin/settings`
- [ ] Can create a test category
- [ ] Can add a test nominee
- [ ] Can toggle voting on/off
- [ ] Git committed and pushed
- [ ] Deployed to production

## Support

If you encounter any issues:
1. Check browser console for errors
2. Check server logs
3. Verify database migrations ran
4. Ensure you're logged in as admin
5. Test API endpoints directly

---

**You're all set!** The admin panel is now complete with categories and settings management. 🎉
