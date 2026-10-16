# Database Setup Guide

## Error: "Referenced resource does not exist"

This error usually means one of these issues:

### 1. User Profile Missing
**Most Common Issue**: Your user account exists in `auth.users` but not in `profiles` table.

**How to check:**
1. Go to Supabase Dashboard → Table Editor
2. Open `profiles` table
3. Look for your user ID

**How to fix:**
Run this SQL in Supabase SQL Editor:

```sql
-- Check if your profile exists
SELECT * FROM profiles WHERE id = auth.uid();

-- If no result, create it manually:
INSERT INTO profiles (id, display_name, gender)
VALUES (
  auth.uid(),
  'Your Name',  -- Replace with your name
  'female'      -- Replace with 'male' or 'female'
);
```

### 2. Foreign Key Constraint Issue

**When creating a post:**
- Check that your profile exists in `profiles` table
- The `user_id` in posts must match a valid profile ID

**When liking a post:**
- Check that the post exists in `posts` table
- Your profile exists in `profiles` table

**How to fix:**
```sql
-- Verify all foreign keys are set up correctly
SELECT 
  conname as constraint_name,
  conrelid::regclass as table_name,
  a.attname as column_name,
  confrelid::regclass as referenced_table
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
WHERE c.contype = 'f';
```

### 3. Database Migration Not Applied

If tables don't exist at all:

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the entire content from `supabase/migrations/001_initial_schema.sql`
4. Click "Run"

**Verify tables exist:**
```sql
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'wardrobe_items', 'posts', 'post_likes');
```

Should return:
- profiles
- wardrobe_items
- posts  
- post_likes

### 4. Storage Bucket Missing

If you get errors when uploading images:

1. Go to Supabase Dashboard → Storage
2. Create bucket named: `clothes`
3. Make it **Public**
4. Set MIME types: `image/*`

**Bucket policies needed:**
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'clothes');

-- Allow public access to read
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'clothes');

-- Allow users to delete their own images
CREATE POLICY "Allow users to delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'clothes' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Quick Diagnosis

Run this SQL to check everything:

```sql
-- 1. Check if your profile exists
SELECT 'Profile exists: ' || CASE 
  WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) 
  THEN 'YES ✓' 
  ELSE 'NO ✗ - CREATE ONE!' 
END;

-- 2. Check table counts
SELECT 
  'profiles: ' || COUNT(*) FROM profiles
UNION ALL
SELECT 
  'wardrobe_items: ' || COUNT(*) FROM wardrobe_items
UNION ALL
SELECT 
  'posts: ' || COUNT(*) FROM posts
UNION ALL
SELECT 
  'post_likes: ' || COUNT(*) FROM post_likes;

-- 3. Check your current user
SELECT 
  auth.uid() as my_user_id,
  p.display_name,
  p.gender,
  p.created_at
FROM profiles p
WHERE p.id = auth.uid();
```

## Common Solutions

### Create Missing Profile
```sql
INSERT INTO profiles (id, display_name, gender)
VALUES (
  auth.uid(),
  'Test User',
  'female'
)
ON CONFLICT (id) DO NOTHING;
```

### Reset Everything (DANGER - Deletes all data!)
```sql
TRUNCATE TABLE post_likes CASCADE;
TRUNCATE TABLE posts CASCADE;
TRUNCATE TABLE wardrobe_items CASCADE;
TRUNCATE TABLE profiles CASCADE;
```

## Environment Variables

Make sure your `.env` file has:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these from Supabase Dashboard → Project Settings → API

## Still Having Issues?

1. **Check browser console** for detailed error messages
2. **Check Supabase logs**: Dashboard → Logs → API logs
3. **Verify RLS policies** are enabled but not blocking you
4. **Try logging out and back in** to refresh your session

## Test Account Setup

To create a fresh test account:

1. Logout from the app
2. Click "Register"
3. Fill in:
   - Email: `test@example.com`
   - Password: `password123`
   - Name: `Test User`
   - Gender: Select one
4. The profile should auto-create via trigger
5. If email confirmation is required, check Supabase → Authentication → Email Templates
6. Disable email confirmation: Authentication → Providers → Email → "Enable email confirmations" = OFF

## Success Checklist

- ✅ All 4 tables exist
- ✅ Your profile exists in `profiles` table
- ✅ Storage bucket `clothes` exists and is public
- ✅ You can login without errors
- ✅ Environment variables are correct
- ✅ Email confirmation is disabled (for testing)
