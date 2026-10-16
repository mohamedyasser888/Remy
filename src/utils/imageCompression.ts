/**
 * Image Compression Utility
 * Client-side image compression to reduce upload size and improve performance
 */

import { IMAGE_CONFIG } from './constants';

// The watermark is kept in public so the same asset can be used by every
// upload flow (wardrobe, posts, partners, and admin uploads).
const WATERMARK_URL = '/rrrr-transparent.png';

let watermarkImagePromise: Promise<HTMLImageElement> | null = null;

function loadWatermark(): Promise<HTMLImageElement> {
  if (!watermarkImagePromise) {
    watermarkImagePromise = new Promise((resolve, reject) => {
      const watermark = new Image();
      watermark.onload = () => resolve(watermark);
      watermark.onerror = () => reject(new Error('Failed to load watermark'));
      watermark.src = WATERMARK_URL;
    });
  }

  return watermarkImagePromise;
}

/**
 * Draw the logo-only watermark in the bottom-right corner.
 */
async function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> {
  const watermark = await loadWatermark();
  const size = Math.max(24, Math.min(50, Math.round(Math.min(canvasWidth, canvasHeight) * 0.06)));
  const margin = Math.max(10, Math.round(size * 0.18));
  const x = canvasWidth - size - margin;
  const y = canvasHeight - size - margin;

  ctx.save();
  ctx.globalAlpha = 0.9;

  ctx.drawImage(watermark, x, y, size, size);
  ctx.restore();
}

/**
 * Compress an image file using Canvas API
 * Resizes to max dimensions while maintaining aspect ratio
 * Applies JPEG compression
 * 
 * @param file - The image file to compress
 * @returns Compressed image as Blob
 */
export async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          const maxWidth = IMAGE_CONFIG.MAX_WIDTH;
          const maxHeight = IMAGE_CONFIG.MAX_HEIGHT;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = width * ratio;
            height = height * ratio;
          }

          // Create canvas and draw resized image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Add the watermark before creating the final uploaded image.
          drawWatermark(ctx, width, height)
            .then(() => {
              canvas.toBlob(
                (blob) => {
                  if (blob) {
                    resolve(blob);
                  } else {
                    reject(new Error('Failed to compress image'));
                  }
                },
                'image/jpeg',
                IMAGE_CONFIG.QUALITY
              );
            })
            .catch(reject);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = event.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Create a preview URL for an image file using FileReader
 * Returns a data URL instead of object URL for better compatibility
 * 
 * @param file - The image file
 * @returns Promise with data URL for preview
 */
export function createImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to create preview'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Revoke an image preview URL to free memory
 * No-op for data URLs (they're garbage collected automatically)
 * 
 * @param url - The URL to revoke
 */
export function revokeImagePreview(url: string): void {
  // Data URLs don't need to be revoked
  // Only object URLs created with URL.createObjectURL need revocation
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Validate image file type
 * 
 * @param file - The file to validate
 * @returns True if valid image type
 */
export function isValidImageType(file: File): boolean {
  return IMAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any);
}

/**
 * Validate image file size
 * 
 * @param file - The file to validate
 * @returns True if size is within limit
 */
export function isValidImageSize(file: File): boolean {
  const maxSizeBytes = IMAGE_CONFIG.MAX_SIZE_MB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Format file size for display
 * 
 * @param bytes - File size in bytes
 * @returns Formatted size string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
