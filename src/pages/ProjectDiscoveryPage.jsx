import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, BriefcaseBusiness, ChevronLeft, ChevronRight, Clock3, Flame, HeartHandshake, Search, Sparkles, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase } from '../lib/supabase'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'

const categories = [
  { key: 'all', label: 'Tất cả' },
  { key: 'game', label: 'Game' },
  { key: 'story', label: 'Truyện' },
  { key: 'comic', label: 'Comic' },
  { key: 'rpg', label: 'RPG' },
  { key: 'visual', label: 'Visual Novel' },
  { key: 'animation', label: 'Animation' },
]

const facets = [
  { key: 'all', label: 'Tất cả dự án', icon: BriefcaseBusiness },
  { key: 'friends', label: 'Từ bạn bè', icon: UsersRound },
  { key: 'following', label: 'Đang theo dõi', icon: HeartHandshake },
  { key: 'active', label: 'Hoạt động sôi nổi', icon: Flame },
  { key: 'creators', label: 'Tác giả được theo dõi', icon: Sparkles },
  { key: 'funding', label: 'Đang tìm vốn', icon: BriefcaseBusiness },
  { key: 'latest', label: 'Mới công bố', icon: Clock3 },
]

const categoryMatches = (project, key) => {
  const type = project.project_type?.toLowerCase() || ''
  if (key === 'all') return true
  if (key === 'game') return ['game', 'game event'].includes(type)
  if (key === 'story') return ['novel', 'story'].includes(type)
  if (key === 'visual') return type === 'visual novel'
  return type === key
}

const seeksFunding = (project) => project.looking_for?.some((value) => /funding|gọi vốn|tìm vốn/i.test(value)) || false
const byRecent = (a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)
const countBy = (rows, field) => { const counts = {}; for (const row of rows || []) counts[row[field]] = (counts[row[field]] || 0) + 1; return counts }

function ProjectPoster({ project, rank }) {
  const cover = publicStorageUrl('project-media', project.cover_path)
  return <Link className="discovery-poster glass-card" to={`/projects/${project.id}`} aria-label={`Mở dự án ${project.name}`}>
    <div className="discovery-cover">{cover ? <img src={cover} loading="lazy" alt={`Bìa dự án ${project.name}`} /> : <span className="discovery-cover-placeholder" aria-hidden="true">{project.name?.slice(0, 1)?.toUpperCase() || 'M'}</span>}{rank && <span className="discovery-rank">#{rank} · Bài liên kết</span>}</div>
    <div className="discovery-poster-body"><small>{project.project_type} · {project.genre || project.stage}</small><h3>{project.name}</h3><p>{project.summary || 'Tác giả chưa viết mô tả công khai.'}</p><span>{project.owner?.display_name || project.owner?.username || 'Người sáng tạo'}</span>{seeksFunding(project) && <b>Đang tìm vốn</b>}</div>
  </Link>
}

export default function ProjectDiscoveryPage() {
  const { user } = useAuth()
  const stripRef = useRef(null)
  const [projects, setProjects] = useState(null)
  const [friendIds, setFriendIds] = useState(new Set())
  const [followedIds, setFollowedIds] = useState(new Set())
  const [activity, setActivity] = useState({})
  const [followers, setFollowers] = useState({})
  const [error, setError] = useState('')
  const [category, setCategory] = useState('all')
  const [facet, setFacet] = useState('all')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const { data, error: projectsError } = await supabase.from('projects')
        .select('id,name,summary,genre,project_type,stage,cover_path,looking_for,published_at,created_at,owner_id,owner:profiles!projects_owner_id_fkey(id,username,display_name)')
        .eq('status', 'published').in('visibility', ['public', 'showcase'])
        .order('published_at', { ascending: false }).limit(100)
      if (!active) return
      if (projectsError) { setError(projectsError.message); setProjects([]); return }
      const publicProjects = data || []
      setProjects(publicProjects)
      const ids = publicProjects.map((item) => item.id)
      const owners = [...new Set(publicProjects.map((item) => item.owner_id))]
      const [friends, following, posts, follows] = await Promise.all([
        supabase.from('friendships').select('requester_id,addressee_id').eq('status', 'accepted').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`),
        supabase.from('follows').select('following_id').eq('follower_id', user.id),
        ids.length ? supabase.from('posts').select('project_id').in('project_id', ids).eq('status', 'published').in('visibility', ['public', 'showcase']).limit(5000) : Promise.resolve({ data: [] }),
        owners.length ? supabase.from('follows').select('following_id').in('following_id', owners).limit(5000) : Promise.resolve({ data: [] }),
      ])
      if (!active) return
      if (!friends.error) setFriendIds(new Set((friends.data || []).map((row) => row.requester_id === user.id ? row.addressee_id : row.requester_id)))
      if (!following.error) setFollowedIds(new Set((following.data || []).map((row) => row.following_id)))
      if (!posts.error) setActivity(countBy(posts.data, 'project_id'))
      if (!follows.error) setFollowers(countBy(follows.data, 'following_id'))
    }
    load().catch((caught) => { if (active) { setError(caught.message); setProjects([]) } })
    return () => { active = false }
  }, [user.id])

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

  return <div className="content-page discovery-page">
    <header className="discovery-heading"><span className="eyebrow purple">KHÁM PHÁ · MORA</span><h1>Khám phá dự án</h1><p>Tìm game, truyện và các ý tưởng được tác giả chủ động công khai. Dự án riêng của bạn nằm trong Không gian của tôi.</p></header>
    <section className="discovery-types" aria-label="Thể loại dự án"><div className="discovery-types-heading"><strong>Thể loại</strong><div><button type="button" aria-label="Lướt thể loại về trái" onClick={() => stripRef.current?.scrollBy({ left: -430, behavior: 'smooth' })}><ChevronLeft size={18} /></button><button type="button" aria-label="Lướt thể loại về phải" onClick={() => stripRef.current?.scrollBy({ left: 430, behavior: 'smooth' })}><ChevronRight size={18} /></button></div></div><div className="discovery-type-strip" ref={stripRef}>{categories.map((item) => <button type="button" key={item.key} className={category === item.key ? 'active' : ''} aria-pressed={category === item.key} onClick={() => setCategory(item.key)}>{item.label}<ArrowRight size={15} /></button>)}</div></section>
    {featured.length > 0 && <section className="discovery-featured"><div className="section-title"><div><span className="eyebrow purple">CỘNG ĐỒNG ĐANG CHIA SẺ</span><h2>Dự án có hoạt động công khai</h2><p>Xếp theo số bài đăng công khai gắn với dự án trong danh sách đã tải.</p></div></div><div className="discovery-featured-scroll">{featured.map((item) => <ProjectPoster key={item.id} project={item} rank={rankings[item.id]} />)}</div></section>}
    <div className="discovery-layout"><aside className="discovery-filters glass-card" aria-label="Bộ lọc dự án"><h2>Khám phá theo</h2><div>{facets.map(({ key, label, icon: Icon }) => <button type="button" key={key} className={facet === key ? 'active' : ''} aria-pressed={facet === key} onClick={() => setFacet(key)}><Icon size={17} />{label}</button>)}<button type="button" disabled title="Chưa có trạng thái gọi vốn được xác minh"><HeartHandshake size={17} />Đã gọi vốn thành công <small>Chờ xác minh</small></button></div><Link to="/studio/projects">Dự án của tôi <ArrowRight size={15} /></Link></aside><main className="discovery-results"><div className="discovery-result-head"><div><span className="eyebrow purple">DỰ ÁN CỦA CỘNG ĐỒNG</span><h2>{facets.find((item) => item.key === facet)?.label}</h2><p>{filtered.length} dự án công khai trong danh sách đã tải</p></div><label className="discovery-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên, tác giả, thể loại…" aria-label="Tìm dự án" /></label></div>{projects === null ? <LoadingState /> : error ? <ErrorState message={error} /> : filtered.length ? <div className="discovery-grid">{filtered.map((item) => <ProjectPoster key={item.id} project={item} rank={facet === 'active' ? rankings[item.id] : null} />)}</div> : <EmptyState title="Chưa có dự án phù hợp" description={facet === 'funding' ? 'Chưa có dự án công khai đánh dấu đang tìm vốn trong thể loại này.' : 'Thử chọn thể loại hoặc bộ lọc khác. Dự án riêng tư không xuất hiện ở đây.'} action={<Link className="secondary-button" to="/studio/projects">Tạo dự án của tôi</Link>} />}</main></div>
    <section className="discovery-sample" aria-label="Kịch bản minh họa"><div><span className="eyebrow purple">KỊCH BẢN MẪU · KHÔNG PHẢI DỰ ÁN THẬT</span><h2>Xem thử một nhóm sáng tạo</h2><p>Morimori và các hồ sơ liên quan là ví dụ giao diện, nằm ngoài danh sách và xếp hạng của người dùng thật.</p></div><Link className="discovery-sample-card glass-card" to="/community#community-project"><span className="discovery-sample-art">M</span><span><small>GAME · MẪU</small><strong>Morimori</strong><small>Mabi và nhóm · kịch bản minh họa</small></span></Link></section>
  </div>
}
