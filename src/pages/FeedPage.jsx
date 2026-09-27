import { useCallback, useEffect, useState } from 'react'
import { AudioLines, BarChart3, Bookmark, Heart, Image as ImageIcon, MessageCircle, Send, Share2, Video } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { publicStorageUrl, supabase } from '../lib/supabase'

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
  const [saved, setSaved] = useState(() => { try { return JSON.parse(localStorage.getItem('mora-saved-posts') || '[]').includes(post.id) } catch { return false } })
  const liked = post.reactions?.some((item) => item.user_id === user.id && item.kind === 'like')
  async function like() {
    setBusy(true)
    const existing = post.reactions?.find((item) => item.user_id === user.id && item.kind === 'like')
    const result = existing ? await supabase.from('reactions').delete().eq('id', existing.id) : await supabase.from('reactions').insert({ user_id:user.id, post_id:post.id, kind:'like' })
    setBusy(false); if (result.error) setError(result.error.message); else onRefresh()
  }
  async function submitComment(event) {
    event.preventDefault(); if (!comment.trim()) return
    setBusy(true); setError('')
    const { error: insertError } = await supabase.from('comments').insert({ user_id:user.id, post_id:post.id, content:comment.trim() })
    setBusy(false); if (insertError) setError(insertError.message); else { setComment(''); onRefresh() }
  }
  async function vote(optionId) {
    setBusy(true); setError('')
    const { error: voteError } = await supabase.from('post_poll_votes').upsert({ post_id:post.id, user_id:user.id, option_id:optionId }, { onConflict:'post_id,user_id' })
    setBusy(false); if (voteError) setError(voteError.message); else onRefresh()
  }
  async function share() {
    const url = `${location.origin}${import.meta.env.BASE_URL}feed?post=${encodeURIComponent(post.id)}`
    try { if (navigator.share) await navigator.share({ url }); else { await navigator.clipboard.writeText(url); setError('Link copied · Đã sao chép liên kết.') } } catch { /* Canceling the share sheet is not an error. */ }
  }
  function save() {
    let existing = []; try { existing = JSON.parse(localStorage.getItem('mora-saved-posts') || '[]') } catch { /* Corrupt local bookmark list. */ }
    const values = new Set(existing)
    if (saved) values.delete(post.id); else values.add(post.id)
    localStorage.setItem('mora-saved-posts', JSON.stringify([...values]))
    setSaved(!saved)
  }
  return <article id={`post-${post.id}`} className="post-card glass-card"><header className="post-header"><PostAvatar person={post.author} /><div><strong>{post.author?.display_name || post.author?.username}</strong><span>@{post.author?.username} · {new Date(post.published_at || post.created_at).toLocaleDateString()}</span></div></header>
    {post.content_type === 'poll' && <span className="post-type"><BarChart3 size={14} /> Poll · Bình chọn</span>}
    {post.content_type === 'discussion' && <span className="post-type"><MessageCircle size={14} /> Discussion · Thảo luận</span>}
    <p className="post-text">{post.content}</p>
    <PostMedia mediaPaths={post.media_paths || []} />
    {post.project?.status === 'published' && ['public','showcase'].includes(post.project.visibility) && <Link className="linked-project" to={`/projects/${post.project.id}/activity`}>↗ {post.project.name} · Public project</Link>}
    {!!post.hashtags?.length && <div className="post-topics">{post.hashtags.map((tag) => <Link key={tag} to={`/feed?topic=${encodeURIComponent(tag)}`}>#{topics.find(([key]) => key === tag)?.[1] || tag}</Link>)}</div>}
    {!!poll?.options?.length && <div className="post-poll">{poll.options.map((option) => <button type="button" key={option.id} disabled={busy} className={poll.myVote === option.id ? 'selected' : ''} onClick={() => vote(option.id)}><span>{option.label}</span><small>{poll.counts?.[option.id] || 0} votes</small></button>)}</div>}
    <footer className="post-actions"><button disabled={busy} className={liked ? 'liked' : ''} onClick={like} aria-label="Like"><Heart /> {post.reactions?.length || 0}</button><button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><MessageCircle /> {post.comments?.length || 0}</button><button className={saved ? 'liked' : ''} onClick={save} title="Saved only on this device"><Bookmark /></button><button onClick={share} aria-label="Share"><Share2 /></button></footer>
    {expanded && <section className="post-comments"><h4>Discussion · Bình luận</h4>{post.comments?.map((item) => <p key={item.id}><strong>{item.author?.display_name || item.author?.username}</strong> {item.content}</p>)}<form onSubmit={submitComment}><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={5000} placeholder="Write a comment / Viết bình luận" aria-label="Write a comment" /><button className="secondary-button" disabled={!comment.trim() || busy}><Send size={15} /></button></form></section>}
    {error && <p className="form-message error" role="status">{error}</p>}
  </article>
}

export default function FeedPage() {
  const { user, profile } = useAuth()
  const { language, t } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [content, setContent] = useState('')
  const [kind, setKind] = useState('article')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [topic, setTopic] = useState('')
  const [projectId, setProjectId] = useState('')
  const [options, setOptions] = useState(['',''])
  const [projects, setProjects] = useState([])
  const filter = searchParams.get('topic') || ''
  const [posts, setPosts] = useState([])
  const [polls, setPolls] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { supabase.from('projects').select('id,name').eq('status','published').in('visibility',['public','showcase']).order('published_at',{ ascending:false }).limit(100).then(({ data }) => setProjects(data || [])) }, [])
  useEffect(() => { if (!file) { setPreview(''); return undefined } const url = URL.createObjectURL(file); setPreview(url); return () => URL.revokeObjectURL(url) }, [file])
  const load = useCallback(async () => {
    setLoading(true); setError('')
    let query = supabase.from('posts').select('*,author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path),project:projects!posts_project_id_fkey(id,name,visibility,status),reactions(id,user_id,kind),comments(id,content,created_at,author:profiles!comments_user_id_fkey(username,display_name))').eq('status','published').in('visibility',['public','showcase']).order('published_at',{ ascending:false }).limit(30)
    if (filter) query = query.contains('hashtags',[filter])
    const result = await query
    if (result.error) { setError(result.error.message); setLoading(false); return }
    setPosts(result.data || [])
    const ids = (result.data || []).filter((item) => item.content_type === 'poll').map((item) => item.id)
    if (ids.length) {
      const [opts, own] = await Promise.all([supabase.from('post_poll_options').select('id,post_id,label,position').in('post_id',ids).order('position'),supabase.from('post_poll_votes').select('post_id,option_id').eq('user_id',user.id).in('post_id',ids)])
      if (!opts.error && !own.error) {
        const results = await Promise.all(ids.map((id) => supabase.rpc('get_poll_results',{ target_post_id:id })))
        setPolls(Object.fromEntries(ids.map((id,index) => [id,{ options:(opts.data || []).filter((item) => item.post_id === id), myVote:own.data?.find((item) => item.post_id === id)?.option_id, counts:Object.fromEntries((results[index].data || []).map((item) => [item.option_id,Number(item.votes)])) }])))
      }
    }
    setLoading(false)
  }, [filter,user.id])
  useEffect(() => { load() }, [load])
  useEffect(() => { const id = searchParams.get('post'); if (id && !loading) document.getElementById(`post-${id}`)?.scrollIntoView({ block:'center' }) }, [loading,searchParams])

  function chooseFile(event) {
    const next = event.target.files?.[0]
    event.target.value = ''
    if (!next) return
    if (!types[next.type]) { setError('Unsupported file type. Use JPG, PNG, WebP, GIF, MP4, WebM, MP3, WAV, OGG or M4A.'); return }
    const limit = next.type.startsWith('image/') ? 8 : 40
    if (next.size > limit * 1024 * 1024) { setError(`File must be under ${limit} MB.`); return }
    setFile(next); setKind(next.type.split('/')[0]); setError('')
  }
  async function publish(event) {
    event.preventDefault(); if (!content.trim() || busy) return
    const choices = options.map((value) => value.trim()).filter(Boolean)
    if (kind === 'poll' && (choices.length < 2 || new Set(choices).size !== choices.length)) { setError('A poll needs at least two different options.'); return }
    setBusy(true); setError('')
    let uploaded = null; let createdId = null
    try {
      if (kind === 'poll') { const check = await supabase.from('post_poll_options').select('id').limit(1); if (check.error) throw new Error('Polls require the pending Supabase migration before they can be published.') }
      if (projectId) { const { data, error: projectError } = await supabase.from('projects').select('id').eq('id',projectId).eq('status','published').in('visibility',['public','showcase']).maybeSingle(); if (projectError || !data) throw new Error('The linked project is no longer public. Select another project.') }
      let mediaPaths = []
      if (file) {
        const bucket = file.type.startsWith('image/') ? 'project-media' : 'post-media'
        const path = `${user.id}/${crypto.randomUUID()}.${types[file.type]}`
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path,file,{ contentType:file.type,cacheControl:'3600' })
        if (uploadError) throw new Error(bucket === 'post-media' ? `Video/audio uploads require the pending Supabase migration: ${uploadError.message}` : uploadError.message)
        uploaded = { bucket,path }; mediaPaths = [bucket === 'post-media' ? `post-media:${path}` : path]
      }
      const { data, error: insertError } = await supabase.from('posts').insert({ user_id:user.id, content:content.trim(), content_type:kind, media_paths:mediaPaths, hashtags:topic ? [topic] : [], project_id:projectId || null, language:language === 'vi' ? 'Vietnamese' : language === 'en' ? 'English' : language, status:kind === 'poll' ? 'draft' : 'published', visibility:'public', published_at:kind === 'poll' ? null : new Date().toISOString() }).select('id').single()
      if (insertError) throw insertError
      createdId = data.id
      if (kind === 'poll') {
        const { error: optionError } = await supabase.from('post_poll_options').insert(choices.map((label,position) => ({ post_id:createdId,label,position })))
        if (optionError) throw optionError
        const { error: publishError } = await supabase.from('posts').update({ status:'published',published_at:new Date().toISOString() }).eq('id',createdId)
        if (publishError) throw publishError
      }
      setContent(''); setKind('article'); setFile(null); setTopic(''); setProjectId(''); setOptions(['','']); await load()
    } catch (caught) {
      if (createdId) await supabase.from('posts').delete().eq('id',createdId)
      if (uploaded) await supabase.storage.from(uploaded.bucket).remove([uploaded.path])
      setError(caught.message)
    } finally { setBusy(false) }
  }

  return <div className="content-page"><section className="welcome-row"><div><span className="eyebrow purple">MORA · CREATE & CONNECT</span><h1>{t.welcomeBack}, {profile?.display_name || profile?.username}</h1><p>{t.feedIntro}</p></div></section>
    <div className="feed-layout"><div className="feed-main"><form className="composer glass-card new-composer" onSubmit={publish}><div className="composer-top"><PostAvatar person={profile} /><textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={t.compose} maxLength={5000} aria-label={t.compose} /></div>
      <div className="composer-kinds"><button type="button" className={kind === 'article' ? 'selected' : ''} onClick={() => { setKind('article'); setFile(null) }}>Text</button><button type="button" className={kind === 'discussion' ? 'selected' : ''} onClick={() => { setKind('discussion'); setFile(null) }}>{t.discussion}</button><button type="button" className={kind === 'poll' ? 'selected' : ''} onClick={() => { setKind('poll'); setFile(null) }}><BarChart3 size={15} /> {t.poll}</button></div>
      {kind === 'poll' && <div className="poll-inputs">{options.map((option,index) => <input key={index} value={option} maxLength={140} onChange={(event) => setOptions((old) => old.map((item,i) => i === index ? event.target.value : item))} placeholder={`Option ${index + 1}`} aria-label={`Poll option ${index + 1}`} />)}{options.length < 8 && <button type="button" onClick={() => setOptions([...options,''])}>+ Add option</button>}</div>}
      {preview && <div className="upload-preview">{file?.type.startsWith('image/') ? <img src={preview} alt="Preview" /> : file?.type.startsWith('video/') ? <video src={preview} controls /> : <audio src={preview} controls />}<button className="secondary-button" type="button" onClick={() => { setFile(null); setKind('article') }}>Remove</button></div>}
      <div className="composer-context"><label>{t.topic}<select value={topic} onChange={(event) => setTopic(event.target.value)}><option value="">All topics</option>{topics.map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>{t.linkedProject}<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">{t.noProject}</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
      <div className="composer-actions"><div><label className="composer-upload"><ImageIcon size={16} /> {t.image}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseFile} hidden /></label><label className="composer-upload"><Video size={16} /> {t.video}<input type="file" accept="video/mp4,video/webm" onChange={chooseFile} hidden /></label><label className="composer-upload"><AudioLines size={16} /> {t.audio}<input type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4" onChange={chooseFile} hidden /></label></div><button className="primary-button small" disabled={busy || !content.trim()}><Send size={15} /> {busy ? t.publishing : t.publish}</button></div>
      {error && <p className="form-message error" role="alert">{error}</p>}
      <p className="composer-note">{language === 'vi' ? 'Bài đăng công khai. Chỉ chọn dự án đã công bố; đăng bài không tự tạo dự án.' : 'Posts are public. You can link a published project; posting never creates a project.'}</p>
    </form>
    <div className="content-tabs topic-filters"><button className={!filter ? 'active' : ''} onClick={() => setSearchParams({})}>{t.forYou}</button>{topics.map(([key,label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setSearchParams({ topic:key })}>{label}</button>)}</div>
    {loading ? <LoadingState /> : error && !posts.length ? <ErrorState message={error} retry={load} /> : !posts.length ? <EmptyState title={t.feedEmpty} description={t.feedEmptyDesc} /> : posts.map((post) => <PostCard key={post.id} post={post} poll={polls[post.id]} onRefresh={load} />)}</div>
    <aside className="feed-right"><section className="glass-card side-widget"><h3>{t.rights}</h3><p>{t.rightsText}</p></section><section className="glass-card side-widget"><h3>{t.demo}</h3><p>{language === 'vi' ? 'Xem ví dụ về Thế giới, Dự án, bài viết và khóa học. Đây là nội dung minh họa, không nằm trong dữ liệu thật.' : 'Explore a fictional world, project, posts and course. The example is separate from real user data.'}</p><Link className="secondary-button" to="/demo">{t.demo}</Link></section></aside></div>
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
      supabase.from('projects').select('id,name,summary,owner:profiles!projects_owner_id_fkey(username,display_name)').eq('id',projectId).eq('status','published').in('visibility',['public','showcase']).maybeSingle(),
      supabase.from('posts').select('*,author:profiles!posts_user_id_fkey(id,username,display_name,avatar_path),project:projects!posts_project_id_fkey(id,name,visibility,status),reactions(id,user_id,kind),comments(id,content,author:profiles!comments_user_id_fkey(username,display_name))').eq('project_id',projectId).eq('status','published').in('visibility',['public','showcase']).order('published_at',{ ascending:false }).limit(60),
    ])
    if (one.error || linked.error) setError(one.error?.message || linked.error?.message)
    else { setProject(one.data); setPosts(linked.data || []) }
    setLoading(false)
  },[projectId])
  useEffect(() => { load() },[load])
  return <div className="content-page project-activity"><Link to="/projects">← Projects · Dự án</Link>{loading ? <LoadingState /> : error ? <ErrorState message={error} retry={load} /> : !project ? <EmptyState title="Project unavailable" description="This project is not public." /> : <><section className="glass-card settings-panel"><span className="eyebrow purple">LINKED POSTS · BÀI VIẾT LIÊN KẾT</span><h1>{project.name}</h1><p>{project.summary}</p><small>By {project.owner?.display_name || project.owner?.username}</small><p>Posts below explicitly link this public project. Private drafts and unlinked mentions never appear here.</p></section><div className="activity-posts">{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} onRefresh={load} />) : <EmptyState title="No linked posts yet" description="Creators can choose this project in the Feed composer to contribute." />}</div></>}</div>
}
