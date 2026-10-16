-- Remy progression: Rems Muse (0-99), Remy Icon (100-499), Remy Ulite (500+).
-- The trigger keeps the user's current badge in sync and sends one admin
-- message when the user crosses into a new stage.

CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  reference_id uuid,
  points integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_points_unique_action_reference
  ON public.user_points(user_id, action, reference_id);
CREATE INDEX IF NOT EXISTS user_points_user_id_idx ON public.user_points(user_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  sender text NOT NULL CHECK (sender IN ('user', 'admin')),
  deleted_by_user boolean NOT NULL DEFAULT false,
  deleted_by_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS remy_badge text NOT NULL DEFAULT 'rems_muse',
  ADD COLUMN IF NOT EXISTS remy_badge_earned_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own messages' AND tablename = 'messages') THEN
    CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send own messages' AND tablename = 'messages') THEN
    CREATE POLICY "Users can send own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND sender = 'user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own messages' AND tablename = 'messages') THEN
    CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own points' AND tablename = 'user_points') THEN
    CREATE POLICY "Users can view own points" ON public.user_points FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can earn own points' AND tablename = 'user_points') THEN
    CREATE POLICY "Users can earn own points" ON public.user_points FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.remy_badge_for_points(total integer)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE WHEN total >= 500 THEN 'remy_ulite'
              WHEN total >= 100 THEN 'remy_icon'
              ELSE 'rems_muse' END;
$$;

CREATE OR REPLACE FUNCTION public.sync_remy_badge()
RETURNS trigger SECURITY DEFINER SET search_path = public LANGUAGE plpgsql AS $$
DECLARE
  total integer;
  old_badge text;
  new_badge text;
  user_name text;
BEGIN
  SELECT COALESCE(SUM(points), 0)::integer INTO total
  FROM public.user_points WHERE user_id = NEW.user_id;
  new_badge := public.remy_badge_for_points(total);

  SELECT remy_badge, display_name INTO old_badge, user_name
  FROM public.profiles WHERE id = NEW.user_id FOR UPDATE;

  IF old_badge IS DISTINCT FROM new_badge THEN
    UPDATE public.profiles
      SET remy_badge = new_badge, remy_badge_earned_at = now()
      WHERE id = NEW.user_id;

    IF old_badge IS NOT NULL AND old_badge <> new_badge THEN
      INSERT INTO public.messages (user_id, content, sender)
      VALUES (NEW.user_id,
        CASE new_badge
          WHEN 'remy_icon' THEN format('Congratulations %s! You reached 100 RMS and earned the Remy Icon badge.', user_name)
          WHEN 'remy_ulite' THEN format('Amazing %s! You reached 500 RMS and earned the Remy Ulite badge.', user_name)
          ELSE format('Welcome back %s! Your Remy badge is now %s.', user_name, replace(new_badge, '_', ' '))
        END,
        'admin');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_points_sync_remy_badge ON public.user_points;
CREATE TRIGGER user_points_sync_remy_badge
  AFTER INSERT OR UPDATE OF points ON public.user_points
  FOR EACH ROW EXECUTE FUNCTION public.sync_remy_badge();

-- Backfill badges without sending historical promotion messages.
UPDATE public.profiles p
SET remy_badge = public.remy_badge_for_points(
  COALESCE((SELECT SUM(up.points)::integer FROM public.user_points up WHERE up.user_id = p.id), 0)
);

