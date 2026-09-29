import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Link2 } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import CharacterGallery from '../components/CharacterGallery'
import ProjectBoard from '../components/ProjectBoard'
import { ProjectWorkspaceNav } from '../components/ProjectWorkspaceShell'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { publicStorageUrl, supabase } from '../lib/supabase'

const tabs = ['overview', 'story', 'character', 'land', 'reference', 'events', 'contact']
const labels = { overview: 'Tổng quan', story: 'Lore & câu chuyện', character: 'Nhân vật', land: 'Vùng đất', reference: 'Hình ảnh & tài liệu', events: 'Sự kiện', contact: 'Liên hệ' }
const safeLinks = (links) => Object.entries(links || {}).filter(([, value]) => {
  try { return ['https:', 'http:'].includes(new URL(value).protocol) } catch { return false }
})

export default function PublicProjectPage() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [snapshot, setSnapshot] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [selectedId, setSelectedId] = useState(null)
  const [characterView, setCharacterView] = useState('cards')

  useEffect(() => {
    let active = true
    async function load() {
      const result = await supabase.from('projects').select('id,name,summary,description,genre,project_type,stage,cover_path,looking_for,contact_links,owner_id,owner:profiles!projects_owner_id_fkey(username,display_name)')
        .eq('id', projectId).eq('status', 'published').in('visibility', ['public', 'showcase']).maybeSingle()
      if (!active) return
      if (result.error) { setError(result.error.message); setLoading(false); return }
      if (!result.data) { setError('Dự án chưa công khai hoặc không tồn tại.'); setLoading(false); return }
      setProject(result.data)
      // The public showcase view is supplied by the collaboration migration. If it
      // is not installed yet, the public summary still works without reading drafts.
      const showcase = await supabase.from('project_showcases').select('public_snapshot').eq('id', projectId).maybeSingle()
      if (active) { if (!showcase.error && showcase.data?.public_snapshot) setSnapshot(showcase.data.public_snapshot); setLoading(false) }
    }
    load().catch((caught) => { if (active) { setError(caught.message); setLoading(false) } })
    return () => { active = false }
  }, [projectId])

  if (loading) return <LoadingState />
  if (error || !project) return <ErrorState message={error || 'Không thể mở dự án.'} />
  const sections = (snapshot.sections || []).filter((item) => item.content?.category !== 'board_element')
  const boardSections = (snapshot.sections || []).filter((item) => item.content?.category === 'board_element')
  const nodes = snapshot.nodes || []
  const content = tab === 'story' ? sections.filter((item) => ['story','lore','overview'].includes(item.section_type) || item.content?.category === 'lore')
    : tab === 'reference' ? sections.filter((item) => ['reference','document','palette','material'].includes(item.section_type))
      : sections.filter((item) => item.section_type === tab)
  const cover = publicStorageUrl('project-media', project.cover_path)
  const owner = project.owner?.display_name || project.owner?.username || 'Người sáng tạo'
  const links = safeLinks(project.contact_links)
  const imageUrl = (item) => publicStorageUrl('project-media', item?.image_path || item?.content?.image_path)

  return <div className="content-page project-public project-public-workspace"><Link to="/projects" className="project-back"><ArrowLeft size={16} /> Khám phá dự án</Link>
    <header className="project-editor-head glass-card"><div><span className="eyebrow purple">DỰ ÁN CÔNG KHAI · MORA</span><h1>{project.name}</h1><p>{project.summary || 'Tác giả chưa thêm mô tả ngắn.'}</p><small>{project.project_type} · {project.genre || project.stage} · {owner}</small></div><Link className="secondary-button" to={`/projects/${projectId}/activity`}>Bài viết về dự án <ArrowRight size={15} /></Link></header>
    <div className="project-space-layout"><ProjectWorkspaceNav title={project.name} tabs={tabs} labels={labels} active={tab} onSelect={(key) => { setTab(key); setSelectedId(null); setCharacterView('cards') }} footer="Chỉ phần tác giả chọn công bố mới xuất hiện ở đây." /><main className="project-space-main">
      <div className="project-editor-toolbar glass-card"><strong className="project-editor-toolbar-label">{labels[tab]}</strong><span className="project-public-readonly">Chế độ xem · {owner}</span></div>
      {boardSections.some((item) => item.content.board_tab === tab) && <ProjectBoard tab={tab} sections={boardSections} connecting={false} readOnly publicView />}
      {tab === 'overview' && <section className="glass-card project-public-overview">{cover && <img src={cover} alt={`Bìa dự án ${project.name}`} />}<div><span className="eyebrow purple">{project.project_type} · {project.stage}</span><h2>{project.name}</h2><p>{project.description || project.summary || 'Tác giả chưa công bố phần giới thiệu chi tiết.'}</p>{project.looking_for?.length > 0 && <p><strong>Đang tìm:</strong> {project.looking_for.join(' · ')}</p>}<button type="button" className="secondary-button" onClick={() => setTab('contact')}>Liên hệ nhóm dự án <ArrowRight size={15} /></button></div></section>}
      {tab === 'character' && <CharacterGallery projectType={project.project_type} nodes={nodes} links={snapshot.links || []} view={characterView} selectedId={selectedId} onView={setCharacterView} onSelect={setSelectedId} imageUrl={imageUrl} readOnly />}
      {tab === 'land' && (nodes.some((node) => node.canvas_kind === 'land') ? <div className="project-public-place-grid">{nodes.filter((node) => node.canvas_kind === 'land').map((node) => <article className="glass-card" key={node.id}>{imageUrl(node) && <img src={imageUrl(node)} alt="" />}<h3>{node.title}</h3><p>{Object.entries(node.details || {}).filter(([key, value]) => key !== 'flashart_data' && typeof value === 'string' && value).map(([key, value]) => `${key}: ${value}`).join(' · ')}</p></article>)}</div> : <EmptyState title="Chưa có vùng đất công khai" description="Chủ dự án chọn nội dung được phép xuất hiện ở đây." />)}
      {['story','reference'].includes(tab) && (content.length ? <div className="project-public-section-list">{content.map((item, index) => <article className="glass-card project-panel" key={index}><h2>{item.title}</h2><p>{item.content?.text}</p>{imageUrl(item) && <img className="event-sketch" src={imageUrl(item)} alt={item.title} />}{item.content?.extra && <p>{item.content.extra}</p>}</article>)}</div> : !boardSections.some((item) => item.content.board_tab === tab) && <EmptyState title="Chưa có nội dung công khai" description="Chủ dự án chưa chọn phần này để giới thiệu." />)}
      {tab === 'events' && ((snapshot.events || []).length ? <div className="project-public-section-list">{snapshot.events.map((item, index) => <article className="glass-card project-panel" key={index}><h2>{item.title}</h2><p>{item.description}</p>{item.sketch_path && <img className="event-sketch" src={publicStorageUrl('project-media', item.sketch_path)} alt={`Phác thảo ${item.title}`} />}</article>)}</div> : <EmptyState title="Chưa có sự kiện công khai" description="Tác giả kiểm soát các sự kiện được chia sẻ." />)}
      {tab === 'contact' && <section className="glass-card project-panel"><h2>Liên hệ nhóm dự án</h2><p>Trao đổi về cộng tác, chuyên môn hoặc đề nghị đầu tư trực tiếp với tác giả. Mora không xử lý giao dịch đầu tư.</p>{project.looking_for?.length > 0 && <p><strong>Nhóm đang tìm:</strong> {project.looking_for.join(' · ')}</p>}{links.length ? <div className="project-public-contact-links">{links.map(([label, url]) => <a className="secondary-button" href={url} key={label} target="_blank" rel="noopener noreferrer"><Link2 size={15} /> {label}</a>)}</div> : <p>Chủ dự án chưa công bố đường liên hệ.</p>}</section>}
    </main></div>
  </div>
}
