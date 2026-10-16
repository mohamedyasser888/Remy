# 🚀 Quick Setup Guide

Follow these steps to set up your Fashion Wardrobe app in 10 minutes!

## Step 1: Run Database Migration ⚡

### Option A: Using Supabase Dashboard (Recommended)

1. **Open your Supabase project**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg

2. **Go to SQL Editor**:
   - Click on "SQL Editor" in the left sidebar
   - Or go directly to: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/sql

3. **Create New Query**:
   - Click "New Query" button (top right)

4. **Copy Migration SQL**:
   - Open file: `supabase/migrations/001_initial_schema.sql`
   - Select ALL content (Ctrl+A)
   - Copy (Ctrl+C)

5. **Paste and Run**:
   - Paste into SQL Editor (Ctrl+V)
   - Click "Run" button (or press Ctrl+Enter)
   - Wait 2-3 seconds

6. **Verify Success**:
   - You should see: "Success. No rows returned"
   - If you see errors, read the error message and try again

### What This Creates:
- ✅ `profiles` table (user profiles)
- ✅ `wardrobe_items` table (personal wardrobe)
- ✅ `posts` table (community feed)
- ✅ `post_likes` table (like tracking)
- ✅ All RLS policies (security)
- ✅ Database triggers (auto-profile creation, validation)
- ✅ Indexes (performance)
- ✅ Views (posts_with_likes)

---

## Step 2: Set Up Storage Bucket 📦

1. **Go to Storage**:
   - Click "Storage" in left sidebar
   - Or go to: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/storage/buckets

2. **Create Bucket**:
   - Click "New bucket"
   - **Name**: `clothes`
   - **Public bucket**: ✅ **CHECK THIS BOX** (important!)
   - Click "Create bucket"

3. **Add Storage Policies**:
   - Click on the `clothes` bucket
   - Click "Policies" tab
   - Click "New policy"

### Policy 1: Public Read (SELECT)
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clothes');
```

### Policy 2: User Upload (INSERT)
```sql
CREATE POLICY "User upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'clothes' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Policy 3: User Delete (DELETE)
```sql
CREATE POLICY "User delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'clothes' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## Step 3: Verify Setup ✅

Run this quick verification:

```bash
node setup-database.js
```

This will test your database connection and confirm tables are created.

---

## Step 4: Start the App 🎉

```bash
npm run dev
```

Open: http://localhost:5174/

### First Time Usage:

1. **Register**: Create an account
   - Email: your@email.com
   - Password: (min 6 characters)
   - Display Name: Your Name
   - **Gender**: Female or Male (can't change later)

2. **Add Item**: 
   - Click "Add Item" in Wardrobe
   - Upload a photo (JPEG, PNG, WebP)
   - Fill details (name, size, category)
   - Save!

3. **Explore**:
   - ❤️ Mark favorites
   - 🏠 Share to community
   - 👀 Browse other posts
   - 👍 Like posts

---

## Troubleshooting 🔧

### "Table does not exist" error
- ✅ Make sure Step 1 (migration) completed successfully
- ✅ Check SQL Editor for errors
- ✅ Try running migration again

### Images not loading
- ✅ Verify storage bucket is **public**
- ✅ Check all 3 storage policies are added
- ✅ Bucket name must be exactly `clothes`

### Can't login after registration
- ✅ Check Supabase email confirmation settings
- ✅ Go to Authentication → Email Templates
- ✅ Confirm email or disable confirmation requirement

---

## Quick Links 🔗

- **Your Project**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg
- **SQL Editor**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/sql
- **Storage**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/storage/buckets
- **Authentication**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/auth/users

---

## Need Help? 💬

Check these files:
- `README.md` - Complete documentation
- `TESTING_CHECKLIST.md` - Feature guide
- `supabase/storage_setup.md` - Detailed storage setup
- `ACCESSIBILITY.md` - Accessibility info

---

**Estimated Setup Time**: 5-10 minutes
**Status**: ✅ .env configured | ⏳ Database migration | ⏳ Storage bucket
