-- Mora integrity and collaboration release. Apply after the project and social migrations.
-- No production example accounts, content or counters are inserted.
begin;

alter table public.projects add column if not exists workspace_version integer not null default 0,
  add column if not exists draft_cover_path text;

-- This definer projection deliberately exposes an allowlist, never the private row.
-- security_barrier prevents caller expressions from being pushed through its public filter.
create or replace view public.project_showcases with (security_barrier = true) as
select p.id,p.owner_id,p.name,p.summary,p.genre,p.project_type,p.stage,p.language,p.looking_for,
 p.cover_path,p.public_snapshot,p.status,p.visibility,p.published_at,p.contact_open,p.allow_copy,
 o.username as owner_username,o.display_name as owner_display_name,o.avatar_path as owner_avatar_path,
 p.created_at
from public.projects p join public.profiles o on o.id=p.owner_id
where p.status='published' and p.visibility in ('public','showcase') and o.account_status='active';
revoke all on public.project_showcases from anon,authenticated;
grant select on public.project_showcases to anon,authenticated;
revoke all on function public.get_unlisted_project(text) from public,anon,authenticated;

create or replace function public.mora_capabilities() returns jsonb language sql stable set search_path='' as $$
 select jsonb_build_object('project_workspace',true,'polls',true,'notifications',true,'admin_mfa',true,'version',3)
$$;
revoke all on function public.mora_capabilities() from public;
grant execute on function public.mora_capabilities() to anon,authenticated;

-- All workspace content is saved atomically with an optimistic version check.
-- Clients have read access to content tables, and write via this RPC only.
revoke insert,update,delete on public.project_sections,public.project_canvas_nodes,
 public.project_canvas_links,public.project_events from authenticated;

create or replace function public.save_project_workspace(target_project uuid,expected_version integer,workspace jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare p public.projects%rowtype; m jsonb; asset text; next_version integer;
begin
 if auth.uid() is null or not public.can_edit_project(target_project) then raise exception 'Project editing permission required' using errcode='42501'; end if;
 select * into p from public.projects where id=target_project for update;
 if p.workspace_version<>expected_version then raise exception 'Dự án đã thay đổi trên thiết bị hoặc tài khoản khác. Tải bản nháp dự phòng rồi mở lại dự án.' using errcode='40001'; end if;
 if octet_length(workspace::text)>2097152 then raise exception 'Nội dung dự án vượt 2 MB. Tách hình ảnh thành tệp tải lên.'; end if;
 if not coalesce((jsonb_typeof(workspace->'sections')='array' and jsonb_typeof(workspace->'nodes')='array' and jsonb_typeof(workspace->'links')='array' and jsonb_typeof(workspace->'events')='array'),false) then raise exception 'Invalid workspace'; end if;
 for asset in
   select r->>'image_path' from jsonb_array_elements(workspace->'nodes') r
   union all select r->'details'->>'flashart_path' from jsonb_array_elements(workspace->'nodes') r
   union all select r->'content'->>'image_path' from jsonb_array_elements(workspace->'sections') r
   union all select r->>'sketch_path' from jsonb_array_elements(workspace->'events') r
   union all select workspace->'metadata'->>'draft_cover_path'
 loop
   if asset is not null and split_part(asset,'/',1)<>target_project::text then raise exception 'Asset belongs to another project' using errcode='42501'; end if;
 end loop;
 delete from public.project_canvas_links where project_id=target_project;
 delete from public.project_canvas_nodes where project_id=target_project;
 delete from public.project_sections where project_id=target_project;
 delete from public.project_events where project_id=target_project;
 insert into public.project_sections(id,project_id,section_type,title,content,sort_order)
 select r.id,target_project,r.section_type,r.title,coalesce(r.content,'{}'),coalesce(r.sort_order,0)
 from jsonb_to_recordset(workspace->'sections') as r(id uuid,section_type text,title text,content jsonb,sort_order integer);
 insert into public.project_canvas_nodes(id,project_id,canvas_kind,title,details,image_path,pos_x,pos_y)
 select r.id,target_project,r.canvas_kind,r.title,coalesce(r.details,'{}'),r.image_path,coalesce(r.pos_x,0),coalesce(r.pos_y,0)
 from jsonb_to_recordset(workspace->'nodes') as r(id uuid,canvas_kind text,title text,details jsonb,image_path text,pos_x double precision,pos_y double precision);
 insert into public.project_canvas_links(id,project_id,canvas_kind,source_id,target_id,label,detail)
 select r.id,target_project,r.canvas_kind,r.source_id,r.target_id,coalesce(r.label,''),coalesce(r.detail,'')
 from jsonb_to_recordset(workspace->'links') as r(id uuid,canvas_kind text,source_id uuid,target_id uuid,label text,detail text);
 insert into public.project_events(id,project_id,title,description,details,sketch_path)
 select r.id,target_project,r.title,coalesce(r.description,''),coalesce(r.details,'{}'),r.sketch_path
 from jsonb_to_recordset(workspace->'events') as r(id uuid,title text,description text,details jsonb,sketch_path text);
 m:=workspace->'metadata'; next_version:=p.workspace_version+1;
 if p.owner_id=auth.uid() and (coalesce(char_length(trim(m->>'name')),0) not between 1 and 120) then raise exception 'Project name must be 1–120 characters'; end if;
 if p.owner_id=auth.uid() then
  update public.projects set name=m->>'name',summary=m->>'summary',description=m->>'description',
   genre=m->>'genre',stage=m->>'stage',language=m->>'language',
   looking_for=array(select jsonb_array_elements_text(coalesce(m->'looking_for','[]'))),
   contact_open=coalesce((m->>'contact_open')::boolean,false),allow_copy=coalesce((m->>'allow_copy')::boolean,true),
   allow_export=coalesce((m->>'allow_export')::boolean,false),draft_cover_path=m->>'draft_cover_path',workspace_version=next_version
  where id=target_project;
 else update public.projects set workspace_version=next_version where id=target_project; end if;
 return next_version;
end $$;
revoke all on function public.save_project_workspace(uuid,integer,jsonb) from public;
grant execute on function public.save_project_workspace(uuid,integer,jsonb) to authenticated;

-- Prevent direct edits to content or metadata from leaving the editor's version stale.
create or replace function public.bump_project_version() returns trigger language plpgsql set search_path='' as $$
begin
 if new.owner_id is distinct from old.owner_id or new.id is distinct from old.id then raise exception 'Project owner cannot be changed'; end if;
 new.workspace_version:=old.workspace_version+1;
 return new;
end $$;
create trigger bump_project_version before update on public.projects for each row execute function public.bump_project_version();

-- Respect profile privacy. Public portfolios do not need access to private profiles.
drop policy profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (
 id=auth.uid() or public.is_staff() or (account_status='active' and profile_visibility in ('public','showcase'))
);

-- Friend requests cannot be self-approved or silently reassigned.
create or replace function public.protect_friendship() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_op='INSERT' then new.status:='pending'; new.responded_at:=null;
 elsif new.requester_id is distinct from old.requester_id or new.addressee_id is distinct from old.addressee_id or new.id is distinct from old.id then raise exception 'Friend request participants cannot change';
 elsif not public.is_staff() and (auth.uid()<>old.addressee_id or old.status<>'pending' or new.status not in ('accepted','declined','blocked')) then raise exception 'Only the recipient may respond to a pending friend request';
 end if;
 return new;
end $$;
create trigger protect_friendship before insert or update on public.friendships for each row execute function public.protect_friendship();

-- A course must be reviewed before publication; editing a published lesson reopens review.
create or replace function public.protect_course_review() returns trigger language plpgsql set search_path='' as $$
begin
 if public.is_staff() then return new; end if;
 if public.current_platform_role()<>'course_creator' then raise exception 'Course Creator permission required' using errcode='42501'; end if;
 if new.status in ('published','rejected') and (tg_op='INSERT' or new.status is distinct from old.status) then raise exception 'Course review permission required' using errcode='42501'; end if;
 if tg_op='UPDATE' and old.status='published' then new.status:='pending_review'; new.visibility:='private'; end if;
 new.published_at:=case when tg_op='UPDATE' then old.published_at else null end;
 return new;
end $$;
create trigger protect_course_review before insert or update on public.courses for each row execute function public.protect_course_review();
create or replace function public.reopen_lesson_review() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not public.is_staff() then
  update public.courses set status='pending_review',visibility='private' where id=coalesce(new.course_id,old.course_id) and status='published';
 end if;
 return coalesce(new,old);
end $$;
create trigger reopen_lesson_review after insert or update or delete on public.course_lessons for each row execute function public.reopen_lesson_review();

-- Comments and likes may only target visible, published public posts.
drop policy comments_insert on public.comments;
create policy comments_insert on public.comments for insert with check (user_id=auth.uid() and public.account_can_write() and exists(select 1 from public.posts p where p.id=post_id and p.status='published' and p.visibility in ('public','showcase')));
drop policy reactions_insert on public.reactions;
create policy reactions_insert on public.reactions for insert with check (user_id=auth.uid() and public.account_can_write() and exists(select 1 from public.posts p where p.id=post_id and p.status='published' and p.visibility in ('public','showcase')));

-- Notifications are created by database triggers, not by arbitrary client messages.
drop policy notifications_own on public.notifications;
create policy notifications_own on public.notifications for select using (user_id=auth.uid());
create or replace function public.protect_notification() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id is distinct from old.id or new.user_id is distinct from old.user_id or new.actor_id is distinct from old.actor_id or new.kind is distinct from old.kind or new.payload is distinct from old.payload or new.created_at is distinct from old.created_at then raise exception 'Only read status can change'; end if;
 return new;
end $$;
create trigger protect_notification before update on public.notifications for each row execute function public.protect_notification();
create or replace function public.notify_mora_activity() returns trigger language plpgsql security definer set search_path='' as $$
declare recipient uuid; actor uuid; event_kind text; event_payload jsonb;
begin
 if tg_table_name='comments' then
  select user_id into recipient from public.posts where id=new.post_id; actor:=new.user_id; event_kind:='comment'; event_payload:=jsonb_build_object('post_id',new.post_id);
 elsif tg_table_name='follows' then recipient:=new.following_id; actor:=new.follower_id; event_kind:='follow'; event_payload:='{}';
 elsif tg_table_name='friendships' then
  if tg_op='INSERT' then recipient:=new.addressee_id; actor:=new.requester_id; event_kind:='friend_request';
  elsif old.status='pending' and new.status='accepted' then recipient:=new.requester_id; actor:=new.addressee_id; event_kind:='friend_accepted';
  else return new; end if; event_payload:='{}';
 elsif tg_table_name='project_inquiries' then
  if tg_op='INSERT' then select owner_id into recipient from public.projects where id=new.project_id; actor:=new.sender_id; event_kind:='project_inquiry';
  else recipient:=new.sender_id; actor:=auth.uid(); event_kind:='project_reply'; end if;
  event_payload:=jsonb_build_object('project_id',new.project_id);
 end if;
 if recipient is not null and recipient is distinct from actor then
  insert into public.notifications(user_id,actor_id,kind,payload) values(recipient,actor,event_kind,event_payload);
 end if;
 return new;
end $$;
create trigger notify_comment after insert on public.comments for each row execute function public.notify_mora_activity();
create trigger notify_follow after insert on public.follows for each row execute function public.notify_mora_activity();
create trigger notify_friendship after insert or update of status on public.friendships for each row execute function public.notify_mora_activity();
create trigger notify_project_inquiry after insert or update of reply_text on public.project_inquiries for each row execute function public.notify_mora_activity();

-- MFA is checked again in the database, including calls made outside the website.
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((auth.jwt()->>'aal')='aal2',false) and exists(select 1 from public.profiles where id=auth.uid() and account_status='active' and platform_role in ('moderator','admin','owner'))
$$;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce((auth.jwt()->>'aal')='aal2',false) and exists(select 1 from public.profiles where id=auth.uid() and account_status='active' and platform_role in ('admin','owner'))
$$;
-- The legacy role RPC checked only the role. Add the same MFA boundary.
create or replace function public.admin_set_user_role(target_user_id uuid,new_role text) returns void language plpgsql security definer set search_path='' as $$
declare before_row jsonb;
begin
 if not public.is_admin() or public.current_platform_role()<>'owner' then raise exception 'Verified Owner MFA session required' using errcode='42501'; end if;
 if new_role not in ('member','course_creator','moderator','admin','owner') then raise exception 'Invalid role'; end if;
 if target_user_id=auth.uid() and new_role<>'owner' then raise exception 'Transfer ownership before changing your own role'; end if;
 select to_jsonb(p) into before_row from public.profiles p where id=target_user_id;
 if not found then raise exception 'Account not found'; end if;
 update public.profiles set platform_role=new_role::public.platform_role where id=target_user_id;
 insert into public.audit_logs(actor_id,action,target_table,target_id,before_data,after_data) values(auth.uid(),'user.role.update','profiles',target_user_id::text,before_row,jsonb_build_object('platform_role',new_role));
end $$;

-- Restrict the old owner storage policies to user folders; project drafts retain project membership policies.
drop policy storage_owner_update on storage.objects;
create policy storage_owner_update on storage.objects for update to authenticated
 using (bucket_id in ('avatars','covers','world-media','project-media','course-media','post-media','site-assets') and public.account_can_write() and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()))
 with check (bucket_id in ('avatars','covers','world-media','project-media','course-media','post-media','site-assets') and public.account_can_write() and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));
drop policy storage_owner_delete on storage.objects;
create policy storage_owner_delete on storage.objects for delete to authenticated
 using (bucket_id in ('avatars','covers','world-media','project-media','course-media','post-media','site-assets') and public.account_can_write() and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin()));

revoke all on public.project_sections,public.project_canvas_nodes,public.project_canvas_links,public.project_events,public.project_invitations,public.project_inquiries,public.post_poll_options,public.post_poll_votes,public.notifications from anon;
-- Enforce Owner-only role changes even when a client bypasses the role RPC.
create or replace function public.protect_profile_privileges() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.id is distinct from old.id then raise exception 'Profile identity cannot change'; end if;
 if auth.uid() is null then return new; end if; -- SQL Editor bootstrap / trusted backend only.
 if new.platform_role is distinct from old.platform_role then
  if not public.is_admin() or public.current_platform_role()<>'owner' then raise exception 'Verified Owner required for role changes' using errcode='42501'; end if;
  if old.id=auth.uid() and old.platform_role='owner' then raise exception 'Transfer ownership before changing your own role'; end if;
 end if;
 if new.account_status is distinct from old.account_status then
  if not public.is_admin() or (old.platform_role='owner' and public.current_platform_role()<>'owner') then raise exception 'Account administration permission required' using errcode='42501'; end if;
  if old.id=auth.uid() and old.platform_role='owner' and new.account_status<>'active' then raise exception 'Cannot disable the signed-in Owner'; end if;
 end if;
 return new;
end $$;

create or replace function public.prepare_project_invitation() returns trigger language plpgsql set search_path='' as $$
begin
 new.token:=replace(gen_random_uuid()::text,'-','') || replace(gen_random_uuid()::text,'-','');
 new.created_at:=now(); new.expires_at:=now()+interval '7 days';
 new.revoked_at:=null; new.accepted_at:=null; new.accepted_by:=null;
 return new;
end $$;
create or replace function public.prevent_content_reassignment() returns trigger language plpgsql set search_path='' as $$
begin
 if new.id is distinct from old.id then raise exception 'Content identity cannot change'; end if;
 if tg_table_name='course_lessons' then
  if new.course_id is distinct from old.course_id then raise exception 'Lesson course cannot change'; end if;
 else
  if new.post_id is distinct from old.post_id or new.user_id is distinct from old.user_id then raise exception 'Comment target cannot change'; end if;
 end if;
 return new;
end $$;
create trigger prevent_lesson_reassignment before update on public.course_lessons for each row execute function public.prevent_content_reassignment();
create trigger prevent_comment_reassignment before update on public.comments for each row execute function public.prevent_content_reassignment();
drop policy reactions_read on public.reactions;
create policy reactions_read on public.reactions for select using (exists(select 1 from public.posts p where p.id=post_id) or public.is_staff());
commit;
