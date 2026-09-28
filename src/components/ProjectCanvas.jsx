import { useState } from 'react'
import { Minus, Plus, ZoomIn, ZoomOut } from 'lucide-react'
import { isGameProject } from '../lib/projectWorkflows'

const storyCharacterFields = [
  ['origin', 'Nguồn gốc / chủng tộc'], ['home', 'Nơi sống'], ['role', 'Vai trò trong truyện'],
  ['personality', 'Tính cách'], ['goal', 'Mục tiêu'], ['appearance', 'Ngoại hình'], ['relationships', 'Quan hệ'],
]
const gameCharacterFields = [
  ['origin', 'Nguồn gốc / phe phái'], ['role', 'Vai trò trong game'], ['position', 'Vị trí'],
  ['playstyle', 'Phong cách chơi'], ['appearance', 'Thiết kế ngoại hình'], ['relationships', 'Quan hệ'],
]
const storyLandFields = [['description', 'Mô tả'], ['history', 'Lịch sử'], ['story', 'Liên hệ cốt truyện']]
const gameLandFields = [['description', 'Mô tả'], ['biome', 'Địa hình / môi trường'], ['gameplay', 'Vai trò trong gameplay'], ['story', 'Liên hệ cốt truyện']]

export default function ProjectCanvas({ kind, projectType, nodes, links, onChange, onRemoveNode, imageUrl, onUpload, readOnly = false }) {
  const [zoom, setZoom] = useState(0.75)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(null)
  const [connecting, setConnecting] = useState(null)
  const [selected, setSelected] = useState(null)
  const [linkLabel, setLinkLabel] = useState('')
  const [linkDetail, setLinkDetail] = useState('')
  const visibleNodes = nodes.filter((node) => node.canvas_kind === kind)
  const visibleLinks = links.filter((link) => link.canvas_kind === kind)
  const current = visibleNodes.find((node) => node.id === selected)
  const suggestedFields = kind === 'land'
    ? (isGameProject(projectType) ? gameLandFields : storyLandFields)
    : (isGameProject(projectType) ? gameCharacterFields : storyCharacterFields)

  function addNode() {
    if (readOnly) return
    const node = { id: crypto.randomUUID(), canvas_kind: kind, title: kind === 'land' ? 'Vùng đất mới' : isGameProject(projectType) ? 'Tướng mới' : 'Nhân vật mới', details: {}, pos_x: 250 - offset.x / zoom, pos_y: 180 - offset.y / zoom }
    onChange([...nodes, node], links)
    setSelected(node.id)
  }
  function patchNode(patch) { if (!readOnly) onChange(nodes.map((node) => node.id === selected ? { ...node, ...patch } : node), links) }
  function pickNode(node) {
    if (!readOnly && connecting && connecting !== node.id) {
      const edge = { id: crypto.randomUUID(), canvas_kind: kind, source_id: connecting, target_id: node.id, label: linkLabel.trim(), detail: linkDetail.trim() }
      onChange(nodes, [...links, edge]); setConnecting(null); setLinkLabel(''); setLinkDetail('')
    } else setSelected(node.id)
  }
  function startDrag(event, node) {
    if (event.target.closest('button')) return
    if (readOnly) { pickNode(node); return }
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging({ type: 'node', id: node.id, x: event.clientX, y: event.clientY, startX: node.pos_x, startY: node.pos_y })
    pickNode(node)
  }
  function move(event) {
    if (!dragging) return
    const dx = event.clientX - dragging.x
    const dy = event.clientY - dragging.y
    if (dragging.type === 'pan') setOffset({ x: dragging.startX + dx, y: dragging.startY + dy })
    else onChange(nodes.map((node) => node.id === dragging.id ? { ...node, pos_x: dragging.startX + dx / zoom, pos_y: dragging.startY + dy / zoom } : node), links)
  }
  function wheel(event) { if (event.ctrlKey) { event.preventDefault(); setZoom((value) => Math.max(.35, Math.min(2, value + (event.deltaY < 0 ? .1 : -.1)))) } }
  function changeDetail(key, value) { patchNode({ details: { ...(current.details || {}), [key]: value } }) }

  return <div className="canvas-workspace">
    <div className="canvas-toolbar"><button type="button" className="primary-button small" onClick={addNode} disabled={readOnly}><Plus size={15} /> {kind === 'land' ? 'Thêm vùng đất' : isGameProject(projectType) ? 'Thêm tướng' : 'Thêm nhân vật'}</button><span>Kéo để sắp xếp · kéo nền để di chuyển · Ctrl + lăn để thu phóng</span><button type="button" onClick={() => setZoom((v) => Math.max(.35, v - .15))} aria-label="Thu nhỏ"><ZoomOut /></button><b>{Math.round(zoom * 100)}%</b><button type="button" onClick={() => setZoom((v) => Math.min(2, v + .15))} aria-label="Phóng to"><ZoomIn /></button></div>
    <div className="canvas-layout"><div className="canvas-viewport" onWheel={wheel} onPointerDown={(event) => { if (event.target === event.currentTarget) { event.currentTarget.setPointerCapture(event.pointerId); setDragging({ type: 'pan', x: event.clientX, y: event.clientY, startX: offset.x, startY: offset.y }) } }} onPointerMove={move} onPointerUp={() => setDragging(null)}>
      <div className="canvas-stage" style={{ transform: `translate(${offset.x}px,${offset.y}px) scale(${zoom})` }}>
        <svg width="1" height="1" className="canvas-lines" aria-hidden="true">{visibleLinks.map((edge) => { const a = visibleNodes.find((node) => node.id === edge.source_id); const b = visibleNodes.find((node) => node.id === edge.target_id); return a && b ? <g key={edge.id}><line x1={a.pos_x + 45} y1={a.pos_y + 45} x2={b.pos_x + 45} y2={b.pos_y + 45} stroke="#9688dc" strokeWidth="2" /><text x={(a.pos_x + b.pos_x) / 2 + 45} y={(a.pos_y + b.pos_y) / 2 + 36} textAnchor="middle">{edge.label}</text></g> : null })}</svg>
        {visibleNodes.map((node) => <div key={node.id} className={`canvas-node${selected === node.id ? ' selected' : ''}`} style={{ left: node.pos_x, top: node.pos_y }} onPointerDown={(event) => startDrag(event, node)} onPointerMove={move} onPointerUp={() => setDragging(null)}>
          <span className="canvas-node-photo">{imageUrl(node) ? <img src={imageUrl(node)} alt="" draggable="false" /> : kind === 'land' ? '◇' : '✦'}</span><span className="canvas-node-label">{node.title}</span><button type="button" className="canvas-node-connect" disabled={readOnly} onPointerDown={(event) => event.stopPropagation()} onClick={() => connecting ? pickNode(node) : (setConnecting(node.id), setSelected(node.id))} title="Tạo liên kết">{connecting === node.id ? '●' : '+'}</button>
        </div>)}
      </div>
    </div><aside className={`canvas-inspector glass-card${readOnly ? " readonly" : ""}`}>{current ? <><h3>{kind === 'land' ? 'Vùng đất' : 'Nhân vật'} · {isGameProject(projectType) ? 'Game Design' : 'Truyện'}</h3><label>Tên<input value={current.title} disabled={readOnly} onChange={(event) => patchNode({ title: event.target.value })} maxLength="160" /></label><label>Ảnh đại diện (PNG đã tách nền được hỗ trợ)<input type="file" disabled={readOnly} accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => onUpload(current.id, event.target.files?.[0])} /></label>{suggestedFields.map(([field, label]) => <label key={field}>{label}<textarea value={current.details?.[field] || ''} disabled={readOnly} onChange={(event) => changeDetail(field, event.target.value)} /></label>)}<label>Thông tin thêm (tùy chọn)<textarea value={current.details?.extra || ''} disabled={readOnly} onChange={(event) => changeDetail('extra', event.target.value)} /></label><button type="button" className="text-danger" disabled={readOnly} onClick={() => { onRemoveNode(current.id); setSelected(null) }}><Minus size={14} /> Xóa khỏi sơ đồ</button></> : <p>Chọn một vòng tròn để xem nội dung hoặc thêm nhân vật, vùng đất.</p>}
      {connecting && <div className="link-editor"><h3>Liên kết</h3><p>Chọn vòng tròn thứ hai để nối.</p><input placeholder="Loại quan hệ" value={linkLabel} onChange={(event) => setLinkLabel(event.target.value)} /><textarea placeholder="Chi tiết cốt truyện / địa lý" value={linkDetail} onChange={(event) => setLinkDetail(event.target.value)} /><button type="button" onClick={() => setConnecting(null)}>Hủy nối</button></div>}
      {!!visibleLinks.length && <div className="link-editor"><h3>Các liên kết</h3>{visibleLinks.map((edge) => <div key={edge.id} className="link-row"><span>{visibleNodes.find((n) => n.id === edge.source_id)?.title} ↔ {visibleNodes.find((n) => n.id === edge.target_id)?.title}<input aria-label="Loại quan hệ" value={edge.label} disabled={readOnly} onChange={(event) => onChange(nodes, links.map((link) => link.id === edge.id ? { ...link, label: event.target.value } : link))} /><textarea aria-label="Chi tiết liên kết" value={edge.detail} disabled={readOnly} onChange={(event) => onChange(nodes, links.map((link) => link.id === edge.id ? { ...link, detail: event.target.value } : link))} /></span><button type="button" disabled={readOnly} onClick={() => onChange(nodes, links.filter((link) => link.id !== edge.id))} aria-label="Xóa liên kết">×</button></div>)}</div>}
    </aside></div>
  </div>
}
