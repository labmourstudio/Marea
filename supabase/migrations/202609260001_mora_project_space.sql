-- Mora project workspace: private editable material is separate from public showcases.
-- Apply AFTER 202609220001_initial_marea.sql. No seed data, no destructive table rewrite.
begin;

alter table public.projects
  add column if not exists public_snapshot jsonb not null default '{}'::jsonb,
  add column if not exists contact_open boolean not null default false,
  add column if not exists allow_copy boolean not null default true,
  add column if not exists allow_export boolean not null default false;

create or replace function public.can_access_project_space(target_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles profile where profile.id = auth.uid()
    and profile.account_status in ('active','limited')) and exists (
    select 1 from public.projects p where p.id = target_project and
    (p.owner_id = auth.uid() or exists (
      select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid()
    ))
  )
$$;

create or replace function public.can_edit_project(target_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.account_can_write() and exists (
    select 1 from public.projects p where p.id = target_project and
    (p.owner_id = auth.uid() or exists (
      select 1 from public.project_members m where m.project_id = p.id and m.user_id = auth.uid() and m.role in ('editor','manager')
    ))
  )
$$;

create or replace function public.can_contact_project(target_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.projects p where p.id = target_project
    and p.status = 'published' and p.visibility in ('public','showcase')
    and p.contact_open and p.owner_id <> auth.uid())
$$;

-- The legacy projects row contains private description, media, links and share_token.
-- Do not expose that row to the public: the view below is an explicit allowlist.
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select
  using (public.can_access_project_space(id) or (public.is_staff() and public.account_can_write()));

create or replace view public.project_showcases as
select p.id, p.owner_id, p.name, p.summary, p.genre, p.project_type, p.stage,
  p.language, p.looking_for, p.cover_path, p.public_snapshot, p.status,
  p.visibility, p.published_at, p.contact_open, p.allow_copy,
  o.username as owner_username, o.display_name as owner_display_name,
  o.avatar_path as owner_avatar_path
from public.projects p join public.profiles o on o.id = p.owner_id
where p.status = 'published' and p.visibility in ('public','showcase')
  and o.account_status = 'active';
grant select on public.project_showcases to anon, authenticated;

create table if not exists public.project_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  section_type text not null check (section_type in ('overview','story','character','land','skill','reference','palette','material','document','custom')),
  title text not null check (char_length(title) between 1 and 160),
  content jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists project_sections_order_idx on public.project_sections(project_id,sort_order);

create table if not exists public.project_canvas_nodes (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  canvas_kind text not null check (canvas_kind in ('character','land')),
  title text not null check (char_length(title) between 1 and 160),
  image_path text, details jsonb not null default '{}'::jsonb,
  pos_x double precision not null default 0, pos_y double precision not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (project_id,id), unique (project_id,id,canvas_kind)
);

create table if not exists public.project_canvas_links (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  canvas_kind text not null check (canvas_kind in ('character','land')),
  source_id uuid not null, target_id uuid not null,
  label text not null default '', detail text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (source_id <> target_id),
  foreign key(project_id,source_id,canvas_kind) references public.project_canvas_nodes(project_id,id,canvas_kind) on delete cascade,
  foreign key(project_id,target_id,canvas_kind) references public.project_canvas_nodes(project_id,id,canvas_kind) on delete cascade
);

create table if not exists public.project_events (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  description text not null default '',
  details jsonb not null default '{}'::jsonb,
  sketch_path text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.project_invitations (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32),'hex'),
  role text not null check (role in ('viewer','editor')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz, accepted_by uuid references public.profiles(id), accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.project_inquiries (
  id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('collaboration','expertise','funding')),
  message text not null check (char_length(message) between 10 and 3000),
  reply_text text check (reply_text is null or char_length(reply_text) between 1 and 3000),
  replied_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.prepare_project_invitation()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.token := encode(gen_random_bytes(32),'hex');
  new.created_at := now(); new.expires_at := now() + interval '7 days';
  new.revoked_at := null; new.accepted_at := null; new.accepted_by := null;
  return new;
end $$;
create trigger prepare_project_invitation before insert on public.project_invitations
  for each row execute function public.prepare_project_invitation();

create or replace function public.prepare_project_inquiry()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.reply_text := null; new.replied_at := null; new.created_at := now();
  return new;
end $$;
create trigger prepare_project_inquiry before insert on public.project_inquiries
  for each row execute function public.prepare_project_inquiry();

grant select, insert, update, delete on public.project_sections, public.project_canvas_nodes,
  public.project_canvas_links, public.project_events, public.project_invitations,
  public.project_inquiries to authenticated;

do $$ declare table_name text; begin
  foreach table_name in array array['project_sections','project_canvas_nodes','project_canvas_links','project_events'] loop
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.set_updated_at()',table_name,table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['project_sections','project_canvas_nodes','project_canvas_links','project_events','project_invitations','project_inquiries'] loop
    execute format('alter table public.%I enable row level security',table_name);
  end loop;
  foreach table_name in array array['project_sections','project_canvas_nodes','project_canvas_links','project_events'] loop
    execute format('create policy %I_select on public.%I for select to authenticated using (public.can_access_project_space(project_id))',table_name,table_name);
    execute format('create policy %I_insert on public.%I for insert to authenticated with check (public.can_edit_project(project_id))',table_name,table_name);
    execute format('create policy %I_update on public.%I for update to authenticated using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id))',table_name,table_name);
    execute format('create policy %I_delete on public.%I for delete to authenticated using (public.can_edit_project(project_id))',table_name,table_name);
  end loop;
end $$;

create policy project_invitations_owner_read on public.project_invitations for select to authenticated
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy project_invitations_owner_insert on public.project_invitations for insert to authenticated
  with check (public.account_can_write() and created_by = auth.uid() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create or replace function public.revoke_project_invitation(access_token text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.account_can_write() then raise exception 'Active account required'; end if;
  update public.project_invitations i set revoked_at = now()
    where i.token = access_token and i.accepted_at is null and i.revoked_at is null
      and exists (select 1 from public.projects p where p.id=i.project_id and p.owner_id=auth.uid());
  if not found then raise exception 'Invitation not found or already used'; end if;
end $$;
revoke all on function public.revoke_project_invitation(text) from public;
grant execute on function public.revoke_project_invitation(text) to authenticated;

create policy project_inquiries_sender_read on public.project_inquiries for select to authenticated
  using (sender_id = auth.uid() or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create policy project_inquiries_sender_insert on public.project_inquiries for insert to authenticated
  with check (public.account_can_write() and sender_id = auth.uid() and public.can_contact_project(project_id));
create policy project_inquiries_owner_reply on public.project_inquiries for update to authenticated
  using (public.account_can_write() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (public.account_can_write() and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
create or replace function public.protect_project_inquiry()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.project_id is distinct from old.project_id or new.sender_id is distinct from old.sender_id
    or new.kind is distinct from old.kind or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the reply can be updated';
  end if;
  return new;
end $$;
create trigger protect_project_inquiry before update on public.project_inquiries
  for each row execute function public.protect_project_inquiry();

create or replace function public.accept_project_invitation(access_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare invitation public.project_invitations%rowtype;
begin
  if auth.uid() is null or not public.account_can_write() then raise exception 'Sign in with an active account'; end if;
  select * into invitation from public.project_invitations
    where token = access_token and revoked_at is null and accepted_at is null and expires_at > now()
    for update;
  if not found then raise exception 'Invitation invalid or expired'; end if;
  if exists(select 1 from public.projects p where p.id=invitation.project_id and p.owner_id=auth.uid()) then raise exception 'Project owner cannot accept an invitation'; end if;
  insert into public.project_members(project_id,user_id,role) values(invitation.project_id,auth.uid(),invitation.role)
    on conflict(project_id,user_id) do update set role=excluded.role;
  update public.project_invitations set accepted_by=auth.uid(), accepted_at=now() where id=invitation.id;
  return invitation.project_id;
end $$;
revoke all on function public.accept_project_invitation(text) from public;
grant execute on function public.accept_project_invitation(text) to authenticated;

-- Path convention: project-id/random-filename. Only members may read private media;
-- only owner/editors may upload. Asset paths never go in public_snapshot.
create or replace function public.project_asset_id(asset_path text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin return split_part(asset_path,'/',1)::uuid;
exception when invalid_text_representation then return null;
end $$;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('project-drafts','project-drafts',false,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict(id) do nothing;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('feed-media','feed-media',true,20971520,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'])
on conflict(id) do nothing;
create policy feed_media_select on storage.objects for select using (bucket_id = 'feed-media');
create policy feed_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'feed-media' and public.account_can_write() and (storage.foldername(name))[1] = auth.uid()::text);
create policy feed_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'feed-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy project_drafts_select on storage.objects for select to authenticated
  using (bucket_id = 'project-drafts' and public.can_access_project_space(public.project_asset_id(name)));
create policy project_drafts_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'project-drafts' and public.can_edit_project(public.project_asset_id(name)));
create policy project_drafts_update on storage.objects for update to authenticated
  using (bucket_id = 'project-drafts' and public.can_edit_project(public.project_asset_id(name)))
  with check (bucket_id = 'project-drafts' and public.can_edit_project(public.project_asset_id(name)));
create policy project_drafts_delete on storage.objects for delete to authenticated
  using (bucket_id = 'project-drafts' and public.can_edit_project(public.project_asset_id(name)));
commit;
