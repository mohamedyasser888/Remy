/**
 * AI Stylist Chat Service
 * Primary:  Groq (Llama 4 Scout) — free, no credit card, vision, ultra-fast
 * Fallback: Gemini 1.5 Flash       — free tier 15 req/min
 *
 * Reads EVERY clothing image, understands them visually,
 * then picks the best full outfit (top, bottom, jacket, shoes, socks, accessories)
 * and tells the user what's missing from their wardrobe.
 */

import type { WardrobeItem } from '@/types';
import { supabase } from '@/services/supabase';

const GROQ_API_KEY   = import.meta.env.VITE_GROQ_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const SUPABASE_URL   = import.meta.env.VITE_SUPABASE_URL;

const GROQ_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GROQ_VISION_MODEL = 'qwen/qwen3.8-27b';
const GROQ_REASONING_MODEL = 'openai/gpt-oss-120b';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  outfitSuggestions?: OutfitSuggestion[];
  timestamp: Date;
}

export interface OutfitSuggestion {
  items: WardrobeItem[];
  reason: string;
}

export interface ChatResponse {
  message: string;
  outfitSuggestions?: OutfitSuggestion[];
  alerts?: string[];
  error?: Error;
}

interface MasterOutfitResult {
  intro: string;
  alerts?: string[];
  invalid_item_ids?: string[];
  accessory_notes?: Array<{ item_id: string; fit_score: number; verdict: string; reason: string }>;
  outfits: Array<{
    title: string;
    item_ids: string[];
    reason: string;
    missing?: string[];
  }>;
}

// ─── Slot mapping — which categories belong to which outfit slot ──────────────

const SLOT_MAP: Record<string, string[]> = {
  top:         ['tops', 'top', 'shirt', 'chemise', 'blouse', 't-shirt', 'tshirt', 'sweater', 'hoodie', 'polo'],
  bottom:      ['bottoms', 'bottom', 'jean', 'jeans', 'pant', 'pants', 'pantalon', 'trouser', 'trousers', 'skirt', 'shorts'],
  dress:       ['dress', 'dresses'],
  jacket:      ['jacket', 'jackets', 'coat', 'blazer'],
  shoes:       ['shoes', 'shoe', 'sneaker', 'sneakers', 'boots', 'boot', 'heels', 'heel', 'sandals', 'sandal'],
  socks:       ['socks', 'sock'],
  bag:         ['bags', 'bag'],
  accessories: ['accessories', 'accessory', 'belt', 'belts', 'scarf', 'hijab', 'hat', 'cap', 'caps', 'watch', 'necklace', 'bracelet', 'sunglasses'],
};

function getSlot(item: WardrobeItem): string {
  const cat = item.category.toLowerCase();
  for (const [slot, keywords] of Object.entries(SLOT_MAP)) {
    if (keywords.some(k => cat.includes(k))) return slot;
  }
  return 'other';
}

function obviousCategoryMismatch(item: WardrobeItem): string | null {
  const category = item.category.toLowerCase();
  const name = item.name.toLowerCase();
  const garmentWords = ['pantalon', 'pants', 'trouser', 'jean', 'jeans', 'skirt', 'shorts', 'legging', 'leggings'];
  const looksLikeGarment = garmentWords.some(word => name.includes(word));
  if (category === 'accessories' && looksLikeGarment) {
    return `${item.name} appears to be clothing, not an accessory. Please recategorize it.`;
  }
  if (category === 'bags' && looksLikeGarment) {
    return `${item.name} appears to be clothing, not a bag. Please recategorize it.`;
  }
  return null;
}

function isFormalRequest(request: string): boolean {
  return /formal|formel|office|work|business|interview|wedding|ceremony|ceremonial|elegant|dressy|professional|meeting|black tie|smart dress/i.test(request);
}

function itemSearchText(item: WardrobeItem): string {
  return `${item.name} ${item.category} ${JSON.stringify(item.ai_attributes || {})}`.toLowerCase();
}

function isTooCasualForFormal(item: WardrobeItem): boolean {
  return /sweatshirt|sweat shirt|sweat-shirt|switchirt|swichirt|hoodie|t-shirt|tshirt|sportswear|sport wear|athleisure|jogger|track suit|tracksuit|sneaker|trainers|flip flop|running shoe|gym shoe/i.test(itemSearchText(item));
}

function fitsRequestedOccasion(items: WardrobeItem[], request: string): boolean {
  return !isFormalRequest(request) || !items.some(isTooCasualForFormal);
}

function requestAwareScore(item: WardrobeItem, request: string): number {
  const text = itemSearchText(item);
  let score = 0;
  if (isFormalRequest(request)) {
    if (/formal|chemise|shirt|blouse|blazer|tailored|trouser|dress|business|elegant|dress shoe|heel|loafer|oxford/i.test(text)) score += 12;
    if (/cotton|linen|wool|silk|satin|structured|classic|smart/i.test(text)) score += 2;
    if (/shorts|cargo|flip flop|slipper/i.test(text)) score -= 12;
    if (isTooCasualForFormal(item)) score -= 30;
  } else if (/casual|relaxed|everyday|weekend/i.test(request)) {
    if (/jeans|denim|sweatpants|sweat pants|jogger|joggers|sweatshirt|hoodie|t-shirt|sneaker/i.test(text)) score += 14;
    if (/classic trouser|formal trouser|tailored trouser|dress pant|dress pants|blazer|oxford|loafer/i.test(text)) score -= 6;
  }
  return score;
}

function outfitDecisionScore(items: WardrobeItem[], request: string): number {
  const slots = new Set(items.map(getSlot));
  let score = items.reduce((total, item) => total + requestAwareScore(item, request), 0);
  if (slots.has('dress') || (slots.has('top') && slots.has('bottom'))) score += 8;
  if (slots.has('shoes')) score += 4;
  if (isFormalRequest(request) && slots.has('jacket')) score += 3;
  return score;
}

function chooseForRequest(items: WardrobeItem[], request: string): WardrobeItem | undefined {
  return [...items]
    .filter(item => !isFormalRequest(request) || !isTooCasualForFormal(item))
    .sort((a, b) => requestAwareScore(b, request) - requestAwareScore(a, request))[0];
}

// ─── Convert image URL to base64 ─────────────────────────────────────────────

async function toBase64(imagePath: string): Promise<{ data: string; mime: string } | null> {
  try {
    const url = `${SUPABASE_URL}/storage/v1/object/public/clothes/${imagePath}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const mime = blob.type || 'image/jpeg';
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({ data: (reader.result as string).split(',')[1], mime });
      reader.onerror   = reject;
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

// ─── Describe ONE item using Groq Vision (Llama 4 Scout) ─────────────────────

async function describeWithGroq(item: WardrobeItem): Promise<string | null> {
  if (!GROQ_API_KEY) return null;
  const img = await toBase64(item.image_path);
  if (!img) return null;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe this clothing item in ONE sentence (max 15 words). Include: color, pattern, garment type. Only output the sentence.'
            },
            {
              type: 'image_url',
              image_url: { url: `data:${img.mime};base64,${img.data}` }
            }
          ]
        }],
        max_tokens: 60,
        temperature: 0.1
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('Groq vision error:', err);
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.warn('Groq vision failed:', e);
    return null;
  }
}

// ─── Describe ONE item using Gemini Vision (fallback) ────────────────────────

/** Analyze the complete wardrobe in one multimodal pass and rank three looks. */
async function buildMasterOutfitsWithGemini(
  userRequest: string,
  wardrobeItems: WardrobeItem[],
): Promise<{ message: string; outfitSuggestions?: OutfitSuggestion[]; alerts?: string[] } | null> {
  if (!GEMINI_API_KEY) return null;

  const images = await Promise.all(wardrobeItems.map(async item => ({ item, image: await toBase64(item.image_path) })));
  const usableImages = images.filter((entry): entry is { item: WardrobeItem; image: { data: string; mime: string } } => Boolean(entry.image));
  if (!usableImages.length) return null;

  const wardrobeIndex = wardrobeItems.map(item =>
    `[${item.id}] name="${item.name}" declared_category="${item.category}" size="${item.size}" attributes=${JSON.stringify(item.ai_attributes || {})}`
  ).join('\n');
  const prompt = `You are a world-class personal fashion director and wardrobe editor.
The user asks: "${userRequest}"
Inspect every wardrobe image below. The text index is authoritative for IDs:
${wardrobeIndex}

Create exactly THREE distinct, high-quality outfits from the user's actual wardrobe. Analyze color harmony, patterns, fabric, silhouette, proportions, layering, footwear, accessories, season, occasion, and the user's request.
Rules: use only indexed IDs; never invent clothing; each look needs a dress OR at least a top and bottom; add optional pieces only when they improve the look; make all three looks meaningfully different; obey any requested color, garment, occasion, or season; rank 1 strongest, 2 best alternative, 3 most creative wearable option. Formal decision rule: when the request includes formal, office, business, interview, wedding, elegant, dressy, or professional, prioritize chemise/shirts, blazers, tailored trousers or skirts, dresses, loafers, heels, or dress shoes. Reject sweatshirts, hoodies, T-shirts, joggers, sportswear, and sneakers unless the user explicitly asks for them. Do not call a sweatshirt formal just because its color matches. Casual decision rule: when the request includes casual, relaxed, everyday, or weekend, prefer jeans/denim, sweatpants, joggers, casual sneakers, hoodies, and relaxed tops over classic trousers, tailored pants, dress shoes, or blazers.
Category safety: compare every image with its declared category. If an image is trousers/pants but declared as Accessories, it is invalid and must not be used at all. If an image is clothing but declared as Bags, it is invalid and must not be used at all. Do not reinterpret a mismatched item as an accessory. Add the ID to invalid_item_ids and explain the mismatch in alerts. Only use category-compatible items in outfits.
Evaluate every valid item declared as Accessories or Bags separately. Rings, belts, scarves, bags, and similar pieces must appear in accessory_notes even when not needed in the core outfit. Give each a realistic 0-100 fit_score, verdict, and reason. Never omit a valid accessory without evaluating it.
Return ONLY valid JSON: {"intro":"one short expert overview","alerts":["category mismatch warnings, or []"],"invalid_item_ids":["IDs of visually mismatched items, or []"],"accessory_notes":[{"item_id":"id","fit_score":50,"verdict":"Works as a subtle accent","reason":"..."}],"outfits":[{"title":"...","item_ids":["id"],"reason":"2 concise sentences explaining the styling logic","missing":["optional missing slot"]},{"title":"...","item_ids":["id"],"reason":"...","missing":[]},{"title":"...","item_ids":["id"],"reason":"...","missing":[]}]}`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  for (const { item, image } of usableImages) {
    parts.push({ text: `Image for wardrobe item ID ${item.id} (${item.name}).` });
    parts.push({ inline_data: { mime_type: image.mime, data: image.data } });
  }

  try {
    const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }], generationConfig: { temperature: 0.65, maxOutputTokens: 2400, responseMimeType: 'application/json' } }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const parsed = parseMasterOutfits(data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '');
    if (!parsed) return null;

    const validIds = new Set(wardrobeItems.map(item => item.id));
    const invalidIds = new Set(parsed.invalid_item_ids || []);
    const seen = new Set<string>();
    const suggestions = parsed.outfits.map(outfit => {
      const ids = [...new Set((outfit.item_ids || []).filter(id => validIds.has(id) && !invalidIds.has(id)))];
      const signature = [...ids].sort().join('|');
      if (!ids.length || seen.has(signature)) return null;
      seen.add(signature);
      const selectedItems = ids.map(id => wardrobeItems.find(item => item.id === id)).filter((item): item is WardrobeItem => Boolean(item));
      if (!isStructurallyValidOutfit(selectedItems) || !fitsRequestedOccasion(selectedItems, userRequest)) return null;
      const missing = outfit.missing?.length ? `\nMissing: ${outfit.missing.join(', ')}` : '';
      return { items: selectedItems, reason: `${outfit.title}: ${outfit.reason}${missing}` };
    }).filter((outfit: OutfitSuggestion | null): outfit is OutfitSuggestion => Boolean(outfit))
      .sort((a: OutfitSuggestion, b: OutfitSuggestion) => outfitDecisionScore(b.items, userRequest) - outfitDecisionScore(a.items, userRequest))
      .slice(0, 3);
    const alertText = parsed.alerts?.length ? `\n\n⚠️ Wardrobe check:\n${parsed.alerts.map(alert => `• ${alert}`).join('\n')}` : '';
    if (!suggestions.length && parsed.alerts?.length) {
      return { message: `I could not build a safe outfit from the available pieces.${alertText}${formatAccessoryNotes(parsed.accessory_notes, validIds)}`, alerts: parsed.alerts };
    }
    return suggestions.length ? { message: `${parsed.intro || 'Here are my three strongest looks for you.'}${alertText}${formatAccessoryNotes(parsed.accessory_notes, validIds)}`, outfitSuggestions: suggestions, alerts: parsed.alerts } : null;
  } catch (error) {
    console.warn('Master stylist request failed:', error);
    return null;
  }
}

function isStructurallyValidOutfit(items: WardrobeItem[]): boolean {
  const slots = new Set(items.map(getSlot));
  return slots.has('dress') || (slots.has('top') && slots.has('bottom'));
}

async function requestSecureStylist(
  userRequest: string,
  wardrobeItems: WardrobeItem[],
): Promise<ChatResponse | null> {
  if (import.meta.env.VITE_USE_SECURE_STYLIST !== 'true') return null;
  try {
    const { data, error } = await supabase.functions.invoke('stylist', {
      body: { userMessage: userRequest, wardrobeItems },
    });
    if (error || !data?.outfits) return null;
    const validItems = new Map(wardrobeItems.map(item => [item.id, item]));
    const invalidIds = new Set<string>(Array.isArray(data.invalid_item_ids) ? data.invalid_item_ids : []);
    const suggestions = data.outfits.map((outfit: { title?: string; item_ids?: string[]; reason?: string }) => {
      const items = [...new Set(outfit.item_ids || [])].filter(id => !invalidIds.has(id)).map(id => validItems.get(id)).filter(Boolean) as WardrobeItem[];
      return isStructurallyValidOutfit(items) && fitsRequestedOccasion(items, userRequest)
        ? { items, reason: `${outfit.title || 'Look'}: ${outfit.reason || ''}` }
        : null;
    }).filter((outfit: OutfitSuggestion | null): outfit is OutfitSuggestion => Boolean(outfit))
      .sort((a: OutfitSuggestion, b: OutfitSuggestion) => outfitDecisionScore(b.items, userRequest) - outfitDecisionScore(a.items, userRequest))
      .slice(0, 3) as OutfitSuggestion[];
    const alertText = Array.isArray(data.alerts) && data.alerts.length ? `\n\n⚠️ Wardrobe check:\n${data.alerts.map((alert: string) => `• ${alert}`).join('\n')}` : '';
    if (!suggestions.length && alertText) {
      return { message: `I could not build a safe outfit from the available pieces.${alertText}${formatAccessoryNotes(data.accessory_notes, new Set(validItems.keys()))}`, alerts: data.alerts };
    }
    return suggestions.length ? { message: `${data.intro || 'Here are my strongest looks for you.'}${alertText}${formatAccessoryNotes(data.accessory_notes, new Set(validItems.keys()))}`, outfitSuggestions: suggestions, alerts: data.alerts } : null;
  } catch {
    return null;
  }
}

function formatAccessoryNotes(
  notes: MasterOutfitResult['accessory_notes'],
  validIds: Set<string>,
): string {
  const usable = (notes || []).filter(note => validIds.has(note.item_id));
  if (!usable.length) return '';
  return `\n\n✨ Accessory check:\n${usable.map(note => `• ${note.verdict} — ${note.reason}`).join('\n')}`;
}

function parseMasterOutfits(text: string): MasterOutfitResult | null {
  try {
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    const json = clean.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;
    const parsed = JSON.parse(json) as Partial<MasterOutfitResult>;
    if (!Array.isArray(parsed.outfits)) return null;
    return { intro: typeof parsed.intro === 'string' ? parsed.intro : '', alerts: Array.isArray(parsed.alerts) ? parsed.alerts.filter(alert => typeof alert === 'string') : [], invalid_item_ids: Array.isArray(parsed.invalid_item_ids) ? parsed.invalid_item_ids.filter(id => typeof id === 'string') : [], accessory_notes: Array.isArray(parsed.accessory_notes) ? parsed.accessory_notes.filter(note => note && typeof note.item_id === 'string') as MasterOutfitResult['accessory_notes'] : [], outfits: parsed.outfits.filter(outfit => outfit && Array.isArray(outfit.item_ids)) as MasterOutfitResult['outfits'] };
  } catch { return null; }
}

async function describeWithGemini(item: WardrobeItem): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;
  const img = await toBase64(item.image_path);
  if (!img) return null;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [
          { text: 'Describe this clothing item in ONE sentence (max 15 words). Include: color, pattern, garment type. Only output the sentence.' },
          { inline_data: { mime_type: img.mime, data: img.data } }
        ]}],
        generationConfig: { temperature: 0.1, maxOutputTokens: 60 }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch { return null; }
}

// ─── Describe an item — try Groq first, then Gemini, then fallback ───────────

async function describeItem(item: WardrobeItem): Promise<string> {
  const desc =
    await describeWithGroq(item) ||
    await describeWithGemini(item) ||
    `${item.category} item`;

  console.log(`  ✓ [${getSlot(item)}] "${item.name}" → ${desc}`);
  return desc;
}

// ─── Ask Groq (text only) to build the best outfit from described items ───────

async function buildOutfitWithGroq(
  userRequest: string,
  items: { id: string; slot: string; name: string; desc: string }[],
  forcedPicks: Record<string, string> = {}
): Promise<{ picks: Record<string, string>; message: string; missing: string[] } | null> {
  if (!GROQ_API_KEY) return null;

  const itemList = addHints(userRequest, items);
  const prompt = buildOutfitPrompt(userRequest, itemList, forcedPicks);

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_REASONING_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 600,
        temperature: 0.4,
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '';
    console.log('Groq outfit response:', text);
    return parseOutfitJson(text);
  } catch { return null; }
}

// ─── Ask Gemini (text) to build outfit — fallback ────────────────────────────

async function buildOutfitWithGemini(
  userRequest: string,
  items: { id: string; slot: string; name: string; desc: string }[],
  forcedPicks: Record<string, string> = {}
): Promise<{ picks: Record<string, string>; message: string; missing: string[] } | null> {
  if (!GEMINI_API_KEY) return null;

  const itemList = addHints(userRequest, items);
  const prompt = buildOutfitPrompt(userRequest, itemList, forcedPicks);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
      })
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    console.log('Gemini outfit response:', text);
    return parseOutfitJson(text);
  } catch { return null; }
}

// ─── Pre-filter: extract color/item hints from request ───────────────────────

/**
 * Directly match color + slot from user request against vision descriptions.
 * Returns forced slot→id picks that override the AI's choices.
 * 
 * "yellow dress" → finds item described as yellow/golden/cream in dress slot
 * "red top"      → finds item described as red in top slot
 */
function extractForcedPicks(
  request: string,
  items: { id: string; slot: string; name: string; desc: string }[]
): Record<string, string> {
  const req = request.toLowerCase();
  const forced: Record<string, string> = {};

  // Color synonyms — map many words to canonical colors
  const colorGroups: Record<string, string[]> = {
    yellow:  ['yellow', 'golden', 'gold', 'mustard', 'lemon', 'canary', 'buttercup', 'champagne', 'cream', 'butter'],
    red:     ['red', 'crimson', 'scarlet', 'burgundy', 'maroon', 'ruby', 'wine', 'cherry', 'rose'],
    blue:    ['blue', 'navy', 'cobalt', 'royal blue', 'sky blue', 'turquoise', 'teal', 'azure', 'indigo', 'denim'],
    green:   ['green', 'olive', 'khaki', 'sage', 'forest', 'mint', 'emerald', 'lime'],
    black:   ['black', 'dark', 'ebony', 'onyx', 'charcoal'],
    white:   ['white', 'ivory', 'off-white', 'ecru', 'pearl'],
    pink:    ['pink', 'blush', 'rose', 'fuchsia', 'magenta', 'coral', 'salmon'],
    purple:  ['purple', 'violet', 'lavender', 'lilac', 'plum', 'mauve'],
    orange:  ['orange', 'peach', 'apricot', 'rust', 'copper', 'terracotta'],
    brown:   ['brown', 'tan', 'camel', 'beige', 'nude', 'taupe', 'mocha', 'chocolate'],
    grey:    ['grey', 'gray', 'silver', 'ash', 'slate'],
  };

  // Slot keywords in request
  const slotKeywords: Record<string, string[]> = {
    dress:       ['dress', 'gown', 'frock'],
    top:         ['shirt', 'top', 'blouse', 'chemise', 'tshirt', 't-shirt', 'sweater', 'hoodie'],
    bottom:      ['jeans', 'jean', 'pants', 'pant', 'pantalon', 'trousers', 'skirt', 'shorts'],
    jacket:      ['jacket', 'coat', 'blazer'],
    shoes:       ['shoes', 'shoe', 'sneakers', 'boots', 'heels', 'sandals'],
    socks:       ['socks', 'sock'],
    accessories: ['bag', 'belt', 'scarf', 'accessory', 'accessories'],
  };

  // Find which colors and slots are in the request
  const reqColors: { canonical: string; synonyms: string[] }[] = [];
  for (const [canonical, synonyms] of Object.entries(colorGroups)) {
    if (synonyms.some(s => req.includes(s))) {
      reqColors.push({ canonical, synonyms });
    }
  }

  const reqSlots: string[] = [];
  for (const [slot, keywords] of Object.entries(slotKeywords)) {
    if (keywords.some(k => req.includes(k))) reqSlots.push(slot);
  }

  console.log('Detected colors in request:', reqColors.map(c => c.canonical));
  console.log('Detected slots in request:', reqSlots);

  if (reqColors.length === 0) return forced; // no color specified, let AI decide

  // Find items that match the requested color(s) AND slot(s)
  for (const colorGroup of reqColors) {
    for (const targetSlot of reqSlots.length > 0 ? reqSlots : Object.keys(slotKeywords)) {
      const match = items.find(item => {
        if (item.slot !== targetSlot) return false;
        const descLower = item.desc.toLowerCase();
        return colorGroup.synonyms.some(syn => descLower.includes(syn));
      });

      if (match) {
        console.log(`✅ FORCED: "${targetSlot}" = "${match.name}" (matched color: ${colorGroup.canonical}, desc: ${match.desc})`);
        forced[targetSlot] = match.id;
      } else {
        console.log(`❌ No ${colorGroup.canonical} ${targetSlot} found in descriptions`);
        // Log what IS available in that slot for debugging
        const slotItems = items.filter(i => i.slot === targetSlot);
        slotItems.forEach(i => console.log(`   Available: "${i.name}" → "${i.desc}"`));
      }
    }
  }

  return forced;
}

// ─── Add color hints to item list ────────────────────────────────────────────

function addHints(
  request: string,
  items: { id: string; slot: string; name: string; desc: string }[]
): string {
  const req = request.toLowerCase();
  const colors = ['yellow','golden','gold','red','blue','green','black','white',
    'pink','purple','orange','brown','grey','gray','beige','navy','cream'];
  return items.map((i, n) => {
    const descLower = i.desc.toLowerCase();
    const matchedColor = colors.find(c => req.includes(c) && descLower.includes(c));
    const hint = matchedColor ? ` <<⭐ MATCHES "${matchedColor}" — PRIORITIZE>>` : '';
    return `${n + 1}. [ID:${i.id}] [SLOT:${i.slot}] ${i.name} — ${i.desc}${hint}`;
  }).join('\n');
}

function buildOutfitPrompt(request: string, itemList: string, _forced?: Record<string, string>): string {
  return `You are an expert fashion stylist with deep knowledge of color theory, style matching, and occasion dressing.

The user wants: "${request}"

Here are ALL items in their wardrobe (with AI visual descriptions):
${itemList}

CRITICAL RULES — READ CAREFULLY:

⚡ SPECIFIC ITEM REQUESTS: If the user mentions a specific color (e.g. "yellow", "red", "blue") or specific item type (e.g. "yellow dress", "blue jeans"), you MUST pick the item whose AI description contains that color/type. This overrides ALL other preferences. Example: "yellow dress" → find the item described as yellow in the dress slot and pick it. Do NOT pick a different colored item.

⚡ WHEN MULTIPLE OPTIONS EXIST: If there are 2 dresses, pick the one whose description matches the color/style the user asked for. Check the description field carefully.

1. UNDERSTAND THE REQUEST:
   - "yellow dress" → find dress described as yellow → pick it
   - "casual outfit" → pick casual-looking top + bottom
   - "party outfit" → pick most elegant/dressy items
   - "formal/work" → pick structured, professional items
   - "summer look" → pick light, bright, airy items

2. COLOR MATCH — when user specifies a color, THAT item is mandatory
   - Search descriptions for that color word
   - Pick that exact item regardless of other factors

3. STYLE CONSISTENCY — all items should match the same style level

4. SLOTS:
   - top: shirt, blouse, t-shirt (set null if dress chosen)
   - bottom: jeans, trousers, skirt (set null if dress chosen)
   - dress: pick when user asks for a dress specifically, or occasion suits it
   - jacket: only if weather/occasion needs it
   - shoes: always include if available
   - socks: include if appropriate
   - accessories: belt, bag, scarf if available and matching

5. MISSING — list slots where wardrobe has ZERO items of that type

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "message": "2-3 enthusiastic sentences explaining WHY you picked these specific pieces. If user asked for a color, confirm you found it.",
  "picks": {
    "top": "exact_item_id or null",
    "bottom": "exact_item_id or null",
    "dress": "exact_item_id or null",
    "jacket": "exact_item_id or null",
    "shoes": "exact_item_id or null",
    "socks": "exact_item_id or null",
    "accessories": "exact_item_id or null"
  },
  "missing": ["list slots with zero items, e.g. shoes"]
}`;
}

// ─── Parse JSON from AI response ─────────────────────────────────────────────

function parseOutfitJson(text: string): { picks: Record<string, string>; message: string; missing: string[] } | null {
  try {
    const clean  = text.replace(/```json\n?|```\n?/g, '').trim();
    const jsonStr = clean.match(/\{[\s\S]*\}/)?.[0];
    if (!jsonStr) return null;
    const parsed = JSON.parse(jsonStr);
    return {
      picks:   parsed.picks   || {},
      message: parsed.message || 'Here is your outfit!',
      missing: parsed.missing || []
    };
  } catch { return null; }
}

// ─── Main exported function ───────────────────────────────────────────────────

export async function chatWithStylist(
  userMessage: string,
  wardrobeItems: WardrobeItem[],
  _history: ChatMessage[]
): Promise<ChatResponse> {
  console.log('\n=== AI Stylist ===');
  console.log('Request:', userMessage);
  console.log('Wardrobe items:', wardrobeItems.length);
  wardrobeItems.forEach(i => console.log(`  - ${i.name} [${i.category}] img:${i.image_path}`));

  if (wardrobeItems.length === 0) {
    return { message: "Your wardrobe is empty! 👗\n\nPlease add some items to your wardrobe first." };
  }

  const localAlerts = wardrobeItems.map(obviousCategoryMismatch).filter((alert): alert is string => Boolean(alert));
  const locallySafeItems = wardrobeItems.filter(item => !obviousCategoryMismatch(item));
  if (locallySafeItems.length === 0 && localAlerts.length > 0) {
    return { message: `I cannot build a safe outfit from these pieces.\n\n⚠️ Wardrobe check:\n${localAlerts.map(alert => `• ${alert}`).join('\n')}`, alerts: localAlerts };
  }

  const secureResult = await requestSecureStylist(userMessage, locallySafeItems);
  if (secureResult) return localAlerts.length ? { ...secureResult, message: `${secureResult.message}\n\n⚠️ Wardrobe check:\n${localAlerts.map(alert => `• ${alert}`).join('\n')}`, alerts: [...(secureResult.alerts || []), ...localAlerts] } : secureResult;

  const masterResult = await buildMasterOutfitsWithGemini(userMessage, locallySafeItems);
  if (masterResult) return localAlerts.length ? { ...masterResult, message: `${masterResult.message}\n\n⚠️ Wardrobe check:\n${localAlerts.map(alert => `• ${alert}`).join('\n')}`, alerts: [...(masterResult.alerts || []), ...localAlerts] } : masterResult;

  // ── Step 1: Visually describe every item with AI vision ───────────────────
  console.log('\nDescribing all items with AI vision...');
  const describedItems: { id: string; slot: string; name: string; desc: string }[] = [];

  for (let i = 0; i < wardrobeItems.length; i++) {
    const item = wardrobeItems[i];
    console.log(`  [${i + 1}/${wardrobeItems.length}] Analyzing: ${item.name} (${item.category})`);
    const desc = await describeItem(item);
    describedItems.push({ id: item.id, slot: getSlot(item), name: item.name, desc });
    if (i < wardrobeItems.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n✅ All items described:');
  describedItems.forEach(d => console.log(`  [${d.slot}] "${d.name}": ${d.desc}`));

  // ── Step 2: Direct color+slot match BEFORE sending to AI ─────────────────
  // This prevents the AI from ignoring an explicit "yellow dress" request
  const forcedPicks = extractForcedPicks(userMessage, describedItems);
  console.log('\nForced picks from color/type matching:', forcedPicks);

  // ── Step 3: Build outfit with AI (Groq → Gemini → fallback) ─────────────
  console.log('\nBuilding outfit with AI...');
  const result =
    await buildOutfitWithGroq(userMessage, describedItems, forcedPicks) ||
    await buildOutfitWithGemini(userMessage, describedItems, forcedPicks) ||
    null;

  if (!result) {
    console.warn('Both AI models failed, using rule-based fallback');
    return ruleFallback(userMessage, locallySafeItems, forcedPicks, describedItems);
  }

  // ── Step 4: Override AI picks with forced picks (color match wins) ────────
  const finalPicks = { ...result.picks, ...forcedPicks };
  console.log('\nFinal picks (after color override):', finalPicks);

  // ── Step 5: Map IDs back to WardrobeItem objects ──────────────────────────
  const hasDress = finalPicks.dress && finalPicks.dress !== 'null';
  const pickedItems: WardrobeItem[] = [];

  for (const [slot, id] of Object.entries(finalPicks)) {
    if (!id || id === 'null') continue;
    if (hasDress && (slot === 'top' || slot === 'bottom')) continue;
    const item = wardrobeItems.find(w => w.id === id);
    if (item) pickedItems.push(item);
  }

  if (pickedItems.length === 0 || !fitsRequestedOccasion(pickedItems, userMessage)) {
    return ruleFallback(userMessage, locallySafeItems, forcedPicks, describedItems);
  }

  // ── Step 6: Build final message ───────────────────────────────────────────
  const slotEmoji: Record<string, string> = {
    top: '👕', bottom: '👖', dress: '👗', jacket: '🧥',
    shoes: '👟', socks: '🧦', accessories: '👜', other: '✨'
  };

  const itemLines = pickedItems
    .map(i => {
      const d = describedItems.find(x => x.id === i.id);
      return `${slotEmoji[getSlot(i)] || '✨'} **${i.name}** — ${d?.desc || i.category}`;
    })
    .join('\n');

  const missingNote = result.missing.length > 0
    ? `\n\n⚠️ **Not in your wardrobe:** ${result.missing.map(s => `${slotEmoji[s] || ''}${s}`).join(', ')}\nConsider adding these for a complete look!`
    : '\n\n✅ Your wardrobe has everything for this outfit!';

  return {
    message: `${result.message}\n\n${itemLines}${missingNote}`,
    outfitSuggestions: [{ items: pickedItems, reason: result.message }],
    alerts: localAlerts.length ? localAlerts : undefined,
  };
}

// ─── Rule-based fallback when both AIs fail ───────────────────────────────────

function ruleFallback(
  request: string,
  items: WardrobeItem[],
  _forced?: Record<string, string>,
  _described?: { id: string; slot: string; name: string; desc: string }[]
): ChatResponse {
  const req = request.toLowerCase();

  const bySlot: Record<string, WardrobeItem[]> = {};
  for (const item of items) {
    const s = getSlot(item);
    if (!bySlot[s]) bySlot[s] = [];
    bySlot[s].push(item);
  }

  const picked: WardrobeItem[] = [];
  const missing: string[] = [];

  const wantsDress = req.includes('dress') || req.includes('elegant') || req.includes('party');

  if (wantsDress && bySlot.dress?.length) {
    const dress = chooseForRequest(bySlot.dress, request);
    if (dress) picked.push(dress);
  } else {
    const top = chooseForRequest(bySlot.top || [], request);
    const bottom = chooseForRequest(bySlot.bottom || [], request);
    if (top) picked.push(top); else missing.push('top');
    if (bottom) picked.push(bottom); else missing.push('bottom');
  }

  const jacket = chooseForRequest(bySlot.jacket || [], request);
  if (jacket && !isTooCasualForFormal(jacket)) picked.push(jacket);
  const shoes = chooseForRequest(bySlot.shoes || [], request);
  if (shoes) picked.push(shoes); else missing.push('shoes');
  const socks = chooseForRequest(bySlot.socks || [], request);
  if (socks) picked.push(socks);
  // Do not guess with optional accessories in the fallback. A misplaced
  // garment must never be silently presented as an accessory.

  if (picked.length === 0) {
    return {
      message: `I couldn't build an outfit. You have:\n${items.map(i => `• ${i.name} (${i.category})`).join('\n')}`
    };
  }

  const slotEmoji: Record<string, string> = {
    top: '👕', bottom: '👖', dress: '👗', jacket: '🧥',
    shoes: '👟', socks: '🧦', accessories: '👜'
  };

  const itemLines = picked.map(i => `${slotEmoji[getSlot(i)] || '✨'} **${i.name}** (${i.category})`).join('\n');
  const occasionNote = isFormalRequest(request)
    ? '\n\nI treated this as a formal occasion, so casual sportswear was deliberately left out.'
    : '';

  const missingNote = missing.length > 0
    ? `\n\n⚠️ **Not in your wardrobe:** ${missing.join(', ')} — consider adding these!`
    : '';

  return {
    message: `Here's my outfit suggestion for you! 👗✨\n\n${itemLines}${missingNote}`,
    outfitSuggestions: [{ items: picked, reason: `${occasionNote}Best match for: ${request}` }]
  };
}
