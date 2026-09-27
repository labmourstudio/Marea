import { useCallback, useEffect, useRef, useState } from 'react'
import { BookOpen, Bookmark, Check, FileText, Globe2, Heart, Image as ImageIcon, LockKeyhole, MessageCircle, MoreHorizontal, Plus, Search, Send, Share2, UserPlus } from 'lucide-react'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase, uploadFeedMedia } from '../lib/supabase'
import { Link } from 'react-router-dom'
import Brand from '../components/Brand'

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

export function FeedPage() {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mediaFile, setMediaFile] = useState(null)
  const mediaInput = useRef(null)
  const feed = useLoad(async () => {
    const { data, error: queryError } = await supabase.from('posts').select('*, author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path,roles), reactions(id,user_id,kind), comments(id)').eq('status', 'published').in('visibility', ['public', 'showcase']).order('published_at', { ascending: false }).limit(30)
    if (queryError) throw queryError
    return data || []
  }, [])

  async function publish(event) {
    event.preventDefault(); if (!content.trim()) return
    setBusy(true); setError('')
    let mediaPaths = []
    try { if (mediaFile) mediaPaths = [await uploadFeedMedia(user.id, mediaFile)] }
    catch (uploadError) { setError(uploadError.message); setBusy(false); return }
    const { error: insertError } = await supabase.from('posts').insert({ user_id: user.id, content: content.trim(), content_type: mediaFile?.type.startsWith('video/') ? 'video' : mediaFile ? 'image' : 'article', media_paths: mediaPaths, status: 'published', visibility: 'public', language: 'Vietnamese', published_at: new Date().toISOString() })
    setBusy(false)
    if (insertError) { if (mediaPaths.length) await supabase.storage.from('feed-media').remove(mediaPaths); setError(insertError.message) }
    else { setContent(''); setMediaFile(null); feed.reload() }
  }

  async function react(post) {
    const existing = post.reactions?.find((reaction) => reaction.user_id === user.id && reaction.kind === 'like')
    if (existing) await supabase.from('reactions').delete().eq('id', existing.id)
    else await supabase.from('reactions').insert({ user_id: user.id, post_id: post.id, kind: 'like' })
    feed.reload()
  }

  return <div className="content-page"><section className="welcome-row"><div><span className="eyebrow purple"><span /> MORA · CREATE & CONNECT</span><h1>Xin chào, {profile?.display_name || profile?.username}</h1><p>Đăng tải ý tưởng, khám phá người sáng tạo và tìm cộng sự. Dự án có không gian riêng trong Studio.</p></div></section>
    <div className="feed-layout"><div className="feed-main"><form className="composer glass-card" onSubmit={publish}><div className="composer-top"><Avatar profile={profile} /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Bạn muốn chia sẻ điều gì hôm nay?" maxLength="5000" /></div>{mediaFile && <p className="feed-attachment">{mediaFile.name} <button type="button" onClick={() => setMediaFile(null)}>Bỏ tệp</button></p>}<div className="composer-actions"><div><button type="button" onClick={() => mediaInput.current?.click()}><ImageIcon /> Ảnh / video</button><input ref={mediaInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm" onChange={(event) => setMediaFile(event.target.files?.[0] || null)} /><Link to="/studio/projects"><FileText /> Dự án của tôi</Link></div><button className="primary-button small" disabled={busy || !content.trim()}><Send /> {busy ? 'Đang đăng…' : 'Đăng bài'}</button></div>{error && <p className="form-message error">{error}</p>}</form>
      <div className="content-tabs"><button className="active">Dành cho bạn</button><button disabled>Đang theo dõi</button><button disabled>Mới nhất</button></div>
      {feed.loading ? <LoadingState /> : feed.error ? <ErrorState message={feed.error} retry={feed.reload} /> : !feed.data.length ? <EmptyState title="Bảng tin đang chờ câu chuyện đầu tiên" description="Đăng cập nhật sáng tạo đầu tiên của bạn. Nội dung công khai từ cộng đồng sẽ xuất hiện tại đây." /> : feed.data.map((post) => <article className="post-card glass-card" key={post.id}><header className="post-header"><Avatar profile={post.author} /><div><strong>{post.author?.display_name || post.author?.username}</strong><span>@{post.author?.username} · {new Date(post.published_at || post.created_at).toLocaleDateString('vi-VN')}</span></div><button><MoreHorizontal /></button></header><p className="post-text">{post.content}</p>{post.media_paths?.map((path) => post.content_type === 'video' ? <video key={path} className="post-media-image" src={publicStorageUrl('feed-media', path)} controls playsInline /> : <img key={path} className="post-media-image" src={publicStorageUrl(post.content_type === 'image' ? 'feed-media' : 'project-media', path)} alt="Nội dung bài đăng" />)}<footer className="post-actions"><button className={post.reactions?.some((reaction) => reaction.user_id === user.id) ? 'liked' : ''} onClick={() => react(post)}><Heart /> {post.reactions?.length || 0}</button><button><MessageCircle /> {post.comments?.length || 0}</button><button><Bookmark /></button><button><Share2 /></button></footer></article>)}</div>
      <aside className="feed-right"><section className="glass-card side-widget"><h3>Nguyên tắc sáng tạo</h3><p>Bạn sở hữu nội dung của mình. AI chỉ hỗ trợ và không tự quyết định canon.</p></section></aside></div>
  </div>
}

export function FriendsPage() {
  const { user } = useAuth()
  const friends = useLoad(async () => {
    const { data, error } = await supabase.from('friendships').select('*, requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_path,roles), addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_path,roles)').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }, [user.id])
  const accepted = friends.data?.filter((item) => item.status === 'accepted') || []
  const pending = friends.data?.filter((item) => item.status === 'pending' && item.addressee_id === user.id) || []
  async function respond(id, status) { await supabase.from('friendships').update({ status, responded_at: new Date().toISOString() }).eq('id', id); friends.reload() }
  return <div className="content-page"><section className="page-hero simple"><div><span className="eyebrow purple"><span /> CỘNG ĐỒNG</span><h1>Bạn bè</h1><p>Kết nối và cộng tác với những người sáng tạo phù hợp.</p></div></section>{friends.loading ? <LoadingState /> : friends.error ? <ErrorState message={friends.error} retry={friends.reload} /> : <><section className="requests glass-card"><div className="section-title"><h2>Lời mời kết bạn</h2></div>{!pending.length ? <p className="inline-empty">Không có lời mời đang chờ.</p> : pending.map((item) => { const person = item.requester; return <div className="friend-row" key={item.id}><Avatar profile={person} /><div><strong>{person.display_name || person.username}</strong><small>{person.roles?.join(' · ')}</small></div><button className="primary-button small" onClick={() => respond(item.id, 'accepted')}><Check /> Chấp nhận</button><button className="secondary-button" onClick={() => respond(item.id, 'declined')}>Từ chối</button></div>})}</section><section className="section-block"><div className="section-title"><h2>Bạn bè của bạn</h2></div>{!accepted.length ? <EmptyState title="Chưa có bạn bè" description="Khi một lời mời được chấp nhận, người sáng tạo đó sẽ xuất hiện ở đây." /> : <div className="people-grid">{accepted.map((item) => { const person = item.requester_id === user.id ? item.addressee : item.requester; return <article className="person-card glass-card" key={item.id}><Avatar profile={person} className="avatar-lg" /><h3>{person.display_name || person.username}</h3><p>@{person.username}</p><small>{person.roles?.join(' · ')}</small></article>})}</div>}</section></>}</div>
}

export function WorldsPage() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', world_type: 'story', genre: '', language: 'Vietnamese', visibility: 'private', status: 'draft' })
  const worlds = useLoad(async () => { const { data, error } = await supabase.from('worlds').select('*').eq('owner_id', user.id).order('updated_at', { ascending: false }); if (error) throw error; return data || [] }, [user.id])
  async function create(event) { event.preventDefault(); setBusy(true); const { error } = await supabase.from('worlds').insert({ ...form, owner_id: user.id }); setBusy(false); if (!error) { setOpen(false); setForm({ ...form, name: '', description: '' }); worlds.reload() } }
  return <div className="content-page"><section className="worlds-hero glass-card"><div><span className="eyebrow"><span /> WORLD STUDIO</span><h1>Biến ý tưởng thành một thế giới sống động.</h1><p>Xây dựng lore, nhân vật, địa điểm và dòng thời gian trong một không gian riêng tư.</p><button className="primary-button" onClick={() => setOpen(true)}><Plus /> Tạo thế giới mới</button></div><div className="world-orb"><Globe2 /></div></section><div className="toolbar"><div className="filter-pills"><button className="active">Tất cả</button></div></div>{worlds.loading ? <LoadingState /> : worlds.error ? <ErrorState message={worlds.error} retry={worlds.reload} /> : !worlds.data.length ? <EmptyState title="Chưa có thế giới nào" description="Tạo Story World hoặc Game World đầu tiên. Nội dung mới mặc định được lưu riêng tư." action={<button className="primary-button" onClick={() => setOpen(true)}><Plus /> Tạo thế giới</button>} /> : <div className="world-grid">{worlds.data.map((world) => <article className="world-card glass-card" key={world.id}><div className="world-card-cover">{world.cover_path ? <img src={publicStorageUrl('covers', world.cover_path)} alt="" /> : <Globe2 />}</div><div className="world-card-body"><Visibility value={world.visibility} /><h2>{world.name}</h2><p>{world.description || 'Chưa có mô tả.'}</p><small>{world.world_type === 'game' ? 'Game World' : 'Story World'} · {world.genre || 'Chưa chọn thể loại'}</small></div></article>)}</div>}
    {open && <div className="modal-layer"><button className="scrim" onClick={() => setOpen(false)} /><form className="modal glass-card" onSubmit={create}><header><div><span className="eyebrow purple"><span /> NEW WORLD</span><h2>Tạo thế giới</h2><p>Thế giới mới được lưu riêng tư cho đến khi bạn chủ động công khai.</p></div></header><div className="field-grid modal-form"><label>Tên thế giới<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Loại<select value={form.world_type} onChange={(event) => setForm({ ...form, world_type: event.target.value })}><option value="story">Story World</option><option value="game">Game World</option></select></label><label>Thể loại<input value={form.genre} onChange={(event) => setForm({ ...form, genre: event.target.value })} /></label><label>Ngôn ngữ<select value={form.language} onChange={(event) => setForm({ ...form, language: event.target.value })}><option>Vietnamese</option><option>English</option><option>Bilingual</option><option>Other</option></select></label><label className="span-2">Mô tả<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label></div><footer className="modal-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Hủy</button><button className="primary-button" disabled={busy}>{busy ? 'Đang tạo…' : 'Tạo thế giới'}</button></footer></form></div>}
  </div>
}

export function ProjectsPage() {
  const [filter, setFilter] = useState('Tất cả')
  const projects = useLoad(async () => { const { data, error } = await supabase.from('project_showcases').select('id,name,summary,project_type,stage,visibility,cover_path,looking_for,owner_username,owner_display_name,published_at').order('published_at', { ascending: false }); if (error) throw error; return data || [] }, [])
  const visible = projects.data?.filter((project) => filter === 'Tất cả' || project.project_type === filter) || []
  return <div className="content-page"><section className="projects-hero glass-card"><div><span className="eyebrow"><span /> KHÁM PHÁ · MORA</span><h1>Dự án công khai,<br />kết nối người sáng tạo.</h1><p>Đây là nơi khám phá những dự án được tác giả chọn giới thiệu. Bản nháp riêng và lời mời cộng tác được quản lý trong Không gian của tôi.</p><Link className="primary-button" to="/studio/projects">Mở dự án cá nhân</Link></div></section><div className="project-filterbar glass-card"><div className="filter-pills">{['Tất cả','Game','Novel','Comic','RPG','Animation','Visual Novel'].map((type) => <button key={type} className={filter === type ? 'active' : ''} onClick={() => setFilter(type)}>{type}</button>)}</div></div>{projects.loading ? <LoadingState /> : projects.error ? <ErrorState message={projects.error} retry={projects.reload} /> : !visible.length ? <EmptyState title="Chưa có dự án phù hợp" description="Khi tác giả công bố dự án thuộc loại này, dự án sẽ xuất hiện ở đây." /> : <div className="project-grid">{visible.map((project) => <Link to={`/projects/${project.id}`} className="project-card glass-card" key={project.id}>{project.cover_path && <img className="project-cover" src={publicStorageUrl('project-media', project.cover_path)} alt="" />}<div className="project-body"><Visibility value={project.visibility} /><h2>{project.name}</h2><p>{project.summary}</p><div className="project-meta"><span>{project.project_type}</span><span>{project.stage}</span></div><small>Bởi {project.owner_display_name || project.owner_username}</small>{project.looking_for?.length > 0 && <div className="project-needs">{project.looking_for.map((need) => <span key={need}>{need}</span>)}</div>}</div></Link>)}</div>}</div>
}

export function LearnPage() {
  const courses = useLoad(async () => { const { data, error } = await supabase.from('courses').select('*, creator:profiles!courses_creator_id_fkey(username,display_name), course_lessons(id)').eq('status', 'published').eq('visibility', 'public').order('published_at', { ascending: false }); if (error) throw error; return data || [] }, [])
  return <div className="content-page"><section className="learn-hero glass-card"><div><span className="eyebrow"><span /> MORA LEARN</span><h1>Học cách xây dựng<br />những thế giới đáng nhớ.</h1><p>Hướng dẫn thực hành về worldbuilding, nhân vật, game design và AI có trách nhiệm.</p></div><BookOpen className="learn-illustration" /></section><section className="section-block"><div className="section-title"><h2>Khóa học</h2><p>Tất cả khóa học hiện miễn phí.</p></div>{courses.loading ? <LoadingState /> : courses.error ? <ErrorState message={courses.error} retry={courses.reload} /> : !courses.data.length ? <EmptyState title="Chưa có khóa học được duyệt" description="Khóa học sẽ xuất hiện sau khi Course Creator gửi và quản trị viên duyệt." /> : <div className="course-grid">{courses.data.map((course) => <article className="course-card glass-card" key={course.id}>{course.cover_path && <img src={publicStorageUrl('course-media', course.cover_path)} alt="" />}<div className="course-body"><span>{course.topic}</span><h3>{course.title}</h3><p>{course.description}</p><small>{course.course_lessons?.length || 0} bài · {course.creator?.display_name || course.creator?.username}</small></div></article>)}</div>}</section></div>
}

export function ProfilePage() {
  const { user, profile } = useAuth()
  const portfolio = useLoad(async () => {
    const [projects, worlds, posts, followers, friends] = await Promise.all([
      supabase.from('project_showcases').select('id,name,summary,project_type,cover_path').eq('owner_id', user.id),
      supabase.from('worlds').select('*').eq('owner_id', user.id).in('visibility', ['public', 'showcase']),
      supabase.from('posts').select('*').eq('user_id', user.id).eq('status', 'published').in('visibility', ['public', 'showcase']),
      supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
      supabase.from('friendships').select('*', { count: 'exact', head: true }).eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
    ])
    const failed = [projects, worlds, posts, followers, friends].find((result) => result.error)
    if (failed) throw failed.error
    return { projects: projects.data || [], worlds: worlds.data || [], posts: posts.data || [], followers: followers.count || 0, friends: friends.count || 0 }
  }, [user.id])
  const cover = publicStorageUrl('covers', profile?.cover_path)
  return <div className="content-page">{portfolio.loading ? <LoadingState /> : portfolio.error ? <ErrorState message={portfolio.error} retry={portfolio.reload} /> : <><section className="profile-head glass-card"><div className="profile-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined} /><div className="profile-main"><Avatar profile={profile} className="avatar-xxl" /><div className="profile-identity"><div><h1>{profile.display_name || profile.username}</h1><p>@{profile.username}</p></div></div><p className="profile-bio">{profile.bio || 'Chưa có giới thiệu.'}</p><div className="profile-roles">{profile.roles?.map((role) => <span key={role}>{role}</span>)}</div><div className="profile-stats"><button><strong>{portfolio.data.followers}</strong><small>Người theo dõi</small></button><span /><button><strong>{portfolio.data.friends}</strong><small>Bạn bè</small></button><span /><button><strong>{portfolio.data.projects.length}</strong><small>Dự án</small></button></div></div></section><section className="profile-layout"><main><div className="section-title"><h2>Dự án</h2></div>{!portfolio.data.projects.length ? <EmptyState title="Chưa có dự án công khai" description="Xuất bản project showcase từ Mora Studio để đưa vào portfolio." /> : <div className="profile-projects">{portfolio.data.projects.map((project) => <Link to={`/projects/${project.id}`} key={project.id} style={project.cover_path ? { backgroundImage: `linear-gradient(transparent, rgba(15,12,35,.75)), url(${publicStorageUrl('project-media', project.cover_path)})` } : undefined}><span>{project.project_type}</span><h2>{project.name}</h2><p>{project.summary}</p></Link>)}</div>}</main><aside><section className="profile-side glass-card"><h3>Thế giới công khai</h3><strong>{portfolio.data.worlds.length}</strong></section><section className="profile-side glass-card"><h3>Bài viết</h3><strong>{portfolio.data.posts.length}</strong></section></aside></section></>}</div>
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
