# Test AI Stylist - Step by Step 🧪

## ✅ Setup Complete!

Your Gemini API key is configured and the dev server has restarted. The AI Stylist is ready to test!

**Server Status:** Running at http://localhost:5173/

---

## Quick Test Guide

### Test 1: Smart Search (2 minutes)

1. **Open the app** in your browser: http://localhost:5173/
2. **Login** with your account
3. **Click "Stylist"** tab in bottom navigation
4. **Type a search query**:
   - Try: `casual summer outfit`
   - Or: `red dress`
   - Or: `formal jacket`
5. **Click "Search"** or press Enter
6. **Check results** - Should show matching items from your wardrobe

**Expected:** AI finds items matching your query based on color, style, and occasion.

---

### Test 2: Outfit Matching (2 minutes)

**From Search Results:**
1. After searching, **click "Find Matches"** on any item
2. **Wait 2-3 seconds** for AI analysis
3. **View matching items** - complementary pieces for an outfit

**Expected:** AI suggests items that work well together (matching colors, similar styles).

---

### Test 3: Batch Analysis (5 minutes)

⚠️ **Note:** This analyzes ALL wardrobe items. Only do this once!

1. **Click "Analyze Wardrobe"** tab at the top
2. **Click "Analyze All Items"** button
3. **Confirm** the dialog
4. **Watch progress bar** - Shows "Analyzing... X / Total"
5. **Wait for completion** - Takes ~4 seconds per item
   - 10 items = ~40 seconds
   - 25 items = ~2 minutes
6. **Success toast** appears when done

**Expected:** Progress bar fills up, then "Wardrobe analysis complete!" message.

**After Analysis:** Future searches will be faster and more accurate!

---

## What to Look For

### ✅ Success Indicators

- **Smart Search**: Results appear after 2-3 seconds
- **Find Matches**: Complementary items are suggested
- **Loading States**: Spinners show during AI processing
- **Progress Bar**: Updates smoothly during batch analysis
- **Toast Messages**: Success/error messages appear
- **No Errors**: Console is clean (F12 → Console tab)

### ❌ Possible Issues

**"Failed to search. Please try again"**
- **Cause:** API key issue or network problem
- **Fix:** Check browser console (F12) for error details
- **Check:** API key in `.env` is correct
- **Verify:** https://makersuite.google.com - key is active

**"No matching items found"**
- **Normal:** Your wardrobe doesn't have items matching that query
- **Try:** Different search terms or add more items

**Rate limit errors**
- **Cause:** Too many requests (15/minute limit)
- **Fix:** Wait 1 minute before trying again

---

## Test Scenarios

### Scenario 1: Empty Wardrobe
**What happens:** Shows "Your wardrobe is empty" message  
**Action needed:** Add items to wardrobe first (Home → Add item)

### Scenario 2: First Search
**What happens:** May take 3-4 seconds (AI analyzing query)  
**Expected:** Normal, subsequent searches are faster

### Scenario 3: After Batch Analysis
**What happens:** Searches become faster and more accurate  
**Why:** Items already have AI analysis cached

---

## Browser Console Check

Open browser console (F12) and look for:

**Good Signs:**
```
✓ Vite connected
✓ No error messages
```

**Bad Signs:**
```
✗ 401 Unauthorized (API key invalid)
✗ 429 Too Many Requests (rate limit hit)
✗ Network error (internet connection issue)
```

---

## Example Queries to Try

### By Color
- "red dress"
- "blue jeans"
- "black jacket"

### By Style
- "casual outfit"
- "formal wear"
- "sporty clothes"

### By Occasion
- "party dress"
- "work clothes"
- "wedding outfit"

### By Season
- "summer tops"
- "winter jacket"
- "all season shoes"

### Combined
- "casual summer outfit"
- "red dress for party"
- "formal winter jacket"
- "blue jeans casual"

---

## Performance Notes

### Expected Response Times

| Action | Time | Notes |
|--------|------|-------|
| Smart Search | 2-3 sec | First query may be slower |
| Find Matches | 2-3 sec | Per item analyzed |
| Batch Analysis | 4 sec/item | Rate limited |
| UI Loading | Instant | Local state updates |

### API Rate Limits

- **15 requests per minute** - Don't spam search!
- **1,500 requests per day** - Plenty for daily use
- **Batch analysis** automatically waits 4 seconds between items

---

## Troubleshooting Commands

### Clear Browser Cache
```
Chrome/Edge: Ctrl + Shift + Delete
Firefox: Ctrl + Shift + Delete
Safari: Cmd + Opt + E
```

### Check Dev Server
```bash
# Should show no errors
# If errors, stop (Ctrl+C) and restart:
npm run dev
```

### Verify API Key
```bash
# Open .env file
# Check VITE_GEMINI_API_KEY has your actual key (no quotes needed)
```

---

## Success Checklist

After testing, you should have:

- [ ] Successfully searched with natural language
- [ ] Found matching items for outfit building
- [ ] Completed batch analysis (if you have items)
- [ ] Seen loading states and progress bars
- [ ] Received success toast notifications
- [ ] No errors in browser console
- [ ] Fast, responsive UI

---

## What's Next?

### Regular Usage
1. **Add items** to your wardrobe via Home page
2. **Search** when planning outfits
3. **Use Find Matches** to build complete looks
4. **Batch analyze** once when you add many new items

### Share Feedback
- Does search find the right items?
- Are matches relevant and useful?
- Is the UI clear and easy to use?
- Any bugs or issues?

---

## Quick Reference

**URLs:**
- App: http://localhost:5173/
- API Dashboard: https://makersuite.google.com/app/apikey

**Docs:**
- Full guide: `AI_STYLIST_COMPLETE.md`
- Setup: `AI_STYLIST_SETUP.md`
- Quick start: `AI_STYLIST_QUICK_START.md`

**Support:**
- Check browser console (F12)
- Review error messages
- Verify API key at Google AI Studio

---

**Ready to test! Go to http://localhost:5173/ and click the Stylist tab! 🚀**
