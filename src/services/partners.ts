/**
 * Partners Service
 * Brand/partner showcase — admin manages, users view
 */

import { supabase, supabaseAdmin } from './supabase';
import { uploadImage, deleteImage } from './storage';

// Admin client bypasses RLS for admin panel reads; user-facing reads also work since partners table is public
const db = supabaseAdmin ?? supabase;

export interface Partner {
  id: string;
  name: string;
  thumbnail_path: string;
  rating: number | null;
  website_url: string | null;
  created_at: string;
}

export interface PartnerPost {
  id: string;
  partner_id: string;
  name: string;
  category: string;
  description: string;
  image_path: string;
  rating: number | null;
  size?: string | null;
  brand?: string | null;
  review?: string | null;
  owns_image?: boolean;
  created_at: string;
}

// ── Partners CRUD ─────────────────────────────────────────────────────────────

export async function getPartners(): Promise<{ partners: Partner[]; error: Error | null }> {
  try {
    const { data, error } = await db
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { partners: data || [], error: null };
  } catch (error) {
    return { partners: [], error: error as Error };
  }
}

export async function createPartner(
  data: { name: string; rating: number | null; website_url: string | null; thumbnail: File }
): Promise<{ partner: Partner | null; error: Error | null }> {
  try {
    const { path, error: uploadErr } = await uploadImage(data.thumbnail, 'partners');
    if (uploadErr || !path) throw uploadErr || new Error('Upload failed');

    const { data: row, error } = await db
      .from('partners')
      .insert({ name: data.name, rating: data.rating || null, website_url: data.website_url || null, thumbnail_path: path })
      .select()
      .single();

    if (error) throw error;
    return { partner: row, error: null };
  } catch (error) {
    return { partner: null, error: error as Error };
  }
}

export async function deletePartner(
  id: string,
  thumbnailPath: string
): Promise<{ error: Error | null }> {
  try {
    await deleteImage(thumbnailPath);
    const { error } = await db.from('partners').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// ── Partner Posts CRUD ────────────────────────────────────────────────────────

export async function getPartnerPosts(
  partnerId: string
): Promise<{ posts: PartnerPost[]; error: Error | null }> {
  try {
    const { data, error } = await db
      .from('partner_posts')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { posts: data || [], error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

export async function createPartnerPost(
  partnerId: string,
  data: { name: string; category: string; description: string; rating: number | null; image: File; size?: string | null; brand?: string | null; review?: string | null }
): Promise<{ post: PartnerPost | null; error: Error | null }> {
  try {
    const { path, error: uploadErr } = await uploadImage(data.image, `partners/${partnerId}`);
    if (uploadErr || !path) throw uploadErr || new Error('Upload failed');

    const { data: row, error } = await db
      .from('partner_posts')
      .insert({
        partner_id:  partnerId,
        name:        data.name,
        category:    data.category,
        description: data.description,
        rating:      data.rating || null,
        size:        data.size || null,
        brand:       data.brand || null,
        review:      data.review || null,
        owns_image:  true,
        image_path:  path,
      })
      .select()
      .single();

    if (error) throw error;
    return { post: row, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

/**
 * Publish a home post into the selected partner collection.
 * It reuses the already-uploaded image path, avoiding a second Storage upload
 * that would be blocked by normal user Storage policies.
 */
export async function createPartnerPostFromExistingImage(
  partnerId: string,
  data: { name: string; category: string; description: string; rating: number | null; imagePath: string; size?: string | null; brand?: string | null; review?: string | null }
): Promise<{ post: PartnerPost | null; error: Error | null }> {
  try {
    const base = {
      partner_id: partnerId,
      name: data.name,
      category: data.category,
      description: data.description,
      rating: data.rating || null,
      image_path: data.imagePath,
    };
    const extended = {
      ...base,
      size: data.size || null,
      brand: data.brand || null,
      review: data.review || null,
      owns_image: false,
    };

    let result = await db.from('partner_posts').insert(extended).select().single();
    const schemaNotReady = result.error && (
      result.error.code === '42703' ||
      result.error.code === 'PGRST204' ||
      /column|schema cache|does not exist/i.test(result.error.message || '')
    );

    // Older databases may not have migration 005 yet. Publish the core item
    // immediately instead of losing the partner post entirely.
    if (schemaNotReady) {
      result = await db.from('partner_posts').insert(base).select().single();
    }

    if (result.error) throw result.error;
    return { post: result.data, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

/* Keep the image-copy data contract available for callers that already have a File. */
export async function createPartnerPostFromFile(
  partnerId: string,
  data: { name: string; category: string; description: string; rating: number | null; image: File; size?: string | null; brand?: string | null; review?: string | null }
): Promise<{ post: PartnerPost | null; error: Error | null }> {
  return createPartnerPost(partnerId, {
      name: data.name,
      category: data.category,
      description: data.description,
      rating: data.rating,
      image: data.image,
      size: data.size,
      brand: data.brand,
      review: data.review,
  });
}

export async function deletePartnerPost(
  id: string,
  imagePath: string
): Promise<{ error: Error | null }> {
  try {
    const { data: existing } = await db
      .from('partner_posts')
      .select('owns_image')
      .eq('id', id)
      .maybeSingle();
    // Home-post images can be shared with partner_posts when migration 005 is
    // not applied yet. Only partner-owned files should be removed here.
    const ownsImage = existing?.owns_image === true || imagePath.startsWith('partners/');
    if (ownsImage) await deleteImage(imagePath);
    const { error } = await db.from('partner_posts').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}
