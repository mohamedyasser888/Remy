-- ============================================================================
-- Database Verification Script
-- Run this in Supabase SQL Editor to diagnose issues
-- ============================================================================

-- 1. Check if all tables exist
SELECT 
  'Tables Check:' as check_name,
  CASE 
    WHEN COUNT(*) = 4 THEN '✓ All 4 tables exist'
    ELSE '✗ Missing tables! Expected 4, found ' || COUNT(*)
  END as result
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'wardrobe_items', 'posts', 'post_likes');

-- 2. Check if your profile exists
SELECT 
  'Your Profile:' as check_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid()) 
    THEN '✓ Profile exists'
    ELSE '✗ NO PROFILE - You need to create one!'
  END as result;

-- 3. Show your profile details (if exists)
SELECT 
  'Your Details:' as info,
  id,
  display_name,
  gender,
  created_at
FROM profiles
WHERE id = auth.uid();

-- 4. Table row counts
SELECT 'profiles' as table_name, COUNT(*) as row_count FROM profiles
UNION ALL
SELECT 'wardrobe_items', COUNT(*) FROM wardrobe_items
UNION ALL
SELECT 'posts', COUNT(*) FROM posts
UNION ALL
SELECT 'post_likes', COUNT(*) FROM post_likes;

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- 6. Check storage bucket
SELECT 
  'Storage Bucket:' as check_name,
  CASE 
    WHEN EXISTS(SELECT 1 FROM storage.buckets WHERE name = 'clothes')
    THEN '✓ Bucket "clothes" exists'
    ELSE '✗ Bucket "clothes" NOT FOUND - Create it!'
  END as result;

-- 7. Check for orphaned records (should be none)
SELECT 
  'Orphaned Posts:' as check_name,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✓ No orphaned posts'
    ELSE '✗ Found ' || COUNT(*) || ' posts without valid user'
  END as result
FROM posts p
WHERE NOT EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = p.user_id);

-- ============================================================================
-- QUICK FIX: Create your profile if missing
-- ============================================================================
-- Uncomment and modify this if your profile doesn't exist:
/*
INSERT INTO profiles (id, display_name, gender)
VALUES (
  auth.uid(),
  'Your Name Here',  -- CHANGE THIS
  'female'           -- CHANGE TO 'male' or 'female'
)
ON CONFLICT (id) DO NOTHING;
*/

-- ============================================================================
-- QUICK FIX: Create storage bucket if missing
-- ============================================================================
-- Run this in SQL Editor if bucket doesn't exist:
/*
INSERT INTO storage.buckets (id, name, public)
VALUES ('clothes', 'clothes', true)
ON CONFLICT (id) DO NOTHING;
*/
