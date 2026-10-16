-- Persist admin conversation read state so unread indicators survive refreshes.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS admin_read_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_messages_read(target_user_id uuid)
RETURNS void SECURITY DEFINER SET search_path = public LANGUAGE sql AS $$
  UPDATE public.messages
  SET admin_read_at = now()
  WHERE user_id = target_user_id
    AND sender = 'user'
    AND deleted_by_admin = false
    AND (admin_read_at IS NULL OR admin_read_at < created_at);
$$;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(uuid) TO anon, authenticated;
