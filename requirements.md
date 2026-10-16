# Requirements: Fashion Wardrobe & Community App

## Overview
A mobile-first fashion wardrobe management and community feed application with foundational data layer for future AI stylist integration. Users manage their clothing collection, share items with the community, and interact through likes and favorites.

## Technology Stack

### Frontend
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS (mobile-first, responsive)
- **Navigation**: Bottom tab navigation (mobile), side/top navigation (desktop)
- **Internationalization**: Structured for i18n (English + Arabic), RTL-ready
- **Image Handling**: Client-side compression (max 1024px)

### Backend
- **Platform**: Supabase
- **Auth**: Email + password authentication
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Storage**: Supabase Storage for images
- **Client Library**: @supabase/supabase-js

### Security & Configuration
- Environment variables via `.env` (create `.env.example` with placeholders)
- Required keys: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **CRITICAL**: service_role key must NEVER be used in frontend or committed
- All security enforced through RLS policies

## User Authentication

### Registration
- **Fields**: Email, password, display name (required), gender (required: Female or Male)
- **Validation**: Client-side validation for all fields
- **Database**: Profile created via trigger on auth.users insert
- **Metadata**: Display name and gender stored in signup metadata for trigger
- **Constraints**: Gender is immutable after registration (affects category lists)

### Login
- Email + password authentication
- Validation, loading states, friendly error messages
- Persistent sessions

### Protected Routes
- Logged-out users → Login page
- Logged-in users → Main app
- Logout button accessible throughout app

## Application Structure

### Main Tabs (3)

1. **Wardrobe** (full implementation)
2. **Home** (full implementation)
3. **Stylist** (placeholder only: "AI Stylist coming soon" with clean empty state)

## Wardrobe Tab

### Sub-tabs (3, segmented control)

#### 1. Owned
- **Display**: Grid view of user's clothing items
- **Item Card**: Image thumbnail, name, size, category
- **Add Item** (+ button):
  - Photo upload (camera/gallery) with preview
  - Client-side compression (max 1024px)
  - Name (text, required)
  - Size dropdown: S, M, L, XL, 2XL, 3XL
  - Category dropdown (gender-specific):
    - **Female**: Dresses, Tops, Bottoms, Jackets, Swimwear, Scarf, Hijab, Shoes, Socks, Formal wear, Bags, Accessories, Sports wear
    - **Male**: Tops, Bottoms, Jackets, Shoes, Socks, Belts, Accessories
- **Favorite Action**: Heart icon on each card
  - Toggle favorite status with animation
  - Red heart when favorited
  - Item appears in Favourites sub-tab
- **Edit/Delete**: Available for each item
  - Delete removes item and its Storage image
- **Filter**: Category filter chips above grid

#### 2. Favourites
- Display user's owned items marked as favorite
- Same card design with red heart
- Tap heart to unfavorite (removes from this view)

#### 3. Liked
- Display Home feed posts that user has liked
- Tap heart to unlike (removes from this view)

## Home Tab

### Feed
- **Content**: All users' posts, newest first
- **Loading**: Pagination or infinite scroll
- **Post Card**:
  - Photo
  - Item name
  - Size
  - Category
  - Description (max 200 characters)
  - Poster display name
  - Like button (heart) with count
- **Create Post** (+ button):
  - Same fields as Owned item form
  - Plus: description field (max 200 chars)
- **Share to Home**: Action on owned items
  - Opens post form prefilled with item data
  - User adds description
- **Filtering**: Category filter chips (ALL categories from both genders + "All" option)
- **Delete**: Users can delete their own posts only
- **Like**: Adds post to Wardrobe → Liked sub-tab

## Database Schema

### Tables

#### profiles
```sql
id              uuid PRIMARY KEY REFERENCES auth.users
display_name    text NOT NULL
gender          text NOT NULL CHECK (gender IN ('female', 'male'))
created_at      timestamptz DEFAULT now()
```

#### wardrobe_items
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
name            text NOT NULL
size            text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL'))
category        text NOT NULL
image_path      text NOT NULL
is_favourite    boolean DEFAULT false
ai_attributes   jsonb NULL
created_at      timestamptz DEFAULT now()
```
- **ai_attributes**: Reserved for AI stylist (color, style, occasion, season). NULL for now.
- **Category constraint**: Check against combined list of all allowed categories
- **Gender validation**: DB trigger/function to validate category against user's gender

#### posts
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES profiles(id)
name            text NOT NULL
size            text NOT NULL CHECK (size IN ('S', 'M', 'L', 'XL', '2XL', '3XL'))
category        text NOT NULL
description     text NOT NULL CHECK (length(description) <= 200)
image_path      text NOT NULL
created_at      timestamptz DEFAULT now()
```

#### post_likes
```sql
user_id         uuid NOT NULL REFERENCES profiles(id)
post_id         uuid NOT NULL REFERENCES posts(id)
created_at      timestamptz DEFAULT now()
PRIMARY KEY (user_id, post_id)
```

### Storage

#### Bucket: `clothes`
- **Read**: Public
- **Upload/Delete**: Only within user's own folder `{user_id}/...`
- **Policy**: User-scoped write access

### Row Level Security (RLS)

#### profiles
- **SELECT**: All authenticated users (read display names)
- **UPDATE**: Users can update only their own row, excluding gender field
- **INSERT**: Handled by trigger (no direct inserts)

#### wardrobe_items
- **ALL**: Users have full CRUD access to their own rows only

#### posts
- **SELECT**: All authenticated users
- **INSERT**: All authenticated users
- **UPDATE/DELETE**: Users can modify only their own posts

#### post_likes
- **ALL**: Users can manage only their own likes
- Like count readable by all (via view or aggregated query)

### Indexes
- `wardrobe_items(user_id)`
- `wardrobe_items(category)`
- `wardrobe_items(created_at)`
- `posts(user_id)`
- `posts(category)`
- `posts(created_at DESC)`
- `post_likes(post_id)`

### Database Triggers
- **Profile Creation**: Trigger on `auth.users` insert to create `profiles` row from signup metadata

## AI Stylist Integration Layer

### Data Contract (build now, AI later)

**File**: `src/services/wardrobe.ts`

#### Export 1: `getWardrobeForStylist(userId: string): Promise<StylistItem[]>`
- Returns all owned items for the user
- **StylistItem type**:
  ```typescript
  {
    id: string;
    name: string;
    size: string;
    category: string;
    image_url: string;  // Full public URL
    is_favourite: boolean;
    ai_attributes: AIAttributes | null;
  }
  ```

#### Export 2: `getItemsByIds(userId: string, ids: string[]): Promise<StylistItem[]>`
- Returns items matching provided IDs
- Validates IDs belong to the user
- Drops invalid/unauthorized IDs silently
- Returns same StylistItem type

#### Future Flow (not implemented now)
1. Chat UI sends wardrobe via `getWardrobeForStylist()` to LLM
2. LLM returns `{ reply: string, outfit_item_ids: string[] }`
3. UI calls `getItemsByIds()` to fetch and display outfit photos

## Design Requirements

### Visual Design
- **Style**: Modern, clean, fashion-boutique aesthetic
- **Palette**: Soft neutrals with one accent color
- **Components**: Rounded cards, subtle shadows
- **Typography**: Clear hierarchy with readable sizes

### Animations & Feedback
- Smooth transitions (150-300ms)
- Skeleton loaders for async content
- Optimistic UI for heart/like interactions
- Toast notifications for success/error states
- Heart animation on favorite/like

### Empty States
- Illustrations or icons
- Clear messaging
- Call-to-action button
- Applied to: empty wardrobe, empty feed, no favorites, no likes

### Accessibility
- Form labels and ARIA attributes
- Focus states on all interactive elements
- WCAG AA contrast ratios (minimum 4.5:1 for text)
- Touch targets minimum 44x44px
- Keyboard navigation support

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Bottom tabs on mobile
- Side or top navigation on desktop
- Adaptive grid columns (1-2-3-4 based on viewport)

### Internationalization (i18n)
- All UI strings structured for translation
- English and Arabic support
- RTL layout support for Arabic
- No hardcoded strings in components
- Translation keys organized by feature

## Quality Requirements

### TypeScript
- Strict mode enabled
- No `any` types in data layer
- Explicit return types for functions
- Proper type definitions for all API responses
- Shared types file for common interfaces

### Error Handling
- Network errors with retry option
- Upload failures with clear messaging
- RLS policy violations (friendly error, not raw SQL)
- Form validation errors (inline + summary)
- Graceful degradation for missing images

### Performance
- Image compression before upload
- Lazy loading for feed items
- Optimistic updates for likes/favorites
- Debounced search/filter inputs
- Minimal re-renders with proper memoization

### Code Organization
- Feature-based folder structure
- Separation of concerns (UI / logic / data)
- Reusable components
- Custom hooks for shared logic
- Clear naming conventions

## Documentation

### README.md
Must include:
1. **Setup Instructions**:
   - Create Supabase project
   - Run database migration
   - Create Storage bucket
   - Copy `.env.example` to `.env`
   - Add Supabase credentials
2. **Installation**: `npm install`
3. **Development**: `npm run dev`
4. **Build**: `npm run build`
5. **Project structure overview**
6. **Available scripts**

### Code Comments
- Complex logic explained
- Data contracts documented
- Type definitions with JSDoc
- Migration files with rollback instructions

## Out of Scope (This Phase)

- AI chat functionality (Stylist tab is placeholder)
- AI-powered outfit recommendations
- Social features beyond likes (comments, follows, messages)
- Advanced search
- User profile pages
- Outfit collections/albums
- Calendar/planning features
- Analytics or insights
- Email notifications
- Password reset flow (use Supabase default)
- Social login (Google, Apple, etc.)

## Success Criteria

1. Users can register and login with email/password
2. Users can add, edit, delete, and favorite wardrobe items
3. Users can create posts and share items to community feed
4. Users can like posts from other users
5. All data persists correctly with proper RLS enforcement
6. Images upload to Storage with correct permissions
7. Category filtering works correctly
8. Gender-specific categories display appropriately
9. AI stylist data layer functions return correct typed data
10. App is responsive and works on mobile and desktop
11. All UI strings are structured for i18n
12. README instructions successfully set up the project
