/**
 * Liked Tab Component
 * Display posts that user has liked from the community feed
 */

import { useLikedPosts } from '@/hooks/usePosts';
import { useToast } from '@/hooks/useToast';
import { useT } from '@/i18n';
import { Card, HeartButton, EmptyState, EmptyStateIcons, SkeletonGrid } from '@/components/common';
import { getImageUrl } from '@/services/storage';
import { getErrorMessage } from '@/utils/errorHandling';

export function LikedTab() {
  const t = useT();
  const { posts, loading, toggleLike } = useLikedPosts();
  const { showToast } = useToast();

  const handleUnlike = async (postId: string) => {
    const { error } = await toggleLike(postId);

    if (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  if (loading) {
    return <SkeletonGrid count={6} />;
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={<EmptyStateIcons.Heart />}
        title={t('wardrobe.emptyLiked')}
        description={t('wardrobe.emptyLikedSubtitle')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-neutral-900">
        {t('wardrobe.liked')}
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map(post => {
          const imageUrl = getImageUrl(post.image_path);
          
          return (
            <Card key={post.id} hover className="relative overflow-hidden">
              {/* Image */}
              <div className="aspect-[3/4] bg-neutral-200 rounded-lg overflow-hidden mb-3">
                <img
                  src={imageUrl}
                  alt={post.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Heart Button */}
              <div className="absolute top-2 right-2">
                <HeartButton
                  isFilled={true}
                  onClick={() => handleUnlike(post.id)}
                  className="bg-white/90 backdrop-blur-sm shadow-sm"
                />
              </div>

              {/* Info */}
              <div>
                <h3 className="font-medium text-neutral-900 truncate">{post.name}</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                  <span>{post.size}</span>
                  <span>•</span>
                  <span className="truncate">{post.category}</span>
                </div>
                {post.description && (
                  <p className="text-xs text-neutral-500 mt-2 line-clamp-2">
                    {post.description}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-neutral-500 mt-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="truncate">{post.display_name}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
