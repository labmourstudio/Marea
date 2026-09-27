-- Run once in the existing Supabase SQL Editor after the initial Marea schema.
-- This migration adds real Feed polls and public video/audio uploads without seeding any example content.

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values
('post-media','post-media',true,41943040,array[
  'video/mp4','video/webm','audio/mpeg','audio/wav','audio/ogg','audio/webm','audio/mp4'
]) on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy storage_post_public_read on storage.objects for select using (bucket_id='post-media');
create policy storage_post_owner_insert on storage.objects for insert to authenticated
with check (bucket_id='post-media' and public.account_can_write() and (storage.foldername(name))[1]=auth.uid()::text);

create table public.post_poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  label text not null check (char_length(btrim(label)) between 1 and 140),
  position smallint not null check (position between 0 and 7),
  created_at timestamptz not null default now(),
  unique (post_id,position), unique (post_id,id)
);
create index post_poll_options_post_idx on public.post_poll_options(post_id,position);

create table public.post_poll_votes (
  post_id uuid not null,
  option_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id,user_id),
  foreign key (post_id,option_id) references public.post_poll_options(post_id,id) on delete cascade
);
create index post_poll_votes_option_idx on public.post_poll_votes(option_id);

alter table public.post_poll_options enable row level security;
alter table public.post_poll_votes enable row level security;
create policy poll_options_read on public.post_poll_options for select using (
  exists (select 1 from public.posts p where p.id=post_id and
    (p.user_id=auth.uid() or (p.status='published' and p.visibility in ('public','showcase'))))
);
create policy poll_options_insert on public.post_poll_options for insert to authenticated with check (
  public.account_can_write() and exists (
    select 1 from public.posts p where p.id=post_id and p.user_id=auth.uid() and p.content_type='poll' and p.status='draft'
  )
);
create policy poll_votes_read_own on public.post_poll_votes for select to authenticated using (user_id=auth.uid());
create policy poll_votes_insert on public.post_poll_votes for insert to authenticated with check (
  user_id=auth.uid() and public.account_can_write() and exists (
    select 1 from public.posts p where p.id=post_id and p.content_type='poll'
      and p.status='published' and p.visibility in ('public','showcase')
  )
);
create policy poll_votes_update on public.post_poll_votes for update to authenticated
using (user_id=auth.uid()) with check (
  user_id=auth.uid() and public.account_can_write() and exists (
    select 1 from public.posts p where p.id=post_id and p.content_type='poll'
      and p.status='published' and p.visibility in ('public','showcase')
  )
);

-- SECURITY DEFINER verifies public status even if the cloud workspace RLS hides
-- the full projects row from non-members. It only returns NEW, never private data.
create or replace function public.validate_feed_post() returns trigger language plpgsql security definer
set search_path='' as $$
begin
  if new.project_id is not null and not exists (
    select 1 from public.projects p where p.id=new.project_id and p.status='published' and p.visibility in ('public','showcase')
  ) then raise exception 'A Feed post can only link a published public project'; end if;
  if new.content_type='poll' and new.status='published' and (
    tg_op='INSERT' or (select count(*) from public.post_poll_options o where o.post_id=new.id) < 2
  ) then raise exception 'A published poll needs at least two options'; end if;
  return new;
end $$;
create trigger validate_feed_post before insert or update of project_id,content_type,status on public.posts
for each row execute function public.validate_feed_post();

create or replace function public.get_poll_results(target_post_id uuid)
returns table (option_id uuid,votes bigint) language plpgsql stable security definer set search_path='' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.posts p where p.id=target_post_id and p.content_type='poll'
      and p.status='published' and p.visibility in ('public','showcase')
  ) then raise exception 'Poll unavailable'; end if;
  return query select o.id,count(v.user_id) from public.post_poll_options o
  left join public.post_poll_votes v on v.post_id=o.post_id and v.option_id=o.id
  where o.post_id=target_post_id group by o.id;
end $$;
revoke all on function public.get_poll_results(uuid) from public;
grant execute on function public.get_poll_results(uuid) to authenticated;
