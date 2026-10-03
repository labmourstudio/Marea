import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const labels = { comment:'Bình luận mới', follow:'Người theo dõi mới', friend_request:'Lời mời kết bạn', friend_accepted:'Lời mời đã được chấp nhận', project_inquiry:'Lời nhắn về dự án', project_reply:'Phản hồi từ dự án' }
export default function NotificationsPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const result = await supabase.from('notifications').select('id,kind,payload,read_at,created_at,actor:profiles!notifications_actor_id_fkey(username,display_name)').eq('user_id',user.id).order('created_at',{ ascending:false }).limit(100)
    if (result.error) setError(result.error.message); else { setRows(result.data || []); setError('') }
  }, [user.id])
  useEffect(() => { load() }, [load])
  async function mark(id) {
    const result = await supabase.from('notifications').update({ read_at:new Date().toISOString() }).eq('id',id).eq('user_id',user.id)
    if (result.error) setError(result.error.message); else load()
  }
  function target(item) {
    if (item.payload?.post_id) return `/feed?post=${encodeURIComponent(item.payload.post_id)}`
    if (item.payload?.project_id) return item.kind === 'project_inquiry' ? `/studio/projects/${item.payload.project_id}` : `/projects/${item.payload.project_id}`
    return item.actor?.username ? `/u/${item.actor.username}` : '/friends'
  }
  return <div className="content-page"><header className="page-hero simple"><h1>Thông báo</h1><button className="secondary-button" onClick={load}>Làm mới</button></header>{error && <ErrorState message={error} retry={load} />}{rows === null ? <LoadingState /> : !rows.length ? <EmptyState title="Chưa có thông báo" description="Bình luận, kết nối và lời nhắn về dự án sẽ xuất hiện ở đây." /> : <section className="notification-list">{rows.map((item) => <article className={`glass-card notification-row ${item.read_at ? '' : 'unread'}`} key={item.id}><Link to={target(item)} onClick={() => { if (!item.read_at) mark(item.id) }}><strong>{labels[item.kind] || 'Hoạt động mới'}</strong><p>{item.actor?.display_name || item.actor?.username || 'Mora'}</p><small>{new Date(item.created_at).toLocaleString()}</small></Link>{!item.read_at && <button className="secondary-button" onClick={() => mark(item.id)}>Đã đọc</button>}</article>)}</section>}</div>
}
