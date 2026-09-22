import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, BriefcaseBusiness, Check, ChevronRight, Eye, FileText, Globe2, Image as ImageIcon, LayoutDashboard, Palette, Settings, ShieldCheck, Trash2, Upload, UserRound, UsersRound } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import Brand from '../components/Brand'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase, uploadOwnedImage } from '../lib/supabase'

const characterStoryFields = ['age', 'gender', 'appearance', 'personality', 'goal', 'fear', 'weakness', 'backstory', 'relationships', 'story_role', 'arc', 'secrets', 'signature_quote', 'palette']
const characterGameFields = ['title', 'region', 'faction', 'role', 'game_position', 'difficulty', 'playstyle', 'base_stats', 'passive', 'skill_1', 'skill_2', 'skill_3', 'ultimate', 'weapon', 'silhouette', 'outfit', 'colors', 'strengths', 'weaknesses', 'balance_notes']

function useDashboard(userId) {
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true }))
    const resources = ['worlds', 'characters', 'projects', 'courses', 'posts']
    const ownerColumns = ['owner_id', 'owner_id', 'owner_id', 'creator_id', 'user_id']
    const results = await Promise.all(resources.map((table, index) => supabase.from(table).select('*', { count: 'exact', head: true }).eq(ownerColumns[index], userId)))
    const failed = results.find((result) => result.error)
    if (failed) setState({ loading: false, error: failed.error.message, data: null })
    else setState({ loading: false, error: '', data: Object.fromEntries(resources.map((name, index) => [name, results[index].count || 0])) })
  }, [userId])
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

export function StudioPage() {
  const { user } = useAuth()
  const dashboard = useDashboard(user.id)
  const [modal, setModal] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [worlds, setWorlds] = useState([])
  const [contentItems, setContentItems] = useState([])
  const [contentLoading, setContentLoading] = useState(true)
  const [characterType, setCharacterType] = useState('story')
  const [form, setForm] = useState({})
  const fileInput = useRef(null)

  const loadContent = useCallback(async () => {
    setContentLoading(true)
    const definitions = [
      ['worlds', 'owner_id', 'world', 'id,name,visibility,status,updated_at'],
      ['characters', 'owner_id', 'character', 'id,name,visibility,updated_at'],
      ['projects', 'owner_id', 'project', 'id,name,visibility,status,updated_at'],
      ['courses', 'creator_id', 'course', 'id,title,visibility,status,updated_at'],
      ['posts', 'user_id', 'post', 'id,content,visibility,status,updated_at'],
    ]
    const results = await Promise.all(definitions.map(([table, owner]) => supabase.from(table).select(definitions.find((item) => item[0] === table)[3]).eq(owner, user.id).order('updated_at', { ascending: false }).limit(20)))
    const items = results.flatMap((result, index) => (result.data || []).map((item) => ({ ...item, table: definitions[index][0], kind: definitions[index][2], label: item.name || item.title || `${item.content?.slice(0, 60)}${item.content?.length > 60 ? '…' : ''}` })))
    setContentItems(items.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)))
    setContentLoading(false)
  }, [user.id])
  useEffect(() => { supabase.from('worlds').select('id,name,world_type').eq('owner_id', user.id).order('name').then(({ data }) => setWorlds(data || [])); loadContent() }, [loadContent, user.id])
  function open(type) { setModal(type); setForm({}); setError('') }

  async function save(event) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      let result
      if (modal === 'character') {
        const fieldNames = characterType === 'story' ? characterStoryFields : characterGameFields
        const details = Object.fromEntries(fieldNames.filter((field) => form[field]).map((field) => [field, form[field]]))
        result = await supabase.from('characters').insert({ owner_id: user.id, world_id: form.world_id || null, character_type: characterType, name: form.name, visibility: 'private', details })
      } else if (modal === 'project') {
        result = await supabase.from('projects').insert({ owner_id: user.id, name: form.name, summary: form.summary || null, description: form.description || null, project_type: form.project_type || 'Game', stage: form.stage || 'Idea', language: form.language || 'Vietnamese', looking_for: form.looking_for ? [form.looking_for] : [], visibility: 'private', status: 'draft', cover_path: form.cover_path || null })
      } else if (modal === 'course') {
        result = await supabase.from('courses').insert({ creator_id: user.id, title: form.title, description: form.description || null, topic: form.topic || null, language: form.language || 'Vietnamese', visibility: 'private', status: 'draft' })
      } else if (modal === 'post') {
        result = await supabase.from('posts').insert({ user_id: user.id, content: form.content, language: form.language || 'Vietnamese', content_type: 'article', visibility: 'private', status: 'draft' })
      }
      if (result?.error) throw result.error
      setModal(''); setForm({}); dashboard.reload(); loadContent()
    } catch (saveError) { setError(saveError.message) } finally { setBusy(false) }
  }

  async function uploadCover(file) {
    if (!file) return
    setBusy(true)
    try { setForm((current) => ({ ...current, cover_path: null })); const path = await uploadOwnedImage('project-media', user.id, file); setForm((current) => ({ ...current, cover_path: path })) } catch (uploadError) { setError(uploadError.message) } finally { setBusy(false) }
  }

  async function publishItem(item) {
    setError('')
    const now = new Date().toISOString()
    let changes
    if (item.kind === 'course') changes = { status: 'pending_review' }
    else if (item.kind === 'project') changes = { status: 'published', visibility: 'showcase', published_at: now }
    else if (item.kind === 'post') changes = { status: 'published', visibility: 'public', published_at: now }
    else changes = { visibility: 'public' }
    const { error: updateError } = await supabase.from(item.table).update(changes).eq('id', item.id)
    if (updateError) setError(updateError.message); else loadContent()
  }

  async function deleteItem(item) {
    if (!window.confirm(`Xóa vĩnh viễn “${item.label}”? Hành động này không thể hoàn tác.`)) return
    const { error: deleteError } = await supabase.from(item.table).delete().eq('id', item.id)
    if (deleteError) setError(deleteError.message); else { dashboard.reload(); loadContent() }
  }

  const metrics = dashboard.data ? [
    ['Thế giới', dashboard.data.worlds, Globe2], ['Nhân vật', dashboard.data.characters, UserRound], ['Dự án', dashboard.data.projects, BriefcaseBusiness], ['Khóa học', dashboard.data.courses, BookOpen],
  ] : []
  return <div className="content-page"><section className="page-hero simple"><div><span className="eyebrow purple"><span /> CREATOR WORKSPACE</span><h1>Marea Studio</h1><p>Quản lý nội dung thuộc tài khoản của bạn. Bản nháp và nội dung riêng tư không xuất hiện trên Feed hoặc tìm kiếm.</p></div></section>{dashboard.loading ? <LoadingState /> : dashboard.error ? <ErrorState message={dashboard.error} retry={dashboard.reload} /> : <><div className="studio-metrics">{metrics.map(([label, count, Icon]) => <article className="glass-card" key={label}><span><Icon /></span><div><strong>{count}</strong><small>{label}</small></div></article>)}</div><section className="studio-grid"><div className="studio-main glass-card"><div className="section-title"><h2>Nội dung của bạn</h2><p>Đọc, xuất bản hoặc xóa nội dung do chính bạn sở hữu.</p></div>{contentLoading ? <LoadingState label="Đang tải nội dung…" /> : !contentItems.length ? <div className="studio-empty"><FileText /><p>Chưa có nội dung. Chọn một hành động để bắt đầu.</p></div> : <div className="studio-content-list">{contentItems.map((item) => <article key={`${item.table}-${item.id}`}><span className="studio-kind">{item.kind}</span><div><strong>{item.label}</strong><small>{item.status || item.visibility} · {new Date(item.updated_at).toLocaleDateString('vi-VN')}</small></div><button title={item.kind === 'course' ? 'Gửi duyệt' : 'Công khai'} onClick={() => publishItem(item)}><Eye /></button><button className="danger" title="Xóa" onClick={() => deleteItem(item)}><Trash2 /></button></article>)}</div>}</div><aside className="studio-actions glass-card"><div className="section-title"><h2>Thao tác nhanh</h2></div><button onClick={() => open('character')}><span className="purple-bg"><UserRound /></span><div><strong>Tạo nhân vật</strong><small>Story hoặc Game Character</small></div><ChevronRight /></button><button onClick={() => open('project')}><span className="blue-bg"><BriefcaseBusiness /></span><div><strong>Tạo dự án</strong><small>Portfolio riêng tư</small></div><ChevronRight /></button><button onClick={() => open('post')}><span className="coral-bg"><FileText /></span><div><strong>Viết bản nháp</strong><small>Chưa xuất bản</small></div><ChevronRight /></button><button onClick={() => open('course')}><span className="purple-bg"><BookOpen /></span><div><strong>Tạo khóa học</strong><small>Gửi duyệt sau khi hoàn thiện</small></div><ChevronRight /></button></aside></section><section className="management-card glass-card"><div className="section-title"><h2>Quản lý</h2><p>Các module dùng chung chính sách sở hữu ở database.</p></div><div className="management-grid">{['Worlds', 'Characters', 'Projects', 'Courses', 'Posts', 'Privacy'].map((item) => <button key={item}><span><Settings /></span><div><strong>{item}</strong><small>Dữ liệu thật trong Studio</small></div><ChevronRight /></button>)}</div></section>{error && <p className="form-message error">{error}</p>}</>}
    {modal && <div className="modal-layer"><button className="scrim" onClick={() => setModal('')} /><form className="modal glass-card" onSubmit={save}><header><div><span className="eyebrow purple"><span /> MAREA STUDIO</span><h2>{modal === 'character' ? 'Tạo nhân vật' : modal === 'project' ? 'Tạo dự án' : modal === 'course' ? 'Tạo khóa học' : 'Viết bản nháp'}</h2><p>Nội dung chỉ thuộc tài khoản của bạn và chưa được công khai.</p></div></header>{modal === 'character' && <><div className="builder-switch"><button type="button" className={characterType === 'story' ? 'active' : ''} onClick={() => setCharacterType('story')}>Story Character</button><button type="button" className={characterType === 'game' ? 'active' : ''} onClick={() => setCharacterType('game')}>Game Character</button></div><div className="field-grid modal-form"><label>Tên<input value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Thế giới<select value={form.world_id || ''} onChange={(event) => setForm({ ...form, world_id: event.target.value })}><option value="">Chưa gắn với world</option>{worlds.map((world) => <option key={world.id} value={world.id}>{world.name}</option>)}</select></label>{(characterType === 'story' ? characterStoryFields : characterGameFields).map((field) => <label key={field} className={['backstory', 'relationships', 'base_stats', 'balance_notes'].includes(field) ? 'span-2' : ''}>{field.replaceAll('_', ' ')}<textarea value={form[field] || ''} onChange={(event) => setForm({ ...form, [field]: event.target.value })} /></label>)}</div></>}{modal === 'project' && <div className="field-grid modal-form"><label>Tên dự án<input value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Loại<select value={form.project_type || 'Game'} onChange={(event) => setForm({ ...form, project_type: event.target.value })}>{['Game', 'Novel', 'Comic', 'RPG', 'Animation', 'Visual Novel'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Giai đoạn<select value={form.stage || 'Idea'} onChange={(event) => setForm({ ...form, stage: event.target.value })}>{['Idea', 'Planning', 'In Development', 'Prototype', 'Completed'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Nhu cầu<select value={form.looking_for || ''} onChange={(event) => setForm({ ...form, looking_for: event.target.value })}><option value="">Không đánh dấu</option>{['Looking for Collaborators', 'Looking for Artists', 'Looking for Writers', 'Looking for Developers', 'Looking for Funding'].map((value) => <option key={value}>{value}</option>)}</select></label><label className="span-2">Mô tả ngắn<textarea value={form.summary || ''} onChange={(event) => setForm({ ...form, summary: event.target.value })} /></label><label className="span-2">Ảnh bìa<button type="button" className="upload-field" onClick={() => fileInput.current.click()}><Upload /> {form.cover_path ? 'Đã tải ảnh' : 'Chọn ảnh'}</button><input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => uploadCover(event.target.files[0])} /></label></div>}{modal === 'course' && <div className="field-grid modal-form"><label>Tiêu đề<input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></label><label>Chủ đề<input value={form.topic || ''} onChange={(event) => setForm({ ...form, topic: event.target.value })} /></label><label className="span-2">Mô tả<textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div>}{modal === 'post' && <div className="field-grid modal-form"><label className="span-2">Nội dung<textarea value={form.content || ''} onChange={(event) => setForm({ ...form, content: event.target.value })} required /></label></div>}{error && <p className="form-message error">{error}</p>}<footer className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal('')}>Hủy</button><button className="primary-button" disabled={busy}>{busy ? 'Đang lưu…' : 'Lưu riêng tư'}</button></footer></form></div>}
  </div>
}

function AdminLayout({ children }) {
  const { profile, signOut } = useAuth()
  const admin = ['owner', 'admin'].includes(profile.platform_role)
  return <div className="admin-shell"><aside className="admin-sidebar glass-panel"><Brand /><p>ADMIN CONSOLE</p><nav><NavLink to="/admin" end><LayoutDashboard /> Tổng quan</NavLink>{admin && <NavLink to="/admin/users"><UsersRound /> Tài khoản</NavLink>}<NavLink to="/admin/review"><ShieldCheck /> Duyệt nội dung</NavLink>{admin && <><NavLink to="/admin/settings/appearance"><Palette /> Giao diện</NavLink><NavLink to="/admin/audit"><FileText /> Nhật ký</NavLink></>}</nav><div className="admin-account"><strong>{profile.display_name || profile.username}</strong><small>{profile.platform_role}</small><button onClick={signOut}>Đăng xuất</button></div></aside><main className="admin-main">{children}</main></div>
}

export function AdminPage({ section = 'dashboard' }) {
  const { profile } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', data: [] })
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setState({ loading: true, error: '', data: [] })
    let result
    if (section === 'users') result = await supabase.from('profiles').select('id,username,display_name,platform_role,account_status,created_at').order('created_at', { ascending: false }).limit(100)
    else if (section === 'review') result = await supabase.from('courses').select('*, creator:profiles!courses_creator_id_fkey(username,display_name)').eq('status', 'pending_review').order('updated_at')
    else if (section === 'audit') result = await supabase.from('audit_logs').select('*, actor:profiles!audit_logs_actor_id_fkey(username,display_name)').order('created_at', { ascending: false }).limit(100)
    else {
      const [users, posts, projects, courses] = await Promise.all(['profiles', 'posts', 'projects', 'courses'].map((table) => supabase.from(table).select('*', { count: 'exact', head: true })))
      const error = [users, posts, projects, courses].find((item) => item.error)?.error
      result = error ? { error } : { data: [{ users: users.count || 0, posts: posts.count || 0, projects: projects.count || 0, courses: courses.count || 0 }] }
    }
    setState(result.error ? { loading: false, error: result.error.message, data: [] } : { loading: false, error: '', data: result.data || [] })
  }, [section])
  useEffect(() => { load() }, [load])

  async function userAction(userId, action, value) {
    setMessage('')
    const rpc = action === 'role' ? 'admin_set_user_role' : 'admin_set_account_status'
    const args = action === 'role' ? { target_user_id: userId, new_role: value } : { target_user_id: userId, new_status: value }
    const { error } = await supabase.rpc(rpc, args)
    if (error) setMessage(error.message); else { setMessage('Đã cập nhật và ghi vào nhật ký.'); load() }
  }
  async function reviewCourse(courseId, status) { const { error } = await supabase.rpc('admin_review_course', { target_course_id: courseId, review_status: status }); if (error) setMessage(error.message); else load() }

  return <AdminLayout><header className="admin-header"><div><span className="eyebrow purple"><span /> MAREA ADMIN</span><h1>{section === 'users' ? 'Quản lý tài khoản' : section === 'review' ? 'Duyệt nội dung' : section === 'audit' ? 'Nhật ký hoạt động' : 'Tổng quan nền tảng'}</h1></div><span className="admin-role"><ShieldCheck /> {profile.platform_role}</span></header>{message && <p className="form-message">{message}</p>}{state.loading ? <LoadingState /> : state.error ? <ErrorState message={state.error} retry={load} /> : section === 'dashboard' ? <div className="admin-metrics">{Object.entries(state.data[0] || {}).map(([label, count]) => <article className="glass-card" key={label}><strong>{count}</strong><span>{label}</span></article>)}</div> : !state.data.length ? <EmptyState title="Không có dữ liệu" description="Không có mục nào phù hợp với khu vực quản trị này." /> : <div className="admin-table glass-card"><table><thead><tr>{section === 'users' ? <><th>Người dùng</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></> : section === 'review' ? <><th>Khóa học</th><th>Tác giả</th><th>Thao tác</th></> : <><th>Thời gian</th><th>Người thực hiện</th><th>Hành động</th><th>Đối tượng</th></>}</tr></thead><tbody>{section === 'users' && state.data.map((item) => <tr key={item.id}><td><strong>{item.display_name || item.username}</strong><small>@{item.username}</small></td><td>{item.platform_role}</td><td>{item.account_status}</td><td><select value={item.platform_role} disabled={profile.platform_role !== 'owner'} onChange={(event) => userAction(item.id, 'role', event.target.value)}>{['member', 'course_creator', 'moderator', 'admin', 'owner'].map((role) => <option key={role}>{role}</option>)}</select><select value={item.account_status} onChange={(event) => userAction(item.id, 'status', event.target.value)}>{['active', 'limited', 'blocked', 'disabled'].map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}{section === 'review' && state.data.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.topic}</small></td><td>{item.creator?.display_name || item.creator?.username}</td><td><button className="primary-button small" onClick={() => reviewCourse(item.id, 'published')}><Check /> Duyệt</button><button className="secondary-button" onClick={() => reviewCourse(item.id, 'rejected')}>Từ chối</button></td></tr>)}{section === 'audit' && state.data.map((item) => <tr key={item.id}><td>{new Date(item.created_at).toLocaleString('vi-VN')}</td><td>{item.actor?.display_name || item.actor?.username || 'Hệ thống'}</td><td>{item.action}</td><td>{item.target_table} · {item.target_id}</td></tr>)}</tbody></table></div>}</AdminLayout>
}

export function AppearanceAdminPage() {
  const { user } = useAuth()
  const [settings, setSettings] = useState({ accent_color: '#7668ed', logo_path: '', favicon_path: '', font_family: 'Manrope', glass_opacity: 0.68 })
  const [busy, setBusy] = useState(true)
  const [message, setMessage] = useState('')
  const logoInput = useRef(null)
  const faviconInput = useRef(null)
  useEffect(() => { supabase.from('site_settings').select('key,value').in('key', Object.keys(settings)).then(({ data }) => { const next = { ...settings }; data?.forEach((item) => { next[item.key] = item.value }); setSettings(next); setBusy(false) }) }, [])
  async function uploadAsset(field, file) { if (!file) return; setBusy(true); try { const path = await uploadOwnedImage('site-assets', user.id, file); setSettings((current) => ({ ...current, [field]: path })) } catch (error) { setMessage(error.message) } finally { setBusy(false) } }
  async function save(event) { event.preventDefault(); setBusy(true); setMessage(''); const { error } = await supabase.rpc('admin_update_site_settings', { settings_payload: settings }); setBusy(false); setMessage(error ? error.message : 'Đã lưu giao diện và ghi nhật ký thay đổi.') }
  return <AdminLayout><header className="admin-header"><div><span className="eyebrow purple"><span /> BRAND SETTINGS</span><h1>Giao diện chung</h1></div></header>{busy ? <LoadingState /> : <form className="appearance-form glass-card" onSubmit={save}><div className="appearance-preview" style={{ '--preview-accent': settings.accent_color, opacity: settings.glass_opacity }}><Brand />{settings.logo_path && <img src={publicStorageUrl('site-assets', settings.logo_path)} alt="Logo tùy chỉnh" />}</div><div className="field-grid"><label>Màu nhấn<input type="color" value={settings.accent_color} onChange={(event) => setSettings({ ...settings, accent_color: event.target.value })} /></label><label>Font<select value={settings.font_family} onChange={(event) => setSettings({ ...settings, font_family: event.target.value })}><option>Manrope</option><option>Inter</option><option>Be Vietnam Pro</option></select></label><label>Độ trong suốt<input type="range" min="0.45" max="0.92" step="0.01" value={settings.glass_opacity} onChange={(event) => setSettings({ ...settings, glass_opacity: Number(event.target.value) })} /></label><label>Logo<button type="button" className="upload-field" onClick={() => logoInput.current.click()}><ImageIcon /> Tải logo</button><input ref={logoInput} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(event) => uploadAsset('logo_path', event.target.files[0])} /></label><label>Favicon<button type="button" className="upload-field" onClick={() => faviconInput.current.click()}><ImageIcon /> Tải favicon</button><input ref={faviconInput} type="file" accept="image/png,image/x-icon,image/svg+xml" hidden onChange={(event) => uploadAsset('favicon_path', event.target.files[0])} /></label></div>{message && <p className="form-message">{message}</p>}<button className="primary-button" disabled={busy}>Lưu thay đổi</button></form>}</AdminLayout>
}
