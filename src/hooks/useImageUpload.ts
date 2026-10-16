/**
 * useImageUpload Hook
 * Manages image file selection, preview, and upload
 */

import { useState, useCallback } from 'react';
import * as storageService from '@/services/storage';
import { createImagePreview, revokeImagePreview, isValidImageType, isValidImageSize } from '@/utils/imageCompression';
import { handleSupabaseError, logError } from '@/utils/errorHandling';
import { ERROR_MESSAGES } from '@/utils/constants';

interface UseImageUploadResult {
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
  error: Error | null;
  selectImage: (file: File) => Promise<{ success: boolean; error?: string }>;
  clearImage: () => void;
  uploadImage: (userId: string) => Promise<{ path: string | null; error: Error | null }>;
}

/**
 * Hook for handling image upload workflow
 */
export function useImageUpload(): UseImageUploadResult {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Select and validate image
  const selectImage = useCallback(async (selectedFile: File): Promise<{ success: boolean; error?: string }> => {
    // Clear any existing preview
    if (previewUrl) {
      revokeImagePreview(previewUrl);
    }

    setError(null);

    // Validate file type
    if (!isValidImageType(selectedFile)) {
      const errorMsg = ERROR_MESSAGES.INVALID_IMAGE_TYPE;
      setError(new Error(errorMsg));
      return { success: false, error: errorMsg };
    }

    // Validate file size
    if (!isValidImageSize(selectedFile)) {
      const errorMsg = ERROR_MESSAGES.IMAGE_TOO_LARGE;
      setError(new Error(errorMsg));
      return { success: false, error: errorMsg };
    }

    try {
      // Create preview
      const preview = await createImagePreview(selectedFile);
      
      setFile(selectedFile);
      setPreviewUrl(preview);

      return { success: true };
    } catch (error) {
      const errorMsg = 'Failed to create image preview';
      setError(new Error(errorMsg));
      return { success: false, error: errorMsg };
    }
  }, [previewUrl]);

  // Clear selected image
  const clearImage = useCallback(() => {
    if (previewUrl) {
      revokeImagePreview(previewUrl);
    }
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }, [previewUrl]);

  // Upload image to storage
  const uploadImage = useCallback(async (userId: string): Promise<{ path: string | null; error: Error | null }> => {
    if (!file) {
      return { path: null, error: new Error('No file selected') };
    }

    setUploading(true);
    setError(null);

    try {
      const { path, error: uploadError } = await storageService.uploadImage(file, userId);

      if (uploadError) {
        const handledError = handleSupabaseError(uploadError);
        setError(handledError);
        setUploading(false);
        return { path: null, error: handledError };
      }

      setUploading(false);
      return { path, error: null };
    } catch (error) {
      const handledError = handleSupabaseError(error);
      setError(handledError);
      setUploading(false);
      logError(error, 'Upload image');
      return { path: null, error: handledError };
    }
  }, [file]);

  return {
    file,
    previewUrl,
    uploading,
    error,
    selectImage,
    clearImage,
    uploadImage,
  };
}
