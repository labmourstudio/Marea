export const isGameProject = (type) => type === 'Game' || type === 'RPG' || type === 'Game Event'

const sharedLabels = {
  overview: 'Tổng quan', character: 'Nhân vật', reference: 'Hình tham chiếu',
  document: 'Tài liệu', custom: 'Mục tùy chỉnh', share: 'Chia sẻ & quyền',
}

const story = {
  label: 'Không gian Truyện',
  description: 'Phát triển lore, cốt truyện, nhân vật và địa điểm theo mạch kể của bạn. Mỗi mục đều có thể thêm và đổi tên.',
  tabs: ['overview', 'lore', 'story', 'character', 'land', 'reference', 'document', 'custom', 'events', 'share'],
  labels: { ...sharedLabels, lore: 'Lore truyện', story: 'Cốt truyện', land: 'Địa điểm', events: 'Mốc truyện' },
}

const game = {
  label: 'Không gian Game Design',
  description: 'Sắp xếp gameplay, bối cảnh, nhân vật, bản đồ và kỹ năng trong một dự án. Chỉ dùng những mục game cần.',
  tabs: ['overview', 'gameplay', 'story', 'character', 'land', 'skill', 'currency', 'items', 'skins', 'game_events', 'economy', 'palette', 'material', 'reference', 'document', 'custom', 'share'],
  labels: { ...sharedLabels, gameplay: 'Gameplay', story: 'Bối cảnh & lore', land: 'Bản đồ & vùng đất', skill: 'Thiết kế kỹ năng', currency: 'Tiền tệ', items: 'Vật phẩm', skins: 'Dòng skin', game_events: 'Sự kiện game', economy: 'Quan hệ & chi phí', palette: 'Bảng màu', material: 'Chất liệu' },
}

const gameEvent = {
  ...game,
  label: 'Không gian Sự kiện Game',
  description: 'Lên cốt truyện sự kiện, chọn tướng và tiền tệ được dùng từ game gốc, rồi phát triển dòng skin và chi phí.',
  tabs: ['overview', 'game_events', 'character', 'currency', 'skins', 'economy', 'story', 'reference', 'document', 'custom', 'share'],
}

export const projectWorkflow = (type) => type === 'Game Event' ? gameEvent : isGameProject(type) ? game : story

// Lore and gameplay use the existing custom section type, so older projects and
// the pending cloud schema can read the same data without adding a SQL enum.
export function sectionForTab(tab, title, sortOrder) {
  const isSpecial = tab === 'lore' || tab === 'gameplay'
  return { id: crypto.randomUUID(), section_type: isSpecial ? 'custom' : tab,
    title, content: { text: '', extra: '', ...(isSpecial ? { category: tab } : {}) }, sort_order: sortOrder }
}

export function sectionBelongsToTab(section, tab) {
  if (tab === 'lore' || tab === 'gameplay') return section.section_type === 'custom' && section.content?.category === tab
  if (tab === 'custom') return section.section_type === 'custom' && !['lore', 'gameplay', 'game_currency', 'game_item', 'skin_series', 'game_skin', 'game_event', 'board_element'].includes(section.content?.category)
  return section.section_type === tab
}
