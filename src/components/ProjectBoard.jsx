import { useState } from 'react'
import { Minus, Plus, Trash2, ZoomIn, ZoomOut } from 'lucide-react'

const size = { text: [195, 68], box: [240, 138], circle: [140, 140] }
const location = (element) => ({ x: Number(element.content.x) || 0, y: Number(element.content.y) || 0 })

export default function ProjectBoard({ tab, sections, onChange, onAdd, connecting, onConnectionDone, textSize = 16, readOnly = false, publicView = false }) {
  const [sourceId, setSourceId] = useState(null)
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(null)
  const elements = sections.filter((item) => item.section_type === 'custom' && item.content?.category === 'board_element' && item.content?.board_tab === tab)
  const blocks = elements.filter((item) => item.content.kind !== 'link')
  const links = elements.filter((item) => item.content.kind === 'link')

  function patch(id, content) {
    if (!readOnly) onChange(sections.map((item) => item.id === id ? { ...item, content: { ...item.content, ...content } } : item))
  }
  function remove(id) {
    if (readOnly) return
    onChange(sections.filter((item) => item.id !== id && item.content?.source_id !== id && item.content?.target_id !== id))
  }
  function connectTo(id) {
    if (!connecting || readOnly) return
    if (!sourceId || sourceId === id) { setSourceId(id); return }
    onChange([...sections, { id: crypto.randomUUID(), section_type: 'custom', sort_order: sections.length, title: 'Liên kết', content: { category: 'board_element', board_tab: tab, kind: 'link', source_id: sourceId, target_id: id, text: '' } }])
    setSourceId(null)
    onConnectionDone()
  }
  function startDrag(event, element) {
    if (readOnly || connecting) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    const pos = location(element)
    setDragging({ id: element.id, clientX: event.clientX, clientY: event.clientY, x: pos.x, y: pos.y })
  }
  function move(event) {
    if (!dragging) return
    patch(dragging.id, { x: Math.max(0, Math.round(dragging.x + (event.clientX - dragging.clientX) / zoom)), y: Math.max(0, Math.round(dragging.y + (event.clientY - dragging.clientY) / zoom)) })
  }

  return <section className="project-board glass-card"><header><div><h2>Bảng ý tưởng</h2><p>Đặt chữ, ô văn bản và vòng tròn. Kéo thanh đầu mỗi khối để sắp xếp; nối hai khối để diễn tả quan hệ.</p></div><div className="board-zoom"><button type="button" onClick={() => setZoom((value) => Math.max(.6, value - .1))} aria-label="Thu nhỏ"><ZoomOut size={17} /></button><span>{Math.round(zoom * 100)}%</span><button type="button" onClick={() => setZoom((value) => Math.min(1.5, value + .1))} aria-label="Phóng to"><ZoomIn size={17} /></button></div></header>
    {connecting && <p className="board-hint" role="status">{sourceId ? 'Chọn khối thứ hai để tạo dây kết nối.' : 'Chọn khối thứ nhất để bắt đầu nối.'} <button type="button" onClick={() => { setSourceId(null); onConnectionDone() }}>Hủy</button></p>}
    <div className="board-viewport"><div className="board-stage" style={{ transform: `scale(${zoom})` }}><svg className="board-links" viewBox="0 0 1100 680" aria-label="Các dây kết nối">{links.map((link) => { const a = blocks.find((block) => block.id === link.content.source_id); const b = blocks.find((block) => block.id === link.content.target_id); if (!a || !b) return null; const [aw, ah] = size[a.content.kind] || size.box; const [bw, bh] = size[b.content.kind] || size.box; const x1 = location(a).x + aw / 2, y1 = location(a).y + ah / 2, x2 = location(b).x + bw / 2, y2 = location(b).y + bh / 2; return <g key={link.id}><line x1={x1} y1={y1} x2={x2} y2={y2} /><circle cx={x1} cy={y1} r="4" /><circle cx={x2} cy={y2} r="4" /></g> })}</svg>
      {links.map((link) => { const a = blocks.find((block) => block.id === link.content.source_id), b = blocks.find((block) => block.id === link.content.target_id); if (!a || !b) return null; const [aw, ah] = size[a.content.kind] || size.box, [bw, bh] = size[b.content.kind] || size.box; return <label className="board-link-label" key={link.id} style={{ left: (location(a).x + aw / 2 + location(b).x + bw / 2) / 2, top: (location(a).y + ah / 2 + location(b).y + bh / 2) / 2 }}><input aria-label="Tên dây kết nối" value={link.content.text || ''} placeholder="Quan hệ" disabled={readOnly} onChange={(event) => patch(link.id, { text: event.target.value })} /><button type="button" disabled={readOnly} aria-label="Xóa dây kết nối" onClick={() => remove(link.id)}>×</button></label> })}
      {blocks.map((element) => <div key={element.id} className={`board-block board-${element.content.kind}${sourceId === element.id ? ' board-source' : ''}`} style={{ left: location(element).x, top: location(element).y, fontSize: element.content.font_size || textSize }}><div className="board-block-handle" onPointerDown={(event) => startDrag(event, element)} onPointerMove={move} onPointerUp={() => setDragging(null)}><span>{element.content.kind === 'circle' ? 'Khung tròn' : element.content.kind === 'text' ? 'Chữ' : 'Ô văn bản'}</span><div><button type="button" disabled={readOnly || !connecting} title="Chọn để nối" onPointerDown={(event) => event.stopPropagation()} onClick={() => connectTo(element.id)}><Plus size={13} /></button><button type="button" disabled={readOnly} title="Xóa khối" onPointerDown={(event) => event.stopPropagation()} onClick={() => remove(element.id)}><Trash2 size={13} /></button></div></div>{element.content.kind === 'box' ? <textarea value={element.content.text || ''} disabled={readOnly} aria-label="Nội dung ô văn bản" placeholder="Ghi ý tưởng…" onChange={(event) => patch(element.id, { text: event.target.value })} /> : <input value={element.content.text || ''} disabled={readOnly} aria-label={element.content.kind === 'circle' ? 'Nội dung khung tròn' : 'Nội dung chữ'} placeholder={element.content.kind === 'circle' ? 'Chủ đề' : 'Thêm chữ…'} onChange={(event) => patch(element.id, { text: event.target.value })} />}</div>)}
    </div></div>{!blocks.length && !readOnly && <div className="board-empty"><p>Chưa có gì trên bảng ý tưởng.</p><button className="secondary-button" type="button" onClick={() => onAdd('box')}><Plus size={15} /> Thêm ô văn bản</button></div>}
    <footer><Minus size={14} /> {publicView ? 'Chỉ những thành phần tác giả chọn công bố.' : 'Bản nháp chỉ ở thiết bị này, chưa công khai.'}</footer>
  </section>
}
