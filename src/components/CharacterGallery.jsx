import { ArrowLeft, ArrowRight, ImagePlus, Link2, Plus, Trash2 } from 'lucide-react'
import ProjectCanvas from './ProjectCanvas'
import { isGameProject } from '../lib/projectWorkflows'

const storyFields = [
  ['origin', 'Nguồn gốc / chủng tộc'], ['home', 'Nơi sống'], ['role', 'Vai trò trong truyện'],
  ['appearance', 'Ngoại hình'], ['personality', 'Tính cách'], ['goal', 'Mục tiêu'],
  ['relationships', 'Mối quan hệ'], ['backstory', 'Quá khứ / hành trình'], ['extra', 'Ghi chú thêm'],
]
const gameFields = [
  ['origin', 'Nguồn gốc'], ['faction', 'Phe phái'], ['role', 'Vai trò'], ['position', 'Vị trí'],
  ['playstyle', 'Phong cách chơi'], ['appearance', 'Ngoại hình'], ['skills', 'Kỹ năng'],
  ['relationships', 'Mối quan hệ'], ['backstory', 'Câu chuyện'], ['extra', 'Ghi chú thêm'],
]

export default function CharacterGallery({ projectType, nodes, links, view, selectedId, onView, onSelect, onAdd, onChange, onRemoveNode, onUploadAvatar, onUploadFlashart, imageUrl, flashartUrl, readOnly = false }) {
  const game = isGameProject(projectType)
  const characters = nodes.filter((node) => node.canvas_kind === 'character')
  const current = characters.find((node) => node.id === selectedId)
  const currentIndex = characters.findIndex((node) => node.id === selectedId)
  const patch = (node, detail) => { if (!readOnly) onChange(nodes.map((item) => item.id === node.id ? { ...item, ...detail } : item), links) }
  const patchDetail = (node, key, value) => patch(node, { details: { ...node.details, [key]: value } })
  const selectAt = (index) => onSelect(characters[(index + characters.length) % characters.length].id)

  if (view === 'canvas') return <div className="character-gallery"><header className="character-gallery-heading"><div><span className="eyebrow purple">SƠ ĐỒ QUAN HỆ</span><h2>{game ? 'Kết nối các tướng' : 'Mối quan hệ nhân vật'}</h2><p>Kéo các vòng tròn, bấm dấu + để nối và ghi tên quan hệ.</p></div><button className="secondary-button" type="button" onClick={() => onView('cards')}>← Danh sách {game ? 'tướng' : 'nhân vật'}</button></header><ProjectCanvas kind="character" projectType={projectType} nodes={nodes} links={links} onChange={onChange} onRemoveNode={onRemoveNode} onUpload={onUploadAvatar} imageUrl={imageUrl} readOnly={readOnly} /></div>

  if (view === 'detail' && current) {
    const art = flashartUrl?.(current) || current.details?.flashart_data || imageUrl(current)
    return <div className="character-gallery character-detail"><div className="character-detail-nav"><button type="button" onClick={() => onView('cards')}><ArrowLeft size={16} /> Danh sách {game ? 'tướng' : 'nhân vật'}</button><span>{currentIndex + 1} / {characters.length}</span></div>
      <div className="character-feature">
        <div className="character-feature-copy"><span>{game ? 'HỒ SƠ TƯỚNG' : 'HỒ SƠ NHÂN VẬT'}</span><h2>{current.title}</h2><p>{current.details?.quote || (game ? current.details?.role : current.details?.backstory) || 'Thêm lời giới thiệu cho nhân vật này.'}</p><div className="character-feature-tags">{[current.details?.role, current.details?.faction || current.details?.home, current.details?.position].filter(Boolean).map((value) => <span key={value}>{value}</span>)}</div></div>
        {art ? <img className="character-feature-art" src={art} alt={`Hình ${current.title}`} /> : <span className="character-feature-empty" aria-hidden="true">{current.title?.slice(0, 1)}</span>}
        {characters.length > 1 && <div className="character-feature-arrows"><button type="button" aria-label="Nhân vật trước" onClick={() => selectAt(currentIndex - 1)}><ArrowLeft /></button><button type="button" aria-label="Nhân vật tiếp theo" onClick={() => selectAt(currentIndex + 1)}><ArrowRight /></button></div>}
      </div>
      <div className="character-detail-fields"><section className="glass-card"><h3>Nhận diện</h3>{readOnly ? <><h4>{current.title}</h4>{current.details?.quote && <p>{current.details.quote}</p>}</> : <><label>Tên<input value={current.title} maxLength={160} onChange={(event) => patch(current, { title: event.target.value })} /></label><label>Câu giới thiệu / thoại đặc trưng<textarea value={current.details?.quote || ''} onChange={(event) => patchDetail(current, 'quote', event.target.value)} /></label><div className="character-image-picks"><label><ImagePlus size={16} /> Ảnh thẻ 3:4<input type="file" hidden disabled={readOnly} accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { if (event.target.files?.[0]) onUploadAvatar(current.id, event.target.files[0]); event.target.value = '' }} /></label><label><ImagePlus size={16} /> Flashart 16:9<input type="file" hidden disabled={readOnly} accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => { if (event.target.files?.[0]) onUploadFlashart(current.id, event.target.files[0]); event.target.value = '' }} /></label></div><small>Ảnh chỉ xuất hiện công khai khi chủ dự án chọn công bố.</small></>}</section>
      <section className="glass-card"><h3>{game ? 'Thiết kế tướng' : 'Xây dựng nhân vật'}</h3>{(game ? gameFields : storyFields).filter(([key]) => !readOnly || current.details?.[key]).map(([key, label]) => readOnly ? <div className="character-public-field" key={key}><strong>{label}</strong><p>{current.details[key]}</p></div> : <label key={key}>{label}<textarea aria-label={label} value={current.details?.[key] || ''} onChange={(event) => patchDetail(current, key, event.target.value)} /></label>)}{!readOnly && <button type="button" className="text-danger" onClick={() => { if (window.confirm('Xóa nhân vật và các đường liên kết của nhân vật này?')) { onRemoveNode(current.id); onView('cards') } }}><Trash2 size={14} /> Xóa {game ? 'tướng' : 'nhân vật'}</button>}</section></div>
    </div>
  }

  return <div className="character-gallery"><header className="character-gallery-heading"><div><span className="eyebrow purple">{game ? 'DANH SÁCH TƯỚNG' : 'DANH SÁCH NHÂN VẬT'}</span><h2>{game ? 'Tướng trong dự án' : 'Nhân vật trong truyện'}</h2><p>Thẻ ảnh dọc 3:4. Mở một thẻ để biên tập hồ sơ ngang 16:9, flashart và câu chuyện.</p></div><div><button type="button" className="secondary-button" onClick={() => onView('canvas')}><Link2 size={15} /> Sơ đồ quan hệ</button><button type="button" className="primary-button" disabled={readOnly} onClick={onAdd}><Plus size={15} /> Thêm {game ? 'tướng' : 'nhân vật'}</button></div></header>
    {!characters.length && <p className="inline-empty">Chưa có {game ? 'tướng' : 'nhân vật'} nào. Thêm một thẻ để bắt đầu xây dựng.</p>}
    <div className="character-poster-grid">{characters.map((node) => <button type="button" className="character-poster glass-card" key={node.id} onClick={() => { onSelect(node.id); onView('detail') }}><span className="character-poster-image">{imageUrl(node) ? <img src={imageUrl(node)} alt="" loading="lazy" /> : <span aria-hidden="true">{node.title?.slice(0, 1) || 'M'}</span>}</span><span className="character-poster-copy"><strong>{node.title}</strong><small>{node.details?.role || (game ? 'Chưa chọn vai trò' : 'Chưa đặt vai trò')}</small></span></button>)}</div>
  </div>
}
