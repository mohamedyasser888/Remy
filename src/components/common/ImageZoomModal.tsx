/**
 * Image Zoom Modal Component
 * Full-screen image viewer with zoom and pan capabilities
 */

import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
}

export function ImageZoomModal({ isOpen, onClose, imageUrl, title }: ImageZoomModalProps) {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Reset scale and position when modal opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 1));
    if (scale <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Image Viewer'}
      size="full"
    >
      <div className="relative h-full flex flex-col">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="p-2 rounded-lg bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            aria-label="Zoom out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-white/90 hover:bg-white transition-smooth"
            aria-label="Reset zoom"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-2 rounded-lg bg-white/90 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
            aria-label="Zoom in"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
          </button>
        </div>

        {/* Zoom Level Indicator */}
        <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
          <span className="text-white text-sm font-medium">{Math.round(scale * 100)}%</span>
        </div>

        {/* Instructions */}
        {scale === 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-white text-sm">
              Click to zoom in • Scroll to zoom • Drag to pan
            </p>
          </div>
        )}

        {/* Image Container */}
        <div
          className="flex-1 flex items-center justify-center overflow-hidden bg-neutral-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}
          onClick={() => scale === 1 && handleZoomIn()}
        >
          <img
            src={imageUrl}
            alt={title || 'Zoomed image'}
            className="max-w-full max-h-full object-contain select-none transition-transform duration-200"
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            }}
            draggable={false}
          />
        </div>
      </div>
    </Modal>
  );
}
