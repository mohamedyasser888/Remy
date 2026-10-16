-- ============================================================================
-- Fashion Wardrobe & Community App - Initial Schema
-- ============================================================================
-- This migration creates the complete database schema including:
-- - Tables: profiles, wardrobe_items, posts, post_likes
-- - Triggers: profile creation, category validation
-- - RLS Policies: secure row-level access control
-- - Indexes: performance optimization
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles Table
-- ----------------------------------------------------------------------------
-- Stores user profile information linked to auth.users
-- Gender is immutable after registration (affects category filtering)
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (length(display_name) >= 2 AND length(display_name) <= 50),
  gender text NOT NULL CHECK (gender IN ('female', 'male')),
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE profiles IS 'User profile information created via trigger on auth.users insert';
COMMENT ON COLUMN profiles.gender IS 'Immutable after registration - determines available categories';

-- ----------------------------------------------------------------------------
-- Wardrobe Items Table
-- ----------------------------------------------------------------------------
-- User's personal clothing collection with favorite status
-- ai_attributes reserved for future AI stylist integration
-- ----------------------------------------------------------------------------
CREATE TABLE wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    -- Female categories
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear',
    -- Male categories (Tops, Bottoms, Jackets, Shoes, Socks, Accessories are shared)
    'Belts'
  )),
  image_path text NOT NULL,
  is_favourite boolean DEFAULT false NOT NULL,
  ai_attributes jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE wardrobe_items IS 'User wardrobe collection with favorite status';
COMMENT ON COLUMN wardrobe_items.ai_attributes IS 'Reserved for AI stylist: color, style, occasion, season';

-- ----------------------------------------------------------------------------
-- Posts Table
-- ----------------------------------------------------------------------------
-- Community feed of shared clothing items
-- ----------------------------------------------------------------------------
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(name) >= 1 AND length(name) <= 100),
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 
    'Sports wear', 'Belts'
  )),
  description text NOT NULL CHECK (length(description) >= 1 AND length(description) <= 200),
  image_path text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE posts IS 'Community feed of shared clothing items';
COMMENT ON COLUMN posts.description IS 'Max 200 characters, user-provided description';

-- ----------------------------------------------------------------------------
-- Post Likes Table
-- ----------------------------------------------------------------------------
-- Many-to-many relationship between users and posts
-- Composite primary key prevents duplicate likes
-- ----------------------------------------------------------------------------
CREATE TABLE post_likes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (user_id, post_id)
);

COMMENT ON TABLE post_likes IS 'User likes on community posts';

-- ============================================================================
-- INDEXES
-- ============================================================================
-- Performance optimization for common queries
-- ----------------------------------------------------------------------------

-- Wardrobe items indexes
CREATE INDEX idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX idx_wardrobe_items_created_at ON wardrobe_items(created_at DESC);
CREATE INDEX idx_wardrobe_items_is_favourite ON wardrobe_items(user_id, is_favourite) WHERE is_favourite = true;

-- Posts indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- Post likes indexes
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX idx_post_likes_user_id ON post_likes(user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: Create Profile on User Signup
-- ----------------------------------------------------------------------------
-- Automatically creates a profile when a new user signs up
-- Reads display_name and gender from auth.users metadata
-- ----------------------------------------------------------------------------
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

COMMENT ON FUNCTION handle_new_user IS 'Creates profile from auth.users signup metadata';

-- Trigger to execute profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ----------------------------------------------------------------------------
-- Function: Validate Wardrobe Category Against User Gender
-- ----------------------------------------------------------------------------
-- Ensures users can only add categories appropriate for their gender
-- Female: All categories except 'Belts'
-- Male: Tops, Bottoms, Jackets, Shoes, Socks, Belts, Accessories
-- ----------------------------------------------------------------------------
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
  -- Get user's gender
  SELECT gender INTO user_gender 
  FROM public.profiles 
  WHERE id = NEW.user_id;
  
  -- Validate category based on gender
  IF user_gender = 'male' AND NOT (NEW.category = ANY(male_categories)) THEN
    RAISE EXCEPTION 'Category "%" is not valid for male users', NEW.category
      USING HINT = 'Allowed categories: Tops, Bottoms, Jackets, Shoes, Socks, Belts, Accessories';
  ELSIF user_gender = 'female' AND NOT (NEW.category = ANY(female_categories)) THEN
    RAISE EXCEPTION 'Category "%" is not valid for female users', NEW.category
      USING HINT = 'Allowed categories: Dresses, Tops, Bottoms, Jackets, Swimwear, Scarf, Hijab, Shoes, Socks, Formal wear, Bags, Accessories, Sports wear';
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION validate_wardrobe_category IS 'Validates category matches user gender';

-- Trigger for wardrobe category validation
CREATE TRIGGER validate_wardrobe_category_trigger
  BEFORE INSERT OR UPDATE OF category ON wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_wardrobe_category();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Profiles RLS
-- ----------------------------------------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view profiles (for display names in feed)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile, but NOT the gender field
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    -- Prevent gender updates by ensuring it hasn't changed
    gender = (SELECT gender FROM profiles WHERE id = auth.uid())
  );

COMMENT ON POLICY "Users can update own profile" ON profiles IS 'Gender is immutable after registration';

-- ----------------------------------------------------------------------------
-- Wardrobe Items RLS
-- ----------------------------------------------------------------------------
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

-- Users can view only their own wardrobe items
CREATE POLICY "Users can view own wardrobe items"
  ON wardrobe_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own wardrobe items
CREATE POLICY "Users can insert own wardrobe items"
  ON wardrobe_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own wardrobe items
CREATE POLICY "Users can update own wardrobe items"
  ON wardrobe_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own wardrobe items
CREATE POLICY "Users can delete own wardrobe items"
  ON wardrobe_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Posts RLS
-- ----------------------------------------------------------------------------
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view all posts
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can create posts
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own posts
CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own posts
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Post Likes RLS
-- ----------------------------------------------------------------------------
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view post likes
CREATE POLICY "Post likes are viewable by authenticated users"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Posts with Likes View
-- ----------------------------------------------------------------------------
-- Aggregates like counts for efficient querying
-- ----------------------------------------------------------------------------
CREATE VIEW posts_with_likes AS
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

COMMENT ON VIEW posts_with_likes IS 'Posts with aggregated like counts and poster info';

-- Grant read access to authenticated users
GRANT SELECT ON posts_with_likes TO authenticated;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To rollback this migration, run the following SQL:
--
-- DROP VIEW IF EXISTS posts_with_likes;
-- DROP TRIGGER IF EXISTS validate_wardrobe_category_trigger ON wardrobe_items;
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS validate_wardrobe_category();
-- DROP FUNCTION IF EXISTS handle_new_user();
-- DROP TABLE IF EXISTS post_likes CASCADE;
-- DROP TABLE IF EXISTS posts CASCADE;
-- DROP TABLE IF EXISTS wardrobe_items CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;
--
-- ============================================================================
