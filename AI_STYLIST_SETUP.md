# AI Stylist Setup Guide

## Using Google Gemini Vision API (Free & Powerful!)

### Why Gemini?
- ✅ **FREE** - Generous free tier (15 requests/minute)
- ✅ **Vision capabilities** - Understands clothing, colors, styles
- ✅ **Fast** - Real-time responses
- ✅ **Multimodal** - Can analyze images + text prompts
- ✅ **Fashion-aware** - Trained on fashion data

### Step 1: Get Your API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Get API Key"
3. Click "Create API key in new project"
4. Copy your API key

### Step 2: Add to .env

Open `d:\remy\.env` and add:

```
VITE_GEMINI_API_KEY=your-api-key-here
```

### Step 3: Done!

The AI Stylist will:
- 🎨 **Analyze colors** - Extract dominant colors from clothing
- 👔 **Identify style** - Casual, formal, sporty, etc.
- 🌡️ **Suggest occasions** - Work, party, beach, gym
- 🌈 **Match outfits** - Find complementary items
- 📊 **Smart search** - Natural language queries
- 🔍 **Visual similarity** - Find similar items

### Features:
1. **Smart Search**: "Show me casual summer tops"
2. **Color Matching**: "Find items that match this red dress"
3. **Occasion-based**: "What should I wear to a wedding?"
4. **Style Analysis**: Automatically tags items with style attributes

### API Limits (Free Tier):
- 15 requests per minute
- 1,500 requests per day
- Perfect for personal use!

### Alternative Free Options:

If you need more requests:

1. **Hugging Face Inference API**
   - Models: CLIP, BLIP
   - Free tier: 30,000 requests/month

2. **Replicate**
   - Various vision models
   - Pay-as-you-go, very cheap

3. **OpenAI Vision (Paid)**
   - More expensive but very accurate
   - ~$0.01 per image

### Privacy Note:
- Images are sent to Google's API
- Not stored permanently by Google
- Processed securely over HTTPS
- No data used for training (per Google's policy)
