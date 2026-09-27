import { useCallback, useEffect, useState } from 'react'
import { BriefcaseBusiness, LockKeyhole, Plus, Upload } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listLocalProjects, putLocalProject } from '../lib/localProjects'
import { EmptyState, LoadingState } from '../components/StateView'

const projectTypes = ['Game', 'Novel', 'Comic', 'RPG', 'Animation', 'Visual Novel']

export default function LocalProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState(null)
  const [name, setName] = useState('')
  const [type, setType] = useState('Game')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const items = await listLocalProjects()
      setProjects(items.filter((item) => item.owner_id === user.id).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')))
    } catch (caught) { setError(`Không mở được bản nháp trên thiết bị này: ${caught.message}`); setProjects([]) }
  }, [user.id])
  useEffect(() => { load() }, [load])

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
    <section className="page-hero simple"><div><span className="eyebrow purple"><span /> MORA STUDIO</span><h1>Dự án cá nhân</h1><p>Tạo và chỉnh sửa câu chuyện, nhân vật, vùng đất, sự kiện trong bản nháp riêng. Đây là khu làm việc của bạn; khu Khám phá dự án chỉ hiển thị những dự án được chủ sở hữu công bố.</p></div></section>
    <form className="glass-card project-create" onSubmit={create}><h2>Tạo bản nháp dự án</h2><p>Bản này tự lưu trên trình duyệt đang dùng. Người khác chưa thể truy cập, kể cả khi có liên kết. Hãy tải bản sao lưu trước khi đổi thiết bị hoặc xóa dữ liệu trình duyệt.</p><div className="project-create-row"><input aria-label="Tên dự án" maxLength="120" required placeholder="Tên dự án" value={name} onChange={(event) => setName(event.target.value)} /><select aria-label="Loại dự án" value={type} onChange={(event) => setType(event.target.value)}>{projectTypes.map((item) => <option key={item}>{item}</option>)}</select><button className="primary-button" disabled={busy}><Plus size={17} /> {busy ? 'Đang tạo…' : 'Tạo trên thiết bị'}</button></div></form>
    <section className="section-block"><div className="section-title"><div><h2>Bản nháp của bạn</h2><p>Chỉ lưu trên thiết bị này · chưa công khai</p></div></div><label className="secondary-button backup-import"><Upload size={16} /> Nhập bản sao lưu JSON<input type="file" accept=".json,application/json" onChange={importBackup} hidden /></label>{error && <p role="alert" className="form-message error">{error}</p>}{projects === null ? <LoadingState /> : projects.length ? <div className="project-grid">{projects.map((item) => <Link className="project-card glass-card project-list-card" to={`/studio/projects/${item.id}`} key={item.id}><LockKeyhole /><h3>{item.name}</h3><p>{item.project_type} · Chỉnh sửa bản nháp</p><small>Lưu lần cuối: {item.updated_at ? new Date(item.updated_at).toLocaleString('vi-VN') : 'Chưa rõ'}</small></Link>)}</div> : <EmptyState title="Chưa có bản nháp trên thiết bị này" description="Tạo dự án để bắt đầu xây dựng nhân vật, vùng đất và nội dung của riêng bạn." />}</section>
    <section className="glass-card project-panel"><BriefcaseBusiness color="var(--purple)" /><h2>Cộng tác và công khai</h2><p>Liên kết mời, đồng bộ và trang dự án công khai cần không gian lưu trữ riêng trên Supabase. Phần này sẽ được mở khi cơ sở dữ liệu Mora hoàn tất. Nội dung bạn tạo tại đây chưa được tự tải lên.</p></section>
  </div>
}

export function LocalProjectGuard({ children }) {
  const { projectId } = useParams()
  return projectId.startsWith('local-') ? children : <Navigate to="/studio/projects" replace />
}
