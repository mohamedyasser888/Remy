-- ============================================================
-- Admin RPC Functions — bypass RLS for dashboard stats
-- All functions use SECURITY DEFINER to read data as superuser
-- ============================================================

-- 1. Count all users
CREATE OR REPLACE FUNCTION get_users_count()
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::integer FROM auth.users;
$$;

-- 2. Count all posts
CREATE OR REPLACE FUNCTION get_posts_count()
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::integer FROM public.posts;
$$;

-- 3. Count all likes
CREATE OR REPLACE FUNCTION get_likes_count()
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(*)::integer FROM public.post_likes;
$$;

-- 4. Get all profiles with age (for age range chart)
CREATE OR REPLACE FUNCTION get_profiles_age()
RETURNS TABLE(age integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT age FROM public.profiles WHERE age IS NOT NULL AND age > 0;
$$;

-- 5. Unique visitors for a specific date
CREATE OR REPLACE FUNCTION get_unique_visitors(target_date date)
RETURNS integer LANGUAGE sql SECURITY DEFINER AS $$
  SELECT COUNT(DISTINCT user_id)::integer
  FROM public.page_visits
  WHERE visited_at::date = target_date;
$$;

-- 6. Visits last 7 days (grouped by day)
CREATE OR REPLACE FUNCTION get_visits_last_7_days()
RETURNS TABLE(day date, unique_visitors integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    visited_at::date AS day,
    COUNT(DISTINCT user_id)::integer AS unique_visitors
  FROM public.page_visits
  WHERE visited_at >= NOW() - INTERVAL '7 days'
  GROUP BY visited_at::date
  ORDER BY day;
$$;

-- 7. Posts last 7 days (grouped by day)
CREATE OR REPLACE FUNCTION get_posts_last_7_days()
RETURNS TABLE(day date, post_count integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    created_at::date AS day,
    COUNT(*)::integer AS post_count
  FROM public.posts
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY created_at::date
  ORDER BY day;
$$;

-- 8. Likes last 7 days (grouped by day)
CREATE OR REPLACE FUNCTION get_likes_last_7_days()
RETURNS TABLE(day date, like_count integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    created_at::date AS day,
    COUNT(*)::integer AS like_count
  FROM public.post_likes
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY created_at::date
  ORDER BY day;
$$;

-- 9. Category breakdown
CREATE OR REPLACE FUNCTION get_category_breakdown()
RETURNS TABLE(category text, post_count integer) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT category, COUNT(*)::integer AS post_count
  FROM public.posts
  GROUP BY category
  ORDER BY post_count DESC
  LIMIT 7;
$$;

-- 10. Top post by likes
CREATE OR REPLACE FUNCTION get_top_post()
RETURNS TABLE(
  id uuid, name text, image_path text,
  likes_count integer, display_name text
) LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    p.id, p.name, p.image_path,
    COUNT(pl.post_id)::integer AS likes_count,
    pr.display_name
  FROM public.posts p
  LEFT JOIN public.post_likes pl ON pl.post_id = p.id
  LEFT JOIN public.profiles pr ON pr.id = p.user_id
  GROUP BY p.id, p.name, p.image_path, pr.display_name
  ORDER BY likes_count DESC
  LIMIT 1;
$$;

-- Grant all to anon AND authenticated (admin uses anon key before login)
GRANT EXECUTE ON FUNCTION get_users_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_posts_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_likes_count() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_profiles_age() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_unique_visitors(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_visits_last_7_days() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_posts_last_7_days() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_likes_last_7_days() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_category_breakdown() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_top_post() TO anon, authenticated;
