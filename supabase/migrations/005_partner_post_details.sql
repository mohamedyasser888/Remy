-- Preserve the complete details when a home post is also published
-- to a selected partner collection.
alter table public.partner_posts
  add column if not exists size text,
  add column if not exists brand text,
  add column if not exists review text,
  add column if not exists owns_image boolean not null default true;

-- Users may publish their own home post into a public partner collection.
-- partner_posts has no user_id, so the authenticated user is intentionally
-- allowed to insert; admins retain full access through their existing client.
alter table public.partner_posts enable row level security;
grant select, insert on public.partner_posts to authenticated;

drop policy if exists "Partner posts are viewable by authenticated users" on public.partner_posts;
create policy "Partner posts are viewable by authenticated users"
  on public.partner_posts for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can publish partner posts" on public.partner_posts;
create policy "Authenticated users can publish partner posts"
  on public.partner_posts for insert
  to authenticated
  with check (true);

