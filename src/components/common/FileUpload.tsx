/**
 * File Upload Component
 * Image upload with drag & drop and preview
 */

import { useRef, useState, useEffect, DragEvent, ChangeEvent } from 'react';
import { useT } from '@/i18n';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  preview?: string | null;
  error?: string;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, preview, error, disabled }: FileUploadProps) {
  const t = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Update local preview when prop changes
  useEffect(() => {
    setLocalPreview(preview || null);
  }, [preview]);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelection(files[0]);
      // Reset input value to allow selecting the same file again
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  };

  const handleFileSelection = (file: File) => {
    // Create immediate local preview using FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setLocalPreview(result);
      }
    };
    reader.readAsDataURL(file);

    // Also call parent callback
    onFileSelect(file);
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const displayPreview = localPreview || preview;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/bmp,image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full rounded-lg border-2 border-dashed transition-smooth
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-neutral-300'}
          ${error ? 'border-red-500' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary-400'}
        `}
      >
        {displayPreview ? (
          <div className="relative w-full h-80">
            <img
              src={displayPreview}
              alt="Preview"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-smooth flex items-center justify-center rounded-lg">
              <span className="text-white text-lg font-medium">
                {t('imageUpload.changeImage')}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <svg
              className="w-16 h-16 text-neutral-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-base font-medium text-neutral-700 mb-2">
              {t('imageUpload.selectImage')}
            </p>
            <p className="text-sm text-neutral-500">
              {t('imageUpload.dropImage')}
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
