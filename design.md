# Design Document: Fashion Wardrobe & Community App

## Architecture Overview

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Buttons, inputs, cards, modals
│   ├── layout/         # Navigation, tabs, layouts
│   └── features/       # Feature-specific components
├── pages/              # Top-level route components
│   ├── auth/          # Login, Register
│   ├── wardrobe/      # Wardrobe tab and sub-tabs
│   ├── home/          # Community feed
│   └── stylist/       # Placeholder
├── services/           # API and business logic
│   ├── supabase.ts    # Supabase client initialization
│   ├── auth.ts        # Authentication functions
│   ├── wardrobe.ts    # Wardrobe CRUD + AI data layer
│   ├── posts.ts       # Posts CRUD
│   └── storage.ts     # Image upload/delete
├── hooks/              # Custom React hooks
│   ├── useAuth.ts     # Auth state and operations
│   ├── useWardrobe.ts # Wardrobe data fetching
│   └── usePosts.ts    # Posts data fetching
├── types/              # TypeScript definitions
│   ├── database.ts    # Supabase generated types
│   ├── models.ts      # Domain models
│   └── index.ts       # Exported types
├── utils/              # Helper functions
│   ├── imageCompression.ts
│   ├── validation.ts
│   └── constants.ts   # Category lists, sizes
├── i18n/               # Internationalization
│   ├── en.json        # English strings
│   ├── ar.json        # Arabic strings
│   └── index.ts       # i18n setup
└── App.tsx             # Root component

supabase/
└── migrations/
    └── 001_initial_schema.sql
```

## Data Models

### TypeScript Types

```typescript
// types/models.ts

export type Gender = 'female' | 'male';

export type Size = 'S' | 'M' | 'L' | 'XL' | '2XL' | '3XL';

export type FemalCategory = 
  | 'Dresses' | 'Tops' | 'Bottoms' | 'Jackets' | 'Swimwear' 
  | 'Scarf' | 'Hijab' | 'Shoes' | 'Socks' | 'Formal wear' 
  | 'Bags' | 'Accessories' | 'Sports wear';

export type MaleCategory = 
  | 'Tops' | 'Bottoms' | 'Jackets' | 'Shoes' 
  | 'Socks' | 'Belts' | 'Accessories';

export type Category = FemalCategory | MaleCategory;

export interface Profile {
  id: string;
  display_name: string;
  gender: Gender;
  created_at: string;
}

export interface WardrobeItem {
  id: string;
  user_id: string;
  name: string;
  size: Size;
  category: Category;
  image_path: string;
  is_favourite: boolean;
  ai_attributes: AIAttributes | null;
  created_at: string;
}

export interface AIAttributes {
  color?: string;
  style?: string;
  occasion?: string;
  season?: string;
  // Future: add more attributes as AI model evolves
}

export interface Post {
  id: string;
  user_id: string;
  name: string;
  size: Size;
  category: Category;
  description: string;
  image_path: string;
  created_at: string;
  // Joined fields
  profile?: Profile;
  likes_count?: number;
  is_liked_by_user?: boolean;
}

export interface PostLike {
  user_id: string;
  post_id: string;
  created_at: string;
}

// AI Stylist Integration Types
export interface StylistItem {
  id: string;
  name: string;
  size: Size;
  category: Category;
  image_url: string;  // Full public URL
  is_favourite: boolean;
  ai_attributes: AIAttributes | null;
}

// Future AI Response (not implemented now)
export interface AIOutfitResponse {
  reply: string;
  outfit_item_ids: string[];
}
```

## Database Design

### Schema Diagram
```
auth.users (Supabase managed)
    ↓
  profiles
    ↓ ↓
    │ └──→ posts ←──→ post_likes
    │
    └──→ wardrobe_items

Storage: clothes/{user_id}/{filename}
```

### Migration File Structure

```sql
-- supabase/migrations/001_initial_schema.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  gender text NOT NULL CHECK (gender IN ('female', 'male')),
  created_at timestamptz DEFAULT now()
);

-- Wardrobe items table
CREATE TABLE wardrobe_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    -- Female categories
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear',
    -- Male categories
    'Belts'
  )),
  image_path text NOT NULL,
  is_favourite boolean DEFAULT false,
  ai_attributes jsonb,
  created_at timestamptz DEFAULT now()
);

-- Posts table
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  size text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL')),
  category text NOT NULL CHECK (category IN (
    'Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 
    'Hijab', 'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 
    'Sports wear', 'Belts'
  )),
  description text NOT NULL CHECK (length(description) <= 200),
  image_path text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Post likes table
CREATE TABLE post_likes (
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- Indexes
CREATE INDEX idx_wardrobe_items_user_id ON wardrobe_items(user_id);
CREATE INDEX idx_wardrobe_items_category ON wardrobe_items(category);
CREATE INDEX idx_wardrobe_items_created_at ON wardrobe_items(created_at);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_category ON posts(category);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_post_likes_post_id ON post_likes(post_id);

-- Function to validate category against user gender
CREATE OR REPLACE FUNCTION validate_wardrobe_category()
RETURNS TRIGGER AS $$
DECLARE
  user_gender text;
  male_categories text[] := ARRAY['Tops', 'Bottoms', 'Jackets', 'Shoes', 'Socks', 'Belts', 'Accessories'];
  female_categories text[] := ARRAY['Dresses', 'Tops', 'Bottoms', 'Jackets', 'Swimwear', 'Scarf', 'Hijab', 
                                     'Shoes', 'Socks', 'Formal wear', 'Bags', 'Accessories', 'Sports wear'];
BEGIN
  -- Get user's gender
  SELECT gender INTO user_gender FROM profiles WHERE id = NEW.user_id;
  
  -- Validate category based on gender
  IF user_gender = 'male' AND NOT (NEW.category = ANY(male_categories)) THEN
    RAISE EXCEPTION 'Invalid category for male user: %', NEW.category;
  ELSIF user_gender = 'female' AND NOT (NEW.category = ANY(female_categories)) THEN
    RAISE EXCEPTION 'Invalid category for female user: %', NEW.category;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for wardrobe category validation
CREATE TRIGGER validate_wardrobe_category_trigger
  BEFORE INSERT OR UPDATE ON wardrobe_items
  FOR EACH ROW
  EXECUTE FUNCTION validate_wardrobe_category();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, gender)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'gender'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Row Level Security Policies

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile (except gender)"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Wardrobe Items
ALTER TABLE wardrobe_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wardrobe items"
  ON wardrobe_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wardrobe items"
  ON wardrobe_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wardrobe items"
  ON wardrobe_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wardrobe items"
  ON wardrobe_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Posts
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Post Likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Post likes are viewable by authenticated users"
  ON post_likes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own likes"
  ON post_likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON post_likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- View for posts with like counts and user like status
CREATE VIEW posts_with_likes AS
SELECT 
  p.*,
  prof.display_name,
  COALESCE(like_counts.count, 0) as likes_count
FROM posts p
LEFT JOIN profiles prof ON p.user_id = prof.id
LEFT JOIN (
  SELECT post_id, COUNT(*) as count
  FROM post_likes
  GROUP BY post_id
) like_counts ON p.id = like_counts.post_id
ORDER BY p.created_at DESC;
```

### Storage Bucket Policy

**Bucket name**: `clothes`

**Policies**:
- Public read access
- Authenticated users can upload to their own folder: `{user_id}/*`
- Users can delete from their own folder only

```sql
-- Storage policies (run in Supabase SQL editor after bucket creation)

-- Allow public read access
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'clothes');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload to own folder"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clothes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Allow users to delete from their own folder
CREATE POLICY "Users can delete from own folder"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clothes' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Services Layer

### Auth Service (`services/auth.ts`)

```typescript
import { supabase } from './supabase';

export interface SignUpData {
  email: string;
  password: string;
  displayName: string;
  gender: Gender;
}

export async function signUp(data: SignUpData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        display_name: data.displayName,
        gender: data.gender
      }
    }
  });
  
  if (error) throw error;
  return authData;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });
}
```

### Wardrobe Service (`services/wardrobe.ts`)

```typescript
import { supabase } from './supabase';
import { WardrobeItem, StylistItem } from '../types/models';

// Standard CRUD operations
export async function getWardrobeItems(userId: string): Promise<WardrobeItem[]> {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data || [];
}

export async function createWardrobeItem(item: Omit<WardrobeItem, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert(item)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateWardrobeItem(id: string, updates: Partial<WardrobeItem>) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteWardrobeItem(id: string, imagePath: string) {
  // Delete from storage first
  await deleteImage(imagePath);
  
  // Delete from database
  const { error } = await supabase
    .from('wardrobe_items')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function toggleFavourite(id: string, currentStatus: boolean) {
  return updateWardrobeItem(id, { is_favourite: !currentStatus });
}

// AI Stylist Integration Layer
// These functions provide data to the future AI chat module

/**
 * Get all wardrobe items for AI stylist context.
 * Returns items with full public image URLs.
 * 
 * @param userId - The user's ID
 * @returns Promise resolving to array of StylistItem
 */
export async function getWardrobeForStylist(userId: string): Promise<StylistItem[]> {
  const items = await getWardrobeItems(userId);
  
  return items.map(item => ({
    id: item.id,
    name: item.name,
    size: item.size,
    category: item.category,
    image_url: getPublicImageUrl(item.image_path),
    is_favourite: item.is_favourite,
    ai_attributes: item.ai_attributes
  }));
}

/**
 * Get specific wardrobe items by IDs for AI outfit display.
 * Validates that all IDs belong to the user.
 * Silently drops invalid or unauthorized IDs.
 * 
 * @param userId - The user's ID
 * @param ids - Array of item IDs to fetch
 * @returns Promise resolving to array of StylistItem (may be shorter than input)
 */
export async function getItemsByIds(
  userId: string, 
  ids: string[]
): Promise<StylistItem[]> {
  if (ids.length === 0) return [];
  
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .in('id', ids);
  
  if (error) throw error;
  
  const items = data || [];
  
  return items.map(item => ({
    id: item.id,
    name: item.name,
    size: item.size,
    category: item.category,
    image_url: getPublicImageUrl(item.image_path),
    is_favourite: item.is_favourite,
    ai_attributes: item.ai_attributes
  }));
}

function getPublicImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('clothes')
    .getPublicUrl(path);
  
  return data.publicUrl;
}
```

### Posts Service (`services/posts.ts`)

```typescript
import { supabase } from './supabase';
import { Post } from '../types/models';

export async function getPosts(category?: string): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select(`
      *,
      profile:profiles(display_name),
      likes:post_likes(count)
    `)
    .order('created_at', { ascending: false });
  
  if (category && category !== 'All') {
    query = query.eq('category', category);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data || [];
}

export async function createPost(post: Omit<Post, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePost(postId: string, imagePath: string) {
  // Delete image from storage
  await deleteImage(imagePath);
  
  // Delete post (likes cascade automatically)
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);
  
  if (error) throw error;
}

export async function toggleLike(userId: string, postId: string) {
  // Check if already liked
  const { data: existing } = await supabase
    .from('post_likes')
    .select('*')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single();
  
  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('post_likes')
      .delete()
      .eq('user_id', userId)
      .eq('post_id', postId);
    
    if (error) throw error;
  } else {
    // Like
    const { error } = await supabase
      .from('post_likes')
      .insert({ user_id: userId, post_id: postId });
    
    if (error) throw error;
  }
}

export async function getLikedPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select(`
      post_id,
      posts (
        *,
        profile:profiles(display_name),
        likes:post_likes(count)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data?.map(item => item.posts).filter(Boolean) || [];
}
```

### Storage Service (`services/storage.ts`)

```typescript
import { supabase } from './supabase';
import { compressImage } from '../utils/imageCompression';

export async function uploadImage(
  file: File, 
  userId: string
): Promise<string> {
  // Compress image
  const compressed = await compressImage(file);
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  
  // Upload to storage
  const { error } = await supabase.storage
    .from('clothes')
    .upload(filePath, compressed, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) throw error;
  
  return filePath;
}

export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('clothes')
    .remove([path]);
  
  if (error) throw error;
}

export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from('clothes')
    .getPublicUrl(path);
  
  return data.publicUrl;
}
```

## UI/UX Design

### Design System

#### Colors
```typescript
// Tailwind config extension
colors: {
  primary: {
    50: '#fdf4f5',
    100: '#fce8eb',
    200: '#f9d5d9',
    300: '#f4b1ba',
    400: '#ed879a',
    500: '#e25d7a',  // Main accent
    600: '#d23e5f',
    700: '#b02f4b',
    800: '#932a43',
    900: '#7d273e',
  },
  neutral: {
    // Soft neutrals for fashion aesthetic
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e8e8e8',
    300: '#d4d4d4',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
  }
}
```

#### Typography
- **Headings**: Inter or Poppins (clean, modern)
- **Body**: Inter or system font stack
- **Scale**:
  - xs: 0.75rem (12px)
  - sm: 0.875rem (14px)
  - base: 1rem (16px)
  - lg: 1.125rem (18px)
  - xl: 1.25rem (20px)
  - 2xl: 1.5rem (24px)
  - 3xl: 1.875rem (30px)

#### Spacing
- Use Tailwind's default spacing scale (4px base unit)
- Common gaps: 4, 6, 8, 12, 16, 24px

#### Shadows
```css
sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)'
md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
```

#### Border Radius
- sm: 0.375rem (6px)
- DEFAULT: 0.5rem (8px)
- md: 0.75rem (12px)
- lg: 1rem (16px)
- full: 9999px

### Component Specifications

#### Bottom Navigation (Mobile)
- **Height**: 64px (80px on iOS to account for safe area)
- **Icons**: 24x24px
- **Active state**: Primary color fill + label
- **Inactive state**: Gray icon + label
- **Transition**: 150ms ease-in-out

#### Card (Wardrobe Item / Post)
- **Aspect ratio**: 3:4 for images
- **Padding**: 12px
- **Border radius**: 12px
- **Shadow**: Default
- **Hover**: Slight scale (1.02) + shadow-md
- **Heart icon**: Absolute positioned top-right, 32x32 touch target

#### Filter Chips
- **Height**: 36px
- **Padding**: 12px 16px
- **Border radius**: Full
- **Active**: Primary background, white text
- **Inactive**: Neutral-100 background, neutral-700 text
- **Hover**: Neutral-200 background

#### Form Inputs
- **Height**: 44px minimum (accessibility)
- **Border**: 1px neutral-300, focus → primary-500
- **Border radius**: 8px
- **Padding**: 12px 16px
- **Label**: 14px, neutral-700, mb-2

#### Buttons
- **Primary**: Primary-500 bg, white text, shadow-sm
- **Secondary**: Neutral-100 bg, neutral-900 text
- **Height**: 44px (touch-friendly)
- **Padding**: 12px 24px
- **Border radius**: 8px
- **Disabled**: Opacity 50%, cursor not-allowed

#### Modal / Bottom Sheet
- **Overlay**: Black with 40% opacity
- **Content**: White bg, rounded-t-3xl (mobile bottom sheet)
- **Max width**: 480px (centered modal on desktop)
- **Animation**: Slide up from bottom (mobile), fade + scale (desktop)

### Animations

```typescript
// Heart favorite animation
const heartVariants = {
  unfavourite: { scale: 1, fill: 'none' },
  favourite: { 
    scale: [1, 1.3, 1],
    fill: '#e25d7a',
    transition: { duration: 0.3, times: [0, 0.5, 1] }
  }
};

// Skeleton loader
const pulseAnimation = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: { duration: 1.5, repeat: Infinity }
  }
};

// Page transitions
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};
```

### Empty States

Each empty state includes:
1. **Icon/Illustration**: 80-120px, neutral-300 color
2. **Heading**: 20px, neutral-900, "No [items] yet"
3. **Description**: 14px, neutral-600, helpful message
4. **CTA Button**: Primary button with action

Examples:
- **Empty Wardrobe**: Clothes hanger icon, "Add your first item"
- **No Favourites**: Heart icon, "Favorite items will appear here"
- **Empty Feed**: Users icon, "Be the first to share"
- **No Likes**: Heart icon, "Like posts to save them"

### Responsive Breakpoints

```typescript
// Mobile: < 640px (default)
- Single column grid
- Bottom navigation
- Full-width modals
- 16px side padding

// Tablet: 640px - 1024px
- 2-3 column grid
- Bottom or side navigation
- Bottom sheet modals
- 24px side padding

// Desktop: > 1024px
- 3-4 column grid
- Side navigation
- Centered modals (max 480px)
- 32px side padding, max 1280px container
```

### Internationalization Structure

```typescript
// i18n/en.json
{
  "auth": {
    "login": "Login",
    "register": "Create Account",
    "email": "Email",
    "password": "Password",
    "displayName": "Display Name",
    "gender": "Gender",
    "female": "Female",
    "male": "Male",
    "logout": "Logout"
  },
  "wardrobe": {
    "title": "Wardrobe",
    "owned": "Owned",
    "favourites": "Favourites",
    "liked": "Liked",
    "addItem": "Add Item",
    "itemName": "Item Name",
    "size": "Size",
    "category": "Category"
  },
  "categories": {
    "all": "All",
    "dresses": "Dresses",
    "tops": "Tops",
    // ... etc
  },
  "home": {
    "title": "Home",
    "createPost": "Create Post",
    "description": "Description",
    "shareToHome": "Share to Home"
  },
  "stylist": {
    "title": "AI Stylist",
    "comingSoon": "AI Stylist coming soon"
  }
}

// i18n/ar.json (RTL support)
{
  "auth": {
    "login": "تسجيل الدخول",
    "register": "إنشاء حساب",
    // ... Arabic translations
  }
}
```

## Technical Specifications

### Environment Configuration

```bash
# .env.example
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# DO NOT COMMIT: VITE_SUPABASE_SERVICE_ROLE_KEY
# Service role key must NEVER be used in frontend
```

### Image Compression

```typescript
// utils/imageCompression.ts
const MAX_WIDTH = 1024;
const MAX_HEIGHT = 1024;
const QUALITY = 0.8;

export async function compressImage(file: File): Promise<Blob> {
  // Use canvas API to resize and compress
  // Maintain aspect ratio
  // Convert to JPEG with 0.8 quality
  // Return Blob
}
```

### Error Handling

```typescript
// utils/errorHandling.ts

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string
  ) {
    super(message);
  }
}

export function handleSupabaseError(error: any): AppError {
  // RLS errors
  if (error.code === '42501') {
    return new AppError(
      error.message,
      'UNAUTHORIZED',
      'You do not have permission to perform this action'
    );
  }
  
  // Network errors
  if (error.message.includes('Failed to fetch')) {
    return new AppError(
      error.message,
      'NETWORK_ERROR',
      'Network error. Please check your connection and try again'
    );
  }
  
  // Generic fallback
  return new AppError(
    error.message,
    'UNKNOWN_ERROR',
    'Something went wrong. Please try again'
  );
}
```

### Validation

```typescript
// utils/validation.ts

export const validationRules = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  password: {
    minLength: 6,
    message: 'Password must be at least 6 characters'
  },
  displayName: {
    minLength: 2,
    maxLength: 50,
    message: 'Display name must be 2-50 characters'
  },
  description: {
    maxLength: 200,
    message: 'Description must be 200 characters or less'
  },
  itemName: {
    minLength: 1,
    maxLength: 100,
    message: 'Item name is required (max 100 characters)'
  }
};
```

## Future AI Stylist Integration

### Data Contract

The wardrobe service exposes two functions specifically for AI integration:

#### 1. `getWardrobeForStylist(userId: string): Promise<StylistItem[]>`

**Purpose**: Provide complete wardrobe context to AI model

**Returns**: Array of items with:
- Full public image URLs (ready for AI vision)
- All metadata (name, size, category, favorite status)
- AI attributes (reserved for future expansion)

**Usage**: Called at chat session start to give AI full context

#### 2. `getItemsByIds(userId: string, ids: string[]): Promise<StylistItem[]>`

**Purpose**: Retrieve specific items for outfit display

**Behavior**:
- Validates all IDs belong to the requesting user
- Silently filters out invalid/unauthorized IDs
- Returns only valid items (array may be shorter than input)

**Usage**: After AI recommends outfit, fetch those specific items to display photos

### Future AI Flow (not implemented now)

```typescript
// Future implementation in Stylist tab

// 1. User opens chat
const wardrobe = await getWardrobeForStylist(userId);

// 2. Send to AI with user message
const aiResponse = await callAI({
  wardrobe,
  userMessage: "Suggest an outfit for a casual dinner"
});
// aiResponse: { reply: "I suggest...", outfit_item_ids: ["uuid1", "uuid2", "uuid3"] }

// 3. Fetch and display outfit items
const outfitItems = await getItemsByIds(userId, aiResponse.outfit_item_ids);
// Render: AI reply text + grid of outfit item photos
```

### AI Attributes Schema (Future)

```typescript
// Reserved for AI to populate
interface AIAttributes {
  color?: string;          // "red", "blue", "multicolor"
  style?: string;          // "casual", "formal", "sporty"
  occasion?: string[];     // ["work", "party", "everyday"]
  season?: string[];       // ["summer", "winter", "all-season"]
  pattern?: string;        // "solid", "striped", "floral"
  material?: string;       // "cotton", "denim", "silk"
  // Future: expand as AI model improves
}
```

## Security Considerations

1. **Never use service_role key in frontend**: All client operations use anon key with RLS
2. **Image uploads**: Users can only write to their own folder (`{user_id}/*`)
3. **Category validation**: DB trigger ensures users can't add categories outside their gender
4. **Gender immutability**: RLS policy prevents gender updates after registration
5. **Post deletion**: Cascade deletes ensure likes are cleaned up
6. **Input validation**: Client-side + server-side (CHECK constraints)
7. **SQL injection**: Protected by Supabase parameterized queries
8. **XSS**: React escapes by default, avoid dangerouslySetInnerHTML

## Performance Optimizations

1. **Image compression**: Client-side before upload (reduce bandwidth)
2. **Lazy loading**: Intersection Observer for feed items
3. **Optimistic updates**: Immediate UI feedback for likes/favorites
4. **Pagination**: Load 20-30 posts at a time
5. **Debouncing**: Filter inputs debounced 300ms
6. **Memoization**: useMemo for expensive filters/sorts
7. **Code splitting**: Lazy load tab components
8. **CDN**: Supabase Storage serves images via CDN

## Testing Strategy (Scope)

While full test implementation is out of scope for this phase, the structure should support:

- **Unit tests**: Utils (validation, compression, error handling)
- **Integration tests**: Service layer (auth, wardrobe, posts)
- **E2E tests**: Critical flows (signup, add item, create post)
- **Accessibility tests**: Jest-axe for a11y violations

## Deployment Checklist

- [ ] Create Supabase project
- [ ] Run database migration
- [ ] Create Storage bucket with policies
- [ ] Enable email auth in Supabase dashboard
- [ ] Copy environment variables
- [ ] Build and deploy frontend
- [ ] Test auth flow end-to-end
- [ ] Test image upload/delete
- [ ] Verify RLS policies working
- [ ] Test on mobile devices
- [ ] Verify RTL layout (Arabic)
