/**
 * Wardrobe Service
 * Handles CRUD operations for wardrobe items and AI stylist integration
 */

import { supabase } from './supabase';
import { getImageUrl, deleteImage } from './storage';
import type { WardrobeItem, StylistItem } from '@/types';

// ============================================================================
// Standard CRUD Operations
// ============================================================================

/**
 * Get all wardrobe items for a user
 */
export async function getWardrobeItems(
  userId: string
): Promise<{ items: WardrobeItem[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { items: data || [], error: null };
  } catch (error) {
    return { items: [], error: error as Error };
  }
}

/**
 * Get a single wardrobe item by ID
 */
export async function getWardrobeItem(
  itemId: string
): Promise<{ item: WardrobeItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error) throw error;

    return { item: data, error: null };
  } catch (error) {
    return { item: null, error: error as Error };
  }
}

/**
 * Create a new wardrobe item
 */
export async function createWardrobeItem(
  item: Omit<WardrobeItem, 'id' | 'created_at'>
): Promise<{ item: WardrobeItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    return { item: data, error: null };
  } catch (error) {
    return { item: null, error: error as Error };
  }
}

/**
 * Update an existing wardrobe item
 */
export async function updateWardrobeItem(
  itemId: string,
  updates: Partial<Omit<WardrobeItem, 'id' | 'user_id' | 'created_at'>>
): Promise<{ item: WardrobeItem | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return { item: data, error: null };
  } catch (error) {
    return { item: null, error: error as Error };
  }
}

/**
 * Delete a wardrobe item
 * Also deletes the associated image from storage
 */
export async function deleteWardrobeItem(
  itemId: string,
  imagePath: string
): Promise<{ error: Error | null }> {
  try {
    // Delete image from storage first
    const { error: storageError } = await deleteImage(imagePath);
    if (storageError) {
      console.warn('Failed to delete image from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('wardrobe_items')
      .delete()
      .eq('id', itemId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

/**
 * Toggle the favourite status of a wardrobe item
 */
export async function toggleFavourite(
  itemId: string,
  currentStatus: boolean
): Promise<{ item: WardrobeItem | null; error: Error | null }> {
  return updateWardrobeItem(itemId, { is_favourite: !currentStatus });
}

/**
 * Get favourite wardrobe items for a user
 */
export async function getFavouriteItems(
  userId: string
): Promise<{ items: WardrobeItem[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .eq('is_favourite', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { items: data || [], error: null };
  } catch (error) {
    return { items: [], error: error as Error };
  }
}

// ============================================================================
// AI Stylist Integration Layer
// ============================================================================

/**
 * Get all wardrobe items formatted for AI stylist context
 * Returns items with full public image URLs ready for AI vision processing
 * 
 * This function is called at the start of a stylist chat session to provide
 * the complete wardrobe context to the AI model.
 * 
 * @param userId - The user's ID
 * @returns Array of items formatted for AI consumption
 * 
 * @example
 * ```typescript
 * const wardrobe = await getWardrobeForStylist(userId);
 * // Send to AI: { wardrobe, userMessage: "Suggest an outfit for dinner" }
 * ```
 */
export async function getWardrobeForStylist(
  userId: string
): Promise<{ items: StylistItem[]; error: Error | null }> {
  try {
    const { items, error } = await getWardrobeItems(userId);

    if (error) throw error;

    // Map to StylistItem format with full public URLs
    const stylistItems: StylistItem[] = items.map(item => ({
      id: item.id,
      name: item.name,
      size: item.size,
      category: item.category,
      image_url: getImageUrl(item.image_path),
      is_favourite: item.is_favourite,
      ai_attributes: item.ai_attributes,
    }));

    return { items: stylistItems, error: null };
  } catch (error) {
    return { items: [], error: error as Error };
  }
}

/**
 * Get specific wardrobe items by IDs for AI outfit display
 * Validates that all IDs belong to the requesting user
 * Silently filters out invalid or unauthorized IDs
 * 
 * This function is called after the AI recommends an outfit, to fetch
 * and display the specific items that make up the outfit.
 * 
 * @param userId - The user's ID
 * @param itemIds - Array of item IDs to fetch
 * @returns Array of items (may be shorter than input if IDs are invalid)
 * 
 * @example
 * ```typescript
 * // AI returns: { reply: "Here's an outfit...", outfit_item_ids: ["id1", "id2", "id3"] }
 * const outfitItems = await getItemsByIds(userId, aiResponse.outfit_item_ids);
 * // Display: AI reply text + grid of outfit item photos
 * ```
 */
export async function getItemsByIds(
  userId: string,
  itemIds: string[]
): Promise<{ items: StylistItem[]; error: Error | null }> {
  try {
    // Return empty array if no IDs provided
    if (itemIds.length === 0) {
      return { items: [], error: null };
    }

    // Fetch items that match the IDs AND belong to the user
    const { data, error } = await supabase
      .from('wardrobe_items')
      .select('*')
      .eq('user_id', userId)
      .in('id', itemIds);

    if (error) throw error;

    // Map to StylistItem format with full public URLs
    const stylistItems: StylistItem[] = (data || []).map(item => ({
      id: item.id,
      name: item.name,
      size: item.size,
      category: item.category,
      image_url: getImageUrl(item.image_path),
      is_favourite: item.is_favourite,
      ai_attributes: item.ai_attributes,
    }));

    return { items: stylistItems, error: null };
  } catch (error) {
    return { items: [], error: error as Error };
  }
}
