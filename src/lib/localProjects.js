import { validateImage } from './mediaValidation'

const DB_NAME = 'mora-local-projects'
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
export const deleteLocalProject = (id) => transaction('readwrite', (store) => store.delete(id))

export async function readImage(file) {
  await validateImage(file)
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}
