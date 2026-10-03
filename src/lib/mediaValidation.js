export const imageTypes = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' }
export const mediaTypes = { ...imageTypes, 'video/mp4': 'mp4', 'video/webm': 'webm', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/webm': 'weba', 'audio/mp4': 'm4a' }

export async function validateImage(file) {
  if (!file || !imageTypes[file.type] || file.size > 8 * 1024 * 1024 || !file.size) throw new Error('Chỉ nhận PNG, JPEG, WebP hoặc GIF tối đa 8 MB.')
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const text = new TextDecoder().decode(bytes)
  const valid = file.type === 'image/jpeg' ? bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
    : file.type === 'image/png' ? bytes[0] === 137 && text.slice(1, 4) === 'PNG'
      : file.type === 'image/gif' ? /^(GIF87a|GIF89a)/.test(text)
        : text.slice(0, 4) === 'RIFF' && text.slice(8, 12) === 'WEBP'
  if (!valid) throw new Error('Nội dung tệp không khớp định dạng ảnh. Hãy xuất lại ảnh trước khi tải lên.')
  return imageTypes[file.type]
}

export const safeExternalLinks = (links) => Object.entries(links || {}).filter(([, value]) => {
  try { return typeof value === 'string' && ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
})
