# Secure AI Stylist Deployment

The production stylist should run through the Supabase Edge Function so API
keys are not shipped to the browser.

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_KEY
supabase functions deploy stylist
```

Then set this frontend environment variable in the deployment platform:

```env
VITE_USE_SECURE_STYLIST=true
```

Redeploy the frontend after changing the environment variable.

The function analyzes the wardrobe images, returns ranked outfit IDs, and the
browser validates those IDs against the user's actual wardrobe before showing
anything. Keep `VITE_GEMINI_API_KEY` and `VITE_GROQ_API_KEY` unset in the
production frontend once the Edge Function is working.
