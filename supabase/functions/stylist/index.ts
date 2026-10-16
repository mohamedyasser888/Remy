import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type WardrobeItem = {
  id: string;
  name: string;
  category: string;
  size: string;
  image_path: string;
  ai_attributes?: unknown;
};

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
const geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function imagePart(item: WardrobeItem) {
  try {
    const response = await fetch(`${supabaseUrl}/storage/v1/object/public/clothes/${item.image_path}`);
    if (!response.ok) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return {
      text: `Image for wardrobe item ID ${item.id} (${item.name}).`,
      inline_data: { mime_type: response.headers.get('content-type') || 'image/jpeg', data: btoa(binary) },
    };
  } catch {
    return null;
  }
}

serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'POST required' }, 405);
  if (!geminiKey) return json({ error: 'GEMINI_API_KEY is not configured' }, 500);

  try {
    const { userMessage, wardrobeItems } = await request.json() as { userMessage: string; wardrobeItems: WardrobeItem[] };
    if (!userMessage || !Array.isArray(wardrobeItems) || wardrobeItems.length === 0) {
      return json({ error: 'userMessage and wardrobeItems are required' }, 400);
    }

    const index = wardrobeItems.map(item =>
      `[${item.id}] name="${item.name}" declared_category="${item.category}" size="${item.size}" attributes=${JSON.stringify(item.ai_attributes || {})}`
    ).join('\n');
    const prompt = `You are a world-class personal fashion director.
User request: "${userMessage}"
Inspect every clothing image and use only the indexed wardrobe items below:
${index}

Return exactly three distinct ranked outfits. Analyze color harmony, pattern, fabric, silhouette, proportions, layering, footwear, accessories, season, occasion, and the request. Each outfit must contain one dress OR at least one top and one bottom. Use only IDs from the index. Do not invent items. Outfit 1 is strongest, outfit 2 is best alternative, outfit 3 is most creative but wearable. Be honest about missing optional pieces. Formal decision rule: when the request includes formal, office, business, interview, wedding, elegant, dressy, or professional, prioritize chemise/shirts, blazers, tailored trousers or skirts, dresses, loafers, heels, or dress shoes. Reject sweatshirts, hoodies, T-shirts, joggers, sportswear, and sneakers unless the user explicitly asks for them. Do not call a sweatshirt formal just because its color matches. Casual decision rule: when the request includes casual, relaxed, everyday, or weekend, prefer jeans/denim, sweatpants, joggers, casual sneakers, hoodies, and relaxed tops over classic trousers, tailored pants, dress shoes, or blazers. Category safety: compare every image with its declared category. If trousers/pants are declared as Accessories, or clothing is declared as Bags, the item is invalid and must not be used at all. Add its ID to invalid_item_ids and explain the mismatch in alerts.

Evaluate every valid Accessories or Bags item separately, including rings. Add each to accessory_notes with a realistic 0-100 fit_score, verdict, and reason, even when it is not needed in the core outfit.
Return only JSON: {"intro":"short expert overview","alerts":["category mismatch warnings, or []"],"invalid_item_ids":["visually mismatched IDs, or []"],"accessory_notes":[{"item_id":"id","fit_score":50,"verdict":"Works as a subtle accent","reason":"..."}],"outfits":[{"title":"...","item_ids":["id"],"reason":"two concise sentences","missing":[]},{"title":"...","item_ids":["id"],"reason":"two concise sentences","missing":[]},{"title":"...","item_ids":["id"],"reason":"two concise sentences","missing":[]}]}`;

    const parts: Record<string, unknown>[] = [{ text: prompt }];
    const images = await Promise.all(wardrobeItems.map(imagePart));
    images.forEach(part => {
      if (part) {
        parts.push({ text: part.text });
        parts.push({ inline_data: part.inline_data });
      }
    });

    const response = await fetch(`${geminiUrl}?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: 0.55, maxOutputTokens: 2400, responseMimeType: 'application/json' },
      }),
    });
    if (!response.ok) return json({ error: 'Stylist model request failed' }, 502);
    const result = await response.json();
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(text.replace(/```json\n?|```\n?/g, '').trim());
    return json(parsed);
  } catch (error) {
    console.error(error);
    return json({ error: 'Unable to generate outfit recommendations' }, 500);
  }
});
