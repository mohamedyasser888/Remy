/**
 * Error Handling Utilities
 * Centralized error handling and user-friendly error messages
 */

import { ERROR_MESSAGES } from './constants';
import type { AppError } from '@/types';

/**
 * Custom application error class
 */
export class ApplicationError extends Error implements AppError {
  code: string;
  userMessage: string;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', userMessage?: string) {
    super(message);
    this.name = 'ApplicationError';
    this.code = code;
    this.userMessage = userMessage || message;
  }
}

/**
 * Handle Supabase errors and convert to user-friendly messages
 */
export function handleSupabaseError(error: any): ApplicationError {
  // Handle null/undefined
  if (!error) {
    return new ApplicationError(
      'Unknown error occurred',
      'UNKNOWN_ERROR',
      ERROR_MESSAGES.GENERIC
    );
  }

  // PostgreSQL error codes
  const pgCode = error.code;
  const message = error.message || '';

  // RLS policy violation (403/42501)
  if (pgCode === '42501' || pgCode === 'PGRST301') {
    return new ApplicationError(
      'Permission denied',
      'UNAUTHORIZED',
      ERROR_MESSAGES.UNAUTHORIZED
    );
  }

  // Unique constraint violation (duplicate email, etc.)
  if (pgCode === '23505') {
    if (message.includes('email')) {
      return new ApplicationError(
        'Email already registered',
        'DUPLICATE_EMAIL',
        'This email is already registered. Please sign in or use a different email.'
      );
    }
    return new ApplicationError(
      'Duplicate entry',
      'DUPLICATE_ENTRY',
      'This entry already exists.'
    );
  }

  // Foreign key violation
  if (pgCode === '23503') {
    return new ApplicationError(
      'Referenced resource not found',
      'FOREIGN_KEY_VIOLATION',
      'Referenced resource does not exist.'
    );
  }

  // Check constraint violation
  if (pgCode === '23514') {
    // Category validation error
    if (message.includes('category')) {
      return new ApplicationError(
        'Invalid category',
        'INVALID_CATEGORY',
        'This category is not valid for your account.'
      );
    }
    return new ApplicationError(
      'Invalid data',
      'CHECK_VIOLATION',
      'The data you entered does not meet the requirements.'
    );
  }

  // Auth errors
  if (error.status === 400) {
    if (message.includes('Invalid login credentials')) {
      return new ApplicationError(
        'Invalid credentials',
        'INVALID_CREDENTIALS',
        'Invalid email or password. Please try again.'
      );
    }
    if (message.includes('Email not confirmed')) {
      return new ApplicationError(
        'Email not confirmed',
        'EMAIL_NOT_CONFIRMED',
        'Please confirm your email address before signing in.'
      );
    }
    if (message.includes('User already registered')) {
      return new ApplicationError(
        'User already registered',
        'USER_EXISTS',
        'An account with this email already exists.'
      );
    }
  }

  // Network errors
  if (
    message.includes('Failed to fetch') ||
    message.includes('Network request failed') ||
    message.includes('NetworkError')
  ) {
    return new ApplicationError(
      'Network error',
      'NETWORK_ERROR',
      ERROR_MESSAGES.NETWORK_ERROR
    );
  }

  // Storage errors
  if (message.includes('The resource already exists')) {
    return new ApplicationError(
      'File already exists',
      'FILE_EXISTS',
      'A file with this name already exists.'
    );
  }

  if (message.includes('Object not found')) {
    return new ApplicationError(
      'File not found',
      'FILE_NOT_FOUND',
      'The requested file was not found.'
    );
  }

  // Not found errors
  if (error.status === 404 || pgCode === 'PGRST116') {
    return new ApplicationError(
      'Resource not found',
      'NOT_FOUND',
      ERROR_MESSAGES.NOT_FOUND
    );
  }

  // Rate limit errors
  if (error.status === 429) {
    return new ApplicationError(
      'Too many requests',
      'RATE_LIMIT',
      'Too many requests. Please try again later.'
    );
  }

  // Server errors
  if (error.status >= 500) {
    return new ApplicationError(
      'Server error',
      'SERVER_ERROR',
      'A server error occurred. Please try again later.'
    );
  }

  // Generic fallback
  return new ApplicationError(
    error.message || 'Unknown error',
    error.code || 'UNKNOWN_ERROR',
    ERROR_MESSAGES.GENERIC
  );
}

/**
 * Handle general errors (non-Supabase)
 */
export function handleError(error: unknown): ApplicationError {
  if (error instanceof ApplicationError) {
    return error;
  }

  if (error instanceof Error) {
    return new ApplicationError(error.message, 'GENERIC_ERROR', ERROR_MESSAGES.GENERIC);
  }

  return new ApplicationError(
    'Unknown error occurred',
    'UNKNOWN_ERROR',
    ERROR_MESSAGES.GENERIC
  );
}

/**
 * Log error to console in development
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * Get user-friendly error message from any error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApplicationError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    return handleSupabaseError(error).userMessage;
  }

  return ERROR_MESSAGES.GENERIC;
}
