/**
 * Favourites Tab Component
 * Display user's favourite wardrobe items
 */

import { useMemo } from 'react';
import { useWardrobe } from '@/hooks/useWardrobe';
import { useToast } from '@/hooks/useToast';
import { useT } from '@/i18n';
import { ItemCard } from './ItemCard';
import { EmptyState, EmptyStateIcons, SkeletonGrid } from '@/components/common';
import { getErrorMessage } from '@/utils/errorHandling';
import type { WardrobeItem } from '@/types';

interface FavouritesTabProps {
  onShareToHome?: (item: WardrobeItem) => void;
}

export function FavouritesTab({ onShareToHome }: FavouritesTabProps) {
  const t = useT();
  const { items, loading, toggleFavourite } = useWardrobe();
  const { showToast } = useToast();

  // Filter only favourite items
  const favouriteItems = useMemo(() => {
    return items.filter(item => item.is_favourite);
  }, [items]);

  const handleToggleFavourite = async (itemId: string, currentStatus: boolean) => {
    const { error } = await toggleFavourite(itemId, currentStatus);

    if (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  if (loading) {
    return <SkeletonGrid count={6} />;
  }

  if (favouriteItems.length === 0) {
    return (
      <EmptyState
        icon={<EmptyStateIcons.Heart />}
        title={t('wardrobe.emptyFavourites')}
        description={t('wardrobe.emptyFavouritesSubtitle')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900">
        {t('wardrobe.favourites')}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {favouriteItems.map(item => (
          <ItemCard
            key={item.id}
            item={item}
            onToggleFavourite={handleToggleFavourite}
            onEdit={() => {}}
            onDelete={() => {}}
            onShare={onShareToHome}
          />
        ))}
      </div>
    </div>
  );
}
