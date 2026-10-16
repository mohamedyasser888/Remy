# 🚀 Complete Setup - Copy & Paste Guide

Follow these steps exactly. Everything is ready to copy-paste!

---

## ✅ Step 1: Open Supabase SQL Editor

1. **Go to**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/sql
2. **Click**: "New Query" button (top right)

---

## ✅ Step 2: Create Database Tables

**Copy ALL the text below** and paste into SQL Editor, then click "Run":

```sql
-- ============================================================================
-- Fashion Wardrobe - Complete Database Setup
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CREATE TABLES
-- ============================================================================

-- Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(display_name) >= 2 AND length(display_name) <= 50),
  gender text NOT NULL CHECK (gender IN ('female', 'male')),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Wardrobe Items Table
CREATE TABLE IF NOT EXISTS wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear', 'Belts'
  )),
  image_path text NOT NULL,
  is_favourite boolean DEFAULT false NOT NULL,
  ai_attributes jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Posts Table
CREATE TABLE IF NOT EXISTS posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear', 'Belts'
  )),
  description text NOT NULL CHECK (length(description) >= 1 AND length(description) <= 200),
  image_path text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Post Likes Table
CREATE TABLE IF NOT EXISTS post_likes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_created_at ON wardrobe_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- ============================================================================
-- CREATE FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function: Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, gender)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'gender'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Trigger for profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Function: Validate category matches gender
CREATE OR REPLACE FUNCTION validate_wardrobe_category()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  user_gender text;
  male_categories text[] := ARRAY['Tops', 'Bottoms', 'Jackets', 'Shoes', 'Socks', 'Belts', 'Accessories'];
  female_categories text[] := ARRAY[
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 'Hijab', 
    'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear'
  ];
BEGIN
  SELECT gender INTO user_gender FROM public.profiles WHERE id = NEW.user_id;
  
  IF user_gender = 'male' AND NOT (NEW.category = ANY(male_categories)) THEN
    RAISE EXCEPTION 'Category "%" is not valid for male users', NEW.category;
  ELSIF user_gender = 'female' AND NOT (NEW.category = ANY(female_categories)) THEN
    RAISE EXCEPTION 'Category "%" is not valid for female users', NEW.category;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger for category validation
DROP TRIGGER IF EXISTS validate_wardrobe_category_trigger ON wardrobe_items;
CREATE TRIGGER validate_wardrobe_category_trigger
  BEFORE INSERT OR UPDATE OF category ON wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_wardrobe_category();

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND gender = (SELECT gender FROM profiles WHERE id = auth.uid()));

-- Wardrobe Items Policies
DROP POLICY IF EXISTS "Users can view own wardrobe items" ON wardrobe_items;
CREATE POLICY "Users can view own wardrobe items"
  ON wardrobe_items FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wardrobe items" ON wardrobe_items;
CREATE POLICY "Users can insert own wardrobe items"
  ON wardrobe_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wardrobe items" ON wardrobe_items;
CREATE POLICY "Users can update own wardrobe items"
  ON wardrobe_items FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own wardrobe items" ON wardrobe_items;
CREATE POLICY "Users can delete own wardrobe items"
  ON wardrobe_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Posts Policies
DROP POLICY IF EXISTS "Posts are viewable by authenticated users" ON posts;
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Post Likes Policies
DROP POLICY IF EXISTS "Post likes are viewable by authenticated users" ON post_likes;
CREATE POLICY "Post likes are viewable by authenticated users"
  ON post_likes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can insert own likes" ON post_likes;
CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own likes" ON post_likes;
CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW posts_with_likes AS
SELECT 
  p.*,
  prof.display_name,
  prof.gender as poster_gender,
  COALESCE(like_counts.count, 0) as likes_count
FROM posts p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_likes
  GROUP BY post_id
) like_counts ON p.id = like_counts.post_id
ORDER BY p.created_at DESC;

GRANT SELECT ON posts_with_likes TO authenticated;

-- ============================================================================
-- DONE!
-- ============================================================================
```

**Expected Result**: You should see "Success. No rows returned"

---

## ✅ Step 3: Create Storage Bucket

1. **Go to**: https://supabase.com/dashboard/project/lpemedejeckfkcykulvg/storage/buckets
2. **Click**: "New bucket" button
3. **Fill in**:
   - Name: `clothes`
   - ✅ **Check**: "Public bucket" (IMPORTANT!)
4. **Click**: "Create bucket"

---

## ✅ Step 4: Add Storage Policies

1. **Click** on the `clothes` bucket you just created
2. **Click** "Policies" tab
3. **Click** "New policy" button **THREE TIMES** (we need 3 policies)

### Policy 1: Public Read
- Click "New policy"
- Choose "For full customization"
- **Policy name**: `Public read access`
- **Allowed operation**: SELECT
- **Target roles**: public
- **USING expression**:
```sql
bucket_id = 'clothes'
```
- Click "Review" → "Save policy"

### Policy 2: User Upload
- Click "New policy"
- Choose "For full customization"
- **Policy name**: `User upload access`
- **Allowed operation**: INSERT
- **Target roles**: authenticated
- **WITH CHECK expression**:
```sql
bucket_id = 'clothes' AND (storage.foldername(name))[1] = auth.uid()::text
```
- Click "Review" → "Save policy"

### Policy 3: User Delete
- Click "New policy"
- Choose "For full customization"
- **Policy name**: `User delete access`
- **Allowed operation**: DELETE
- **Target roles**: authenticated
- **USING expression**:
```sql
bucket_id = 'clothes' AND (storage.foldername(name))[1] = auth.uid()::text
```
- Click "Review" → "Save policy"

---

## ✅ Step 5: Verify Setup

Open in browser: **d:/remy/check-setup.html**

You should see all green checkmarks ✅

---

## ✅ Step 6: Start the App

The dev server is already running at: **http://localhost:5174/**

---

## 🎉 You're Done! Now Use the App:

1. **Go to**: http://localhost:5174/
2. **Click**: "Sign up here" (or "Create Account")
3. **Register**:
   - Email: your@email.com
   - Password: (min 6 chars)
   - Display Name: Your Name
   - Gender: Male or Female
4. **Click**: "Create Account"
5. **Start adding items!**

---

## 🐛 Troubleshooting

### If SQL fails:
- Make sure you copied ALL the SQL (scroll to the bottom)
- Check for error message in SQL Editor
- Try running it again (it's safe to re-run)

### If images don't upload:
- Make sure bucket is named exactly `clothes`
- Make sure "Public bucket" is checked
- Verify all 3 storage policies are added

### If you see "Table does not exist":
- Go back to Step 2 and run the SQL again
- Wait 10 seconds after running
- Refresh the page

---

## 📞 Need Help?

Check the files:
- `README.md` - Full documentation
- `TESTING_CHECKLIST.md` - Feature guide
- `supabase/storage_setup.md` - Detailed storage guide

---

**That's it! Everything should be working now!** 🎊
