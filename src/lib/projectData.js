const collections = ['sections', 'nodes', 'links', 'events']
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
export function validateProjectBackup(backup, ownerId) {
  if (!backup || backup.owner_id !== ownerId || typeof backup.name !== 'string' || !backup.name.trim() || backup.name.length > 120 || !collections.every((key) => Array.isArray(backup[key]))) throw new Error('Tệp không phải bản sao lưu hợp lệ của tài khoản này.')
  const ids = collections.flatMap((key) => backup[key].map((item) => item?.id))
  if (ids.some((id) => typeof id !== 'string' || !uuid.test(id)) || new Set(ids).size !== ids.length) throw new Error('Bản sao lưu có mã nội dung không hợp lệ hoặc trùng nhau.')
  const nodes = new Map(backup.nodes.map((node) => [node.id, node]))
  if (backup.links.some((edge) => !nodes.has(edge.source_id) || !nodes.has(edge.target_id) || edge.source_id === edge.target_id || nodes.get(edge.source_id).canvas_kind !== edge.canvas_kind || nodes.get(edge.target_id).canvas_kind !== edge.canvas_kind)) throw new Error('Bản sao lưu có quan hệ nhân vật hoặc vùng đất không hợp lệ.')
  return backup
}

export function workspacePayload(draft) {
  return {
    metadata: { name: draft.name, summary: draft.summary || '', description: draft.description || '', genre: draft.genre || '', stage: draft.stage || 'Idea', language: draft.language || 'Vietnamese', looking_for: draft.looking_for || [], contact_open: !!draft.contact_open, allow_copy: draft.allow_copy !== false, allow_export: !!draft.allow_export, draft_cover_path: draft.draft_cover_path || null },
    sections: (draft.sections || []).map(({ id, section_type, title, content, sort_order }) => ({ id, section_type, title, content: content || {}, sort_order: sort_order || 0 })),
    nodes: (draft.nodes || []).map(({ id, canvas_kind, title, details, image_path, pos_x, pos_y }) => ({ id, canvas_kind, title, details: details || {}, image_path: image_path || null, pos_x: pos_x || 0, pos_y: pos_y || 0 })),
    links: (draft.links || []).map(({ id, canvas_kind, source_id, target_id, label, detail }) => ({ id, canvas_kind, source_id, target_id, label: label || '', detail: detail || '' })),
    events: (draft.events || []).map(({ id, title, description, details, sketch_path }) => ({ id, title, description: description || '', details: details || {}, sketch_path: sketch_path || null })),
  }
}

export function createSaveQueue(save) {
  let pending = Promise.resolve()
  return (snapshot) => {
    const next = pending.catch(() => {}).then(() => save(snapshot))
    pending = next
    return next
  }
}
