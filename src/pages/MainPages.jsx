import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Globe2, LockKeyhole, Search, UserPlus } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'
import { FeaturedCourse } from '../components/CommunityPreview'

function useLoad(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' })
  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try { setState({ data: await loader(), loading: false, error: '' }) } catch (error) { setState({ data: null, loading: false, error: error.message }) }
  }, dependencies)
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}

function Avatar({ profile, className = 'avatar-md' }) {
  const source = publicStorageUrl('avatars', profile?.avatar_path)
  return source ? <img className={`avatar ${className}`} src={source} alt="" /> : <span className={`avatar avatar-fallback ${className}`}>{(profile?.display_name || profile?.username || 'M').slice(0, 1).toUpperCase()}</span>
}

function Visibility({ value }) {
  const labels = { private: 'Riêng tư', unlisted: 'Không công khai', public: 'Công khai', showcase: 'Showcase' }
  return <span className={`visibility visibility-${value}`}>{value === 'private' ? <LockKeyhole /> : <Globe2 />}{labels[value] || value}</span>
}

export function WorldsPage({ archiveOnly = false }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', world_type: 'story', genre: '', language: 'Vietnamese', visibility: 'private', status: 'draft' })
  const worlds = useLoad(async () => { const { data, error } = await supabase.from('worlds').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }); if (error) throw error; return data || [] }, [user.id])
  async function create(event) { event.preventDefault(); setBusy(true); const { error } = await supabase.from('worlds').insert({ ...form, owner_id: user.id }); setBusy(false); if (!error) { setOpen(false); setForm({ ...form, name: '', description: '' }); worlds.reload() } }
  return <div className="content-page"><section className="worlds-hero glass-card"><div><span className="eyebrow"><span /> LƯU TRỮ CŨ</span><h1>Nội dung Thế giới đã tạo</h1><p>Đây là dữ liệu có trước khi Mora đưa nhân vật, lore và vùng đất vào cùng một dự án. Bản gốc vẫn được giữ; quay lại Dự án của tôi để sao chép sang không gian chung.</p><Link className="secondary-button demo-hero-link" to="/studio/projects">← Dự án của tôi</Link></div><div className="world-orb"><Globe2 /></div></section><div className="toolbar"><div className="filter-pills"><button className="active">Tất cả</button></div></div>{worlds.loading ? <LoadingState /> : worlds.error ? <ErrorState message={worlds.error} retry={worlds.reload} /> : !worlds.data.length ? <EmptyState title="Không có dữ liệu Thế giới cũ" description="Từ nay bạn có thể tạo mọi nội dung mới ngay trong Dự án của tôi." action={<Link className="primary-button" to="/studio/projects">Tạo dự án</Link>} /> : <div className="world-grid">{worlds.data.map((world) => <article className="world-card glass-card" key={world.id}><div className="world-card-cover">{world.cover_path ? <img src={publicStorageUrl('covers', world.cover_path)} alt="" /> : <Globe2 />}</div><div className="world-card-body"><Visibility value={world.visibility} /><h2>{world.name}</h2><p>{world.description || 'Chưa có mô tả.'}</p><small>{world.world_type === 'game' ? 'Game World' : 'Story World'} · {world.genre || 'Chưa chọn thể loại'}</small></div></article>)}</div>}
    {open && !archiveOnly && <div className="modal-layer"><button className="scrim" onClick={() => setOpen(false)} /><form className="modal glass-card" onSubmit={create}><header><div><span className="eyebrow purple"><span /> NEW WORLD</span><h2>Tạo thế giới</h2><p>Thế giới mới được lưu riêng tư cho đến khi bạn chủ động công khai.</p></div></header><div className="field-grid modal-form"><label>Tên thế giới<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Loại<select value={form.world_type} onChange={(event) => setForm({ ...form, world_type: event.target.value })}><option value="story">Story World</option><option value="game">Game World</option></select></label><label>Thể loại<input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} /></label><label>Ngôn ngữ<select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option>Vietnamese</option><option>English</option><option>Bilingual</option><option>Other</option></select></label><label className="span-2">Mô tả<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><footer className="modal-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo thế giới'}</button></footer></form></div>}
  </div>
}

export function LearnPage() {
  const courses = useLoad(async () => { const { data, error } = await supabase.from('courses').select('*, creator:profiles!courses_creator_id_fkey(username,display_name), course_lessons(id)').eq('status', 'published').eq('visibility', 'public').order('published_at', { ascending: false }); if (error) throw error; return data || [] }, [])
  return <div className="content-page"><section className="learn-hero glass-card"><div><span className="eyebrow"><span /> MORA LEARN</span><h1>Học cách xây dựng<br />những thế giới đáng nhớ.</h1><p>Hướng dẫn thực hành về worldbuilding, nhân vật, game design và AI có trách nhiệm.</p><Link className="secondary-button demo-hero-link" to="/community#community-learn">Khóa học của Mabi ↗</Link></div><BookOpen className="learn-illustration" /></section><section className="section-block"><FeaturedCourse /><div className="section-title"><h2>Khóa học cộng đồng</h2><p>Tất cả khóa học hiện miễn phí.</p></div>{courses.loading ? <LoadingState /> : courses.error ? <ErrorState message={courses.error} retry={courses.reload} /> : !courses.data.length ? <EmptyState title="Chưa có khóa học được duyệt" description="Khóa học sẽ xuất hiện sau khi Course Creator gửi và quản trị viên duyệt." /> : <div className="course-grid">{courses.data.map((course) => <article className="course-card glass-card" key={course.id}>{course.cover_path && <img src={publicStorageUrl('course-media', course.cover_path)} alt="" />}<div className="course-body"><span>{course.topic}</span><h3>{course.title}</h3><p>{course.description}</p><small>{course.course_lessons?.length || 0} bài · {course.creator?.display_name || course.creator?.username}</small></div></article>)}</div>}</section></div>
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const portfolio = useLoad(async () => {
    const [projects, courses, posts, followers, friends] = await Promise.all([
      supabase.from('projects').select('*').eq('owner_id', user.id).in('visibility', ['public', 'showcase']).eq('status', 'published'),
      supabase.from('courses').select('id').eq('creator_id', user.id).eq('status', 'published').eq('visibility', 'public'),
      supabase.from('posts').select('*').eq('user_id', user.id).eq('status', 'published').in('visibility', ['public', 'showcase']),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ])
    const failed = [projects, courses, posts, followers, friends].find((result) => result.error)
    if (failed) throw failed.error
    return { projects: projects.data || [], courses: courses.data || [], posts: posts.data || [], followers: followers.count || 0, friends: friends.count || 0 }
  }, [user.id])
  const cover = publicStorageUrl('covers', profile?.cover_path)
  return <div className="content-page">{portfolio.loading ? <LoadingState /> : portfolio.error ? <ErrorState message={portfolio.error} retry={portfolio.reload} /> : <><section className="profile-head glass-card"><div className="profile-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined} /><div className="profile-main"><Avatar profile={profile} className="avatar-xxl" /><div className="profile-identity"><div><h1>{profile.display_name || profile.username}</h1><p>@{profile.username}</p></div></div><p className="profile-bio">{profile.bio || 'Chưa có giới thiệu.'}</p><div className="profile-roles">{profile.roles?.map((role) => <span key={role}>{role}</span>)}</div><div className="profile-stats"><button><strong>{portfolio.data.followers}</strong><small>Người theo dõi</small></button><span /><button><strong>{portfolio.data.friends}</strong><small>Bạn bè</small></button><span /><button><strong>{portfolio.data.projects.length}</strong><small>Dự án</small></button></div></div></section><div className="section-title profile-project-heading"><h2>Dự án</h2></div><section className="profile-layout"><main>{!portfolio.data.projects.length ? <EmptyState title="Chưa có dự án công khai" description="Xuất bản project showcase từ Mora Studio để đưa vào portfolio." /> : <div className="profile-projects">{portfolio.data.projects.map((project) => <Link to={`/projects/${project.id}`} key={project.id} style={project.cover_path ? { backgroundImage: `linear-gradient(transparent, rgba(15,12,35,.75)), url(${publicStorageUrl('project-media', project.cover_path)})` } : undefined}><span>{project.project_type}</span><h2>{project.name}</h2><p>{project.summary}</p></Link>)}</div>}</main><aside><section className="profile-side glass-card"><h3>Khóa học đã đăng</h3><strong>{portfolio.data.courses.length}</strong></section><section className="profile-side glass-card"><h3>Bài viết</h3><strong>{portfolio.data.posts.length}</strong></section></aside></section></>}</div>
}

export function SearchPage() {
  const { user } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function search(event) { event.preventDefault(); const safeQuery = query.trim().replace(/[%_,().]/g, ''); if (safeQuery.length < 2) return; setBusy(true); const { data } = await supabase.from('profiles').select('id,username,display_name,bio,roles,avatar_path').neq('id', user.id).or(`username.ilike.%${safeQuery}%,display_name.ilike.%${safeQuery}%`).limit(20); setResults(data || []); setBusy(false) }
  async function connect(personId) { setMessage(''); const { error } = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: personId }); setMessage(error ? error.message : 'Đã gửi lời mời kết bạn.') }
  return <div className="content-page"><section className="page-hero simple"><div><span className="eyebrow purple"><span /> SEARCH</span><h1>Tìm kiếm</h1><p>Tìm người sáng tạo bằng tên hoặc username.</p></div></section><form className="search-page glass-card" onSubmit={search}><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nhập ít nhất 2 ký tự" /><button className="primary-button">Tìm</button></form>{message && <p className="form-message">{message}</p>}{busy ? <LoadingState /> : results.map((person) => <article className="friend-row glass-card" key={person.id}><Avatar profile={person} /><div><strong>{person.display_name || person.username}</strong><small>@{person.username} · {person.roles?.join(' · ')}</small></div><button className="secondary-button" onClick={() => connect(person.id)}><UserPlus /> Kết nối</button></article>)}</div>
}

export function ForbiddenPage() {
  return <div className="admin-gate"><header><Brand /></header><section className="glass-card"><span className="gate-icon"><LockKeyhole /></span><small>HTTP 403</small><h1>Không có quyền truy cập</h1><p>Tài khoản của bạn không có vai trò hoặc quyền cần thiết để truy cập khu vực này.</p><Link className="primary-button" to="/feed">Quay về Mora</Link></section></div>
}
