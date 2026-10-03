-- CI ONLY. Every fixture is rolled back; this never seeds production data.
begin;
create schema test;
create function test.assert(condition boolean,label text) returns void language plpgsql as $$ begin if not coalesce(condition,false) then raise exception 'ASSERTION FAILED: %',label; end if; end $$;
create function test.denied(command text,code text) returns void language plpgsql as $$ begin
 begin execute command; exception when others then if sqlstate<>code then raise exception 'Expected %, got %: %',code,sqlstate,sqlerrm; end if; return; end;
 raise exception 'Expected rejection: %',command;
end $$;
grant usage on schema test to anon,authenticated;
grant execute on all functions in schema test to anon,authenticated;
insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000000001','owner@tests.invalid'),
('00000000-0000-4000-8000-000000000002','editor@tests.invalid'),
('00000000-0000-4000-8000-000000000003','viewer@tests.invalid'),
('00000000-0000-4000-8000-000000000004','outsider@tests.invalid'),
('00000000-0000-4000-8000-000000000005','teacher@tests.invalid'),
('00000000-0000-4000-8000-000000000006','admin@tests.invalid');
update public.profiles set username='user_'||right(id::text,1),onboarding_completed=true;
update public.profiles set platform_role='owner' where id='00000000-0000-4000-8000-000000000001';
update public.profiles set platform_role='course_creator' where id='00000000-0000-4000-8000-000000000005';
update public.profiles set platform_role='admin' where id='00000000-0000-4000-8000-000000000006';
insert into public.projects(id,owner_id,name,description,visibility,status) values
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000001','CI project','PRIVATE_LORE','private','draft'),
('10000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000004','CI second','OTHER_SECRET','private','draft');
insert into public.project_members(project_id,user_id,role) values
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002','editor'),
('10000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000003','viewer');
insert into public.project_canvas_nodes(id,project_id,canvas_kind,title) values
('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','character','Original node'),
('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000002','character','Other node');
insert into storage.objects(bucket_id,name,owner_id) values('project-drafts','10000000-0000-4000-8000-000000000001/portrait.png','00000000-0000-4000-8000-000000000003');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","aal":"aal1"}',true);
select test.assert((select count(*) from public.projects)=1,'outsider cannot read private project');
select test.assert((select count(*) from storage.objects where bucket_id='project-drafts')=0,'outsider cannot read private media');
select test.denied($$select public.save_project_workspace('10000000-0000-4000-8000-000000000001',0,'{"sections":[],"nodes":[],"links":[],"events":[],"metadata":{"name":"Changed"}}')$$,'42501');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","aal":"aal1"}',true);
select test.assert((select count(*) from public.project_canvas_nodes)=1,'viewer reads project nodes');
select test.assert((select count(*) from storage.objects where bucket_id='project-drafts')=1,'viewer reads private image');
delete from storage.objects where bucket_id='project-drafts';
select test.assert((select count(*) from storage.objects where bucket_id='project-drafts')=1,'legacy owner_id cannot let viewer delete image');
select test.denied($$select public.save_project_workspace('10000000-0000-4000-8000-000000000001',0,'{"sections":[],"nodes":[],"links":[],"events":[],"metadata":{"name":"Changed"}}')$$,'42501');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000002","aal":"aal1"}',true);
select test.assert(public.save_project_workspace('10000000-0000-4000-8000-000000000001',0,'{"sections":[],"nodes":[{"id":"20000000-0000-4000-8000-000000000001","canvas_kind":"character","title":"Edited node"}],"links":[],"events":[],"metadata":{"name":"Editor cannot rename"}}')=1,'editor can save content');
select test.assert((select name from public.projects where id='10000000-0000-4000-8000-000000000001')='CI project','editor cannot rename owner metadata');
select test.denied($$select public.save_project_workspace('10000000-0000-4000-8000-000000000001',0,'{"sections":[],"nodes":[],"links":[],"events":[],"metadata":{}}')$$,'40001');
select test.denied($$select public.save_project_workspace('10000000-0000-4000-8000-000000000001',1,'{"sections":[],"nodes":[{"id":"20000000-0000-4000-8000-000000000002","canvas_kind":"character","title":"Collision"}],"links":[],"events":[],"metadata":{}}')$$,'23505');
select test.assert((select title from public.project_canvas_nodes where id='20000000-0000-4000-8000-000000000001')='Edited node','failed atomic write preserves previous content');
select test.assert((select workspace_version from public.projects where id='10000000-0000-4000-8000-000000000001')=1,'failed atomic write preserves version');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","aal":"aal1"}',true);
select test.assert(not public.is_admin(),'Owner AAL1 is not an admin session');
select test.denied($$select public.admin_set_user_role('00000000-0000-4000-8000-000000000004','admin')$$,'42501');
insert into public.project_invitations(project_id,created_by,role) values('10000000-0000-4000-8000-000000000001',auth.uid(),'viewer');
select set_config('test.invite',(select token from public.project_invitations limit 1),true);
select test.assert(length(current_setting('test.invite'))=64,'invite token has correct format');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","aal":"aal1"}',true);
select test.assert(public.accept_project_invitation(current_setting('test.invite'))='10000000-0000-4000-8000-000000000001','invite allows authenticated collaborator');
select test.denied($$select public.accept_project_invitation(current_setting('test.invite'))$$,'P0001');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000001","aal":"aal1"}',true);
delete from public.project_members where project_id='10000000-0000-4000-8000-000000000001' and user_id='00000000-0000-4000-8000-000000000004';
update public.projects set status='published',visibility='showcase',public_snapshot='{"sections":[{"title":"PUBLIC_TEXT"}]}' where id='10000000-0000-4000-8000-000000000001';
update public.profiles set profile_visibility='private' where id=auth.uid();
set local role anon;
select test.assert((select count(*) from public.projects)=0,'anon cannot read base rows even for published projects');
select test.assert((select count(*) from public.project_showcases)=1,'anon can read selected showcase');
select test.assert((select to_jsonb(s)::text not like '%PRIVATE_LORE%' and to_jsonb(s)::text not like '%share_token%' from public.project_showcases s limit 1),'showcase never exposes private lore or token');
select test.assert((select count(*) from public.profiles where id='00000000-0000-4000-8000-000000000001')=0,'private profile hidden');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000004","aal":"aal1"}',true);
select test.assert((select count(*) from storage.objects where bucket_id='project-drafts')=0,'revoked collaborator loses private media access');
insert into public.friendships(requester_id,addressee_id) values(auth.uid(),'00000000-0000-4000-8000-000000000003');
select test.denied($$update public.friendships set status='accepted' where requester_id=auth.uid()$$,'P0001');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000003","aal":"aal1"}',true);
update public.friendships set status='accepted' where addressee_id=auth.uid();
select test.assert((select count(*) from public.friendships where status='accepted')=1,'recipient can accept friend request');
select test.assert((select count(*) from public.notifications)>0,'activity creates notifications');
select test.denied($$update public.notifications set payload='{"spam":true}' where user_id=auth.uid()$$,'P0001');
update public.notifications set read_at=now() where user_id=auth.uid();
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","aal":"aal1"}',true);
insert into public.courses(id,creator_id,title) values('30000000-0000-4000-8000-000000000001',auth.uid(),'CI course');
select test.denied($$update public.courses set status='published',visibility='public' where creator_id=auth.uid()$$,'42501');
insert into public.course_lessons(course_id,title,content) values('30000000-0000-4000-8000-000000000001','Lesson','Content');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000006","aal":"aal2"}',true);
select test.assert(public.is_admin(),'Admin AAL2 grants admin access');
select test.denied($$update public.profiles set platform_role='owner' where id=auth.uid()$$,'42501');
select public.admin_review_course('30000000-0000-4000-8000-000000000001','published');
select set_config('request.jwt.claims','{"sub":"00000000-0000-4000-8000-000000000005","aal":"aal1"}',true);
update public.course_lessons set content='Updated' where course_id='30000000-0000-4000-8000-000000000001';
select test.assert((select status='pending_review' and visibility='private' from public.courses where id='30000000-0000-4000-8000-000000000001'),'editing published lesson reopens review');
rollback;
