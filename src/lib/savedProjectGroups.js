const keyFor = (userId) => `mora:saved-project-groups:${userId}`

export function readSavedProjectGroups(userId) {
  if (!userId) return []
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(userId)) || '[]')
    return Array.isArray(saved) ? saved.filter((id) => typeof id === 'string') : []
  } catch { return [] }
}

export function toggleSavedProjectGroup(userId, projectId) {
  const saved = readSavedProjectGroups(userId)
  const next = saved.includes(projectId) ? saved.filter((id) => id !== projectId) : [...saved, projectId]
  localStorage.setItem(keyFor(userId), JSON.stringify(next))
  return next
}
