/**
 * Posts Service
 * Handles community feed posts and likes
 */

import { supabase, supabaseAdmin } from './supabase';
import { deleteImage } from './storage';
import type { Post, PostWithLikes, Category } from '@/types';

// Use admin client for destructive ops so they bypass RLS (works for both user & admin deletes)
const db = supabaseAdmin ?? supabase;

// ============================================================================
// Post CRUD Operations
// ============================================================================

/**
 * Get all posts with like counts and poster information
 * Optionally filter by category
 */
export async function getPosts(
  category?: Category | 'All'
): Promise<{ posts: PostWithLikes[]; error: Error | null }> {
  try {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(display_name, gender)
      `)
      .order('created_at', { ascending: false });

    // Apply category filter if not "All"
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) throw postsError;

    if (!posts || posts.length === 0) {
      return { posts: [], error: null };
    }

    // Get like counts for all posts
    const postIds = posts.map(p => p.id);
    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    if (likesError) throw likesError;

    // Count likes per post
    const likeCounts = (likes || []).reduce((acc, like) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format posts with like counts
    const formattedPosts: PostWithLikes[] = posts.map(post => ({
      ...post,
      display_name: post.profiles.display_name,
      poster_gender: post.profiles.gender,
      likes_count: likeCounts[post.id] || 0,
    }));

    return { posts: formattedPosts, error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

/**
 * Get posts with user's like status
 */
export async function getPostsWithLikeStatus(
  userId: string,
  category?: Category | 'All'
): Promise<{ posts: PostWithLikes[]; error: Error | null }> {
  try {
    const { posts, error } = await getPosts(category);

    if (error) throw error;

    if (posts.length === 0) {
      return { posts: [], error: null };
    }

    // Get user's likes
    const postIds = posts.map(p => p.id);
    const { data: userLikes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', userId)
      .in('post_id', postIds);

    if (likesError) throw likesError;

    // Create a Set of liked post IDs for fast lookup
    const likedPostIds = new Set((userLikes || []).map(like => like.post_id));

    // Add like status to posts
    const postsWithLikeStatus = posts.map(post => ({
      ...post,
      is_liked_by_user: likedPostIds.has(post.id),
    }));

    return { posts: postsWithLikeStatus, error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

/**
 * Get a single post by ID
 */
export async function getPost(
  postId: string
): Promise<{ post: Post | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    return { post: data, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

/**
 * Create a new post
 */
export async function createPost(
  post: Omit<Post, 'id' | 'created_at'>
): Promise<{ post: Post | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;

    return { post: data, error: null };
  } catch (error) {
    return { post: null, error: error as Error };
  }
}

/**
 * Delete a post
 * Also deletes the associated image from storage
 * Likes are automatically deleted via CASCADE
 */
export async function deletePost(
  postId: string,
  imagePath: string
): Promise<{ error: Error | null }> {
  try {
    // Delete image from storage first (uses admin client to bypass storage RLS)
    const { error: storageError } = await deleteImage(imagePath);
    if (storageError) {
      console.warn('Failed to delete image from storage:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database using admin client — bypasses RLS so both user & admin deletes work
    const { error: dbError } = await db
      .from('posts')
      .delete()
      .eq('id', postId);

    if (dbError) throw dbError;

    return { error: null };
  } catch (error) {
    return { error: error as Error };
  }
}

// ============================================================================
// Post Likes
// ============================================================================

/**
 * Toggle like on a post
 * If already liked, removes the like. If not liked, adds a like.
 */
export async function toggleLike(
  userId: string,
  postId: string
): Promise<{ isLiked: boolean; error: Error | null }> {
  try {
    // Check if already liked
    const { data: existing, error: checkError } = await supabase
      .from('post_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (checkError) throw checkError;

    if (existing) {
      // Unlike: Remove the like
      const { error: deleteError } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId);

      if (deleteError) throw deleteError;

      return { isLiked: false, error: null };
    } else {
      // Like: Add a like
      const { error: insertError } = await supabase
        .from('post_likes')
        .insert({ user_id: userId, post_id: postId });

      if (insertError) throw insertError;

      return { isLiked: true, error: null };
    }
  } catch (error) {
    return { isLiked: false, error: error as Error };
  }
}

/**
 * Get posts that a user has liked
 * Used for the "Liked" sub-tab in Wardrobe
 */
export async function getLikedPosts(
  userId: string
): Promise<{ posts: PostWithLikes[]; error: Error | null }> {
  try {
    // Get user's liked post IDs
    const { data: likes, error: likesError } = await supabase
      .from('post_likes')
      .select('post_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likesError) throw likesError;

    if (!likes || likes.length === 0) {
      return { posts: [], error: null };
    }

    const postIds = likes.map(like => like.post_id);

    // Get the posts with profiles
    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(display_name, gender)
      `)
      .in('id', postIds);

    if (postsError) throw postsError;

    if (!posts || posts.length === 0) {
      return { posts: [], error: null };
    }

    // Get like counts for these posts
    const { data: allLikes, error: allLikesError } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    if (allLikesError) throw allLikesError;

    // Count likes per post
    const likeCounts = (allLikes || []).reduce((acc, like) => {
      acc[like.post_id] = (acc[like.post_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Format posts with like counts and sort by user's like date
    const likeTimeMap = likes.reduce((acc, like) => {
      acc[like.post_id] = new Date(like.created_at).getTime();
      return acc;
    }, {} as Record<string, number>);

    const formattedPosts: PostWithLikes[] = posts
      .map(post => ({
        ...post,
        display_name: post.profiles.display_name,
        poster_gender: post.profiles.gender,
        likes_count: likeCounts[post.id] || 0,
        is_liked_by_user: true,
      }))
      .sort((a, b) => (likeTimeMap[b.id] || 0) - (likeTimeMap[a.id] || 0));

    return { posts: formattedPosts, error: null };
  } catch (error) {
    return { posts: [], error: error as Error };
  }
}

/**
 * Check if a user has liked a specific post
 */
export async function isPostLikedByUser(
  userId: string,
  postId: string
): Promise<{ isLiked: boolean; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('post_likes')
      .select('*')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (error) throw error;

    return { isLiked: !!data, error: null };
  } catch (error) {
    return { isLiked: false, error: error as Error };
  }
}

/**
 * Get like count for a post
 */
export async function getPostLikeCount(
  postId: string
): Promise<{ count: number; error: Error | null }> {
  try {
    const { count, error } = await supabase
      .from('post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (error) throw error;

    return { count: count || 0, error: null };
  } catch (error) {
    return { count: 0, error: error as Error };
  }
}
