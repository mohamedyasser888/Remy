/**
 * AI Stylist Service
 * Uses Google Gemini Vision API for intelligent clothing analysis
 */

import type { WardrobeItem } from '@/types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent';
const UNSPLASH_ACCESS_KEY = 'your_unsplash_key_here'; // Free API from unsplash.com

export interface ClothingAnalysis {
  colors: string[];
  style: string[];
  occasion: string[];
  season: string[];
  description: string;
}

export interface WebSearchResult {
  id: string;
  imageUrl: string;
  description: string;
  source: string;
}

export interface StyleRecommendation {
  matchScore: number;
  reason: string;
  suggestedWith: string[];
}

/**
 * Analyze a clothing item using AI
 */
export async function analyzeClothing(
  imageUrl: string,
  itemName: string,
  category: string
): Promise<{ analysis: ClothingAnalysis | null; error: Error | null }> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured. Add VITE_GEMINI_API_KEY to your .env file.');
    }

    // Convert image URL to base64
    const base64Image = await urlToBase64(imageUrl);

    const prompt = `Analyze this ${category} clothing item named "${itemName}". Provide a JSON response with:
- colors: array of main colors (max 3)
- style: array of style tags (e.g., casual, formal, sporty, elegant, vintage)
- occasion: array of suitable occasions (e.g., work, party, beach, gym, wedding)
- season: array of seasons (spring, summer, fall, winter, all-season)
- description: brief 1-sentence description

Example: {"colors":["blue","white"],"style":["casual","comfortable"],"occasion":["daily","weekend"],"season":["spring","summer","all-season"],"description":"A light blue casual t-shirt perfect for everyday wear"}

Respond ONLY with the JSON, no other text.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to analyze image');
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('No analysis returned from AI');
    }

    // Extract JSON from response (remove markdown code blocks if present)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse AI response');
    }

    const analysis: ClothingAnalysis = JSON.parse(jsonMatch[0]);

    return { analysis, error: null };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    return { analysis: null, error: error as Error };
  }
}

/**
 * Search web for clothing images using Unsplash API
 */
async function searchWebForClothing(query: string): Promise<WebSearchResult[]> {
  try {
    // Using Unsplash as fallback (free tier: 50 requests/hour)
    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' clothing fashion')}&per_page=12&client_id=${UNSPLASH_ACCESS_KEY}`
    );

    if (!response.ok) {
      console.warn('Web search failed, returning empty results');
      return [];
    }

    const data = await response.json();
    
    return data.results?.map((photo: any) => ({
      id: photo.id,
      imageUrl: photo.urls.regular,
      description: photo.description || photo.alt_description || query,
      source: 'Unsplash'
    })) || [];
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

/**
 * Enhanced smart search with auto-analysis and web fallback
 * - Auto-analyzes unanalyzed items during search
 * - Better semantic matching (finds "dress" when searching "dress")
 * - Falls back to web search if no wardrobe matches
 */
export async function smartSearch(
  query: string,
  wardrobeItems: WardrobeItem[],
  onAnalyzing?: (current: number, total: number, itemName: string) => void
): Promise<{ 
  results: WardrobeItem[]; 
  webResults?: WebSearchResult[];
  analyzedCount?: number;
  error: Error | null;
}> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    let analyzedCount = 0;
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(w => w.length >= 2);

    // Step 1: Auto-analyze unanalyzed items
    const itemsWithAnalysis: WardrobeItem[] = [];
    const unanalyzedItems = wardrobeItems.filter(item => !item.ai_attributes);

    // Analyze unanalyzed items
    for (let i = 0; i < unanalyzedItems.length; i++) {
      const item = unanalyzedItems[i];
      onAnalyzing?.(i + 1, unanalyzedItems.length, `${item.name} (${item.category})`);
      
      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/clothes/${item.image_path}`;
      const { analysis } = await analyzeClothing(imageUrl, item.name, item.category);
      
      if (analysis) {
        analyzedCount++;
        itemsWithAnalysis.push({
          ...item,
          ai_attributes: analysis as any
        });
      } else {
        itemsWithAnalysis.push(item);
      }

      // Rate limiting: 4 seconds between analyses
      if (i < unanalyzedItems.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    // Add already-analyzed items
    const analyzedItems = wardrobeItems.filter(item => item.ai_attributes);
    const allItems = [...analyzedItems, ...itemsWithAnalysis];

    // Step 2: Enhanced semantic search
    const results = allItems.filter(item => {
      const analysis = item.ai_attributes as ClothingAnalysis | null;
      
      // Direct name match
      if (item.name.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Direct category match - THIS IS KEY for "dress" search
      if (item.category.toLowerCase().includes(queryLower)) {
        return true;
      }

      // Plural/singular handling for categories
      const categoryLower = item.category.toLowerCase();
      for (const word of queryWords) {
        // Match "dress" with "dresses", "jean" with "jeans", etc.
        if (categoryLower.includes(word) || 
            (categoryLower + 's').includes(word) ||
            categoryLower.includes(word + 's')) {
          return true;
        }
      }

      // Word-by-word matching
      for (const word of queryWords) {
        if (item.name.toLowerCase().includes(word) || 
            categoryLower.includes(word)) {
          return true;
        }
      }

      if (!analysis) return false;

      // AI analysis matching
      const colors = analysis.colors || [];
      const styles = analysis.style || [];
      const occasions = analysis.occasion || [];
      const seasons = analysis.season || [];
      const description = analysis.description || '';

      // Color match
      if (colors.some(color => 
        queryWords.some(w => color.toLowerCase().includes(w) || w.includes(color.toLowerCase()))
      )) {
        return true;
      }

      // Style match
      if (styles.some(style => 
        queryWords.some(w => style.toLowerCase().includes(w) || w.includes(style.toLowerCase()))
      )) {
        return true;
      }

      // Occasion match
      if (occasions.some(occasion => 
        queryWords.some(w => occasion.toLowerCase().includes(w) || w.includes(occasion.toLowerCase()))
      )) {
        return true;
      }

      // Season match
      if (seasons.some(season => 
        queryWords.some(w => season.toLowerCase().includes(w) || w.includes(season.toLowerCase()))
      )) {
        return true;
      }

      // Description match
      if (queryWords.some(w => description.toLowerCase().includes(w))) {
        return true;
      }

      return false;
    });

    // Step 3: If no results, search the web
    if (results.length === 0) {
      const webResults = await searchWebForClothing(query);
      return {
        results: [],
        webResults,
        analyzedCount,
        error: null
      };
    }

    return { 
      results, 
      analyzedCount,
      error: null 
    };
  } catch (error) {
    console.error('Smart search error:', error);
    return { 
      results: [], 
      analyzedCount: 0,
      error: error as Error 
    };
  }
}

/**
 * Find matching items for outfit building
 */
export async function findMatches(
  selectedItem: WardrobeItem,
  wardrobeItems: WardrobeItem[]
): Promise<{ matches: (WardrobeItem & { matchScore: number })[]; error: Error | null }> {
  try {
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const selectedAnalysis = selectedItem.ai_attributes as ClothingAnalysis | null;
    if (!selectedAnalysis) {
      // Can't match without analysis
      return { matches: [], error: new Error('Item not analyzed') };
    }

    // Filter and score potential matches
    const scoredMatches = wardrobeItems
      .filter(item => item.id !== selectedItem.id) // Exclude the selected item
      .map(item => {
        const analysis = item.ai_attributes as ClothingAnalysis | null;
        if (!analysis) return null;

        let score = 0;

        // Color harmony (complementary colors)
        const colorMatch = selectedAnalysis.colors.some(selectedColor =>
          analysis.colors.some(color => 
            areComplementaryColors(selectedColor, color)
          )
        );
        if (colorMatch) score += 30;

        // Style match
        const styleMatch = selectedAnalysis.style.some(selectedStyle =>
          analysis.style.includes(selectedStyle)
        );
        if (styleMatch) score += 25;

        // Occasion match
        const occasionMatch = selectedAnalysis.occasion.some(selectedOccasion =>
          analysis.occasion.includes(selectedOccasion)
        );
        if (occasionMatch) score += 25;

        // Season match
        const seasonMatch = selectedAnalysis.season.some(selectedSeason =>
          analysis.season.includes(selectedSeason) || selectedSeason === 'all-season' || analysis.season.includes('all-season')
        );
        if (seasonMatch) score += 20;

        return score > 0 ? { ...item, matchScore: score } : null;
      })
      .filter((item): item is WardrobeItem & { matchScore: number } => item !== null)
      .sort((a, b) => b.matchScore - a.matchScore);

    return { matches: scoredMatches, error: null };
  } catch (error) {
    return { matches: [], error: error as Error };
  }
}

/**
 * Check if two colors are complementary or harmonious
 */
function areComplementaryColors(color1: string, color2: string): boolean {
  const c1 = color1.toLowerCase();
  const c2 = color2.toLowerCase();

  // Same color family
  if (c1 === c2) return true;

  // Common complementary pairs
  const complementary: Record<string, string[]> = {
    red: ['green', 'blue', 'white', 'black', 'beige'],
    blue: ['orange', 'white', 'black', 'beige', 'brown'],
    green: ['red', 'white', 'black', 'beige', 'brown'],
    yellow: ['purple', 'blue', 'black', 'white'],
    purple: ['yellow', 'white', 'black', 'beige'],
    orange: ['blue', 'white', 'black', 'beige'],
    white: ['all'], // white goes with everything
    black: ['all'], // black goes with everything
    beige: ['all'], // neutral
    brown: ['blue', 'white', 'beige', 'green'],
    gray: ['all'], // gray goes with everything
    grey: ['all']
  };

  return complementary[c1]?.includes(c2) || 
         complementary[c2]?.includes(c1) ||
         complementary[c1]?.includes('all') ||
         complementary[c2]?.includes('all');
}

/**
 * Convert image URL to base64
 */
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Batch analyze multiple items (with rate limiting)
 */
export async function batchAnalyze(
  items: WardrobeItem[],
  onProgress?: (current: number, total: number, itemName?: string) => void
): Promise<{ results: Array<{ item: WardrobeItem; analysis: ClothingAnalysis | null }>; error: Error | null }> {
  const results: Array<{ item: WardrobeItem; analysis: ClothingAnalysis | null }> = [];
  
  try {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      // Notify what we're analyzing
      onProgress?.(i + 1, items.length, `${item.name} (${item.category})`);
      
      // Skip if already analyzed
      if (item.ai_attributes) {
        // Cast ai_attributes to ClothingAnalysis with proper handling
        results.push({ 
          item, 
          analysis: {
            colors: (item.ai_attributes as any).colors || [],
            style: (item.ai_attributes as any).style || 'casual',
            occasion: (item.ai_attributes as any).occasion || ['daily'],
            season: (item.ai_attributes as any).season || ['all-season'],
            description: (item.ai_attributes as any).description || item.name
          }
        });
        continue;
      }

      const imageUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/clothes/${item.image_path}`;
      const { analysis } = await analyzeClothing(imageUrl, item.name, item.category);
      
      results.push({ item, analysis });

      // Rate limiting: Wait 4 seconds between requests (15 req/min = 1 req/4s)
      if (i < items.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    return { results, error: null };
  } catch (error) {
    return { results, error: error as Error };
  }
}
