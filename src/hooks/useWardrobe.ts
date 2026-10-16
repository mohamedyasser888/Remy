/**
 * useWardrobe Hook
 * Manages wardrobe items state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import * as wardrobeService from '@/services/wardrobe';
import type { WardrobeItem } from '@/types';
import { handleSupabaseError, logError } from '@/utils/errorHandling';
import { useAuth } from './useAuth';
import { useRealtimeSync } from './useRealtimeSync';

interface UseWardrobeResult {
  items: WardrobeItem[];
  loading: boolean;
  error: Error | null;
  addItem: (item: Omit<WardrobeItem, 'id' | 'created_at'>) => Promise<{ item: WardrobeItem | null; error: Error | null }>;
  updateItem: (itemId: string, updates: Partial<WardrobeItem>) => Promise<{ item: WardrobeItem | null; error: Error | null }>;
  deleteItem: (itemId: string, imagePath: string) => Promise<{ error: Error | null }>;
  toggleFavourite: (itemId: string, currentStatus: boolean) => Promise<{ error: Error | null }>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing wardrobe items
 */
export function useWardrobe(): UseWardrobeResult {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch wardrobe items — silent refresh (no loading flash on polls)
  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setError(null);

    const { items: fetchedItems, error: fetchError } = await wardrobeService.getWardrobeItems(user.id);

    if (fetchError) {
      setError(handleSupabaseError(fetchError));
      logError(fetchError, 'Fetch wardrobe items');
    } else {
      setItems(fetchedItems);
    }

    setLoading(false);
  }, [user]);

  // Initial load (shows spinner) + silent 5s poll
  useEffect(() => {
    setLoading(true);
    fetchItems();
  }, [fetchItems]);
  useRealtimeSync(['wardrobe_items'], fetchItems);

  // Add item
  const addItem = async (
    item: Omit<WardrobeItem, 'id' | 'created_at'>
  ): Promise<{ item: WardrobeItem | null; error: Error | null }> => {
    try {
      const { item: newItem, error: createError } = await wardrobeService.createWardrobeItem(item);

      if (createError) {
        return { item: null, error: handleSupabaseError(createError) };
      }

      if (newItem) {
        // Optimistic update
        setItems(prevItems => [newItem, ...prevItems]);
      }

      return { item: newItem, error: null };
    } catch (error) {
      logError(error, 'Add wardrobe item');
      return { item: null, error: handleSupabaseError(error) };
    }
  };

  // Update item
  const updateItem = async (
    itemId: string,
    updates: Partial<WardrobeItem>
  ): Promise<{ item: WardrobeItem | null; error: Error | null }> => {
    try {
      const { item: updatedItem, error: updateError } = await wardrobeService.updateWardrobeItem(
        itemId,
        updates
      );

      if (updateError) {
        return { item: null, error: handleSupabaseError(updateError) };
      }

      if (updatedItem) {
        // Optimistic update
        setItems(prevItems =>
          prevItems.map(item => (item.id === itemId ? updatedItem : item))
        );
      }

      return { item: updatedItem, error: null };
    } catch (error) {
      logError(error, 'Update wardrobe item');
      return { item: null, error: handleSupabaseError(error) };
    }
  };

  // Delete item
  const deleteItem = async (
    itemId: string,
    imagePath: string
  ): Promise<{ error: Error | null }> => {
    try {
      // Optimistically remove from UI
      setItems(prevItems => prevItems.filter(item => item.id !== itemId));

      const { error: deleteError } = await wardrobeService.deleteWardrobeItem(itemId, imagePath);

      if (deleteError) {
        // Revert on error
        await fetchItems();
        return { error: handleSupabaseError(deleteError) };
      }

      return { error: null };
    } catch (error) {
      // Revert on error
      await fetchItems();
      logError(error, 'Delete wardrobe item');
      return { error: handleSupabaseError(error) };
    }
  };

  // Toggle favourite
  const toggleFavourite = async (
    itemId: string,
    currentStatus: boolean
  ): Promise<{ error: Error | null }> => {
    try {
      // Optimistic update
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, is_favourite: !currentStatus } : item
        )
      );

      const { error: toggleError } = await wardrobeService.toggleFavourite(
        itemId,
        currentStatus
      );

      if (toggleError) {
        // Revert on error
        setItems(prevItems =>
          prevItems.map(item =>
            item.id === itemId ? { ...item, is_favourite: currentStatus } : item
          )
        );
        return { error: handleSupabaseError(toggleError) };
      }

      return { error: null };
    } catch (error) {
      // Revert on error
      setItems(prevItems =>
        prevItems.map(item =>
          item.id === itemId ? { ...item, is_favourite: currentStatus } : item
        )
      );
      logError(error, 'Toggle favourite');
      return { error: handleSupabaseError(error) };
    }
  };

  // Refresh items
  const refresh = async () => {
    await fetchItems();
  };

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    toggleFavourite,
    refresh,
  };
}

/**
 * Hook for favourite items only
 */
export function useFavouriteItems() {
  const { user } = useAuth();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFavourites = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const { items: fetchedItems, error: fetchError } = await wardrobeService.getFavouriteItems(user.id);

    if (fetchError) {
      setError(handleSupabaseError(fetchError));
      logError(fetchError, 'Fetch favourite items');
    } else {
      setItems(fetchedItems);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFavourites();
  }, [fetchFavourites]);
  useRealtimeSync(['wardrobe_items'], fetchFavourites);

  return {
    items,
    loading,
    error,
    refresh: fetchFavourites,
  };
}
