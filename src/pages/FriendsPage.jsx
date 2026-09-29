import { useCallback, useEffect, useState } from 'react'
import { Bookmark, Check, Search, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { readSavedProjectGroups, toggleSavedProjectGroup } from '../lib/savedProjectGroups'
import { publicStorageUrl, supabase } from '../lib/supabase'

function Avatar({ profile }) {
  const image = publicStorageUrl('avatars', profile?.avatar_path)
  return image ? <img className="avatar avatar-md" src={image} alt="" /> : <span className="avatar avatar-fallback avatar-md">{(profile?.display_name || profile?.username || 'M').slice(0, 1).toUpperCase()}</span>
}

function GroupCard({ project, subtitle, onRemove }) {
  const image = publicStorageUrl('project-media', project.cover_path)
  return <article className="glass-card saved-group-card">
    <Link to={`/projects/${project.id}`}>{image ? <img src={image} alt="" loading="lazy" /> : <span className="saved-group-placeholder" aria-hidden="true">{project.name.slice(0, 1).toUpperCase()}</span>}<span><strong>{project.name}</strong><small>{project.project_type} · {subtitle}</small></span></Link>
    {onRemove && <button type="button" onClick={onRemove} aria-label={`Bỏ lưu ${project.name}`} title="Bỏ lưu"><Bookmark size={17} fill="currentColor" /></button>}
  </article>
}

export default function FriendsPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState(null)
  const [groups, setGroups] = useState(null)
  const [savedState, setSavedState] = useState(() => ({ userId: user.id, ids: readSavedProjectGroups(user.id) }))
  const [error, setError] = useState('')
  const [groupError, setGroupError] = useState('')
  const [showRequests, setShowRequests] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)

  const loadFriends = useCallback(async () => {
    const { data, error: queryError } = await supabase.from('friendships')
      .select('id,requester_id,addressee_id,status,created_at,requester:profiles!friendships_requester_id_fkey(id,username,display_name,avatar_path,roles),addressee:profiles!friendships_addressee_id_fkey(id,username,display_name,avatar_path,roles)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).order('created_at', { ascending: false })
    if (queryError) throw queryError
    setFriends({ userId: user.id, rows: data || [] })
  }, [user.id])

  useEffect(() => {
    let active = true
    loadFriends().catch((caught) => { if (active) { setError(caught.message); setFriends({ userId: user.id, rows: [] }) } })
    return () => { active = false }
  }, [loadFriends])

  useEffect(() => {
    if (tab !== 'groups') return undefined
    let active = true
    async function loadGroups() {
      const saved = readSavedProjectGroups(user.id)
      setSavedState({ userId: user.id, ids: saved })
      const membership = await supabase.from('project_members').select('project_id,role').eq('user_id', user.id)
      if (membership.error) throw membership.error
      const ids = [...new Set([...saved, ...(membership.data || []).map((item) => item.project_id)])]
      const result = ids.length ? await supabase.from('projects')
        .select('id,name,cover_path,project_type,status,visibility').in('id', ids).limit(100) : { data: [], error: null }
      if (result.error) throw result.error
      if (active) setGroups({ userId: user.id, projects: result.data || [], memberships: membership.data || [] })
    }
    loadGroups().catch((caught) => { if (active) { setGroupError(caught.message); setGroups({ userId: user.id, projects: [], memberships: [] }) } })
    return () => { active = false }
  }, [tab, user.id])

  const friendRows = friends?.userId === user.id ? friends.rows : null
  const groupData = groups?.userId === user.id ? groups : null
  const savedIds = savedState.userId === user.id ? savedState.ids : []
  const accepted = (friendRows || []).filter((item) => item.status === 'accepted')
  const pending = (friendRows || []).filter((item) => item.status === 'pending' && item.addressee_id === user.id)
  const publicProjects = (groupData?.projects || []).filter((item) => item.status === 'published' && ['public', 'showcase'].includes(item.visibility))
  const saved = publicProjects.filter((item) => savedIds.includes(item.id))
  const invited = publicProjects.filter((item) => groupData.memberships.some((member) => member.project_id === item.id))
  const unavailable = (groupData?.memberships || []).filter((member) => !groupData.projects.some((item) => item.id === member.project_id)).length

  async function respond(id, status) {
    const { error: responseError } = await supabase.from('friendships').update({ status, responded_at: new Date().toISOString() }).eq('id', id).eq('addressee_id', user.id)
    if (responseError) setError(responseError.message)
    else loadFriends().catch((caught) => setError(caught.message))
  }
  function removeSaved(id) {
    try { setSavedState({ userId: user.id, ids: toggleSavedProjectGroup(user.id, id) }) }
    catch { setGroupError('Không cập nhật được danh sách đã lưu trên thiết bị này.') }
  }

  return <div className="content-page friends-page">
    <section className="mora-screen friends-screen">
      <header className="friends-heading"><h1>Kết nối</h1><Link className="secondary-button" to="/search"><Search size={16} /> Tìm người</Link></header>
      <div className="friends-tabs" role="tablist" aria-label="Kết nối của tôi"><button type="button" role="tab" aria-selected={tab === 'friends'} className={tab === 'friends' ? 'active' : ''} onClick={() => setTab('friends')}>Bạn bè {accepted.length > 0 && <small>{accepted.length}</small>}</button><button type="button" role="tab" aria-selected={tab === 'groups'} className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}><UsersRound size={17} /> Nhóm</button>{pending.length > 0 && tab === 'friends' && <button type="button" className="friends-request-toggle" aria-expanded={showRequests} onClick={() => setShowRequests((value) => !value)}>Lời mời {pending.length}</button>}</div>
      {error && <p role="alert" className="form-message error">{error}</p>}
      {tab === 'friends' && <div role="tabpanel">{friendRows === null ? <LoadingState /> : !accepted.length ? <EmptyState title="Chưa có bạn bè" description="Những người đã kết nối với bạn sẽ xuất hiện ở đây." /> : <><div className="friends-list">{accepted.slice(0, visibleCount).map((item) => { const person = item.requester_id === user.id ? item.addressee : item.requester; return <article className="glass-card friend-compact" key={item.id}><Avatar profile={person} /><div><strong>{person?.display_name || person?.username}</strong><small>@{person?.username}</small><span>{person?.roles?.join(' · ')}</span></div></article> })}</div>{accepted.length > visibleCount && <button className="secondary-button friends-more" onClick={() => setVisibleCount((count) => count + 8)}>Xem thêm bạn bè</button>}</>}{showRequests && pending.length > 0 && <section className="friends-requests"><h2>Lời mời kết bạn</h2>{pending.map((item) => <article className="glass-card friend-compact" key={item.id}><Avatar profile={item.requester} /><div><strong>{item.requester?.display_name || item.requester?.username}</strong><small>@{item.requester?.username}</small></div><button className="primary-button small" onClick={() => respond(item.id, 'accepted')}><Check size={15} /> Chấp nhận</button><button className="secondary-button" onClick={() => respond(item.id, 'declined')}>Từ chối</button></article>)}</section>}</div>}
      {tab === 'groups' && <div className="friends-groups" role="tabpanel">{groupError && <p role="alert" className="form-message error">{groupError}</p>}{groupData === null ? <LoadingState /> : <><section><h2>Nhóm đã lưu</h2>{saved.length ? <div className="saved-group-grid">{saved.map((item) => <GroupCard key={item.id} project={item} subtitle="Đã lưu trên thiết bị" onRemove={() => removeSaved(item.id)} />)}</div> : <EmptyState title="Chưa lưu nhóm dự án" description="Bấm dấu lưu trên một dự án công khai để thấy nhóm ở đây." action={<Link to="/projects" className="secondary-button">Khám phá dự án</Link>} />}</section><section><h2>Nhóm đã tham gia</h2>{invited.length ? <div className="saved-group-grid">{invited.map((item) => <GroupCard key={item.id} project={item} subtitle="Nhóm dự án của bạn" />)}</div> : <p className="inline-empty">Chưa có nhóm dự án công khai nào bạn tham gia.</p>}{unavailable > 0 && <p className="privacy-note">Có {unavailable} dự án nhóm riêng tư chưa mở được trong phiên bản này; quyền truy cập đang chờ cập nhật cơ sở dữ liệu.</p>}</section></>}</div>}
    </section>
  </div>
}
