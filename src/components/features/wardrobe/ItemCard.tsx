/**
 * Item Card Component
 * Display wardrobe item with actions
 */

import { useState } from 'react';
import { HeartButton, Card, ImageZoomModal, WatermarkOverlay } from '@/components/common';
import { StarRating } from '@/components/common';
import { getImageUrl } from '@/services/storage';
import type { WardrobeItem } from '@/types';

interface ItemCardProps {
  item: WardrobeItem;
  onToggleFavourite: (itemId: string, currentStatus: boolean) => void;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (item: WardrobeItem) => void;
  onShare?: (item: WardrobeItem) => void;
}

export function ItemCard({ item, onToggleFavourite, onEdit, onDelete, onShare }: ItemCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const imageUrl = getImageUrl(item.image_path);

  return (
    <Card hover className="relative overflow-hidden">
      {/* Image */}
      <div 
        className="relative aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden mb-3 cursor-pointer hover:opacity-95 transition-smooth"
        onClick={() => setShowZoom(true)}
      >
        <img
          src={imageUrl}
          alt={item.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <WatermarkOverlay visible />
      </div>

      {/* Heart Button */}
      <div className="absolute top-2 right-2">
        <HeartButton
          isFilled={item.is_favourite}
          onClick={() => onToggleFavourite(item.id, item.is_favourite)}
          className="bg-white/90 backdrop-blur-sm shadow-sm"
        />
      </div>

      {/* Menu Button */}
      <div className="absolute top-2 left-2">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="touch-target p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-smooth"
          aria-label="More options"
        >
          <svg className="w-5 h-5 text-neutral-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute left-0 top-12 z-20 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden">
              <button
                onClick={() => {
                  onEdit(item);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-smooth flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              {onShare && (
                <button
                  onClick={() => {
                    onShare(item);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-smooth flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share to Home
                </button>
              )}
              <button
                onClick={() => {
                  onDelete(item);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-smooth flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div>
        <h3 className="font-medium text-neutral-900 truncate">{item.name}</h3>
        <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
          <span>{item.size}</span>
          <span>•</span>
          <span className="truncate">{item.category}</span>
        </div>
        {/* Star rating — shown to all viewers */}
        {(item as any).rating > 0 && (
          <div className="mt-2">
            <StarRating value={(item as any).rating} size="sm" />
          </div>
        )}
      </div>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        isOpen={showZoom}
        onClose={() => setShowZoom(false)}
        imageUrl={imageUrl}
        title={item.name}
      />
    </Card>
  );
}
