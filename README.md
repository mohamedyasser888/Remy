# Fashion Wardrobe App

A modern, full-stack fashion wardrobe management application with community features and AI stylist integration layer. Built with React, TypeScript, Tailwind CSS, and Supabase.

## ✨ Features

### 👗 Personal Wardrobe
- **Manage Your Collection**: Add, edit, and delete wardrobe items with images
- **Smart Organization**: Filter by category, mark favorites
- **Gender-Specific Categories**: Tailored category lists based on user profile
- **Image Compression**: Automatic client-side image optimization

### 🏠 Community Feed
- **Share Your Style**: Post items to the community feed
- **Social Engagement**: Like posts, browse by category
- **Personal Feed**: View posts you've liked
- **Share from Wardrobe**: Instantly share items to the feed

### 🎨 AI Stylist (Coming Soon)
- **Integration Layer Ready**: Services prepared for AI recommendations
- **Placeholder UI**: Feature preview screen

### 🌍 Internationalization
- **Bilingual Support**: English and Arabic
- **RTL Layout**: Automatic right-to-left support for Arabic
- **Persistent Preferences**: Language choice saved locally

### ♿ Accessibility
- **WCAG 2.1 Level AA**: Compliant with accessibility standards
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: ARIA labels and semantic HTML
- **Touch-Friendly**: 44x44px minimum touch targets

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript (strict mode), Vite
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router v6
- **State Management**: React Context + Custom Hooks
- **Image Processing**: Client-side compression (canvas-based)
- **Security**: Row Level Security (RLS) policies

## 📋 Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Supabase Account**: Free tier is sufficient

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd remy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

#### 3.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `fashion-wardrobe` (or your choice)
   - **Database Password**: Save this securely
   - **Region**: Choose closest to your users
5. Wait for project provisioning (2-3 minutes)

#### 3.2 Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL Editor
5. Click "Run" (or press `Ctrl+Enter`)
6. Verify success: You should see "Success. No rows returned"

This creates:
- `profiles` table (user profiles)
- `wardrobe_items` table (personal wardrobe)
- `posts` table (community feed)
- `post_likes` table (like tracking)
- All RLS policies (security)
- Database triggers (auto profile creation, category validation)
- Indexes (performance optimization)
- Views (posts with like counts)

#### 3.3 Set Up Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. Click "Create a new bucket"
3. Bucket details:
   - **Name**: `clothes`
   - **Public bucket**: ✅ **Check this box**
4. Click "Create bucket"

**Configure Storage Policies:**

1. Click on the `clothes` bucket
2. Go to "Policies" tab
3. Click "New Policy"

**Policy 1: Public Read Access**
- Policy name: `Public read access`
- Target roles: `public`
- SELECT allowed: ✅
- SQL:
  ```sql
  CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'clothes');
  ```

**Policy 2: User Upload Access**
- Policy name: `User upload access`
- Target roles: `authenticated`
- INSERT allowed: ✅
- SQL:
  ```sql
  CREATE POLICY "User upload access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clothes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
  ```

**Policy 3: User Delete Access**
- Policy name: `User delete access`
- Target roles: `authenticated`
- DELETE allowed: ✅
- SQL:
  ```sql
  CREATE POLICY "User delete access"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clothes' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
  ```

See `supabase/storage_setup.md` for detailed instructions.

#### 3.4 Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

⚠️ **Important**: Never commit the `.env` file to version control. The `.env.example` file is for reference only.

### 5. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 📱 Usage

### First Time Setup

1. **Register an Account**:
   - Navigate to `/register`
   - Enter email, password, display name
   - Select gender (this determines category options)
   - ⚠️ Gender cannot be changed after registration

2. **Add Your First Item**:
   - Click "Add Item" in Wardrobe
   - Upload an image (JPEG, PNG, or WebP)
   - Fill in name, size, category
   - Click "Save"

3. **Explore Features**:
   - Mark items as favorites (heart icon)
   - Share items to community feed
   - Browse community posts
   - Like posts from other users

### Key Concepts

- **Wardrobe → Owned**: Your personal collection
- **Wardrobe → Favourites**: Items you've marked as favorite
- **Wardrobe → Liked**: Community posts you've liked
- **Home**: Community feed (all users' shared posts)
- **Share to Home**: Convert wardrobe item to community post

## 🏗️ Project Structure

```
remy/
├── public/                   # Static assets
├── src/
│   ├── components/
│   │   ├── common/          # Reusable UI components
│   │   ├── features/        # Feature-specific components
│   │   │   ├── home/        # Community feed components
│   │   │   └── wardrobe/    # Wardrobe components
│   │   └── layout/          # Layout components (nav, routes)
│   ├── contexts/            # React contexts (Auth)
│   ├── hooks/               # Custom React hooks
│   ├── i18n/                # Internationalization (en, ar)
│   ├── pages/               # Page components
│   │   ├── auth/            # Login, Register
│   │   ├── home/            # Home page
│   │   ├── stylist/         # Stylist page
│   │   └── wardrobe/        # Wardrobe page
│   ├── routes/              # React Router configuration
│   ├── services/            # API services (Supabase)
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── supabase/
│   ├── migrations/          # Database migrations
│   └── storage_setup.md     # Storage setup guide
├── .env.example             # Environment variables template
├── ACCESSIBILITY.md         # Accessibility documentation
├── TESTING_CHECKLIST.md     # Manual testing guide
└── README.md                # This file
```

## 🧪 Testing

This project uses **manual testing**. See `TESTING_CHECKLIST.md` for a comprehensive testing guide covering:
- Authentication flows
- Wardrobe CRUD operations
- Community feed features
- Navigation and routing
- Internationalization (i18n/RTL)
- Accessibility
- Responsive design
- Error handling
- Security (RLS policies)
- Browser compatibility

## ♿ Accessibility

The app is built with accessibility in mind:
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader friendly
- Sufficient color contrast (7:1+ for primary text)
- Touch-friendly (44x44px minimum targets)

See `ACCESSIBILITY.md` for detailed documentation.

## 🔒 Security

### Row Level Security (RLS)

All database tables have RLS policies:
- **Profiles**: Users can only read/update their own profile
- **Wardrobe Items**: Users can only access their own items
- **Posts**: Users can create/delete their own posts, read all posts
- **Post Likes**: Users can manage their own likes

### Storage Security

- Users can only upload to their own folder (`{user_id}/*`)
- Users can only delete their own images
- Public read access for all images (needed for community feed)

### Data Validation

- Client-side validation for forms
- Server-side validation via database constraints
- Database triggers enforce business rules (e.g., gender-specific categories)

### Environment Variables

- Sensitive keys in `.env` (git-ignored)
- Only `anon` key used in frontend (safe for public exposure)
- `service_role` key **NEVER** used in frontend

## 🌐 Internationalization

### Supported Languages

- English (en)
- Arabic (ar) with RTL support

### Adding New Languages

1. Create new translation file: `src/i18n/{locale}.json`
2. Copy structure from `src/i18n/en.json`
3. Translate all strings
4. Update `src/i18n/index.ts`:
   ```typescript
   import newLocale from './newLocale.json';
   
   const translations = {
     en,
     ar,
     newLocale, // Add here
   };
   ```

## 🎨 Customization

### Design System

Edit `tailwind.config.js` to customize:
- **Colors**: Primary palette, neutral grays
- **Fonts**: Currently using Inter from Google Fonts
- **Shadows**: Soft, medium, strong
- **Animations**: Heartbeat, fade-in, slide-up

### Categories

Edit `src/utils/constants.ts`:
- `FEMALE_CATEGORIES`: Categories for female users
- `MALE_CATEGORIES`: Categories for male users
- `SIZES`: Available sizes

⚠️ **Important**: If you change categories, also update:
- `src/i18n/en.json` (category translations)
- `src/i18n/ar.json` (category translations)
- Database trigger in `001_initial_schema.sql` (validation)

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in `dist/`.

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy!

### Deploy to Netlify

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Select your repository
5. Configure:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
6. Add environment variables in "Site settings" → "Environment variables"
7. Deploy!

### Other Platforms

The app can be deployed to any static hosting service:
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront
- Firebase Hosting

Just build with `npm run build` and serve the `dist/` directory.

## 📦 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## 🧩 Architecture

### Data Flow

1. **User Action** → Component
2. **Component** → Custom Hook (e.g., `useWardrobe`)
3. **Hook** → Service Layer (e.g., `wardrobe.ts`)
4. **Service** → Supabase Client
5. **Supabase** → Database/Storage
6. **Response** → Hook (update state)
7. **Hook** → Component (re-render)

### State Management

- **Auth State**: `AuthContext` (global)
- **Local State**: `useState` in components
- **Server State**: Custom hooks with optimistic updates
- **Toast Notifications**: `ToastContext` (global)
- **i18n**: `I18nContext` (global)

### AI Stylist Integration

The app includes a service layer ready for AI integration:

```typescript
// src/services/wardrobe.ts
export async function getWardrobeForStylist(userId: string): Promise<StylistItem[]>
export async function getItemsByIds(itemIds: string[]): Promise<WardrobeItem[]>
```

These functions provide a clean interface for an AI module to:
1. Fetch user's entire wardrobe
2. Retrieve specific items by IDs
3. Return outfit recommendations

## 🐛 Troubleshooting

### "Invalid Supabase URL" Error

- Verify `.env` has correct `VITE_SUPABASE_URL`
- Restart dev server after changing `.env`
- Check for typos (URL should start with `https://`)

### Images Not Loading

- Verify storage bucket is **public**
- Check storage policies are configured correctly
- Verify image uploaded to correct path: `{user_id}/{filename}`

### Categories Not Showing

- Check database migration ran successfully
- Verify trigger `validate_wardrobe_category` exists
- Check `FEMALE_CATEGORIES` / `MALE_CATEGORIES` in `constants.ts`

### RLS Policy Errors

- Run migration file again (it's idempotent)
- Check policies exist: Supabase Dashboard → Authentication → Policies
- Test in SQL Editor: `SELECT * FROM wardrobe_items;` (should only see your items)

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature`
3. **Follow existing code style**: TypeScript strict mode, ESLint rules
4. **Test manually**: Use `TESTING_CHECKLIST.md`
5. **Commit with clear messages**: `git commit -m "Add: feature description"`
6. **Push and create PR**: `git push origin feature/your-feature`

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Supabase**: Backend infrastructure
- **Tailwind CSS**: Styling framework
- **React**: UI library
- **Vite**: Build tool
- **Inter Font**: Typography (Google Fonts)

## 📞 Support

For issues or questions:
1. Check `TESTING_CHECKLIST.md` and `ACCESSIBILITY.md`
2. Review `supabase/storage_setup.md`
3. Check Supabase documentation
4. Open an issue on GitHub

---

**Built with ❤️ using React, TypeScript, and Supabase**
