import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Check, UserPlus } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { publicStorageUrl, supabase, uploadOwnedImage } from '../lib/supabase'
import { safeExternalLinks } from '../lib/mediaValidation'
import { loadPublicProjects } from '../lib/publicProjects'

export default function ProfilePage() {
  const { username } = useParams()
  const { user, profile: ownProfile } = useAuth()
  const [state, setState] = useState({ loading: true, error: '', data: null })
  const [following, setFollowing] = useState(false)
  const [friendship, setFriendship] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setState({ loading: true, error: '', data: null })
    try {
      let query = supabase.from('profiles').select('id,username,display_name,bio,avatar_path,cover_path,roles,external_links,profile_visibility,account_status')
      query = username ? query.eq('username', username) : query.eq('id', user.id)
      const result = await query.maybeSingle()
      if (result.error) throw result.error
      const person = result.data
      if (!person || (person.id !== user?.id && (!['public','showcase'].includes(person.profile_visibility) || person.account_status !== 'active'))) throw new Error('Hồ sơ chưa công khai hoặc không tồn tại.')
      const [projects, courses, posts, followers, followingCount, relationship, myFollow] = await Promise.all([
        loadPublicProjects({ ownerId: person.id }),
        supabase.from('courses').select('id,title,topic,cover_path').eq('creator_id', person.id).eq('status', 'published').eq('visibility', 'public'),
        supabase.from('posts').select('id,content,created_at').eq('user_id', person.id).eq('status', 'published').in('visibility', ['public','showcase']).order('created_at', { ascending: false }).limit(20),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', person.id),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', person.id),
        user && user.id !== person.id ? supabase.from('friendships').select('id,requester_id,addressee_id,status').or(`and(requester_id.eq.${user.id},addressee_id.eq.${person.id}),and(requester_id.eq.${person.id},addressee_id.eq.${user.id})`).maybeSingle() : { data: null },
        user && user.id !== person.id ? supabase.from('follows').select('following_id').eq('follower_id', user.id).eq('following_id', person.id).maybeSingle() : { data: null },
      ])
      const failed = [courses, posts, followers, followingCount, relationship, myFollow].find((item) => item.error)
      if (failed) throw failed.error
      setFollowing(!!myFollow.data); setFriendship(relationship.data)
      setState({ loading: false, error: '', data: { person, projects, courses: courses.data || [], posts: posts.data || [], followers: followers.count || 0, following: followingCount.count || 0 } })
    } catch (error) { setState({ loading: false, error: error.message, data: null }) }
  }, [username, user?.id])
  useEffect(() => { load() }, [load])

  async function follow() {
    setBusy(true); setMessage('')
    const personId = state.data.person.id
    const result = following ? await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', personId) : await supabase.from('follows').insert({ follower_id: user.id, following_id: personId })
    if (result.error) setMessage(result.error.message); else await load()
    setBusy(false)
  }
  async function connect() {
    setBusy(true); setMessage('')
    let result
    if (friendship?.status === 'pending' && friendship.addressee_id === user.id) result = await supabase.from('friendships').update({ status: 'accepted', responded_at: new Date().toISOString() }).eq('id', friendship.id)
    else if (friendship?.status === 'pending') result = await supabase.from('friendships').delete().eq('id', friendship.id).eq('requester_id', user.id)
    else {
      if (friendship) { const old = await supabase.from('friendships').delete().eq('id', friendship.id); if (old.error) { setMessage(old.error.message); setBusy(false); return } }
      result = await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: state.data.person.id })
    }
    if (result.error) setMessage(result.error.message); else await load()
    setBusy(false)
  }

  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} retry={load} />
  const { person, projects, courses, posts, followers, following: followingCount } = state.data
  const own = person.id === user?.id
  const cover = publicStorageUrl('covers', person.cover_path)
  const avatar = publicStorageUrl('avatars', person.avatar_path)
  return <div className="content-page portfolio-page"><section className="profile-head glass-card"><div className="profile-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined} /><div className="profile-main">{avatar ? <img className="avatar avatar-xxl" src={avatar} alt="" /> : <span className="avatar avatar-fallback avatar-xxl">{(person.display_name || person.username).slice(0,1)}</span>}<div className="profile-identity"><div><h1>{person.display_name || person.username}</h1><p>@{person.username}</p></div><div className="portfolio-actions">{own ? <Link className="secondary-button" to="/settings/profile">Chỉnh sửa hồ sơ</Link> : !user ? <Link className="primary-button" to="/login">Đăng nhập để kết nối</Link> : <><button className="secondary-button" disabled={busy} onClick={follow}>{following ? 'Đang theo dõi' : 'Theo dõi'}</button><button className="primary-button" disabled={busy || friendship?.status === 'accepted' || friendship?.status === 'blocked'} onClick={connect}>{friendship?.status === 'accepted' ? <Check size={16} /> : <UserPlus size={16} />}{friendship?.status === 'accepted' ? 'Bạn bè' : friendship?.status === 'blocked' ? 'Không thể kết nối' : friendship?.status === 'pending' ? friendship.addressee_id === user.id ? 'Chấp nhận lời mời' : 'Hủy lời mời' : 'Kết bạn'}</button></>}</div></div><p className="profile-bio">{person.bio}</p><div className="profile-roles">{person.roles?.map((role) => <span key={role}>{role}</span>)}</div><div className="profile-stats"><span><strong>{followers}</strong><small>Người theo dõi</small></span><span><strong>{followingCount}</strong><small>Đang theo dõi</small></span><span><strong>{projects.length}</strong><small>Dự án công khai</small></span></div><div className="portfolio-actions">{safeExternalLinks(person.external_links).map(([label, href]) => <a key={label} href={href} target="_blank" rel="noopener noreferrer">{label} ↗</a>)}</div>{message && <p role="alert" className="form-message error">{message}</p>}</div></section>
    <section className="portfolio-section"><h2>Dự án</h2>{projects.length ? <div className="profile-projects">{projects.map((project) => <Link key={project.id} to={`/projects/${project.id}`} style={project.cover_path ? { backgroundImage: `linear-gradient(transparent,rgba(15,12,35,.75)),url(${publicStorageUrl('project-media',project.cover_path)})` } : undefined}><span>{project.project_type}</span><h2>{project.name}</h2><p>{project.summary}</p></Link>)}</div> : <EmptyState title="Chưa có dự án công khai" />}</section>
    <section className="portfolio-section"><h2>Khóa học</h2>{courses.length ? <div className="resource-list">{courses.map((course) => <Link className="glass-card" key={course.id} to={`/learn/${course.id}`}><strong>{course.title}</strong><small>{course.topic}</small></Link>)}</div> : <p className="inline-empty">Chưa có khóa học công khai.</p>}</section>
    <section className="portfolio-section"><h2>Bài viết công khai</h2>{posts.length ? <div className="resource-list">{posts.map((post) => <Link className="glass-card" key={post.id} to={`/feed?post=${post.id}`}><p>{post.content}</p><small>{new Date(post.created_at).toLocaleDateString()}</small></Link>)}</div> : <p className="inline-empty">Chưa có bài viết công khai.</p>}</section>{own && ownProfile && <Link className="secondary-button" to="/studio">Không gian của tôi</Link>}
  </div>
}

export function ProfileEditorPage() {
  const { user, profile, refreshProfile } = useAuth()
  const [form, setForm] = useState(() => ({ display_name: profile.display_name || '', username: profile.username || '', bio: profile.bio || '', roles: (profile.roles || []).join(', '), avatar_path: profile.avatar_path, cover_path: profile.cover_path, profile_visibility: profile.profile_visibility || 'public' }))
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function upload(field, bucket, file) {
    if (!file) return
    setBusy(true); setMessage('')
    try { const path = await uploadOwnedImage(bucket,user.id,file); setForm((current) => ({ ...current,[field]:path })) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function save(event) {
    event.preventDefault(); setBusy(true); setMessage('')
    const result = await supabase.from('profiles').update({ ...form, display_name: form.display_name.trim(), username: form.username.trim().toLowerCase(), roles: form.roles.split(',').map((role) => role.trim()).filter(Boolean) }).eq('id',user.id)
    if (result.error) setMessage(result.error.message); else { await refreshProfile(); setMessage('Đã lưu hồ sơ.') }
    setBusy(false)
  }
  return <div className="content-page"><Link to="/profile">← Hồ sơ</Link><form className="glass-card project-panel" onSubmit={save}><h1>Chỉnh sửa hồ sơ</h1><label>Tên hiển thị<input required maxLength={80} value={form.display_name} onChange={(e) => setForm({ ...form,display_name:e.target.value })} /></label><label>Username<input required pattern="[a-z0-9_]{3,30}" value={form.username} onChange={(e) => setForm({ ...form,username:e.target.value.toLowerCase() })} /></label><label>Giới thiệu<textarea maxLength={300} value={form.bio} onChange={(e) => setForm({ ...form,bio:e.target.value })} /></label><label>Vai trò sáng tạo, ngăn cách bằng dấu phẩy<input value={form.roles} onChange={(e) => setForm({ ...form,roles:e.target.value })} /></label><label>Ảnh đại diện<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => upload('avatar_path','avatars',e.target.files?.[0])} /></label><label>Ảnh bìa<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(e) => upload('cover_path','covers',e.target.files?.[0])} /></label><label>Quyền xem hồ sơ<select value={form.profile_visibility} onChange={(e) => setForm({ ...form,profile_visibility:e.target.value })}><option value="public">Công khai</option><option value="private">Riêng tư</option></select></label><p className="privacy-note">Ảnh đại diện và ảnh bìa là tệp công khai. Quyền hồ sơ không tự đổi quyền của bài viết hay dự án đã công bố.</p>{message && <p role="status">{message}</p>}<button className="primary-button" disabled={busy}>Lưu hồ sơ</button></form></div>
}
