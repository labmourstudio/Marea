import { useCallback, useEffect, useState } from 'react'
import { AudioLines, BarChart3, Bookmark, Heart, Image as ImageIcon, MessageCircle, Send, Share2, Video } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { publicStorageUrl, supabase } from '../lib/supabase'
import { readBookmarks, toggleBookmark } from '../lib/bookmarks'
import { validateImage } from '../lib/mediaValidation'
import { attachPublicProjects, loadPublicProjects } from '../lib/publicProjects'
import { useBackend } from '../context/BackendContext'

const topics = [
  ['worldbuilding','Worldbuilding'], ['character-design','Character design'],
  ['game-creation','Game creation'], ['writing','Writing'], ['concept-art','Concept art'], ['voice-acting','Voice acting'],
]
const types = { 'image/jpeg':'jpg', 'image/png':'png', 'image/webp':'webp', 'image/gif':'gif', 'video/mp4':'mp4', 'video/webm':'webm', 'audio/mpeg':'mp3', 'audio/wav':'wav', 'audio/ogg':'ogg', 'audio/webm':'weba', 'audio/mp4':'m4a' }

function PostAvatar({ person }) {
  const url = publicStorageUrl('avatars', person?.avatar_path)
  return url ? <img className="avatar avatar-md" src={url} alt="" /> : <span className="avatar avatar-md avatar-fallback">{(person?.display_name || person?.username || 'M').slice(0,1).toUpperCase()}</span>
}

export function PostMedia({ mediaPaths = [] }) {
  return mediaPaths.map((entry) => {
    const modern = entry.startsWith('post-media:')
    const path = modern ? entry.slice('post-media:'.length) : entry
    const src = publicStorageUrl(modern ? 'post-media' : 'project-media', path)
    if (!src) return null
    if (/\.(mp4|webm)$/i.test(path)) return <video key={entry} className="post-media-image" controls playsInline preload="metadata" src={src} />
    if (/\.(mp3|wav|ogg|weba|m4a)$/i.test(path)) return <audio key={entry} className="post-audio" controls preload="none" src={src}>Audio playback unavailable.</audio>
    return <img key={entry} className="post-media-image" loading="lazy" src={src} alt="Creator upload" />
  })
}

export function PostCard({ post, onRefresh, poll = null }) {
  const { user } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(() => readBookmarks(user?.id).includes(post.id))
  const [editing, setEditing] = useState(false)
  const [edited, setEdited] = useState(post.content)
  const liked = post.reactions?.some((item) => item.user_id === user?.id && item.kind === 'like')
  async function like() {
    if (!user) return
    setBusy(true); setError('')
    const existing = post.reactions?.find((item) => item.user_id === user?.id && item.kind === 'like')
    const result = existing ? await supabase.from('reactions').delete().eq('id', existing.id) : await supabase.from('reactions').insert({ user_id:user.id, post_id:post.id, kind:'like' })
    setBusy(false); if (result.error) setError(result.error.message); else onRefresh()
  }
  async function submitComment(event) {
    event.preventDefault(); if (!user || !comment.trim()) return
    setBusy(true); setError('')
    const { error: insertError } = await supabase.from('comments').insert({ user_id:user.id, post_id:post.id, content:comment.trim() })
    setBusy(false); if (insertError) setError(insertError.message); else { setComment(''); onRefresh() }
  }
  async function vote(optionId) {
    if (!user) return
    setBusy(true); setError('')
    const { error: voteError } = await supabase.from('post_poll_votes').upsert({ post_id:post.id, user_id:user.id, option_id:optionId }, { onConflict:'post_id,user_id' })
    setBusy(false); if (voteError) setError(voteError.message); else onRefresh()
  }
  async function share() {
    const url = `${location.origin}${import.meta.env.BASE_URL}feed?post=${encodeURIComponent(post.id)}`
    try { if (navigator.share) await navigator.share({ url }); else { await navigator.clipboard.writeText(url); setError('Link copied · Đã sao chép liên kết.') } } catch { /* Canceling the share sheet is not an error. */ }
  }
  function save() {
    try { setSaved(toggleBookmark(user?.id,post.id).includes(post.id)); onRefresh() }
    catch (caught) { setError(caught.message) }
  }
  async function editPost() {
    if (!edited.trim() || post.user_id !== user?.id) return
    setBusy(true); setError('')
    const result = await supabase.from('posts').update({ content:edited.trim() }).eq('id',post.id).eq('user_id',user.id)
    setBusy(false)
    if (result.error) setError(result.error.message); else { setEditing(false); onRefresh() }
  }
  async function deletePost() {
    if (post.user_id !== user?.id || !window.confirm('Xóa bài đăng này cùng bình luận và lượt tương tác?')) return
    setBusy(true)
    const result = await supabase.from('posts').delete().eq('id',post.id).eq('user_id',user.id)
    setBusy(false)
    if (result.error) setError(result.error.message); else onRefresh()
  }
  async function reportPost() {
    if (!user) return
    const reason = window.prompt('Lý do báo cáo bài đăng (tối đa 500 ký tự):')
    if (!reason?.trim()) return
    const result = await supabase.from('reports').insert({ reporter_id:user.id,target_type:'post',target_id:post.id,reason:reason.trim().slice(0,500) })
    setError(result.error ? result.error.message : 'Đã gửi báo cáo cho quản trị viên.')
  }
  return <article id={`post-${post.id}`} className="post-card glass-card"><header className="post-header"><PostAvatar person={post.author} /><div><Link to={`/u/${post.author?.username}`}><strong>{post.author?.display_name || post.author?.username || 'Người sáng tạo'}</strong></Link><span>{post.author?.username ? `@${post.author.username} · ` : ''} {new Date(post.published_at || post.created_at).toLocaleDateString()}</span></div></header>
    {post.content_type === 'poll' && <span className="post-type"><BarChart3 size={14} /> Poll · Bình chọn</span>}
    {post.content_type === 'discussion' && <span className="post-type"><MessageCircle size={14} /> Discussion · Thảo luận</span>}
    <p className="post-text">{post.content}</p>{editing && <div className="post-edit"><textarea aria-label="Chỉnh sửa bài đăng" value={edited} maxLength={5000} onChange={(event) => setEdited(event.target.value)} /><button className="secondary-button" disabled={busy || !edited.trim()} onClick={editPost}>Lưu</button><button className="text-button" onClick={() => setEditing(false)}>Hủy</button></div>}
    <PostMedia mediaPaths={post.media_paths || []} />
    {post.project?.status === 'published' && ['public','showcase'].includes(post.project.visibility) && <Link className="linked-project" to={`/projects/${post.project.id}`}>↗ {post.project.name} · Dự án công khai</Link>}
    {!!post.hashtags?.length && <div className="post-topics">{post.hashtags.map((tag) => <Link key={tag} to={`/feed?topic=${encodeURIComponent(tag)}`}>#{topics.find(([key]) => key === tag)?.[1] || tag}</Link>)}</div>}
    {!!poll?.options?.length && <div className="post-poll">{poll.options.map((option) => <button type="button" key={option.id} disabled={busy || !user} className={poll.myVote === option.id ? 'selected' : ''} onClick={() => vote(option.id)}><span>{option.label}</span><small>{poll.counts?.[option.id] || 0} votes</small></button>)}</div>}
    <footer className="post-actions"><button disabled={busy || !user} className={liked ? 'liked' : ''} onClick={like} aria-label="Like"><Heart /> {post.reactions?.length || 0}</button><button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><MessageCircle /> {post.comments?.length || 0}</button><button disabled={!user} className={saved ? 'liked' : ''} onClick={save} title="Lưu theo tài khoản trên thiết bị này"><Bookmark /></button><button onClick={share} aria-label="Share"><Share2 /></button></footer>
    {expanded && <section className="post-comments"><h4>Discussion · Bình luận</h4>{post.comments?.map((item) => <p key={item.id}><Link to={`/u/${item.author?.username}`}><strong>{item.author?.display_name || item.author?.username || 'Người sáng tạo'}</strong></Link> {item.content}</p>)}{user ? <form onSubmit={submitComment}><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="Write a comment / Viết bình luận" aria-label="Write a comment" /><button className="secondary-button" disabled={!comment.trim() || busy}><Send size={15} /></button></form> : <Link to="/login">Đăng nhập để bình luận</Link>}</section>}
    {user && <div className="post-management">{post.user_id === user.id ? <><button className="text-button" onClick={() => setEditing(true)}>Chỉnh sửa</button><button className="text-danger" disabled={busy} onClick={deletePost}>Xóa</button></> : <button className="text-button" onClick={reportPost}>Báo cáo</button>}</div>}
    {error && <p className="form-message error" role="status">{error}</p>}
  </article>
}

export default function FeedPage() {
  const { user, profile } = useAuth()
  const { polls: pollsReady } = useBackend()
  const [limit, setLimit] = useState(30)
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [content, setContent] = useState('')
  const [kind, setKind] = useState('discussion')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [topic, setTopic] = useState('')
  const [projectId, setProjectId] = useState('')
  const [options, setOptions] = useState(['',''])
  const [projects, setProjects] = useState([])
  const filter = searchParams.get('topic') || ''
  const feedTab = searchParams.get('tab') || ''
  const [posts, setPosts] = useState([])
  const [polls, setPolls] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { loadPublicProjects().then(setProjects).catch((caught) => setError(caught.message)) }, [])
  useEffect(() => { if (!file) { setPreview(''); return undefined } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url) }, [file])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    let query = supabase.from('posts').select('*,author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path),reactions(id,user_id,kind),comments(id,content,created_at,author:profiles!comments_user_id_fkey(username,display_name))').eq('status','published').in('visibility',['public','showcase']).order('published_at',{ ascending:false }).limit(limit)
    if (filter) query = query.contains('hashtags',[filter])
    if (feedTab === 'saved') {
      const saved = readBookmarks(user.id)
      if (!saved.length) { setPosts([]); setLoading(false); return }
      query = query.in('id',saved)
    }
    if (feedTab === 'following') {
      const followed = await supabase.from('follows').select('following_id').eq('follower_id',user.id)
      if (followed.error) { setError(followed.error.message); setLoading(false); return }
      if (!followed.data.length) { setPosts([]); setLoading(false); return }
      query = query.in('user_id',followed.data.map((item) => item.following_id))
    }
    const result = await query
    if (result.error) { setError(result.error.message); setLoading(false); return }
    let rows = result.data || []
    const sharedId = searchParams.get('post')
    if (sharedId && /^[a-f0-9-]{36}$/i.test(sharedId) && !rows.some((item) => item.id === sharedId)) {
      const shared = await supabase.from('posts').select('*,author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path),reactions(id,user_id,kind),comments(id,content,author:profiles!comments_user_id_fkey(username,display_name))').eq('id',sharedId).eq('status','published').in('visibility',['public','showcase']).maybeSingle()
      if (shared.error) { setError(shared.error.message); setLoading(false); return }
      if (shared.data) rows = [shared.data,...rows]
      else setError('Bài đăng được chia sẻ đã ẩn, đã xóa hoặc không tồn tại.')
    }
    try { rows = await attachPublicProjects(rows) } catch (caught) { setError(caught.message) }
    setPosts(rows)
    setPolls({})
    const ids = rows.filter((item) => item.content_type === 'poll').map((item) => item.id)
    if (ids.length) {
      const [opts, own] = await Promise.all([supabase.from('post_poll_options').select('id,post_id,label,position').in('post_id',ids).order('position'),supabase.from('post_poll_votes').select('post_id,option_id').eq('user_id',user.id).in('post_id',ids)])
      if (!opts.error && !own.error) {
        const results = await Promise.all(ids.map((id) => supabase.rpc('get_poll_results',{ target_post_id:id })))
        setPolls(Object.fromEntries(ids.map((id,index) => [id,{ options:(opts.data || []).filter((item) => item.post_id === id), myVote:own.data?.find((item) => item.post_id === id)?.option_id, counts:Object.fromEntries((results[index].data || []).map((item) => [item.option_id,Number(item.votes)])) }])))
      }
    }
    setLoading(false)
  }, [filter,feedTab,user.id,limit,searchParams])
  useEffect(() => { load().catch((caught) => { setError(caught.message); setLoading(false) }) }, [load])
  useEffect(() => { const id = searchParams.get('post'); if (id && !loading) document.getElementById(`post-${id}`)?.scrollIntoView({ block:'center' }) }, [loading,searchParams])

  async function chooseFile(event) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) return
    if (!types[next.type]) { setError('Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, WebM, MP3, WAV, OGG or M4A.'); return }
    const limit = next.type.startsWith('image/') ? 8 : 40
    if (next.size > limit * 1024 * 1024) { setError(`File must be under ${limit} MB.`); return }
    try { if (next.type.startsWith('image/')) await validateImage(next); setFile(next); setKind(next.type.split('/')[0]); setError('') } catch (caught) { setError(caught.message) }
  }
  async function publish(event) {
    event.preventDefault(); if (!content.trim() || busy) return
    const choices = options.map((value) => value.trim()).filter(Boolean)
    if (kind === 'poll' && (choices.length < 2 || new Set(choices).size !== choices.length)) { setError('A poll needs at least two different options.'); return }
    setBusy(true); setError('')
    let uploaded = null; let createdId = null
    try {
      if (kind === 'poll' && !pollsReady) throw new Error('Bình chọn đang chờ cập nhật Supabase.')
      if (projectId && !(await loadPublicProjects({ id:projectId })).length) throw new Error('Dự án được liên kết không còn công khai.')
      let mediaPaths = []
      if (file) {
        if (file.type.startsWith('image/')) await validateImage(file)
        if (!file.type.startsWith('image/') && !pollsReady) throw new Error('Video và âm thanh đang chờ cập nhật Supabase.')
        const bucket = file.type.startsWith('image/') ? 'project-media' : 'post-media'
        const path = `${user.id}/${crypto.randomUUID()}.${types[file.type]}`
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path,file,{ contentType:file.type,cacheControl:'3600' })
        if (uploadError) throw new Error(bucket === 'post-media' ? `Video/audio uploads require the pending Supabase migration: ${uploadError.message}` : uploadError.message)
        uploaded = { bucket,path }; mediaPaths = [bucket === 'post-media' ? `post-media:${path}` : path]
      }
      const { data, error: insertError } = await supabase.from('posts').insert({ user_id:user.id, content:content.trim(), content_type:kind, media_paths:mediaPaths, hashtags:topic.trim() ? [topic.trim()] : [], project_id:projectId || null, language:language === 'vi' ? 'Vietnamese' : language === 'en' ? 'English' : language, status:kind === 'poll' ? 'draft' : 'published', visibility:'public', published_at:kind === 'poll' ? null : new Date().toISOString() }).select('id').single()
      if (insertError) throw insertError
      createdId = data.id
      if (kind === 'poll') {
        const { error: optionError } = await supabase.from('post_poll_options').insert(choices.map((label,position) => ({ post_id:createdId,label,position })))
        if (optionError) throw optionError
        const { error: publishError } = await supabase.from('posts').update({ status:'published',published_at:new Date().toISOString() }).eq('id',createdId)
        if (publishError) throw publishError
      }
      setContent(''); setKind('discussion'); setFile(null); setTopic(''); setProjectId(''); setOptions(['','']); await load()
    } catch (caught) {
      if (createdId) await supabase.from('posts').delete().eq('id',createdId)
      if (uploaded) await supabase.storage.from(uploaded.bucket).remove([uploaded.path])
      setError(caught.message)
    } finally { setBusy(false) }
  }

  return <div className="content-page"><section className="welcome-row"><div><span className="eyebrow purple">MORA · CREATE & CONNECT</span><h1>{t.welcomeBack}, {profile?.display_name || profile?.username}</h1><p>{t.feedIntro}</p></div><Link className="secondary-button" to="/community">{language === 'vi' ? 'Khám phá nhóm Morimori' : 'Explore the Morimori group'}</Link></section>
    <div className="feed-layout"><div className="feed-main"><form className="composer glass-card new-composer" onSubmit={publish}><div className="composer-top"><PostAvatar person={profile} /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t.compose} maxLength={5000} aria-label={t.compose} /></div>
      <div className="composer-kinds"><button type="button" className={kind === 'discussion' ? 'selected' : ''} onClick={() => { setKind('discussion'); setFile(null) }}>{t.discussion}</button><button type="button" disabled={!pollsReady} title={pollsReady ? '' : 'Cần cập nhật Supabase'} className={kind === 'poll' ? 'selected' : ''} onClick={() => { setKind('poll'); setFile(null) }}><BarChart3 size={15} /> {t.poll}</button></div>
      {kind === 'poll' && <div className="poll-inputs">{options.map((option,index) => <input key={index} value={option} maxLength={140} onChange={(event) => setOptions((old) => old.map((item,i) => i === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} aria-label={`Poll option ${index + 1}`} />)}{options.length < 8 && <button type="button" onClick={() => setOptions([...options,''])}>+ Add option</button>}</div>}
      {preview && <div className="upload-preview">{file?.type.startsWith('image/') ? <img src={preview} alt="Preview" /> : file?.type.startsWith('video/') ? <video src={preview} controls /> : <audio src={preview} controls />}<button className="secondary-button" type="button" onClick={() => { setFile(null); setKind('discussion') }}>Remove</button></div>}
      <div className="composer-context"><label>{t.topic}<input value={topic} maxLength="80" list="mora-feed-topics" placeholder="Chọn hoặc nhập chủ đề" onChange={(event) => setTopic(event.target.value.trimStart())} /><datalist id="mora-feed-topics">{topics.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</datalist></label><label>{t.linkedProject}<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{t.noProject}</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      <div className="composer-actions"><div><label className="composer-upload"><ImageIcon size={16} /> {t.image}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} hidden /></label><label className="composer-upload"><Video size={16} /> {t.video}<input type="file" accept="video/mp4,video/webm" onChange={chooseFile} hidden /></label><label className="composer-upload"><AudioLines size={16} /> {t.audio}<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4" onChange={chooseFile} hidden /></label></div><button className="primary-button small" disabled={busy || !content.trim()}><Send size={15} /> {busy ? t.publishing : t.publish}</button></div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <p className="composer-note">{language === 'vi' ? 'Bài đăng công khai. Chỉ chọn dự án đã công bố; đăng bài không tự tạo dự án.' : 'Posts are public. You can link a published project; posting never creates a project.'}</p>
    </form>
    <div className="content-tabs topic-filters"><button className={!filter && !feedTab ? 'active' : ''} onClick={() => setSearchParams({})}>{t.forYou}</button><button className={feedTab === 'following' ? 'active' : ''} onClick={() => { setLimit(30); setSearchParams({ tab:'following' }) }}>Following</button><button className={feedTab === 'saved' ? 'active' : ''} onClick={() => { setLimit(30); setSearchParams({ tab:'saved' }) }}>Saved</button>{topics.map(([key,label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setSearchParams({ topic:key })}>{label}</button>)}</div>
    <div className="section-title community-real-heading"><h2>{language === 'vi' ? 'Bài đăng cộng đồng' : 'Community posts'}</h2></div>
    {loading ? <LoadingState /> : error && !posts.length ? <ErrorState message={error} retry={load} /> : !posts.length ? <EmptyState title={t.feedEmpty} description={t.feedEmptyDesc} /> : posts.map((post) => <PostCard key={post.id} post={post} poll={polls[post.id]} onRefresh={() => load().catch((caught) => { setError(caught.message); setLoading(false) })} />)}{!loading && posts.length >= limit && <button className="secondary-button feed-more" onClick={() => setLimit((value) => value+30)}>Xem thêm bài đăng</button>}</div>
    </div>
  </div>
}

export function ProjectActivityPage() {
  const { projectId } = useParams()
  const [project,setProject] = useState(null)
  const [posts,setPosts] = useState([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    const [one,linked] = await Promise.all([
      loadPublicProjects({ id:projectId }).then((data) => ({ data:data[0] })),
      supabase.from('posts').select('*,author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path),reactions(id,user_id,kind),comments(id,content,author:profiles!comments_user_id_fkey(username,display_name))').eq('project_id',projectId).eq('status','published').in('visibility',['public','showcase']).order('published_at',{ ascending:false }).limit(60),
    ])
    if (one.error || linked.error) setError(one.error?.message || linked.error?.message)
    else { setProject(one.data); setPosts(linked.data || []) }
    setLoading(false)
  },[projectId])
  useEffect(() => { load() },[load])
  return <div className="content-page project-activity"><Link to="/projects">← Projects · Dự án</Link>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={load} /> : !project ? <EmptyState title="Project unavailable" description="This project is not public." /> : <><section className="glass-card settings-panel"><span className="eyebrow purple">LINKED POSTS · BÀI VIẾT LIÊN KẾT</span><h1>{project.name}</h1><p>{project.summary}</p><small>By {project.owner?.display_name || project.owner?.username}</small><p>Posts below explicitly link this public project. Private drafts and unlinked mentions never appear here.</p></section><div className="activity-posts">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onRefresh={() => load().catch((caught) => { setError(caught.message); setLoading(false) })} />) : <EmptyState title="No linked posts yet" description="Creators can choose this project in the Feed composer to contribute." />}</div></>}</div>
}
