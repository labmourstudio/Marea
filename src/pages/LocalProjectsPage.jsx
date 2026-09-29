import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Clapperboard, Gamepad2, Globe2, LockKeyhole, Plus, Upload } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listLocalProjects, putLocalProject } from '../lib/localProjects'
import { worldToLocalProject } from '../lib/legacyWorlds'
import { isGameProject } from '../lib/projectWorkflows'
import { supabase } from '../lib/supabase'
import { EmptyState, LoadingState } from '../components/StateView'

const projectTypes = ['Novel', 'Comic', 'Visual Novel', 'Film', 'Animation', 'Game', 'RPG', 'Game Event']

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

  const modes = [
    { type: 'Novel', title: 'Truyện', detail: 'Lore · nhân vật', icon: BookOpen, selected: !isGameProject(type) && !['Film', 'Animation'].includes(type) },
    { type: 'Game', title: 'Game', detail: 'Tướng · cơ chế', icon: Gamepad2, selected: isGameProject(type) && type !== 'Game Event' },
    { type: 'Film', title: 'Phim ảnh', detail: 'Kịch bản · cảnh quay', icon: Clapperboard, selected: ['Film', 'Animation'].includes(type) },
    { type: 'Game Event', title: 'Sự kiện game', detail: 'Tướng · dòng skin', icon: Globe2, selected: type === 'Game Event' },
  ]

  return <div className="content-page project-workspace local-projects-page">
    <section className="mora-screen project-create-screen" aria-labelledby="create-project-title">
      <form className="glass-card project-create" onSubmit={create}>
        <header className="project-create-heading"><h1 id="create-project-title">Tạo dự án</h1><span><LockKeyhole size={15} /> Bản nháp trên thiết bị</span></header>
        <div className="project-workflow-choices" aria-label="Loại dự án">
          {modes.map(({ type: modeType, title, detail, icon: Icon, selected }) => <button key={modeType} type="button" className={selected ? 'active' : ''} aria-pressed={selected} onClick={() => setType(modeType)}><Icon size={25} strokeWidth={1.7} aria-hidden="true" /><strong>{title}</strong><small>{detail}</small></button>)}
        </div>
        <div className="project-create-row"><input aria-label="Tên dự án" maxLength="120" required placeholder="Tên dự án của bạn" value={name} onChange={(event) => setName(event.target.value)} /><select aria-label="Định dạng dự án" value={type} onChange={(event) => setType(event.target.value)}>{projectTypes.map((item) => <option key={item}>{item}</option>)}</select><button className="primary-button" disabled={busy}><Plus size={17} /> {busy ? 'Đang tạo…' : 'Tạo dự án'}</button></div>
        {error && <p role="alert" className="form-message error">{error}</p>}
      </form>
    </section>
    <section className="mora-screen project-library-screen" aria-labelledby="my-projects-title">
      <div className="project-library-heading"><h2 id="my-projects-title">Dự án của tôi</h2><label className="secondary-button backup-import"><Upload size={16} /> Nhập bản sao lưu<input type="file" accept=".json,application/json" onChange={importBackup} hidden /></label></div>
      {projects === null ? <LoadingState /> : projects.length ? <div className="project-grid">{projects.map((item) => <Link className="glass-card local-project-poster" to={`/studio/projects/${item.id}`} key={item.id}><span className="local-project-cover">{item.cover_data ? <img src={item.cover_data} alt={`Bìa ${item.name}`} loading="lazy" /> : <span aria-hidden="true">{item.name.slice(0, 1).toUpperCase()}</span>}</span><span className="local-project-details"><small><LockKeyhole size={13} /> CHỈ TRÊN MÁY · {item.project_type}</small><strong>{item.name}</strong><span>Chỉnh sửa ↗</span></span></Link>)}</div> : <EmptyState title="Chưa có dự án" description="Tạo dự án ở khung phía trên để bắt đầu." />}
    </section>
    {worldError && <p role="alert" className="form-message error">Không mở được dữ liệu Thế giới cũ: {worldError}</p>}
    {!!worlds.length && <section className="mora-screen project-archive-screen" aria-labelledby="archive-title"><div className="project-library-heading"><h2 id="archive-title">Thế giới đã tạo trước đây</h2><Link className="secondary-button" to="/studio/legacy-worlds">Xem lưu trữ cũ</Link></div><div className="project-grid">{worlds.map((world) => { const copied = projects?.some((item) => item.source_world_id === world.id); return <article className="project-card glass-card project-list-card" key={world.id}><Globe2 /><h3>{world.name}</h3><p>{world.world_type === 'game' ? 'Game' : 'Truyện'}</p><button className="secondary-button" type="button" disabled={busy || copied} onClick={() => copyWorld(world)}>{copied ? 'Đã sao chép' : 'Sao chép vào dự án'}</button></article> })}</div></section>}
  </div>
}

export function LocalProjectGuard({ children }) {
  const { projectId } = useParams()
  return projectId.startsWith('local-') ? children : <Navigate to="/studio/projects" replace />
}
