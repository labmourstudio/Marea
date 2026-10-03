import { imageTypes, validateImage } from './mediaValidation'
import { workspacePayload } from './projectData'
import { supabase } from './supabase'

async function imageBlob(data) {
  if (!/^data:image\/(png|jpeg|webp|gif);base64,/.test(data || '')) throw new Error('Dữ liệu ảnh không hợp lệ.')
  const blob = await (await fetch(data)).blob()
  await validateImage(blob)
  return blob
}

export async function uploadPrivateProjectImage(projectId, file) {
  const extension = await validateImage(file)
  const path = `${projectId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('project-drafts').upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}

export async function prepareCloudProject(draft, cloudId) {
  const uploaded = []
  const upload = async (data) => { const path = await uploadPrivateProjectImage(cloudId, await imageBlob(data)); uploaded.push(path); return path }
  // Imported/cloned local drafts may contain IDs already used by another cloud project.
  const ids = new Map([...draft.sections, ...draft.nodes, ...draft.links, ...draft.events].map((item) => [item.id, crypto.randomUUID()]))
  const remap = (value) => Array.isArray(value) ? value.map(remap) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, remap(item)])) : ids.get(value) || value
  const next = { ...draft, id: cloudId, sections: remap(draft.sections), nodes: remap(draft.nodes), links: remap(draft.links), events: remap(draft.events) }
  try {
    if (draft.cover_data) next.draft_cover_path = await upload(draft.cover_data)
    for (const node of next.nodes) {
      if (node.image_data) node.image_path = await upload(node.image_data)
      delete node.image_data
      if (node.details?.flashart_data) { node.details.flashart_path = await upload(node.details.flashart_data); delete node.details.flashart_data }
    }
    for (const section of next.sections) if (section.content?.image_data) { section.content.image_path = await upload(section.content.image_data); delete section.content.image_data }
    for (const event of next.events) if (event.details?.sketch_data) { event.sketch_path = await upload(event.details.sketch_data); delete event.details.sketch_data }
    return { workspace: workspacePayload(next), uploaded }
  } catch (error) { if (uploaded.length) await supabase.storage.from('project-drafts').remove(uploaded); throw error }
}

export async function preparePublicSnapshot(draft, selectedIds, userId) {
  const selected = new Set(selectedIds)
  const uploaded = []
  const copy = async (path) => {
    if (!path) return null
    if (!path.startsWith(`${draft.id}/`)) throw new Error('Ảnh không thuộc dự án này.')
    const { data: file, error } = await supabase.storage.from('project-drafts').download(path)
    if (error) throw error
    const extension = imageTypes[file.type]
    if (!extension) throw new Error('Định dạng ảnh không được hỗ trợ.')
    const output = `${userId}/${crypto.randomUUID()}.${extension}`
    const result = await supabase.storage.from('project-media').upload(output, file, { contentType: file.type })
    if (result.error) throw result.error
    uploaded.push(output)
    return output
  }
  try {
    const snapshot = { sections: [], nodes: [], links: [], events: [] }
    for (const item of draft.sections.filter((row) => selected.has(row.id))) {
      if (item.content?.kind === 'link' && (!selected.has(item.content.source_id) || !selected.has(item.content.target_id))) continue
      const content = { ...item.content, image_path: await copy(item.content?.image_path) }
      delete content.image_data
      snapshot.sections.push({ id: item.id, section_type: item.section_type, title: item.title, content })
    }
    for (const node of draft.nodes.filter((row) => selected.has(row.id))) {
      const details = { ...node.details, flashart_path: await copy(node.details?.flashart_path) }
      delete details.flashart_data
      snapshot.nodes.push({ id: node.id, canvas_kind: node.canvas_kind, title: node.title, details, image_path: await copy(node.image_path), pos_x: node.pos_x, pos_y: node.pos_y })
    }
    snapshot.links = draft.links.filter((edge) => selected.has(edge.source_id) && selected.has(edge.target_id)).map(({ id, source_id, target_id, canvas_kind, label, detail }) => ({ id, source_id, target_id, canvas_kind, label, detail }))
    for (const event of draft.events.filter((row) => selected.has(row.id))) {
      const details = { ...event.details }; delete details.sketch_data
      snapshot.events.push({ id: event.id, title: event.title, description: event.description, details, sketch_path: await copy(event.sketch_path) })
    }
    const cover = await copy(draft.draft_cover_path) || snapshot.nodes.find((node) => node.image_path)?.image_path || null
    snapshot.cover_path = cover
    return { snapshot, cover, uploaded }
  } catch (error) { if (uploaded.length) await supabase.storage.from('project-media').remove(uploaded); throw error }
}

export const publicSnapshotAssets = (snapshot) => [...new Set([
  snapshot?.cover_path, ...(snapshot?.nodes || []).flatMap((node) => [node.image_path, node.details?.flashart_path]),
  ...(snapshot?.events || []).map((event) => event.sketch_path), ...(snapshot?.sections || []).map((item) => item.content?.image_path),
].filter(Boolean))]
