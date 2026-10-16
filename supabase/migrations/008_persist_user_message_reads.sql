-- Persist user-side message reads so the chat notification stays cleared after refresh.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS user_read_at timestamptz;

CREATE OR REPLACE FUNCTION public.mark_user_messages_read(target_user_id uuid)
RETURNS void SECURITY DEFINER SET search_path = public LANGUAGE sql AS $$
  UPDATE public.messages
  SET user_read_at = now()
  WHERE user_id = target_user_id
    AND sender = 'admin'
    AND deleted_by_user = false
    AND (user_read_at IS NULL OR user_read_at < created_at);
$$;

GRANT EXECUTE ON FUNCTION public.mark_user_messages_read(uuid) TO anon, authenticated;
