-- Enable Supabase Realtime for every table used by user and admin tabs.
-- The guards keep this migration safe when optional feature tables are not
-- installed yet or when a table is already in the publication.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'profiles', 'wardrobe_items', 'posts', 'post_likes',
    'trends', 'trend_likes', 'partners', 'partner_posts',
    'messages', 'page_visits', 'user_points'
  ] LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', table_name);

      IF NOT EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = table_name
      ) THEN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
      END IF;
    END IF;
  END LOOP;
END $$;
