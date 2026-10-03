import { supabase } from './supabase'

export const missingResource = (error) => ['42P01', '42883', 'PGRST202', 'PGRST205'].includes(error?.code)
export const normalizePublicProject = (row) => row && ({ ...row, owner: row.owner || { id: row.owner_id, username: row.owner_username, display_name: row.owner_display_name, avatar_path: row.owner_avatar_path } })

// Only fall back on installations that have not added the public projection yet.
// A permission error or an empty projection must never trigger a private-row read.
export async function loadPublicProjects({ id, ownerId, ids, limit = 100 } = {}) {
  const run = (modern) => {
    if (!supabase) throw new Error('Chưa kết nối Supabase.')
  let query = modern ? supabase.from('project_showcases').select('*')
      : supabase.from('projects').select('id,owner_id,name,summary,description,genre,project_type,stage,language,looking_for,cover_path,status,visibility,published_at,created_at,contact_links,owner:profiles!projects_owner_id_fkey(id,username,display_name,avatar_path)')
        .eq('status', 'published').in('visibility', ['public', 'showcase'])
    if (id) query = query.eq('id', id)
    if (ownerId) query = query.eq('owner_id', ownerId)
    if (ids) query = query.in('id', ids)
    return query.order('published_at', { ascending: false }).limit(limit)
  }
  let result = await run(true)
  if (missingResource(result.error)) result = await run(false)
  if (result.error) throw result.error
  return (result.data || []).map(normalizePublicProject)
}

export async function attachPublicProjects(posts) {
  const ids = [...new Set(posts.map((post) => post.project_id).filter(Boolean))]
  const projects = ids.length ? await loadPublicProjects({ ids }) : []
  const byId = new Map(projects.map((project) => [project.id, project]))
  return posts.map((post) => ({ ...post, project: byId.get(post.project_id) || null }))
}
