# Testing Checklist

This document provides a comprehensive manual testing checklist for the Fashion Wardrobe app.

## Pre-Testing Setup

- [ ] Supabase project created
- [ ] Database migration applied (`001_initial_schema.sql`)
- [ ] Storage bucket `clothes` created with public access
- [ ] Storage policies configured (see `supabase/storage_setup.md`)
- [ ] `.env` file created with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- [ ] Dependencies installed (`npm install`)
- [ ] Dev server running (`npm run dev`)

## Authentication Flow

### Registration
- [ ] Navigate to `/register`
- [ ] Validate: Empty form shows validation errors
- [ ] Validate: Invalid email format shows error
- [ ] Validate: Short password (< 6 chars) shows error
- [ ] Validate: Short display name (< 2 chars) shows error
- [ ] Validate: Missing gender selection shows error
- [ ] Create account with valid data (Female user)
- [ ] Verify: Auto-redirected to wardrobe page after registration
- [ ] Verify: Profile created in database with correct gender
- [ ] Create another account (Male user) for testing gender-specific categories

### Login
- [ ] Navigate to `/login`
- [ ] Validate: Empty form shows validation errors
- [ ] Validate: Invalid credentials show error
- [ ] Login with valid credentials
- [ ] Verify: Redirected to wardrobe page
- [ ] Verify: User profile displayed in sidebar (desktop)

### Logout
- [ ] Click logout button in sidebar (desktop)
- [ ] Verify: Redirected to login page
- [ ] Verify: Cannot access protected routes after logout

### Route Guards
- [ ] Try accessing `/app/wardrobe` while logged out → redirects to `/login`
- [ ] Try accessing `/login` while logged in → redirects to `/app/wardrobe`
- [ ] Verify: Protected routes show loader during auth check

## Wardrobe - Owned Tab

### Add Item
- [ ] Click "Add Item" button
- [ ] Validate: Empty form shows validation errors
- [ ] Upload image (test JPEG, PNG, WebP formats)
- [ ] Validate: Large image (>10MB) shows error
- [ ] Validate: Non-image file shows error
- [ ] Verify: Image preview displays correctly
- [ ] Fill all fields (name, size, category)
- [ ] **Female user**: Verify category dropdown shows female categories only
- [ ] **Male user**: Verify category dropdown shows male categories only
- [ ] Submit form
- [ ] Verify: Item appears in grid
- [ ] Verify: Image loads correctly
- [ ] Verify: Toast notification shows success

### Category Filtering
- [ ] Add items in different categories
- [ ] Click category filter chips
- [ ] Verify: Grid filters to selected category
- [ ] Verify: "All" shows all items

### Favorite Item
- [ ] Click heart icon on item card
- [ ] Verify: Heart fills with color
- [ ] Verify: Optimistic update (immediate UI feedback)
- [ ] Navigate to Favourites tab
- [ ] Verify: Item appears in Favourites
- [ ] Click heart again to unfavorite
- [ ] Verify: Item removed from Favourites tab

### Edit Item
- [ ] Click menu (three dots) on item card
- [ ] Click "Edit"
- [ ] Verify: Modal opens with pre-filled data
- [ ] Verify: Current image displayed
- [ ] Change item name
- [ ] Change category (observe validation based on gender)
- [ ] Upload new image (optional)
- [ ] Submit
- [ ] Verify: Changes reflected in grid
- [ ] Verify: Toast notification shows success

### Delete Item
- [ ] Click menu on item card
- [ ] Click "Delete"
- [ ] Verify: Confirmation modal appears
- [ ] Click "Cancel" → modal closes, item remains
- [ ] Click delete again, confirm
- [ ] Verify: Item removed from grid
- [ ] Verify: Image deleted from storage
- [ ] Verify: Toast notification shows success

### Share to Home
- [ ] Click menu on item card
- [ ] Click "Share to Home"
- [ ] Verify: Post form opens with pre-filled data (name, size, category, image)
- [ ] Add description (required, max 200 chars)
- [ ] Verify: Character counter updates (shows X/200)
- [ ] Submit
- [ ] Navigate to Home tab
- [ ] Verify: Post appears in community feed

### Empty States
- [ ] With no items: Verify empty state displays with CTA
- [ ] Filter to category with no items: Verify "no results" message

### Loading States
- [ ] On initial load: Verify skeleton grid displays
- [ ] During operations: Verify buttons show loading spinner

## Wardrobe - Favourites Tab

- [ ] Navigate to Favourites tab
- [ ] Verify: Only favorited items display
- [ ] Click heart to unfavorite
- [ ] Verify: Item removed from Favourites tab (still in Owned)
- [ ] Empty state: Verify message "Tap the heart icon to favourite items"
- [ ] Share to Home works from Favourites tab

## Wardrobe - Liked Tab

- [ ] Navigate to Liked tab
- [ ] Verify: Shows posts user has liked from community
- [ ] Click heart to unlike
- [ ] Verify: Post removed from Liked tab
- [ ] Empty state: Verify message "Like posts from the community feed"

## Home - Community Feed

### View Posts
- [ ] Navigate to Home tab
- [ ] Verify: All posts display in grid
- [ ] Verify: Each post shows: image, name, size, category, description, poster name
- [ ] Verify: Like count displays if > 0
- [ ] Scroll: Verify lazy loading of images

### Category Filtering
- [ ] Click category filter chips
- [ ] Verify: Feed filters by category
- [ ] Verify: "All" shows all posts
- [ ] Empty category: Verify "No posts in this category" message

### Create Post
- [ ] Click "Create Post" button in TopBar
- [ ] Validate: Empty form shows errors
- [ ] Upload image
- [ ] Fill name, size, category, description (required)
- [ ] Verify: Character counter for description (200 max)
- [ ] Submit
- [ ] Verify: Post appears in feed immediately
- [ ] Verify: Toast notification shows success

### Like/Unlike Post
- [ ] Click heart on a post
- [ ] Verify: Heart fills, like count increments
- [ ] Verify: Optimistic update (immediate UI feedback)
- [ ] Navigate to Wardrobe → Liked tab
- [ ] Verify: Post appears in Liked tab
- [ ] Return to Home, unlike the post
- [ ] Verify: Heart empties, like count decrements
- [ ] Verify: Removed from Liked tab

### Delete Own Post
- [ ] Find your own post (has menu icon)
- [ ] Click menu (three dots)
- [ ] Click "Delete"
- [ ] Verify: Confirmation modal appears
- [ ] Cancel → post remains
- [ ] Delete again, confirm
- [ ] Verify: Post removed from feed
- [ ] Verify: Image deleted from storage
- [ ] Verify: Toast notification shows success

### Delete Restrictions
- [ ] Verify: Other users' posts do NOT show delete button
- [ ] Only own posts have the menu/delete option

### Empty States
- [ ] With no posts: Verify "No posts yet" with CTA
- [ ] Filter to empty category: Verify "No posts in this category"

## Stylist Tab

- [ ] Navigate to Stylist tab
- [ ] Verify: Placeholder with "AI Stylist coming soon"
- [ ] Verify: Feature list displays

## Navigation

### Mobile Navigation (< 1024px)
- [ ] Verify: Bottom tab bar displays (Wardrobe, Home, Stylist)
- [ ] Verify: Active tab highlighted
- [ ] Click each tab
- [ ] Verify: Routes change correctly
- [ ] Verify: Icons change (filled for active)
- [ ] Verify: Safe area spacing on iOS notch devices

### Desktop Navigation (≥ 1024px)
- [ ] Verify: Sidebar displays on left
- [ ] Verify: User's display name shown in header
- [ ] Verify: Active route highlighted
- [ ] Click each nav item
- [ ] Verify: Routes change correctly
- [ ] Verify: Bottom bar hidden

## Internationalization (i18n)

### Language Switching
- [ ] Click language switcher (globe icon)
- [ ] Switch to Arabic
- [ ] Verify: All UI text changes to Arabic
- [ ] Verify: Layout switches to RTL (right-to-left)
- [ ] Verify: Language preference persists after refresh
- [ ] Switch back to English
- [ ] Verify: Layout switches to LTR

### RTL Verification (Arabic)
- [ ] Text alignment: right-aligned
- [ ] Navigation: icons on right side
- [ ] Modals: close button on left
- [ ] Input fields: icons on left
- [ ] All components properly mirrored

## Accessibility

### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Verify: Focus visible (keyboard only)
- [ ] Verify: Focus NOT visible when clicking with mouse
- [ ] Verify: Logical tab order
- [ ] Press Enter/Space on buttons
- [ ] Press Escape to close modals

### Touch Targets
- [ ] All buttons and links: minimum 44x44px
- [ ] Easy to tap on mobile devices
- [ ] No accidental taps

### Screen Reader (Test with NVDA/JAWS/VoiceOver)
- [ ] Form labels: properly associated
- [ ] Buttons: descriptive text
- [ ] Images: alt text (item name)
- [ ] Modals: focus trapped
- [ ] Toast notifications: announced

### Color Contrast
- [ ] Primary text on white: sufficient contrast
- [ ] Secondary text: readable
- [ ] Button text: readable on all variants
- [ ] Error messages: red with sufficient contrast

## Responsive Design

### Mobile (375px - 768px)
- [ ] Layout: Single column
- [ ] Grid: 2 columns
- [ ] Navigation: Bottom bar
- [ ] Forms: Full width inputs
- [ ] Modals: Full screen or nearly full
- [ ] TopBar: Sticky, shows title and actions

### Tablet (768px - 1024px)
- [ ] Grid: 3 columns
- [ ] Layout: Still bottom nav
- [ ] Forms: Max-width modals

### Desktop (≥ 1024px)
- [ ] Grid: 4 columns
- [ ] Sidebar: Visible
- [ ] Bottom nav: Hidden
- [ ] Forms: Medium-width modals
- [ ] Max-width content container

## Error Handling

### Network Errors
- [ ] Disconnect internet
- [ ] Try to load data
- [ ] Verify: Error toast displays
- [ ] Reconnect
- [ ] Verify: Can retry operation

### Invalid Supabase Credentials
- [ ] Use wrong Supabase URL/key
- [ ] Verify: Appropriate error messages
- [ ] Not exposed to user, logged to console

### Image Upload Errors
- [ ] Upload oversized image: Error toast
- [ ] Upload invalid format: Error toast
- [ ] Network failure during upload: Error toast

### Database Validation Errors
- [ ] Try to create item with wrong gender category (shouldn't happen due to UI filtering)
- [ ] Database trigger blocks it
- [ ] User sees error message

## Performance

### Image Optimization
- [ ] Upload large images
- [ ] Verify: Compressed before upload (check Network tab)
- [ ] Verify: Max 1024px dimension
- [ ] Verify: 0.8 quality

### Optimistic Updates
- [ ] Like/unlike: Immediate UI feedback
- [ ] Favorite/unfavorite: Immediate UI feedback
- [ ] No flash of old state

### Loading States
- [ ] Initial page load: Skeleton loaders
- [ ] Button actions: Loading spinner
- [ ] No frozen UI

## Security

### RLS (Row Level Security)
- [ ] User A cannot delete User B's wardrobe items
- [ ] User A cannot delete User B's posts
- [ ] User A can only see their own wardrobe items
- [ ] User A can see all community posts
- [ ] User A can only modify their own profile

### Storage Policies
- [ ] User can only upload to their own folder (`{user_id}/*`)
- [ ] User cannot access other users' folders
- [ ] Public read access works for all images

### Gender Immutability
- [ ] After registration, gender field cannot be edited
- [ ] Category validation based on gender enforced

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Edge Cases

- [ ] Very long item names: Truncated with ellipsis
- [ ] Very long descriptions: Line clamp (2 lines)
- [ ] No profile picture: Initials or default icon
- [ ] Slow network: Loading states work
- [ ] Rapid clicking: Debounced, no duplicate actions
- [ ] Concurrent edits: Last write wins (acceptable)
- [ ] Session expiry: Redirect to login

## Polish Checks

- [ ] Animations smooth (transitions, heartbeat)
- [ ] No layout shift during loading
- [ ] Consistent spacing throughout
- [ ] All images load (no broken links)
- [ ] Toast notifications auto-dismiss after 3s
- [ ] Modal overlays dim background
- [ ] Hover states on interactive elements
- [ ] Active states on buttons
- [ ] Proper loading spinners
- [ ] Error states clearly communicated

## Cross-Feature Integration

- [ ] Add item → Favorite → Share to Home → Like → Check in Liked tab (full flow)
- [ ] Register → Add items → Filter → Edit → Delete (full wardrobe flow)
- [ ] Language switch persists across all pages
- [ ] Navigation works from any page to any page

---

## Testing Notes Template

Use this template to document issues found:

```
### Issue: [Brief description]
- **Severity**: Critical | High | Medium | Low
- **Steps to Reproduce**:
  1. 
  2. 
  3. 
- **Expected**: 
- **Actual**: 
- **Browser/Device**: 
- **Screenshot/Video**: [If applicable]
```

## Success Criteria

All items checked = Ready for production deployment! ✅
