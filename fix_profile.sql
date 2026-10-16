-- ============================================================================
-- Fix: Create Missing Profile
-- ============================================================================
-- This creates your profile if it's missing
-- The error "Referenced resource does not exist" happens when:
-- 1. You have an auth.users account
-- 2. But no corresponding profile in the profiles table
-- ============================================================================

-- Step 1: Check if profile exists
SELECT 
  CASE 
    WHEN EXISTS(SELECT 1 FROM profiles WHERE id = auth.uid())
    THEN '✓ Your profile already exists!'
    ELSE '✗ Profile is missing - will create below'
  END as status,
  auth.uid() as your_user_id;

-- Step 2: Create profile if missing
-- IMPORTANT: Change 'Your Name' and 'female' to your actual details!
INSERT INTO profiles (id, display_name, gender)
VALUES (
  auth.uid(),
  'Test User',  -- CHANGE THIS to your name
  'female'      -- CHANGE THIS to 'male' or 'female'
)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify it was created
SELECT 
  '✓ Profile created successfully!' as result,
  id,
  display_name,
  gender,
  created_at
FROM profiles
WHERE id = auth.uid();

-- ============================================================================
-- Alternative: Get your email and create profile with that info
-- ============================================================================
-- If you want to use your email as display name:
/*
INSERT INTO profiles (id, display_name, gender)
SELECT 
  id,
  SPLIT_PART(email, '@', 1) as display_name,  -- Uses part before @
  'female' as gender  -- CHANGE THIS
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO NOTHING;
*/
