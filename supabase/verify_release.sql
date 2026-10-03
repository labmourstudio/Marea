-- Read-only inspection in your existing Supabase SQL Editor.
select name,to_regclass('public.'||name) as relation from unnest(array['projects','project_showcases','project_sections','project_canvas_nodes','project_canvas_links','project_events','project_invitations','project_inquiries','post_poll_options','post_poll_votes']) name;
select routine_name from information_schema.routines where routine_schema='public' and routine_name in ('mora_capabilities','save_project_workspace','accept_project_invitation','protect_profile_privileges','protect_course_review');
select column_name from information_schema.columns where table_schema='public' and table_name='projects' and column_name in ('workspace_version','draft_cover_path','public_snapshot');
select id,public,file_size_limit from storage.buckets where id in ('project-drafts','post-media','course-media');
-- Run only after the new migration is present:
-- select public.mora_capabilities();
