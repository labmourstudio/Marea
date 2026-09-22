-- Marea production foundation: schema, RLS, storage and privileged RPCs.
create extension if not exists pgcrypto;

create type public.platform_role as enum ('member', 'course_creator', 'moderator', 'admin', 'owner');
create type public.account_status as enum ('active', 'limited', 'blocked', 'disabled');
create type public.content_visibility as enum ('private', 'unlisted', 'public', 'showcase');
create type public.content_status as enum ('draft', 'pending_review', 'published', 'rejected', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 80),
  bio text check (char_length(bio) <= 300),
  avatar_path text,
  cover_path text,
  roles text[] not null default '{}',
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  external_links jsonb not null default '{}',
  profile_visibility public.content_visibility not null default 'public',
  platform_role public.platform_role not null default 'member',
  account_status public.account_status not null default 'active',
  onboarding_completed boolean not null default false,
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.worlds (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120), description text, world_type text not null check (world_type in ('story','game')),
  cover_path text, genre text, language text not null default 'Vietnamese', status text not null default 'draft',
  visibility public.content_visibility not null default 'private', share_token text not null unique default encode(gen_random_bytes(24),'hex'), reference_images jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.world_members (
  world_id uuid not null references public.worlds(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','editor','manager')), created_at timestamptz not null default now(), primary key (world_id,user_id)
);
create table public.characters (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  world_id uuid references public.worlds(id) on delete set null, name text not null, character_type text not null check (character_type in ('story','game')),
  details jsonb not null default '{}', image_paths text[] not null default '{}', visibility public.content_visibility not null default 'private',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.locations (
  id uuid primary key default gen_random_uuid(), world_id uuid not null references public.worlds(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text, details jsonb not null default '{}', image_paths text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.factions (
  id uuid primary key default gen_random_uuid(), world_id uuid not null references public.worlds(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text, details jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.items (
  id uuid primary key default gen_random_uuid(), world_id uuid not null references public.worlds(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null, description text, details jsonb not null default '{}', image_paths text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.world_events (
  id uuid primary key default gen_random_uuid(), world_id uuid not null references public.worlds(id) on delete cascade, owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, event_date text, sort_order integer not null default 0, details jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete cascade,
  world_id uuid references public.worlds(id) on delete set null, name text not null, cover_path text, summary text, description text,
  genre text, project_type text not null, stage text not null default 'Idea', language text not null default 'Vietnamese', progress smallint not null default 0 check (progress between 0 and 100),
  looking_for text[] not null default '{}', contact_links jsonb not null default '{}', media_paths text[] not null default '{}',
  visibility public.content_visibility not null default 'private', share_token text not null unique default encode(gen_random_bytes(24),'hex'), status public.content_status not null default 'draft', published_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade, user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null, created_at timestamptz not null default now(), primary key (project_id,user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null, world_id uuid references public.worlds(id) on delete set null,
  content text not null check (char_length(content) between 1 and 20000), content_type text not null default 'article', media_paths text[] not null default '{}',
  hashtags text[] not null default '{}', language text not null default 'Vietnamese', visibility public.content_visibility not null default 'public',
  status public.content_status not null default 'draft', published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.comments (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 5000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.reactions (
  id uuid primary key default gen_random_uuid(), post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade, kind text not null default 'like', created_at timestamptz not null default now(), unique(post_id,user_id,kind)
);
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade, following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(), primary key(follower_id,following_id), check (follower_id <> following_id)
);
create table public.friendships (
  id uuid primary key default gen_random_uuid(), requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade, status text not null default 'pending' check (status in ('pending','accepted','declined','blocked')),
  created_at timestamptz not null default now(), responded_at timestamptz, check (requester_id <> addressee_id), unique(requester_id,addressee_id)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(), creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, topic text, cover_path text, language text not null default 'Vietnamese', visibility public.content_visibility not null default 'private',
  status public.content_status not null default 'draft', rejection_reason text, published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.course_lessons (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, content text, video_path text, image_paths text[] not null default '{}', attachment_paths text[] not null default '{}', lesson_order integer not null default 0,
  exercise jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.notifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null, kind text not null, payload jsonb not null default '{}', read_at timestamptz, created_at timestamptz not null default now()
);
create table public.reports (
  id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null, target_id uuid not null, reason text not null, details text, status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now()
);
create table public.site_settings (
  key text primary key, value jsonb not null, updated_by uuid references public.profiles(id), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references public.profiles(id) on delete set null,
  action text not null, target_table text, target_id text, before_data jsonb, after_data jsonb, ip_hint text, created_at timestamptz not null default now()
);

create index posts_feed_idx on public.posts(status, visibility, published_at desc);
create index worlds_owner_idx on public.worlds(owner_id, updated_at desc);
create index projects_public_idx on public.projects(status, visibility, published_at desc);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create unique index friendships_pair_unique on public.friendships(least(requester_id,addressee_id),greatest(requester_id,addressee_id));

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
do $$ declare table_name text; begin foreach table_name in array array['profiles','worlds','characters','locations','factions','items','world_events','projects','posts','comments','courses','course_lessons'] loop execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name, table_name); end loop; end $$;

create or replace function public.current_platform_role() returns public.platform_role language sql stable security definer set search_path = public as $$ select platform_role from public.profiles where id = auth.uid() $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.current_platform_role() in ('moderator','admin','owner'), false) $$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$ select coalesce(public.current_platform_role() in ('admin','owner'), false) $$;
create or replace function public.account_can_write() returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.profiles where id=auth.uid() and account_status='active') $$;
create or replace function public.can_edit_world(target_world uuid) returns boolean language sql stable security definer set search_path = public as $$ select exists(select 1 from public.worlds w where w.id=target_world and (w.owner_id=auth.uid() or exists(select 1 from public.world_members m where m.world_id=w.id and m.user_id=auth.uid() and m.role in ('editor','manager')))) $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id,display_name) values(new.id, nullif(new.raw_user_meta_data->>'display_name','')); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.protect_profile_privileges() returns trigger language plpgsql security definer set search_path = public as $$ begin
  if auth.uid() is not null and (new.platform_role is distinct from old.platform_role or new.account_status is distinct from old.account_status) and not public.is_admin() then raise exception 'Insufficient privilege'; end if;
  return new;
end $$;
create trigger protect_profile_privileges before update on public.profiles for each row execute function public.protect_profile_privileges();

alter table public.profiles enable row level security; alter table public.worlds enable row level security; alter table public.world_members enable row level security;
alter table public.characters enable row level security; alter table public.locations enable row level security; alter table public.factions enable row level security; alter table public.items enable row level security; alter table public.world_events enable row level security;
alter table public.projects enable row level security; alter table public.project_members enable row level security; alter table public.posts enable row level security; alter table public.comments enable row level security; alter table public.reactions enable row level security;
alter table public.follows enable row level security; alter table public.friendships enable row level security; alter table public.courses enable row level security; alter table public.course_lessons enable row level security;
alter table public.notifications enable row level security; alter table public.reports enable row level security; alter table public.site_settings enable row level security; alter table public.audit_logs enable row level security;

do $$ declare table_name text; begin foreach table_name in array array['profiles','worlds','world_members','characters','locations','factions','items','world_events','projects','project_members','posts','comments','reactions','follows','friendships','courses','course_lessons','reports'] loop
  execute format('create policy %I_active_insert on public.%I as restrictive for insert with check (public.account_can_write() or public.is_admin())', table_name, table_name);
  execute format('create policy %I_active_update on public.%I as restrictive for update using (public.account_can_write() or public.is_admin()) with check (public.account_can_write() or public.is_admin())', table_name, table_name);
  execute format('create policy %I_active_delete on public.%I as restrictive for delete using (public.account_can_write() or public.is_admin())', table_name, table_name);
end loop; end $$;

create policy profiles_read on public.profiles for select using (account_status='active' or id=auth.uid() or public.is_staff());
create policy profiles_update_self on public.profiles for update using (id=auth.uid() or public.is_admin()) with check (id=auth.uid() or public.is_admin());
create policy worlds_read on public.worlds for select using (owner_id=auth.uid() or visibility in ('public','showcase') or public.can_edit_world(id) or public.is_staff());
create policy worlds_insert on public.worlds for insert with check (owner_id=auth.uid()); create policy worlds_update on public.worlds for update using (public.can_edit_world(id) or public.is_staff()) with check (public.can_edit_world(id) or public.is_staff()); create policy worlds_delete on public.worlds for delete using (owner_id=auth.uid() or public.is_admin());
create policy world_members_read on public.world_members for select using (user_id=auth.uid() or public.can_edit_world(world_id) or public.is_staff()); create policy world_members_manage on public.world_members for all using (public.can_edit_world(world_id) or public.is_admin()) with check (public.can_edit_world(world_id) or public.is_admin());

do $$ declare table_name text; begin foreach table_name in array array['characters','locations','factions','items','world_events'] loop
  execute format('create policy %I_read on public.%I for select using (owner_id=auth.uid() or public.can_edit_world(world_id) or public.is_staff() or exists(select 1 from public.worlds w where w.id=world_id and w.visibility in (''public'',''showcase'')))', table_name, table_name);
  execute format('create policy %I_insert on public.%I for insert with check (owner_id=auth.uid() and (world_id is null or public.can_edit_world(world_id)))', table_name, table_name);
  execute format('create policy %I_update on public.%I for update using (owner_id=auth.uid() or public.can_edit_world(world_id) or public.is_staff()) with check (owner_id=auth.uid() or public.can_edit_world(world_id) or public.is_staff())', table_name, table_name);
  execute format('create policy %I_delete on public.%I for delete using (owner_id=auth.uid() or public.can_edit_world(world_id) or public.is_admin())', table_name, table_name);
end loop; end $$;

create policy projects_read on public.projects for select using (owner_id=auth.uid() or (status='published' and visibility in ('public','showcase')) or public.is_staff()); create policy projects_insert on public.projects for insert with check (owner_id=auth.uid()); create policy projects_update on public.projects for update using (owner_id=auth.uid() or public.is_staff()) with check (owner_id=auth.uid() or public.is_staff()); create policy projects_delete on public.projects for delete using (owner_id=auth.uid() or public.is_admin());
create policy project_members_read on public.project_members for select using (user_id=auth.uid() or exists(select 1 from public.projects p where p.id=project_id and (p.owner_id=auth.uid() or (p.status='published' and p.visibility in ('public','showcase')))) or public.is_staff()); create policy project_members_manage on public.project_members for all using (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()) or public.is_admin()) with check (exists(select 1 from public.projects p where p.id=project_id and p.owner_id=auth.uid()) or public.is_admin());
create policy posts_read on public.posts for select using (user_id=auth.uid() or (status='published' and visibility in ('public','showcase')) or public.is_staff()); create policy posts_insert on public.posts for insert with check (user_id=auth.uid()); create policy posts_update on public.posts for update using (user_id=auth.uid() or public.is_staff()) with check (user_id=auth.uid() or public.is_staff()); create policy posts_delete on public.posts for delete using (user_id=auth.uid() or public.is_staff());
create policy comments_read on public.comments for select using (exists(select 1 from public.posts p where p.id=post_id and (p.user_id=auth.uid() or (p.status='published' and p.visibility in ('public','showcase')))) or public.is_staff()); create policy comments_insert on public.comments for insert with check (user_id=auth.uid()); create policy comments_manage on public.comments for update using (user_id=auth.uid() or public.is_staff()) with check (user_id=auth.uid() or public.is_staff()); create policy comments_delete on public.comments for delete using (user_id=auth.uid() or public.is_staff());
create policy reactions_read on public.reactions for select using (true); create policy reactions_insert on public.reactions for insert with check (user_id=auth.uid()); create policy reactions_delete on public.reactions for delete using (user_id=auth.uid() or public.is_staff());
create policy follows_read on public.follows for select using (true); create policy follows_insert on public.follows for insert with check (follower_id=auth.uid()); create policy follows_delete on public.follows for delete using (follower_id=auth.uid());
create policy friendships_read on public.friendships for select using (requester_id=auth.uid() or addressee_id=auth.uid() or public.is_staff()); create policy friendships_insert on public.friendships for insert with check (requester_id=auth.uid()); create policy friendships_update on public.friendships for update using (addressee_id=auth.uid() or requester_id=auth.uid() or public.is_staff()) with check (addressee_id=auth.uid() or requester_id=auth.uid() or public.is_staff()); create policy friendships_delete on public.friendships for delete using (requester_id=auth.uid() or addressee_id=auth.uid() or public.is_staff());
create policy courses_read on public.courses for select using (creator_id=auth.uid() or (status='published' and visibility='public') or public.is_staff()); create policy courses_insert on public.courses for insert with check (creator_id=auth.uid()); create policy courses_update on public.courses for update using (creator_id=auth.uid() or public.is_staff()) with check (creator_id=auth.uid() or public.is_staff()); create policy courses_delete on public.courses for delete using (creator_id=auth.uid() or public.is_admin());
create policy lessons_read on public.course_lessons for select using (exists(select 1 from public.courses c where c.id=course_id and (c.creator_id=auth.uid() or (c.status='published' and c.visibility='public'))) or public.is_staff()); create policy lessons_manage on public.course_lessons for all using (exists(select 1 from public.courses c where c.id=course_id and c.creator_id=auth.uid()) or public.is_staff()) with check (exists(select 1 from public.courses c where c.id=course_id and c.creator_id=auth.uid()) or public.is_staff());
create policy notifications_own on public.notifications for select using (user_id=auth.uid() or public.is_staff()); create policy notifications_update on public.notifications for update using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy reports_insert on public.reports for insert with check (reporter_id=auth.uid()); create policy reports_read on public.reports for select using (reporter_id=auth.uid() or public.is_staff()); create policy reports_manage on public.reports for update using (public.is_staff()) with check (public.is_staff());
create policy settings_read on public.site_settings for select using (true); create policy audit_read on public.audit_logs for select using (public.is_staff());

create or replace function public.admin_set_user_role(target_user_id uuid, new_role text) returns void language plpgsql security definer set search_path=public as $$ declare before_row jsonb; begin
  if public.current_platform_role() <> 'owner' then raise exception 'Owner role required'; end if;
  if new_role not in ('member','course_creator','moderator','admin','owner') then raise exception 'Invalid role'; end if;
  select to_jsonb(p) into before_row from public.profiles p where id=target_user_id;
  update public.profiles set platform_role=new_role::public.platform_role where id=target_user_id;
  insert into public.audit_logs(actor_id,action,target_table,target_id,before_data,after_data) values(auth.uid(),'user.role.update','profiles',target_user_id::text,before_row,jsonb_build_object('platform_role',new_role));
end $$;
create or replace function public.admin_set_account_status(target_user_id uuid, new_status text) returns void language plpgsql security definer set search_path=public as $$ declare before_row jsonb; target_role public.platform_role; begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if new_status not in ('active','limited','blocked','disabled') then raise exception 'Invalid status'; end if;
  select platform_role,to_jsonb(p) into target_role,before_row from public.profiles p where id=target_user_id;
  if target_role='owner' and public.current_platform_role()<>'owner' then raise exception 'Only an owner can change an owner account'; end if;
  update public.profiles set account_status=new_status::public.account_status where id=target_user_id;
  insert into public.audit_logs(actor_id,action,target_table,target_id,before_data,after_data) values(auth.uid(),'user.status.update','profiles',target_user_id::text,before_row,jsonb_build_object('account_status',new_status));
end $$;
create or replace function public.admin_review_course(target_course_id uuid, review_status text) returns void language plpgsql security definer set search_path=public as $$ declare before_row jsonb; begin
  if not public.is_staff() then raise exception 'Staff role required'; end if;
  if review_status not in ('published','rejected') then raise exception 'Invalid review status'; end if;
  select to_jsonb(c) into before_row from public.courses c where id=target_course_id;
  update public.courses set status=review_status::public.content_status, visibility=case when review_status='published' then 'public'::public.content_visibility else visibility end, published_at=case when review_status='published' then now() else published_at end where id=target_course_id;
  insert into public.audit_logs(actor_id,action,target_table,target_id,before_data,after_data) values(auth.uid(),'course.review','courses',target_course_id::text,before_row,jsonb_build_object('status',review_status));
end $$;
create or replace function public.admin_update_site_settings(settings_payload jsonb) returns void language plpgsql security definer set search_path=public as $$ declare item record; begin
  if not public.is_admin() then raise exception 'Admin role required'; end if;
  if settings_payload ? 'accent_color' and not ((settings_payload->>'accent_color') ~ '^#[0-9A-Fa-f]{6}$') then raise exception 'Invalid accent color'; end if;
  if settings_payload ? 'font_family' and settings_payload->>'font_family' not in ('Manrope','Inter','Be Vietnam Pro') then raise exception 'Invalid font'; end if;
  for item in select key,value from jsonb_each(settings_payload) where key in ('accent_color','logo_path','favicon_path','font_family','glass_opacity') loop
    insert into public.site_settings(key,value,updated_by) values(item.key,item.value,auth.uid()) on conflict(key) do update set value=excluded.value,updated_by=auth.uid(),updated_at=now();
  end loop;
  insert into public.audit_logs(actor_id,action,target_table,target_id,after_data) values(auth.uid(),'site.appearance.update','site_settings','appearance',settings_payload);
end $$;
create or replace function public.get_unlisted_world(access_token text) returns setof public.worlds language sql stable security definer set search_path=public as $$ select * from public.worlds where visibility='unlisted' and share_token=access_token limit 1 $$;
create or replace function public.get_unlisted_project(access_token text) returns setof public.projects language sql stable security definer set search_path=public as $$ select * from public.projects where visibility='unlisted' and share_token=access_token limit 1 $$;
revoke all on function public.admin_set_user_role(uuid,text) from public; revoke all on function public.admin_set_account_status(uuid,text) from public; revoke all on function public.admin_review_course(uuid,text) from public; revoke all on function public.admin_update_site_settings(jsonb) from public;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated; grant execute on function public.admin_set_account_status(uuid,text) to authenticated; grant execute on function public.admin_review_course(uuid,text) to authenticated; grant execute on function public.admin_update_site_settings(jsonb) to authenticated;
grant execute on function public.get_unlisted_world(text) to anon,authenticated; grant execute on function public.get_unlisted_project(text) to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
('avatars','avatars',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
('covers','covers',true,8388608,array['image/jpeg','image/png','image/webp']),
('world-media','world-media',false,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
('project-media','project-media',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']),
('course-media','course-media',true,52428800,array['image/jpeg','image/png','image/webp','video/mp4','application/pdf']),
('site-assets','site-assets',true,8388608,array['image/jpeg','image/png','image/webp','image/svg+xml','image/x-icon'])
on conflict(id) do nothing;

create policy storage_public_read on storage.objects for select using (bucket_id in ('avatars','covers','project-media','course-media','site-assets'));
create policy storage_world_read on storage.objects for select using (bucket_id='world-media' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_staff()));
create policy storage_owner_insert on storage.objects for insert to authenticated with check (public.account_can_write() and bucket_id in ('avatars','covers','world-media','project-media','course-media') and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_owner_update on storage.objects for update to authenticated using (owner_id=auth.uid()::text or public.is_admin()) with check (owner_id=auth.uid()::text or public.is_admin());
create policy storage_owner_delete on storage.objects for delete to authenticated using (owner_id=auth.uid()::text or public.is_admin());
create policy storage_admin_assets on storage.objects for insert to authenticated with check (public.account_can_write() and bucket_id='site-assets' and public.is_admin());

-- First owner bootstrap (run once in SQL Editor after replacing the email):
-- update public.profiles set platform_role='owner' where id=(select id from auth.users where email='owner@example.com');
