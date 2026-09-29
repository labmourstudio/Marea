import { useCallback, useEffect, useState } from 'react'
import { BriefcaseBusiness, Globe2, LockKeyhole, Plus, Upload } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listLocalProjects, putLocalProject } from '../lib/localProjects'
import { worldToLocalProject } from '../lib/legacyWorlds'
import { projectWorkflow, isGameProject } from '../lib/projectWorkflows'
import { supabase } from '../lib/supabase'
import { EmptyState, LoadingState } from '../components/StateView'

const projectTypes = ['Novel', 'Comic', 'Visual Novel', 'Game', 'RPG', 'Game Event', 'Animation']

export default function LocalProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null)
  const [worlds, setWorlds] = useState([])
  const [worldError, setWorldError] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('Novel')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const items = await listLocalProjects()
      setProjects(items.filter((item) => item.owner_id === user.id).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')))
    } catch (caught) { setError(`Không mở được bản nháp trên thiết bị này: ${caught.message}`); setProjects([]) }
  }, [user.id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    let active = true
    supabase.from('worlds').select('id,name,description,world_type,genre,language,reference_images').eq('owner_id', user.id).order('updated_at', { ascending: false }).then(({ data, error: fetchError }) => {
      if (!active) return
      if (fetchError) setWorldError(fetchError.message)
      else setWorlds(data || [])
    })
    return () => { active = false }
  }, [user.id])

  async function copyWorld(world) {
    setBusy(true); setError('')
    try {
      const tables = [['characters','characters'],['locations','locations'],['factions','factions'],['items','items'],['world_events','events']]
      const results = await Promise.all(tables.map(([table]) => supabase.from(table).select('*').eq('world_id', world.id).eq('owner_id', user.id)))
      const failed = results.find((result) => result.error)
      if (failed) throw failed.error
      const related = Object.fromEntries(tables.map(([,key], index) => [key, results[index].data || []]))
      const draft = worldToLocalProject(world, related, user.id)
      await putLocalProject(draft)
      navigate(`/studio/projects/${draft.id}`)
    } catch (caught) { setError(`Không thể sao chép thế giới: ${caught.message}`); setBusy(false) }
  }

  async function create(event) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true); setError('')
    try {
      const id = `local-${crypto.randomUUID()}`
      await putLocalProject({ id, local: true, owner_id: user.id, name: name.trim(), project_type: type, summary: '', description: '', stage: 'Idea', language: 'Vietnamese', visibility: 'private', status: 'draft', looking_for: [], contact_open: false, allow_copy: true, allow_export: false, sections: [], nodes: [], links: [], events: [], updated_at: new Date().toISOString() })
      navigate(`/studio/projects/${id}`)
    } catch (caught) { setError(caught.message); setBusy(false) }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('Bản sao lưu phải nhỏ hơn 30 MB.')
      const backup = JSON.parse(await file.text())
      if (backup.owner_id !== user.id || typeof backup.name !== 'string' || !['sections', 'nodes', 'links', 'events'].every((key) => Array.isArray(backup[key]))) throw new Error('Bản sao lưu không thuộc tài khoản đang đăng nhập hoặc bị thiếu dữ liệu.')
      const id = `local-${crypto.randomUUID()}`
      await putLocalProject({ ...backup, id, local: true, status: 'draft', visibility: 'private', pending_cloud_id: undefined, updated_at: new Date().toISOString() })
      navigate(`/studio/projects/${id}`)
    } catch (caught) { setError(caught.message) }
    event.target.value = ''
  }

  return <div className="content-page project-workspace">
    <Link className="project-back" to="/studio">← Không gian của tôi</Link>
    <section className="page-hero simple"><div><span className="eyebrow purple"><span /> MORA STUDIO</span><h1>Dự án của tôi</h1><p>Mỗi dự án có thể chứa cốt truyện, nhân vật, vùng đất và sự kiện trong cùng một nơi. Bản nháp lưu trên thiết bị; khu Khám phá chỉ hiện dự án chủ sở hữu đã công bố.</p></div><Link className="secondary-button" to="/community#community-project">Xem nhóm Morimori ↗</Link></section>
    <form className="glass-card project-create" onSubmit={create}><h2>Tạo dự án của bạn</h2><p>Chọn cách làm việc. Nội dung game, truyện và sự kiện có cấu trúc riêng; không có mục Thế giới bắt buộc tách ra.</p><div className="project-workflow-choices"><button type="button" className={!isGameProject(type) ? 'active' : ''} aria-pressed={!isGameProject(type)} onClick={() => setType('Novel')}><strong>Truyện</strong><small>Lore · cốt truyện · nhân vật · địa điểm</small></button><button type="button" className={isGameProject(type) && type !== 'Game Event' ? 'active' : ''} aria-pressed={isGameProject(type) && type !== 'Game Event'} onClick={() => setType('Game')}><strong>Game Design</strong><small>Tướng · vật phẩm · tiền tệ · dòng skin</small></button><button type="button" className={type === 'Game Event' ? 'active' : ''} aria-pressed={type === 'Game Event'} onClick={() => setType('Game Event')}><strong>Sự kiện Game</strong><small>Gắn tướng và tiền tệ từ game gốc trên thiết bị</small></button></div><p className="workflow-description">{projectWorkflow(type).description}</p><div className="project-create-row"><input aria-label="Tên dự án" maxLength="120" required placeholder={type === 'Game Event' ? 'Tên sự kiện của bạn' : 'Tên dự án của bạn'} value={name} onChange={(event) => setName(event.target.value)} /><select aria-label="Định dạng dự án" value={type} onChange={(event) => setType(event.target.value)}>{projectTypes.map((item) => <option key={item}>{item}</option>)}</select><button className="primary-button" disabled={busy}><Plus size={17} /> {busy ? 'Đang tạo…' : 'Bắt đầu xây dựng'}</button></div><small className="privacy-note">Bản nháp tự lưu trong trình duyệt này; tải bản sao lưu trước khi đổi thiết bị. Người khác chưa mở được bằng liên kết.</small></form>
    <section className="section-block"><div className="section-title"><div><h2>Bản nháp của bạn</h2><p>Chỉ lưu trên thiết bị này · chưa công khai</p></div></div><label className="secondary-button backup-import"><Upload size={16} /> Nhập bản sao lưu JSON<input type="file" accept=".json,application/json" onChange={importBackup} hidden /></label>{error && <p role="alert" className="form-message error">{error}</p>}{projects === null ? <LoadingState /> : projects.length ? <div className="project-grid">{projects.map((item) => <Link className="glass-card local-project-poster" to={`/studio/projects/${item.id}`} key={item.id}><span className="local-project-cover">{item.cover_data ? <img src={item.cover_data} alt={`Bìa ${item.name}`} loading="lazy" /> : <span aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>}</span><span className="local-project-details"><small><LockKeyhole size={13} /> CHỈ TRÊN MÁY · {item.project_type}</small><strong>{item.name}</strong><span>Chỉnh sửa bản nháp <span aria-hidden="true">↗</span></span></span></Link>)}</div> : <EmptyState title="Chưa có bản nháp trên thiết bị này" description="Tạo dự án để bắt đầu xây dựng nhân vật, vùng đất và nội dung của riêng bạn." />}</section>
    {worldError && <p role="alert" className="form-message error">Không mở được dữ liệu Thế giới cũ: {worldError}</p>}
    {!!worlds.length && <section className="section-block"><div className="section-title"><div><h2>Nội dung Thế giới đã tạo trước đây</h2><p>Sao chép vào Dự án của tôi. Dữ liệu gốc vẫn ở Supabase; ảnh cũ cần chọn và gắn lại để không vô tình tải nội dung riêng tư lên bản công khai.</p></div><Link className="secondary-button" to="/studio/legacy-worlds">Xem lưu trữ cũ</Link></div><div className="project-grid">{worlds.map((world) => { const copied = projects?.some((item) => item.source_world_id === world.id); return <article className="project-card glass-card project-list-card" key={world.id}><Globe2 /><h3>{world.name}</h3><p>{world.world_type === 'game' ? 'Game' : 'Truyện'} · Dữ liệu Thế giới cũ</p><button className="secondary-button" type="button" disabled={busy || copied} onClick={() => copyWorld(world)}>{copied ? 'Đã sao chép trên máy' : 'Sao chép thành dự án'}</button></article> })}</div></section>}
    <section className="glass-card project-panel"><BriefcaseBusiness color="var(--purple)" /><h2>Cộng tác và công khai</h2><p>Liên kết mời, đồng bộ và trang dự án công khai cần không gian lưu trữ riêng trên Supabase. Phần này sẽ được mở khi cơ sở dữ liệu Mora hoàn tất. Nội dung bạn tạo tại đây chưa được tự tải lên.</p></section>
  </div>
}

export function LocalProjectGuard({ children }) {
  const { projectId } = useParams()
  return projectId.startsWith('local-') ? children : <Navigate to="/studio/projects" replace />
}
