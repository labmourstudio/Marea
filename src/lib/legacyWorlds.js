// A read-only copy into the unified project editor. The legacy Supabase world
// remains untouched, including its media, until its owner explicitly manages it.
const text = (value) => typeof value === 'string' ? value : JSON.stringify(value ?? '')
const details = (value) => Object.fromEntries(Object.entries(value || {}).map(([key, entry]) => [key, text(entry)]))

export function worldToLocalProject(world, related, ownerId) {
  const sections = []
  function section(title, content, extra = '') {
    sections.push({ id: crypto.randomUUID(), section_type: 'custom', title, content: { text: content || '', extra }, sort_order: sections.length })
  }
  if (world.description || world.genre) section('Bối cảnh và cốt truyện', world.description, world.genre ? `Thể loại: ${world.genre}` : '')
  for (const faction of related.factions || []) section(`Phe phái: ${faction.name}`, faction.description, JSON.stringify(faction.details || {}, null, 2))
  for (const item of related.items || []) section(`Vật phẩm: ${item.name}`, item.description, JSON.stringify(item.details || {}, null, 2))

  const nodes = [
    ...(related.characters || []).map((character, index) => ({
      id: crypto.randomUUID(), canvas_kind: 'character', title: character.name,
      details: details(character.details), pos_x: 120 + index % 4 * 180, pos_y: 90 + Math.floor(index / 4) * 160,
    })),
    ...(related.locations || []).map((location, index) => ({
      id: crypto.randomUUID(), canvas_kind: 'land', title: location.name,
      details: { ...details(location.details), description: location.description || '' },
      pos_x: 120 + index % 4 * 180, pos_y: 90 + Math.floor(index / 4) * 160,
    })),
  ]
  const events = (related.events || []).map((event) => ({
    id: crypto.randomUUID(), title: event.title, description: event.description || '',
    details: { participants: '', skins: '', notes: [event.event_date, JSON.stringify(event.details || {})].filter(Boolean).join('\n') },
  }))
  const oldMediaCount = (world.reference_images?.length || 0) + [...(related.characters || []), ...(related.locations || []), ...(related.items || [])].reduce((total, item) => total + (item.image_paths?.length || 0), 0)
  if (oldMediaCount) section('Ảnh gốc cần gắn lại', `Có ${oldMediaCount} ảnh/tài liệu trong Thế giới cũ. Ảnh vẫn nằm ở dữ liệu gốc trên Mora; hãy tự chọn và tải lại ảnh muốn đưa vào dự án này.`)

  return {
    id: `local-${crypto.randomUUID()}`, local: true, owner_id: ownerId, source_world_id: world.id,
    name: world.name, project_type: world.world_type === 'game' ? 'Game' : 'Novel',
    summary: (world.description || '').slice(0, 240), description: world.description || '',
    genre: world.genre || '', language: world.language || 'Vietnamese', stage: 'Idea',
    visibility: 'private', status: 'draft', looking_for: [], contact_open: false,
    allow_copy: true, allow_export: false, sections, nodes, links: [], events,
    updated_at: new Date().toISOString(),
  }
}
