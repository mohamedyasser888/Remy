import { supabase, supabaseAdmin } from './supabase';
import { STORAGE_BUCKET } from '@/utils/constants';
import { compressImage } from '@/utils/imageCompression';

// Admin client bypasses storage RLS — ensures deletes always succeed
const adminStorage = (supabaseAdmin ?? supabase).storage;

/**
 * Upload an image to Supabase Storage
 * Compresses the image before upload and generates a unique filename
 * 
 * @param file - The image file to upload
 * @param userId - The user's ID (used for folder path)
 * @returns The file path in storage or error
 */
export async function uploadImage(
  file: File,
  userId: string
): Promise<{ path: string | null; error: Error | null }> {
  try {
    // Compress the image
    const compressedBlob = await compressImage(file);

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `wm-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, compressedBlob, {
        cacheControl: '3600',
        upsert: false,
      // compressImage always produces a JPEG after applying the watermark.
      contentType: 'image/jpeg',
      });

    if (uploadError) throw uploadError;

    return { path: filePath, error: null };
  } catch (error) {
    console.error('Image upload error:', error);
    return { path: null, error: error as Error };
  }
}

/**
 * Delete an image from Supabase Storage
 * Uses admin client to bypass bucket RLS policies
 * 
 * @param path - The file path in storage
 * @returns Error if deletion failed, null otherwise
 */
export async function deleteImage(path: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await adminStorage
      .from(STORAGE_BUCKET)
      .remove([path]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Image deletion error:', error);
    return { error: error as Error };
  }
}

/**
 * Get the public URL for an image
 * 
 * @param path - The file path in storage
 * @returns The public URL
 */
export function getImageUrl(path: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  return data.publicUrl;
}

/**
 * Check if a file is a valid image type
 * 
 * @param file - The file to check
 * @returns True if the file is a valid image
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return validTypes.includes(file.type);
}

/**
 * Check if a file size is within the allowed limit
 * 
 * @param file - The file to check
 * @param maxSizeMB - Maximum size in megabytes (default: 10)
 * @returns True if the file size is valid
 */
export function isValidImageSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}
