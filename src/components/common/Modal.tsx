/**
 * Modal Component
 * Accessible modal dialog with overlay
 */

import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  full: 'max-w-full w-screen h-screen m-0 rounded-none',
};

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          ${size === 'full' ? 'h-full' : 'max-h-[90vh] overflow-auto'}
          bg-white ${size === 'full' ? '' : 'rounded-2xl'} shadow-2xl
          animate-in fade-in ${size === 'full' ? '' : 'slide-in-from-bottom-4'} duration-300
        `}
      >
        {/* Header */}
        {title && (
          <div className={`sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 ${size === 'full' ? '' : 'rounded-t-2xl'}`}>
            <h2 id="modal-title" className="text-xl font-semibold text-neutral-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 rounded-lg hover:bg-neutral-100 transition-smooth"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className={size === 'full' ? 'h-full overflow-hidden flex flex-col' : 'px-6 py-4'}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
