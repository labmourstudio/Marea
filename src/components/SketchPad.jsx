import { useEffect, useRef, useState } from 'react'

export default function SketchPad({ initialImage, onSave, disabled = false }) {
  const canvas = useRef(null)
  const drawing = useRef(false)
  const [ink, setInk] = useState('#5846ad')
  useEffect(() => {
    if (!initialImage) return
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => canvas.current?.getContext('2d').drawImage(image, 0, 0, 960, 540)
    image.src = initialImage
  }, [initialImage])
  function pointer(event, stage) {
    if (disabled) return
    const node = canvas.current
    const bounds = node.getBoundingClientRect()
    const context = node.getContext('2d')
    const x = (event.clientX - bounds.left) * node.width / bounds.width
    const y = (event.clientY - bounds.top) * node.height / bounds.height
    if (stage === 'down') { drawing.current = true; node.setPointerCapture(event.pointerId); context.beginPath(); context.moveTo(x,y) }
    if (stage === 'move' && drawing.current) { context.strokeStyle = ink; context.lineCap = 'round'; context.lineWidth = 4; context.lineTo(x,y); context.stroke() }
    if (stage === 'up') drawing.current = false
  }
  function background(event) {
    const file = event.target.files?.[0]
    if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 8*1024*1024) return
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => { const ctx = canvas.current.getContext('2d'); ctx.clearRect(0,0,960,540); ctx.drawImage(image,0,0,960,540); URL.revokeObjectURL(url) }
    image.src = url
  }
  function save() { canvas.current.toBlob((blob) => { if (blob) onSave(blob) }, 'image/png') }
  return <div className="sketchpad"><p>Phác thảo nhanh hoặc ghi chú trực tiếp lên hình tham chiếu. Nét vẽ chỉ được chia sẻ khi dự án được đồng bộ và bạn cấp quyền.</p><canvas ref={canvas} width="960" height="540" onPointerDown={(event) => pointer(event,'down')} onPointerMove={(event) => pointer(event,'move')} onPointerUp={(event) => pointer(event,'up')} /><div className="sketch-controls"><label>Ảnh nền<input type="file" accept="image/png,image/jpeg,image/webp" disabled={disabled} onChange={background} /></label><label>Màu nét<input type="color" value={ink} disabled={disabled} onChange={(event) => setInk(event.target.value)} /></label><button type="button" className="secondary-button" disabled={disabled} onClick={() => canvas.current.getContext('2d').clearRect(0,0,960,540)}>Xóa nét</button><button type="button" className="primary-button" disabled={disabled} onClick={save}>Lưu phác thảo</button></div></div>
}
