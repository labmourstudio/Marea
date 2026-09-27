const DB_NAME = 'mayo-local-projects'
const STORE = 'drafts'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'id' })
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function transaction(mode, operation) {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const request = operation(tx.objectStore(STORE))
    let result
    request.onsuccess = () => { result = request.result }
    tx.oncomplete = () => { db.close(); resolve(result) }
    tx.onerror = () => { db.close(); reject(tx.error) }
    tx.onabort = () => { db.close(); reject(tx.error || new Error('Không thể lưu bản nháp trên thiết bị.')) }
  })
}

export const listLocalProjects = () => transaction('readonly', (store) => store.getAll())
export const getLocalProject = (id) => transaction('readonly', (store) => store.get(id))
export const putLocalProject = (draft) => transaction('readwrite', (store) => store.put(draft))

export function readImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type) || file.size > 8 * 1024 * 1024) { reject(new Error('Chỉ nhận PNG, JPEG, WebP hoặc GIF tối đa 8 MB.')); return }
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
