const KEY = 'mora:pending-invite'
const INVITE_PATH = /^\/invite\/[a-f0-9]{64}$/i

export function rememberInvite(path) {
  if (INVITE_PATH.test(path || '')) sessionStorage.setItem(KEY, path)
}

export function pendingInvite() {
  const path = sessionStorage.getItem(KEY)
  return INVITE_PATH.test(path || '') ? path : null
}

export function clearInvite() { sessionStorage.removeItem(KEY) }
