import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BookOpen, Bookmark, BriefcaseBusiness, ChevronLeft, ChevronRight, Clapperboard, Clock3, Dices, Film, Flame, Gamepad2, HeartHandshake, Palette, Search, Sparkles, UsersRound } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase } from '../lib/supabase'
import { readSavedProjectGroups, toggleSavedProjectGroup } from '../lib/savedProjectGroups'
import { loadPublicProjects } from '../lib/publicProjects'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'

const categories = [
  { key: 'all', label: 'Tất cả', icon: Sparkles, tone: 'blue' },
  { key: 'game', label: 'Game', icon: Gamepad2, tone: 'violet' },
  { key: 'story', label: 'Truyện', icon: BookOpen, tone: 'rose' },
  { key: 'comic', label: 'Comic', icon: Palette, tone: 'cyan' },
  { key: 'rpg', label: 'RPG', icon: Dices, tone: 'indigo' },
  { key: 'visual', label: 'Visual Novel', icon: BookOpen, tone: 'lilac' },
  { key: 'film', label: 'Phim', icon: Clapperboard, tone: 'amber' },
  { key: 'animation', label: 'Animation', icon: Film, tone: 'teal' },
]

const facets = [
  { key: 'all', label: 'Tất cả dự án', icon: BriefcaseBusiness },
  { key: 'friends', label: 'Từ bạn bè', icon: UsersRound },
  { key: 'following', label: 'Đang theo dõi', icon: HeartHandshake },
  { key: 'active', label: 'Đang thảo luận', icon: Flame },
  { key: 'creators', label: 'Tác giả nổi bật', icon: Sparkles },
  { key: 'funding', label: 'Đang tìm vốn', icon: BriefcaseBusiness },
  { key: 'latest', label: 'Mới công bố', icon: Clock3 },
]

function categoryMatches(project, key) {
  const type = project.project_type?.toLowerCase() || ''
  if (key === 'all') return true
  if (key === 'game') return ['game', 'game event'].includes(type)
  if (key === 'story') return ['novel', 'story'].includes(type)
  if (key === 'visual') return type === 'visual novel'
  if (key === 'film') return ['film', 'movie'].includes(type)
  return type === key
}

const seeksFunding = (project) => project.looking_for?.some((value) => /funding|gọi vốn|tìm vốn/i.test(value)) || false
const byRecent = (a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)
const countBy = (rows, field) => { const counts = {}; for (const row of rows || []) counts[row[field]] = (counts[row[field]] || 0) + 1; return counts }

function ProjectPoster({ project, rank, saved, onSave }) {
  const cover = publicStorageUrl('project-media', project.cover_path)
  return <article className="discovery-poster glass-card">
    <Link className="discovery-poster-link" to={`/projects/${project.id}`} aria-label={`Mở dự án ${project.name}`}>
      <div className="discovery-cover">{cover ? <img src={cover} loading="lazy" alt={`Bìa dự án ${project.name}`} /> : <span className="discovery-cover-placeholder" aria-hidden="true">{project.name?.slice(0, 1)?.toUpperCase() || 'M'}</span>}{rank && <span className="discovery-rank">#{rank} · Bài liên kết</span>}</div>
      <div className="discovery-poster-body"><small>{project.project_type} · {project.genre || project.stage}</small><h3>{project.name}</h3><p>{project.summary || 'Chưa có mô tả.'}</p><span>{project.owner?.display_name || project.owner?.username || 'Người sáng tạo'}</span>{seeksFunding(project) && <b>Đang tìm vốn</b>}</div>
    </Link>
    <button type="button" className={`discovery-save${saved ? ' active' : ''}`} onClick={() => onSave(project.id)} aria-pressed={saved} aria-label={saved ? `Bỏ lưu nhóm dự án ${project.name}` : `Lưu nhóm dự án ${project.name}`} title={saved ? 'Bỏ lưu' : 'Lưu nhóm dự án'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} /></button>
  </article>
}

export default function ProjectDiscoveryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const stripRef = useRef(null)
  const [projects, setProjects] = useState(null)
  const [friendIds, setFriendIds] = useState(new Set())
  const [followedIds, setFollowedIds] = useState(new Set())
  const [activity, setActivity] = useState({})
  const [followers, setFollowers] = useState({})
  const [savedVersion, setSavedVersion] = useState(0)
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [facet, setFacet] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const publicProjects = await loadPublicProjects()
      if (!active) return
      setProjects(publicProjects)
      const ids = publicProjects.map((item) => item.id)
      const owners = [...new Set(publicProjects.map((item) => item.owner_id))]
      const [friends, following, posts, follows] = await Promise.all([
        user ? supabase.from('friendships').select('requester_id,addressee_id').eq('status', 'accepted').or(`requester_id.eq.${user?.id},addressee_id.eq.${user?.id}`) : Promise.resolve({ data:[] }),
        user ? supabase.from('follows').select('following_id').eq('follower_id', user?.id) : Promise.resolve({ data:[] }),
        ids.length ? supabase.from('posts').select('project_id').in('project_id', ids).eq('status', 'published').in('visibility', ['public', 'showcase']).limit(5000) : Promise.resolve({ data: [] }),
        owners.length ? supabase.from('follows').select('following_id').in('following_id', owners).limit(5000) : Promise.resolve({ data: [] }),
      ])
      if (!active) return
      if (!friends.error) setFriendIds(new Set((friends.data || []).map((row) => row.requester_id === user?.id ? row.addressee_id : row.requester_id)))
      if (!following.error) setFollowedIds(new Set((following.data || []).map((row) => row.following_id)))
      if (!posts.error) setActivity(countBy(posts.data, 'project_id'))
      if (!follows.error) setFollowers(countBy(follows.data, 'following_id'))
    }
    load().catch((caught) => { if (active) { setError(caught.message); setProjects([]) } })
    return () => { active = false }
  }, [user?.id])

  const filtered = useMemo(() => {
    const search = query.trim().toLocaleLowerCase()
    return (projects || []).filter((item) => categoryMatches(item, category))
      .filter((item) => !search || [item.name, item.summary, item.genre, item.owner?.display_name, item.owner?.username].some((part) => part?.toLocaleLowerCase().includes(search)))
      .filter((item) => facet !== 'friends' || friendIds.has(item.owner_id))
      .filter((item) => facet !== 'following' || followedIds.has(item.owner_id))
      .filter((item) => facet !== 'funding' || seeksFunding(item))
      .filter((item) => facet !== 'active' || activity[item.id] > 0)
      .filter((item) => facet !== 'creators' || followers[item.owner_id] > 0)
      .sort((a, b) => facet === 'active' ? (activity[b.id] || 0) - (activity[a.id] || 0) || byRecent(a, b)
        : facet === 'creators' ? (followers[b.owner_id] || 0) - (followers[a.owner_id] || 0) || byRecent(a, b) : byRecent(a, b))
  }, [projects, category, facet, query, friendIds, followedIds, activity, followers])
  const featured = useMemo(() => [...(projects || [])].filter((item) => categoryMatches(item, category) && activity[item.id] > 0)
    .sort((a, b) => (activity[b.id] || 0) - (activity[a.id] || 0) || byRecent(a, b)).slice(0, 6), [projects, category, activity])
  const rankings = Object.fromEntries(featured.map((item, index) => [item.id, index + 1]))
  const savedIds = useMemo(() => readSavedProjectGroups(user?.id), [user?.id, savedVersion])
  const toggleSave = (projectId) => { if (!user) { navigate('/login'); return } try { toggleSavedProjectGroup(user?.id, projectId); setSavedVersion((version) => version + 1) } catch { setError('Không lưu được trên thiết bị này.') } }
  const poster = (project, rank) => <ProjectPoster key={project.id} project={project} rank={rank} saved={savedIds.includes(project.id)} onSave={toggleSave} />

  return <div className="content-page discovery-page">
    <section className="mora-screen discovery-first-screen" aria-label="Khám phá dự án">
      <div className="discovery-types-heading"><h1>Thể loại</h1><div><button type="button" aria-label="Lướt thể loại về trái" onClick={() => stripRef.current?.scrollBy({ left: -430, behavior: 'smooth' })}><ChevronLeft size={18} /></button><button type="button" aria-label="Lướt thể loại về phải" onClick={() => stripRef.current?.scrollBy({ left: 430, behavior: 'smooth' })}><ChevronRight size={18} /></button></div></div>
      <div className="discovery-type-strip" ref={stripRef} aria-label="Thể loại dự án">{categories.map(({ key, label, icon: Icon, tone }) => <button type="button" key={key} className={`discovery-type-${tone}${category === key ? ' active' : ''}`} aria-pressed={category === key} onClick={() => setCategory(key)}><Icon size={22} strokeWidth={1.7} aria-hidden="true" /><span>{label}</span><ArrowRight size={15} aria-hidden="true" /></button>)}</div>
      <div className="discovery-layout"><aside className="discovery-filters glass-card" aria-label="Bộ lọc dự án"><h2>Khám phá theo</h2><div>{facets.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={facet === key ? 'active' : ''} aria-pressed={facet === key} onClick={() => setFacet(key)}><Icon size={17} />{label}</button>)}<button type="button" disabled title="Chưa có trạng thái gọi vốn được xác minh"><HeartHandshake size={17} />Đã gọi vốn <small>Chờ xác minh</small></button></div><Link to="/studio/projects">Dự án của tôi <ArrowRight size={15} /></Link></aside>
        <main className="discovery-results"><div className="discovery-result-head"><div><h2>{facets.find((item) => item.key === facet)?.label}</h2><small>{filtered.length} dự án công khai</small></div><label className="discovery-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm dự án, tác giả…" aria-label="Tìm dự án" /></label></div>{projects === null ? <LoadingState /> : error ? <ErrorState message={error} /> : filtered.length ? <div className="discovery-grid">{filtered.map((item) => poster(item, facet === 'active' ? rankings[item.id] : null))}</div> : <EmptyState title="Chưa có dự án phù hợp" description="Thử chọn thể loại hoặc bộ lọc khác." action={<Link className="secondary-button" to="/studio/projects">Tạo dự án</Link>} />}</main>
      </div>
    </section>
    {featured.length > 0 && <section className="mora-screen discovery-featured" aria-label="Dự án có thảo luận"><div className="project-library-heading"><h2>Đang được thảo luận</h2><small>Xếp theo số bài công khai liên kết dự án trong danh sách đã tải.</small></div><div className="discovery-featured-scroll">{featured.map((item) => poster(item, rankings[item.id]))}</div></section>}
  </div>
}
