const storageKey = (userId, kind) => `mora:${kind}:${userId}`

export function readBookmarks(userId, kind = 'saved-posts') {
  if (!userId) return []
  try {
    const data = JSON.parse(localStorage.getItem(storageKey(userId, kind)) || '[]')
    return Array.isArray(data) ? [...new Set(data.filter((id) => typeof id === 'string'))] : []
  } catch { return [] }
}

export function toggleBookmark(userId, id, kind = 'saved-posts') {
  if (!userId || typeof id !== 'string') throw new Error('Cần đăng nhập để lưu nội dung.')
  const current = readBookmarks(userId, kind)
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  localStorage.setItem(storageKey(userId, kind), JSON.stringify(next))
  return next
}
