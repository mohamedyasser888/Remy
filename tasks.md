# Implementation Tasks: Fashion Wardrobe & Community App

## Phase 1: Project Setup & Configuration

### Task 1.1: Initialize Project Structure
- [ ] Create Vite + React + TypeScript project
- [ ] Install dependencies: @supabase/supabase-js, tailwindcss, react-router-dom
- [ ] Configure Tailwind CSS with custom design tokens
- [ ] Set up folder structure (components, pages, services, hooks, types, utils, i18n)
- [ ] Create `.env.example` with required keys
- [ ] Add `.env` to `.gitignore`

### Task 1.2: Configure TypeScript
- [ ] Enable strict mode in `tsconfig.json`
- [ ] Configure path aliases for cleaner imports
- [ ] Set up type checking scripts

### Task 1.3: Set Up Supabase Client
- [ ] Create `src/services/supabase.ts` with client initialization
- [ ] Export typed Supabase client
- [ ] Handle missing environment variables gracefully

### Task 1.4: Create Base Type Definitions
- [ ] Define `Gender`, `Size`, `Category` types in `src/types/models.ts`
- [ ] Define `Profile`, `WardrobeItem`, `Post`, `PostLike` interfaces
- [ ] Define `StylistItem`, `AIAttributes` interfaces for AI integration layer
- [ ] Export all types from `src/types/index.ts`

## Phase 2: Database & Storage Setup

### Task 2.1: Create Database Migration
- [ ] Create `supabase/migrations/001_initial_schema.sql`
- [ ] Define `profiles` table with gender constraint
- [ ] Define `wardrobe_items` table with size/category constraints
- [ ] Define `posts` table with description length constraint
- [ ] Define `post_likes` table with composite primary key
- [ ] Add all necessary indexes
- [ ] Create `validate_wardrobe_category()` function and trigger
- [ ] Create `handle_new_user()` function and trigger for profile creation
- [ ] Document rollback instructions

### Task 2.2: Implement Row Level Security
- [ ] Enable RLS on all tables
- [ ] Create policies for `profiles` (read all, update own except gender)
- [ ] Create policies for `wardrobe_items` (full CRUD on own rows)
- [ ] Create policies for `posts` (read all, CRUD own rows)
- [ ] Create policies for `post_likes` (manage own likes)
- [ ] Create `posts_with_likes` view for efficient querying
- [ ] Test policies with different user scenarios

### Task 2.3: Configure Storage Bucket
- [ ] Document Storage bucket creation steps (`clothes`)
- [ ] Document public read policy
- [ ] Document user upload policy (own folder only: `{user_id}/*`)
- [ ] Document user delete policy (own folder only)

## Phase 3: Utilities & Helpers

### Task 3.1: Image Compression Utility
- [ ] Implement `compressImage()` in `src/utils/imageCompression.ts`
- [ ] Use Canvas API for client-side resize (max 1024px)
- [ ] Maintain aspect ratio
- [ ] Apply JPEG compression (0.8 quality)
- [ ] Return Blob for upload
- [ ] Handle errors gracefully

### Task 3.2: Validation Utilities
- [ ] Create `src/utils/validation.ts` with validation rules
- [ ] Email validation (regex pattern)
- [ ] Password validation (min length)
- [ ] Display name validation (length range)
- [ ] Description validation (max length)
- [ ] Item name validation (required, max length)
- [ ] Export reusable validation functions

### Task 3.3: Constants & Configuration
- [ ] Create `src/utils/constants.ts`
- [ ] Define `FEMALE_CATEGORIES` array
- [ ] Define `MALE_CATEGORIES` array
- [ ] Define `ALL_CATEGORIES` (union of both)
- [ ] Define `SIZES` array
- [ ] Define image compression constants
- [ ] Define pagination constants

### Task 3.4: Error Handling
- [ ] Create `AppError` class in `src/utils/errorHandling.ts`
- [ ] Implement `handleSupabaseError()` for friendly error messages
- [ ] Map RLS errors (42501) to user-friendly messages
- [ ] Map network errors
- [ ] Map storage errors
- [ ] Export error utility functions

## Phase 4: Services Layer

### Task 4.1: Auth Service
- [ ] Create `src/services/auth.ts`
- [ ] Implement `signUp(data: SignUpData)` with metadata
- [ ] Implement `signIn(email, password)`
- [ ] Implement `signOut()`
- [ ] Implement `onAuthStateChange(callback)`
- [ ] Implement `getCurrentUser()`
- [ ] Type all return values strictly (no `any`)

### Task 4.2: Storage Service
- [ ] Create `src/services/storage.ts`
- [ ] Implement `uploadImage(file, userId)` with compression
- [ ] Generate unique filenames with timestamp + random string
- [ ] Implement `deleteImage(path)`
- [ ] Implement `getImageUrl(path)` for public URLs
- [ ] Handle upload failures with retries
- [ ] Type all functions strictly

### Task 4.3: Wardrobe Service (CRUD)
- [ ] Create `src/services/wardrobe.ts`
- [ ] Implement `getWardrobeItems(userId)`
- [ ] Implement `createWardrobeItem(item)`
- [ ] Implement `updateWardrobeItem(id, updates)`
- [ ] Implement `deleteWardrobeItem(id, imagePath)` (delete image + DB)
- [ ] Implement `toggleFavourite(id, currentStatus)`
- [ ] Handle all errors with `handleSupabaseError`

### Task 4.4: Wardrobe Service (AI Integration Layer)
- [ ] Implement `getWardrobeForStylist(userId): Promise<StylistItem[]>`
- [ ] Map `WardrobeItem` to `StylistItem` with full image URLs
- [ ] Implement `getItemsByIds(userId, ids): Promise<StylistItem[]>`
- [ ] Validate IDs belong to user
- [ ] Filter out invalid IDs silently
- [ ] Return typed `StylistItem[]`
- [ ] Add JSDoc comments explaining AI integration contract

### Task 4.5: Posts Service
- [ ] Create `src/services/posts.ts`
- [ ] Implement `getPosts(category?)` with optional filter
- [ ] Join with profiles for display name
- [ ] Aggregate like counts
- [ ] Implement `createPost(post)`
- [ ] Implement `deletePost(postId, imagePath)` (delete image + DB + cascade likes)
- [ ] Implement `toggleLike(userId, postId)` (check existing, insert or delete)
- [ ] Implement `getLikedPosts(userId)` for Liked sub-tab
- [ ] Handle all errors gracefully

## Phase 5: Custom Hooks

### Task 5.1: useAuth Hook
- [ ] Create `src/hooks/useAuth.ts`
- [ ] Manage auth state (user, session, profile, loading)
- [ ] Subscribe to auth state changes
- [ ] Fetch user profile from `profiles` table
- [ ] Provide `signUp`, `signIn`, `signOut` functions
- [ ] Handle loading and error states
- [ ] Persist session automatically

### Task 5.2: useWardrobe Hook
- [ ] Create `src/hooks/useWardrobe.ts`
- [ ] Fetch wardrobe items on mount
- [ ] Provide `addItem`, `updateItem`, `deleteItem`, `toggleFavourite` functions
- [ ] Optimistic updates for favorites
- [ ] Handle loading and error states
- [ ] Invalidate/refetch after mutations

### Task 5.3: usePosts Hook
- [ ] Create `src/hooks/usePosts.ts`
- [ ] Fetch posts with pagination/infinite scroll
- [ ] Provide `createPost`, `deletePost`, `toggleLike` functions
- [ ] Optimistic updates for likes (increment/decrement count)
- [ ] Handle loading and error states
- [ ] Support category filtering

### Task 5.4: useImageUpload Hook
- [ ] Create `src/hooks/useImageUpload.ts`
- [ ] Handle file selection (camera/gallery)
- [ ] Generate preview URL
- [ ] Compress image
- [ ] Upload to storage
- [ ] Return image path or error
- [ ] Manage upload progress state

## Phase 6: Internationalization

### Task 6.1: i18n Setup
- [ ] Install i18n library (e.g., react-i18next or custom solution)
- [ ] Create `src/i18n/en.json` with all English strings
- [ ] Create `src/i18n/ar.json` with all Arabic strings
- [ ] Organize by feature (auth, wardrobe, home, stylist, categories, common)
- [ ] Create `src/i18n/index.ts` with i18n initialization
- [ ] Detect user language preference
- [ ] Provide language toggle (English ↔ Arabic)

### Task 6.2: RTL Support
- [ ] Configure Tailwind for RTL with `dir` attribute
- [ ] Test all layouts in RTL mode
- [ ] Ensure icons flip appropriately (arrows, etc.)
- [ ] Test navigation (left ↔ right)
- [ ] Verify text alignment (start/end instead of left/right)

## Phase 7: Common Components

### Task 7.1: Layout Components
- [ ] Create `src/components/layout/BottomNav.tsx` (mobile)
- [ ] Create `src/components/layout/SideNav.tsx` (desktop)
- [ ] Create `src/components/layout/AppLayout.tsx` with responsive nav
- [ ] Highlight active tab
- [ ] Handle navigation between tabs

### Task 7.2: Form Components
- [ ] Create `src/components/common/Input.tsx` (text input with validation)
- [ ] Create `src/components/common/Select.tsx` (dropdown)
- [ ] Create `src/components/common/Button.tsx` (primary, secondary, loading)
- [ ] Create `src/components/common/FileUpload.tsx` (image picker with preview)
- [ ] All components accessible (labels, ARIA, focus states)
- [ ] Touch-friendly (44px minimum)

### Task 7.3: Feedback Components
- [ ] Create `src/components/common/Toast.tsx` (notifications)
- [ ] Create `src/components/common/Loader.tsx` (spinner, skeleton)
- [ ] Create `src/components/common/EmptyState.tsx` (icon, text, CTA)
- [ ] Create `src/components/common/ErrorBoundary.tsx`

### Task 7.4: Modal Components
- [ ] Create `src/components/common/Modal.tsx` (desktop centered)
- [ ] Create `src/components/common/BottomSheet.tsx` (mobile slide-up)
- [ ] Responsive: modal on desktop, bottom sheet on mobile
- [ ] Handle overlay click to close
- [ ] Trap focus within modal

### Task 7.5: Display Components
- [ ] Create `src/components/common/Card.tsx` (rounded, shadow)
- [ ] Create `src/components/common/FilterChips.tsx` (category filters)
- [ ] Create `src/components/common/HeartButton.tsx` (animated like/favorite)

## Phase 8: Authentication Pages

### Task 8.1: Login Page
- [ ] Create `src/pages/auth/Login.tsx`
- [ ] Email and password inputs with validation
- [ ] Show validation errors inline
- [ ] Loading state during sign-in
- [ ] Display friendly error messages (wrong credentials, network error)
- [ ] Link to Register page
- [ ] Redirect to app after successful login

### Task 8.2: Register Page
- [ ] Create `src/pages/auth/Register.tsx`
- [ ] Email, password, display name, gender inputs
- [ ] Gender radio buttons (Female, Male)
- [ ] Validate all fields before submit
- [ ] Loading state during sign-up
- [ ] Display friendly error messages (email taken, weak password)
- [ ] Link to Login page
- [ ] Redirect to app after successful registration

### Task 8.3: Protected Routes
- [ ] Create `src/components/layout/ProtectedRoute.tsx`
- [ ] Redirect to Login if not authenticated
- [ ] Show loading while checking auth state
- [ ] Redirect to app if already authenticated (Login/Register pages)

## Phase 9: Wardrobe Tab

### Task 9.1: Wardrobe Layout
- [ ] Create `src/pages/wardrobe/Wardrobe.tsx`
- [ ] Implement segmented control for 3 sub-tabs (Owned, Favourites, Liked)
- [ ] State management for active sub-tab
- [ ] Render appropriate sub-tab content

### Task 9.2: Owned Sub-tab
- [ ] Create `src/pages/wardrobe/OwnedTab.tsx`
- [ ] Fetch user's wardrobe items with `useWardrobe` hook
- [ ] Display in responsive grid (1/2/3/4 columns)
- [ ] Each card: image, name, size, category, heart button
- [ ] Heart button toggles favorite with animation
- [ ] Category filter chips at top (user's gender-specific categories)
- [ ] Filter logic (All or specific category)
- [ ] "+" button to open Add Item form
- [ ] Empty state if no items
- [ ] Skeleton loader while fetching

### Task 9.3: Add/Edit Item Form
- [ ] Create `src/components/features/wardrobe/ItemForm.tsx`
- [ ] Modal/bottom sheet layout
- [ ] Image upload with preview
- [ ] Name input (required)
- [ ] Size dropdown (S, M, L, XL, 2XL, 3XL)
- [ ] Category dropdown (filtered by user's gender)
- [ ] Validation before submit
- [ ] Loading state during save
- [ ] Handle upload errors
- [ ] Success toast on save
- [ ] Close modal after save
- [ ] Support edit mode (prefill values)

### Task 9.4: Item Card Component
- [ ] Create `src/components/features/wardrobe/ItemCard.tsx`
- [ ] Display image with 3:4 aspect ratio
- [ ] Display name, size, category
- [ ] Heart button (absolute positioned top-right)
- [ ] Heart animation on toggle (scale + color change)
- [ ] Red heart if favorited, outlined if not
- [ ] Edit and delete actions (icon buttons or menu)
- [ ] Confirm before delete
- [ ] Delete from storage + database
- [ ] Optimistic UI for favorite toggle

### Task 9.5: Favourites Sub-tab
- [ ] Create `src/pages/wardrobe/FavouritesTab.tsx`
- [ ] Filter owned items where `is_favourite = true`
- [ ] Display in same grid layout as Owned
- [ ] Same ItemCard component (with red heart)
- [ ] Tap heart to unfavorite (removes from this view)
- [ ] Empty state if no favorites

### Task 9.6: Liked Sub-tab
- [ ] Create `src/pages/wardrobe/LikedTab.tsx`
- [ ] Fetch liked posts with `getLikedPosts()`
- [ ] Display in grid layout
- [ ] Each card: post image, name, size, category, poster name, heart button
- [ ] Tap heart to unlike (removes from this view)
- [ ] Optimistic update
- [ ] Empty state if no likes

## Phase 10: Home Tab

### Task 10.1: Home Feed Layout
- [ ] Create `src/pages/home/Home.tsx`
- [ ] Fetch all posts with `usePosts` hook
- [ ] Display in scrollable grid or list
- [ ] Implement pagination or infinite scroll
- [ ] Category filter chips at top (ALL categories + "All" option)
- [ ] Filter logic
- [ ] "+" button to open Create Post form
- [ ] Empty state if no posts
- [ ] Skeleton loader while fetching

### Task 10.2: Post Card Component
- [ ] Create `src/components/features/home/PostCard.tsx`
- [ ] Display image with 3:4 aspect ratio
- [ ] Display name, size, category, description
- [ ] Display poster's display name
- [ ] Heart button with like count
- [ ] Heart animation on toggle
- [ ] Optimistic UI (increment/decrement count)
- [ ] Delete button (only for user's own posts)
- [ ] Confirm before delete

### Task 10.3: Create Post Form
- [ ] Create `src/components/features/home/PostForm.tsx`
- [ ] Modal/bottom sheet layout
- [ ] Image upload with preview
- [ ] Name input (required)
- [ ] Size dropdown
- [ ] Category dropdown (ALL categories, not gender-filtered)
- [ ] Description textarea (max 200 chars, show counter)
- [ ] Validation before submit
- [ ] Loading state during save
- [ ] Success toast on save
- [ ] Close modal after save

### Task 10.4: Share to Home Feature
- [ ] Add "Share to Home" button to ItemCard (in Owned tab)
- [ ] Open PostForm prefilled with item data (name, size, category, image)
- [ ] User adds description
- [ ] Submit creates post
- [ ] Toast confirmation

## Phase 11: Stylist Tab (Placeholder)

### Task 11.1: Stylist Placeholder Page
- [ ] Create `src/pages/stylist/Stylist.tsx`
- [ ] Display empty state with icon/illustration
- [ ] Heading: "AI Stylist"
- [ ] Subheading: "Coming soon"
- [ ] Brief description of future functionality
- [ ] No interactive elements (just placeholder)

## Phase 12: Routing & Navigation

### Task 12.1: Set Up React Router
- [ ] Install react-router-dom
- [ ] Create `src/App.tsx` with router setup
- [ ] Define routes: `/login`, `/register`, `/app/*`
- [ ] App routes: `/app/wardrobe`, `/app/home`, `/app/stylist`
- [ ] Default redirect: logged out → `/login`, logged in → `/app/wardrobe`

### Task 12.2: Navigation Integration
- [ ] Integrate BottomNav (mobile) with router links
- [ ] Integrate SideNav (desktop) with router links
- [ ] Highlight active route
- [ ] Smooth transitions between tabs

## Phase 13: Styling & Theming

### Task 13.1: Tailwind Configuration
- [ ] Extend Tailwind config with custom colors (primary, neutral)
- [ ] Add custom fonts (Inter/Poppins)
- [ ] Add custom shadows
- [ ] Add custom border radius values
- [ ] Configure responsive breakpoints
- [ ] Add animation utilities

### Task 13.2: Global Styles
- [ ] Create `src/index.css` with Tailwind directives
- [ ] Add global resets and base styles
- [ ] Define focus styles for accessibility
- [ ] Add smooth scroll behavior
- [ ] Set up CSS custom properties for theming

### Task 13.3: Responsive Design
- [ ] Test all pages at mobile breakpoint (< 640px)
- [ ] Test at tablet breakpoint (640-1024px)
- [ ] Test at desktop breakpoint (> 1024px)
- [ ] Adjust grid columns, navigation, modal styles
- [ ] Ensure touch targets are 44x44px on mobile

### Task 13.4: Animations
- [ ] Implement heart favorite animation (scale + color)
- [ ] Add page transition animations
- [ ] Add modal/bottom sheet slide animations
- [ ] Add skeleton pulse animation
- [ ] Keep animations subtle (150-300ms)

## Phase 14: Error Handling & Loading States

### Task 14.1: Loading States
- [ ] Add skeleton loaders to all data fetching views
- [ ] Add loading spinners to buttons during async actions
- [ ] Add loading indicator to image uploads
- [ ] Show progress for large uploads if possible

### Task 14.2: Error States
- [ ] Display toast notifications for errors
- [ ] Show inline validation errors in forms
- [ ] Handle network errors with retry option
- [ ] Handle RLS errors with friendly messages
- [ ] Handle storage upload failures
- [ ] Add error boundary for unhandled errors

### Task 14.3: Empty States
- [ ] Design and implement empty state for empty wardrobe
- [ ] Design and implement empty state for no favorites
- [ ] Design and implement empty state for no likes
- [ ] Design and implement empty state for empty feed
- [ ] Each includes icon, message, and CTA button

## Phase 15: Accessibility

### Task 15.1: Semantic HTML
- [ ] Use semantic elements (nav, main, section, article, button)
- [ ] Ensure heading hierarchy (h1, h2, h3)
- [ ] Use label elements for all form inputs
- [ ] Use button elements for interactive elements (not divs)

### Task 15.2: ARIA Attributes
- [ ] Add aria-label to icon-only buttons
- [ ] Add aria-live regions for dynamic content (toasts, like counts)
- [ ] Add aria-expanded for modals/dropdowns
- [ ] Add aria-hidden to decorative icons

### Task 15.3: Keyboard Navigation
- [ ] Ensure all interactive elements are keyboard accessible
- [ ] Trap focus within modals
- [ ] Test tab order makes sense
- [ ] Add visible focus indicators
- [ ] Support Escape to close modals

### Task 15.4: Color Contrast
- [ ] Check all text meets WCAG AA (4.5:1 for normal text)
- [ ] Check focus indicators are visible
- [ ] Test with color blindness simulators
- [ ] Ensure icons are not color-only (use labels)

## Phase 16: Testing & Quality Assurance

### Task 16.1: Manual Testing
- [ ] Test sign up flow end-to-end
- [ ] Test login flow
- [ ] Test add wardrobe item with image upload
- [ ] Test edit and delete item
- [ ] Test favorite/unfavorite
- [ ] Test create post
- [ ] Test like/unlike post
- [ ] Test category filtering (wardrobe and home)
- [ ] Test Share to Home feature
- [ ] Test on different screen sizes
- [ ] Test on mobile device (touch interactions)

### Task 16.2: RLS Testing
- [ ] Verify users can only see their own wardrobe items
- [ ] Verify users can see all posts
- [ ] Verify users can only edit/delete their own posts
- [ ] Verify users can only like as themselves
- [ ] Verify users can only upload to their own folder
- [ ] Verify gender cannot be updated after registration

### Task 16.3: AI Integration Layer Testing
- [ ] Test `getWardrobeForStylist()` returns correct data
- [ ] Verify image URLs are full public URLs
- [ ] Test `getItemsByIds()` with valid IDs
- [ ] Test `getItemsByIds()` with invalid IDs (should filter out)
- [ ] Test `getItemsByIds()` with other user's IDs (should filter out)
- [ ] Verify return type is `StylistItem[]`

### Task 16.4: Error Scenario Testing
- [ ] Test with network offline
- [ ] Test with invalid credentials
- [ ] Test with missing required fields
- [ ] Test with oversized images
- [ ] Test with duplicate email signup
- [ ] Test with RLS policy violations
- [ ] Verify friendly error messages appear

## Phase 17: Documentation

### Task 17.1: README.md
- [ ] Write project overview
- [ ] Document prerequisites (Node.js version, npm)
- [ ] Document Supabase project setup steps
- [ ] Document database migration instructions
- [ ] Document Storage bucket creation
- [ ] Document environment variable setup
- [ ] Document installation steps (`npm install`)
- [ ] Document development command (`npm run dev`)
- [ ] Document build command (`npm run build`)
- [ ] Add project structure overview
- [ ] Add technology stack section
- [ ] Add troubleshooting section

### Task 17.2: Code Documentation
- [ ] Add JSDoc comments to all service functions
- [ ] Add JSDoc comments to AI integration layer functions
- [ ] Document complex utility functions
- [ ] Add inline comments for non-obvious logic
- [ ] Document environment variables in .env.example

### Task 17.3: Migration Documentation
- [ ] Add comments in migration file explaining each section
- [ ] Document rollback strategy
- [ ] Add SQL comments for triggers and functions
- [ ] Document RLS policies

## Phase 18: Final Polish

### Task 18.1: Performance Optimization
- [ ] Implement image lazy loading in feed
- [ ] Debounce filter inputs (300ms)
- [ ] Memoize expensive computations
- [ ] Optimize re-renders with React.memo where needed
- [ ] Use proper dependency arrays in useEffect/useMemo/useCallback
- [ ] Add loading="lazy" to images

### Task 18.2: UX Polish
- [ ] Add smooth transitions between views
- [ ] Ensure animations feel natural (not too fast/slow)
- [ ] Add haptic feedback for mobile interactions (if possible)
- [ ] Polish empty states with appealing visuals
- [ ] Add success animations (checkmarks, confetti)
- [ ] Ensure all toasts auto-dismiss after 3-5 seconds

### Task 18.3: Code Quality
- [ ] Remove console.logs
- [ ] Remove commented-out code
- [ ] Fix TypeScript any types if any slipped through
- [ ] Run linter and fix issues
- [ ] Format code consistently
- [ ] Remove unused imports
- [ ] Remove unused components/functions

### Task 18.4: Build & Deploy Preparation
- [ ] Test production build locally
- [ ] Verify environment variables work in production
- [ ] Check bundle size
- [ ] Optimize images if needed
- [ ] Verify all assets load correctly
- [ ] Test in production-like environment

## Phase 19: Deployment

### Task 19.1: Supabase Project Setup
- [ ] Create new Supabase project
- [ ] Run database migration
- [ ] Create `clothes` storage bucket
- [ ] Apply storage policies
- [ ] Enable email authentication
- [ ] Configure email templates (optional)
- [ ] Note project URL and anon key

### Task 19.2: Frontend Deployment
- [ ] Choose hosting (Vercel, Netlify, etc.)
- [ ] Configure environment variables in hosting dashboard
- [ ] Deploy production build
- [ ] Verify deployment successful
- [ ] Test deployed app end-to-end
- [ ] Check all images load
- [ ] Verify auth flow works

### Task 19.3: Post-Deployment Testing
- [ ] Create test account
- [ ] Upload test wardrobe items
- [ ] Create test posts
- [ ] Test on real mobile device
- [ ] Test in different browsers
- [ ] Verify responsive design
- [ ] Check performance (Core Web Vitals)

## Summary

**Total Tasks**: ~150 individual tasks across 19 phases

**Estimated Timeline** (full-time work):
- Phase 1-4 (Setup & Infrastructure): 1-2 days
- Phase 5-7 (Hooks & Components): 2-3 days
- Phase 8-11 (Feature Pages): 4-5 days
- Phase 12-15 (Integration & Polish): 2-3 days
- Phase 16-19 (Testing & Deployment): 2-3 days
- **Total**: ~2-3 weeks

**Priority Order**:
1. Setup & Database (Phases 1-2)
2. Auth (Phase 8)
3. Wardrobe tab (Phase 9)
4. Home tab (Phase 10)
5. Polish & Deploy (Phases 13-19)

**AI Integration Note**:
- Phase 4.4 builds the data layer for the AI stylist
- The Stylist tab (Phase 11) is a placeholder only
- AI chat implementation is deferred to a future phase
