import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

export function publicStorageUrl(bucket, path) {
  if (!supabase || !path) return null
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

export async function uploadOwnedImage(bucket, userId, file) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  if (!file?.type?.startsWith('image/')) throw new Error('Chỉ chấp nhận tệp hình ảnh.')
  if (file.size > 8 * 1024 * 1024) throw new Error('Ảnh phải nhỏ hơn 8 MB.')
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    contentType: file.type,
  })
  if (error) throw error
  return path
}

export async function uploadFeedMedia(userId, file) {
  if (!supabase) throw new Error('Supabase chưa được cấu hình.')
  if (!['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm'].includes(file?.type)) throw new Error('Chỉ nhận ảnh hoặc video MP4/WebM.')
  if (file.size > 20 * 1024 * 1024) throw new Error('Tệp phải nhỏ hơn 20 MB.')
  const path = `${userId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'bin'}`
  const { error } = await supabase.storage.from('feed-media').upload(path, file, { contentType: file.type })
  if (error) throw error
  return path
}
