/**
 * Admin Home Feed
 * Shows all community posts — admin can delete any
 */

import { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/services/supabase';
import { deletePost } from '@/services/posts';
import { getImageUrl } from '@/services/storage';
import { Loader, Card, Button } from '@/components/common';
import { StarRating } from '@/components/common';
import type { PostWithLikes } from '@/types';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const db = supabaseAdmin!;

export function AdminHomePage() {
  const [posts, setPosts]     = useState<PostWithLikes[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    load();
  }, []);
  useRealtimeSync(['posts', 'post_likes', 'profiles'], load, { admin: true });

  async function load() {
    const { data } = await db
      .from('posts')
      .select(`*, profiles!posts_user_id_fkey(display_name, gender)`)
      .order('created_at', { ascending: false });

    if (data) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await db
        .from('post_likes').select('post_id').in('post_id', postIds);
      const counts: Record<string, number> = {};
      (likes || []).forEach(l => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
      setPosts(data.map(p => ({
        ...p,
        display_name: p.profiles?.display_name || 'Unknown',
        poster_gender: p.profiles?.gender || 'female',
        likes_count: counts[p.id] || 0,
      })));
    }
    setLoading(false);
  }

  async function handleDelete(post: PostWithLikes) {
    if (!confirm(`Delete "${post.name}"? This cannot be undone.`)) return;
    setDeleting(post.id);
    await deletePost(post.id, post.image_path);
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setDeleting(null);
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Home Feed</h1>
        <p className="text-slate-500 mt-1">{posts.length} posts — you can delete any</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader size="lg" /></div>
      ) : (
        <div className="max-w-[1500px] grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {posts.map(post => (
            <Card key={post.id} className="overflow-hidden">
              <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden mb-3">
                <img src={getImageUrl(post.image_path)} alt={post.name} className="w-full h-full object-cover" />
              </div>
              <div className="px-1">
                <p className="font-medium text-slate-800 truncate">{post.name}</p>
                <p className="text-xs text-slate-500">{post.category} · {post.size}</p>
                <p className="text-xs text-slate-400 mt-0.5">by {post.display_name}</p>
                {/* Star rating */}
                {(post as any).rating > 0 && (
                  <div className="mt-2">
                    <StarRating value={(post as any).rating} size="sm" />
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-1 text-rose-400 text-sm">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                    {post.likes_count}
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(post)}
                    disabled={deleting === post.id}
                  >
                    {deleting === post.id ? <Loader size="sm" /> : 'Delete'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
