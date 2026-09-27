import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, BriefcaseBusiness, Download, Globe2, Link2, LockKeyhole, Plus, Send, ShieldCheck, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProjectCanvas from '../components/ProjectCanvas'
import SketchPad from '../components/SketchPad'
import { EmptyState, ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { getLocalProject, listLocalProjects, putLocalProject, readImage } from '../lib/localProjects'
import { publicStorageUrl, supabase } from '../lib/supabase'
import { clearInvite } from '../lib/pendingInvite'

const kinds = { overview: 'Tổng quan', story: 'Cốt truyện', character: 'Nhân vật', land: 'Vùng đất', skill: 'Kỹ năng', reference: 'Hình tham chiếu', palette: 'Bảng màu', material: 'Chất liệu', document: 'Tài liệu', custom: 'Mục tùy chỉnh' }
const createDraft = (name, projectType, local) => ({ id: `local-${crypto.randomUUID()}`, local, name, project_type: projectType, summary: '', description: '', stage: 'Idea', language: 'Vietnamese', visibility: 'private', status: 'draft', looking_for: [], contact_open: false, allow_copy: true, allow_export: false, sections: [], nodes: [], links: [], events: [] })
const projectUrl = (path) => `${window.location.origin}${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

function InquiryCard({ inquiry, onReply }) {
  const [reply, setReply] = useState(inquiry.reply_text || '')
  return <article className="project-entry"><strong>{inquiry.sender?.display_name || inquiry.sender?.username}</strong><small> · {inquiry.kind} · {new Date(inquiry.created_at).toLocaleDateString('vi-VN')}</small><p>{inquiry.message}</p><label>Phản hồi<textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength="3000" /></label><button className="secondary-button" disabled={!reply.trim()} onClick={() => onReply(inquiry.id, reply)}>Gửi phản hồi trong Mora</button></article>
}

function PublicSection({ section }) {
  return <section className="glass-card project-panel"><h2>{section.title}</h2><p>{section.content?.text}</p>
    {section.content?.image_path && <img className="event-sketch" src={publicStorageUrl('project-media', section.content.image_path)} alt={`Hình tham chiếu ${section.title}`} />}
    <p>{[section.content?.effect, section.content?.character, section.content?.event, section.content?.extra].filter(Boolean).join(' · ')}</p>
  </section>
}

async function privateImageUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('project-drafts').createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

export function MyProjectsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [locals, setLocals] = useState([])
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Game')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    const [{ data, error: queryError }, memberships, drafts] = await Promise.all([
      supabase.from('projects').select('id,name,project_type,visibility,status,updated_at,owner_id').eq('owner_id', user.id).order('updated_at', { ascending: false }),
      supabase.from('project_members').select('project_id,role').eq('user_id', user.id),
      listLocalProjects().catch(() => []),
    ])
    if (queryError) throw queryError
    let invited = []
    if (memberships.data?.length) {
      const result = await supabase.from('projects').select('id,name,project_type,visibility,status,updated_at,owner_id').in('id', memberships.data.map((item) => item.project_id))
      if (result.error) throw result.error
      invited = result.data || []
    }
    setProjects([...data, ...invited.filter((item) => !data.some((owned) => owned.id === item.id))]); setLocals(drafts.filter((item) => item.owner_id === user.id).sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || '')))
  }, [user.id])
  useEffect(() => { load().catch((caught) => setError(caught.message)) }, [load])

  async function create(event, local) {
    event.preventDefault(); if (!newName.trim()) return
    setBusy(true); setError('')
    try {
      if (local) { const draft = { ...createDraft(newName.trim(), newType, true), owner_id: user.id }; await putLocalProject({ ...draft, updated_at: new Date().toISOString() }); navigate(`/studio/projects/${draft.id}`) }
      else { const { data, error: insertError } = await supabase.from('projects').insert({ owner_id: user.id, name: newName.trim(), project_type: newType, visibility: 'private', status: 'draft' }).select('id').single(); if (insertError) throw insertError; navigate(`/studio/projects/${data.id}`) }
    } catch (caught) { setError(caught.message) } finally { setBusy(false) }
  }

  async function importBackup(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setError('')
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('Bản sao lưu phải nhỏ hơn 30 MB.')
      const backup = JSON.parse(await file.text())
      if (backup.owner_id !== user.id || typeof backup.name !== 'string' ||
          !['sections','nodes','links','events'].every((key) => Array.isArray(backup[key]))) {
        throw new Error('Tệp không phải bản sao lưu dự án của tài khoản này.')
      }
      const id = `local-${crypto.randomUUID()}`
      await putLocalProject({ ...backup, id, local: true, status: 'draft', visibility: 'private', updated_at: new Date().toISOString() })
      navigate(`/studio/projects/${id}`)
    } catch (caught) { setError(caught.message) }
    event.target.value = ''
  }

  return <div className="content-page project-workspace"><div className="page-hero simple"><div><span className="eyebrow purple"><span /> MORA STUDIO</span><h1>Dự án của bạn</h1><p>Đăng bài trên Feed không tạo dự án. Chỉ dự án bạn chủ động xuất bản mới vào khu vực Khám phá.</p></div></div>
    <form className="glass-card project-create" onSubmit={(event) => create(event, false)}><h2>Tạo dự án</h2><p>Chọn lưu chỉ trên thiết bị này hoặc đồng bộ lên Mora để sau đó mời cộng tác.</p><div className="project-create-row"><input required maxLength="120" value={newName} placeholder="Tên dự án" onChange={(event) => setNewName(event.target.value)} /><select value={newType} onChange={(event) => setNewType(event.target.value)}>{['Game','Novel','Comic','RPG','Animation','Visual Novel'].map((type) => <option key={type}>{type}</option>)}</select><button type="button" className="secondary-button" disabled={busy} onClick={(event) => create(event, true)}><LockKeyhole size={15} /> Lưu trên máy</button><button className="primary-button" disabled={busy}><Upload size={15} /> Tạo trên Mora</button></div>{error && <p className="form-message error">{error}</p>}</form>
    <section className="section-block"><div className="section-title"><h2>Trên thiết bị này</h2><p>Chưa ai khác xem được; xóa dữ liệu trình duyệt có thể làm mất bản nháp. Hãy xuất tệp để lưu dự phòng.</p></div><label className="secondary-button backup-import"><Upload size={15} /> Nhập bản sao lưu JSON<input type="file" accept=".json,application/json" onChange={importBackup} hidden /></label>{!locals.length ? <p className="inline-empty">Chưa có bản nháp trên thiết bị.</p> : <div className="project-grid">{locals.map((item) => <Link className="project-card glass-card project-list-card" to={`/studio/projects/${item.id}`} key={item.id}><LockKeyhole /><h3>{item.name}</h3><p>{item.project_type} · Chỉ trên máy</p></Link>)}</div>}</section>
    <section className="section-block"><div className="section-title"><h2>Đã đồng bộ lên Mora</h2></div>{!projects.length ? <EmptyState title="Chưa có dự án được đồng bộ" description="Tạo trên Mora hoặc đồng bộ một bản nháp từ thiết bị này để mời người khác." /> : <div className="project-grid">{projects.map((item) => <Link className="project-card glass-card project-list-card" to={`/studio/projects/${item.id}`} key={item.id}><BriefcaseBusiness /><h3>{item.name}</h3><p>{item.project_type} · {item.owner_id === user.id ? 'Của bạn' : 'Được mời'} · {item.status === 'published' ? 'Đã công khai' : 'Riêng tư'}</p></Link>)}</div>}</section>
  </div>
}

export function ProjectStudioPage({ localOnly = false }) {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const local = projectId.startsWith('local-')
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('Đang mở…')
  const [tab, setTab] = useState('overview')
  const [selectedPublic, setSelectedPublic] = useState([])
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviteUrl, setInviteUrl] = useState('')
  const [imageUrls, setImageUrls] = useState({})
  const [sketchUrls, setSketchUrls] = useState({})
  const [sketching, setSketching] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [working, setWorking] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const ready = useRef(false)
  const saveQueue = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    ready.current = false
    async function load() {
      try {
        let next
        if (local) { next = await getLocalProject(projectId); if (next?.owner_id !== user.id) throw new Error('Bản nháp này không thuộc tài khoản hiện tại trên thiết bị này.') }
        else {
          const [project, sections, nodes, links, events, membership] = await Promise.all([
            supabase.from('projects').select('*').eq('id', projectId).single(),
            supabase.from('project_sections').select('*').eq('project_id', projectId).order('sort_order'),
            supabase.from('project_canvas_nodes').select('*').eq('project_id', projectId),
            supabase.from('project_canvas_links').select('*').eq('project_id', projectId),
            supabase.from('project_events').select('*').eq('project_id', projectId),
            supabase.from('project_members').select('role').eq('project_id', projectId).eq('user_id', user.id).maybeSingle(),
          ])
          for (const result of [project, sections, nodes, links, events]) if (result.error) throw result.error
          next = { ...project.data, member_role: membership.data?.role, sections: sections.data || [], nodes: nodes.data || [], links: links.data || [], events: events.data || [] }
          const imagePaths = [...(next.nodes || []).map((node) => node.image_path), ...(next.sections || []).map((item) => item.content?.image_path)].filter(Boolean)
          const imageEntries = await Promise.all(imagePaths.map(async (path) => [path, await privateImageUrl(path)]))
          if (active) setImageUrls(Object.fromEntries(imageEntries))
          const sketchEntries = await Promise.all((next.events || []).filter((event) => event.sketch_path).map(async (event) => [event.sketch_path, await privateImageUrl(event.sketch_path)]))
          if (active) setSketchUrls(Object.fromEntries(sketchEntries))
          if (project.data.owner_id === user.id) {
            const [inbox, team, links] = await Promise.all([
              supabase.from('project_inquiries').select('id,kind,message,reply_text,replied_at,created_at,sender:profiles!project_inquiries_sender_id_fkey(username,display_name)').eq('project_id', projectId).order('created_at', { ascending: false }),
              supabase.from('project_members').select('user_id,role,person:profiles!project_members_user_id_fkey(username,display_name)').eq('project_id', projectId),
              supabase.from('project_invitations').select('id,token,role,expires_at,accepted_at,revoked_at').eq('project_id', projectId).order('created_at', { ascending: false }),
            ])
            for (const result of [inbox, team, links]) if (result.error) throw result.error
            if (active) { setInquiries(inbox.data || []); setMembers(team.data || []); setInvitations(links.data || []) }
          }
        }
        if (!next) throw new Error('Không tìm thấy bản nháp trên thiết bị này.')
        if (active) { setDraft(next); setSaveStatus(local ? 'Chỉ lưu trên thiết bị này' : 'Đã lưu trên Mora'); setTimeout(() => { ready.current = true }, 0) }
      } catch (caught) { if (active) setError(caught.message) }
    }
    load()
    return () => { active = false; ready.current = false }
  }, [local, projectId, user.id])

  useEffect(() => {
    if (!draft || !ready.current) return undefined
    setSaveStatus('Đang lưu…')
    const timer = setTimeout(() => {
      const snapshot = structuredClone(draft)
      saveQueue.current = saveQueue.current.catch(() => {}).then(async () => {
        if (local) await putLocalProject({ ...snapshot, updated_at: new Date().toISOString() })
        else {
          if (snapshot.owner_id === user.id) {
            const { error: projectError } = await supabase.from('projects').update({ name: snapshot.name, summary: snapshot.summary, description: snapshot.description, stage: snapshot.stage, genre: snapshot.genre, language: snapshot.language, looking_for: snapshot.looking_for, contact_open: snapshot.contact_open, allow_copy: snapshot.allow_copy, allow_export: snapshot.allow_export }).eq('id', projectId)
            if (projectError) throw projectError
          }
          for (const [table, collection] of [['project_sections',snapshot.sections],['project_canvas_nodes',snapshot.nodes],['project_canvas_links',snapshot.links],['project_events',snapshot.events]]) {
            if (!collection.length) continue
            const rows = collection.map((item) => ({ ...item, project_id: projectId, updated_at: undefined, created_at: undefined, image_data: undefined }))
            const { error: upsertError } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
            if (upsertError) throw upsertError
          }
        }
        setSaveStatus(local ? 'Đã lưu trên thiết bị này' : 'Đã lưu trên Mora')
      }).catch((caught) => { setSaveStatus('Lưu thất bại'); setError(caught.message) })
    }, 850)
    return () => clearTimeout(timer)
  }, [draft, local, projectId, user.id])

  const update = (patch) => { if (canEdit) setDraft((current) => ({ ...current, ...patch })) }
  const canEdit = local || draft?.owner_id === user.id || ['editor','manager'].includes(draft?.member_role)
  const isOwner = local || draft?.owner_id === user.id
  async function remove(table, id, collection) {
    if (!canEdit) return
    try {
      if (!local) { const { error: deleteError } = await supabase.from(table).delete().eq('id', id).eq('project_id', projectId); if (deleteError) throw deleteError }
      update({ [collection]: draft[collection].filter((item) => item.id !== id) })
    } catch (caught) { setError(caught.message) }
  }
  async function removeNode(id) {
    if (!canEdit) return
    if (!local) { const { error: deleteError } = await supabase.from('project_canvas_nodes').delete().eq('id', id).eq('project_id', projectId); if (deleteError) { setError(deleteError.message); return } }
    update({ nodes: draft.nodes.filter((node) => node.id !== id), links: draft.links.filter((edge) => edge.source_id !== id && edge.target_id !== id) })
  }
  function handleCanvasChange(nodes, links) {
    if (!canEdit) return
    if (!local) draft.links.filter((edge) => !links.some((item) => item.id === edge.id)).forEach((edge) => {
      supabase.from('project_canvas_links').delete().eq('id', edge.id).eq('project_id', projectId).then(({ error: deleteError }) => { if (deleteError) setError(deleteError.message) })
    })
    update({ nodes, links })
  }
  async function uploadNodeImage(id, file) {
    if (!canEdit) return
    if (!file) return
    try {
      const data = await readImage(file)
      if (local) update({ nodes: draft.nodes.map((node) => node.id === id ? { ...node, image_data: data } : node) })
      else {
        const path = `${projectId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'png'}`
        const { error: uploadError } = await supabase.storage.from('project-drafts').upload(path, file, { contentType: file.type })
        if (uploadError) throw uploadError
        const url = await privateImageUrl(path)
        setImageUrls((current) => ({ ...current, [path]: url }))
        update({ nodes: draft.nodes.map((node) => node.id === id ? { ...node, image_path: path } : node) })
      }
    } catch (caught) { setError(caught.message) }
  }
  async function uploadSectionImage(id, file) {
    if (!canEdit || !file) return
    try {
      const data = await readImage(file)
      if (local) update({ sections: draft.sections.map((item) => item.id === id ? { ...item, content: { ...item.content, image_data: data } } : item) })
      else {
        const path = `${projectId}/${crypto.randomUUID()}.${file.name.split('.').pop()?.toLowerCase() || 'png'}`
        const { error: uploadError } = await supabase.storage.from('project-drafts').upload(path, file, { contentType: file.type })
        if (uploadError) throw uploadError
        const url = await privateImageUrl(path)
        setImageUrls((current) => ({ ...current, [path]: url }))
        update({ sections: draft.sections.map((item) => item.id === id ? { ...item, content: { ...item.content, image_path: path } } : item) })
      }
    } catch (caught) { setError(caught.message) }
  }
  function addSection() { update({ sections: [...draft.sections, { id: crypto.randomUUID(), section_type: kinds[tab] ? tab : 'custom', title: kinds[tab] || 'Mục mới', content: { text: '', extra: '' }, sort_order: draft.sections.length }] }) }
  function patchSection(id, patch) { update({ sections: draft.sections.map((item) => item.id === id ? { ...item, ...patch } : item) }) }
  function addEvent() { update({ events: [...draft.events, { id: crypto.randomUUID(), title: 'Sự kiện mới', description: '', details: { participants: '', skins: '', notes: '' } }] }) }
  function patchEvent(id, patch) { update({ events: draft.events.map((item) => item.id === id ? { ...item, ...patch } : item) }) }
  async function saveSketch(eventId, blob) {
    if (!canEdit) return
    try {
      if (local) {
        const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob) })
        const event = draft.events.find((item) => item.id === eventId)
        patchEvent(eventId, { details: { ...event.details, sketch_data: data } })
      } else {
        const path = `${projectId}/${crypto.randomUUID()}.png`
        const { error: uploadError } = await supabase.storage.from('project-drafts').upload(path, blob, { contentType: 'image/png' })
        if (uploadError) throw uploadError
        const url = await privateImageUrl(path)
        setSketchUrls((current) => ({ ...current, [path]: url }))
        patchEvent(eventId, { sketch_path: path })
      }
      setSketching(null)
    } catch (caught) { setError(caught.message) }
  }

  async function syncToMora() {
    if (!local || !window.confirm('Đồng bộ toàn bộ nội dung bản nháp này lên Mora? Sau đó bạn mới có thể mời người khác. Bản trên máy vẫn được giữ riêng.')) return
    setWorking(true); setError('')
    try {
      await saveQueue.current
      let nextId = draft.pending_cloud_id
      if (!nextId) {
        const { data: project, error: insertError } = await supabase.from('projects').insert({ owner_id: user.id, name: draft.name, project_type: draft.project_type, summary: draft.summary, description: draft.description, stage: draft.stage, genre: draft.genre, language: draft.language, looking_for: draft.looking_for, visibility: 'private', status: 'draft' }).select('id').single()
        if (insertError) throw insertError
        nextId = project.id
        await putLocalProject({ ...draft, pending_cloud_id: nextId, updated_at: new Date().toISOString() })
        update({ pending_cloud_id: nextId })
      }
      for (const [table, collection] of [['project_sections',draft.sections],['project_canvas_nodes',draft.nodes],['project_canvas_links',draft.links],['project_events',draft.events]]) {
        if (!collection.length) continue
        const rows = []
        for (const item of collection) {
          let image_path = item.image_path
          let sketch_path = item.sketch_path
          if (item.image_data && table === 'project_canvas_nodes') {
            const blob = await (await fetch(item.image_data)).blob()
            image_path = `${nextId}/${crypto.randomUUID()}.${blob.type.split('/')[1] || 'png'}`
            const { error: assetError } = await supabase.storage.from('project-drafts').upload(image_path, blob, { contentType: blob.type })
            if (assetError) throw assetError
          }
          let content = item.content
          if (item.content?.image_data && table === 'project_sections') {
            const blob = await (await fetch(item.content.image_data)).blob()
            const path = `${nextId}/${crypto.randomUUID()}.${blob.type.split('/')[1] || 'png'}`
            const { error: assetError } = await supabase.storage.from('project-drafts').upload(path, blob, { contentType: blob.type })
            if (assetError) throw assetError
            content = { ...item.content, image_data: undefined, image_path: path }
          }
          if (item.details?.sketch_data && table === 'project_events') {
            const blob = await (await fetch(item.details.sketch_data)).blob()
            sketch_path = `${nextId}/${crypto.randomUUID()}.png`
            const { error: sketchError } = await supabase.storage.from('project-drafts').upload(sketch_path, blob, { contentType: 'image/png' })
            if (sketchError) throw sketchError
          }
          rows.push({ ...item, project_id: nextId, content, details: table === 'project_events' ? { ...item.details, sketch_data: undefined } : item.details, sketch_path: table === 'project_events' ? sketch_path : undefined, image_data: undefined, image_path: table === 'project_canvas_nodes' ? image_path : undefined })
        }
        const { error: contentError } = await supabase.from(table).upsert(rows, { onConflict: 'id' })
        if (contentError) throw contentError
      }
      navigate(`/studio/projects/${nextId}`)
    } catch (caught) { setError(`Đồng bộ chưa hoàn tất: ${caught.message}. Kiểm tra dự án trên Mora trước khi thử lại để tránh trùng.`) } finally { setWorking(false) }
  }

  async function makeInvite() {
    setWorking(true); setError('')
    const { data, error: inviteError } = await supabase.from('project_invitations').insert({ project_id: projectId, created_by: user.id, role: inviteRole }).select('id,token,role,expires_at').single()
    if (inviteError) setError(inviteError.message)
    else { setInviteUrl(projectUrl(`/invite/${data.token}`)); setInvitations((list) => [data, ...list]) }
    setWorking(false)
  }

  async function revokeInvite(token) {
    if (!isOwner || local) return
    const { error: revokeError } = await supabase.rpc('revoke_project_invitation', { access_token: token })
    if (revokeError) setError(revokeError.message)
    else { setInvitations((list) => list.map((item) => item.token === token ? { ...item, revoked_at: new Date().toISOString() } : item)); if (inviteUrl.includes(token)) setInviteUrl('') }
  }

  async function setMemberRole(memberId, role) {
    if (!isOwner || local) return
    const { error: roleError } = await supabase.from('project_members').update({ role }).eq('project_id', projectId).eq('user_id', memberId)
    if (roleError) setError(roleError.message)
    else setMembers((list) => list.map((item) => item.user_id === memberId ? { ...item, role } : item))
  }

  async function removeMember(memberId) {
    if (!isOwner || local) return
    const { error: removeError } = await supabase.from('project_members').delete().eq('project_id', projectId).eq('user_id', memberId)
    if (removeError) setError(removeError.message)
    else setMembers((list) => list.filter((item) => item.user_id !== memberId))
  }

  async function replyToInquiry(id, replyText) {
    if (!isOwner || local || !replyText.trim()) return
    const { error: replyError } = await supabase.from('project_inquiries').update({ reply_text: replyText.trim(), replied_at: new Date().toISOString() }).eq('id', id).eq('project_id', projectId)
    if (replyError) setError(replyError.message)
    else setInquiries((list) => list.map((item) => item.id === id ? { ...item, reply_text: replyText.trim() } : item))
  }

  async function removePublicAssets(snapshot) {
    const paths = [...(snapshot?.nodes || []).map((node) => node.image_path),
      ...(snapshot?.events || []).map((event) => event.sketch_path),
      ...(snapshot?.sections || []).map((section) => section.content?.image_path)].filter(Boolean)
    if (paths.length) {
      const { error: assetError } = await supabase.storage.from('project-media').remove(paths)
      if (assetError) throw assetError
    }
  }

  async function unpublish() {
    if (!isOwner || local || !window.confirm('Ẩn dự án khỏi trang công khai? Các liên kết và bản sao đã được người khác lưu trước đó vẫn có thể tồn tại.')) return
    setPublishing(true); setError('')
    try {
      const previous = draft.public_snapshot
      const { error: hideError } = await supabase.from('projects').update({ status: 'draft', visibility: 'private', public_snapshot: {}, cover_path: null, published_at: null }).eq('id', projectId)
      if (hideError) throw hideError
      update({ status: 'draft', visibility: 'private', public_snapshot: {} })
      await removePublicAssets(previous)
      setSaveStatus('Đã ẩn dự án công khai')
    } catch (caught) { setError(`Dự án đã được ẩn nếu cập nhật thành công; hãy kiểm tra ảnh công khai cũ: ${caught.message}`) }
    finally { setPublishing(false) }
  }

  async function publish() {
    if (!isOwner || local || !selectedPublic.length) { setError('Chọn ít nhất một mục trước khi công bố.'); return }
    if (!window.confirm('Công khai đúng các mục đã chọn trên trang Dự án? Dữ liệu nội bộ khác vẫn riêng tư.')) return
    setPublishing(true); setError('')
    const uploaded = []
    try {
      await saveQueue.current
      const sections = []
      for (const section of draft.sections.filter((item) => selectedPublic.includes(item.id))) {
        let image_path = null
        if (section.content?.image_path) {
          const { data: file, error: downloadError } = await supabase.storage.from('project-drafts').download(section.content.image_path)
          if (downloadError) throw downloadError
          image_path = `${user.id}/${crypto.randomUUID()}.${file.type.split('/')[1] || 'png'}`
          const { error: uploadError } = await supabase.storage.from('project-media').upload(image_path, file, { contentType: file.type })
          if (uploadError) throw uploadError
          uploaded.push(image_path)
        }
        sections.push({ section_type: section.section_type, title: section.title, content: { ...section.content, image_data: undefined, image_path } })
      }
      const events = []
      for (const event of draft.events.filter((item) => selectedPublic.includes(item.id))) {
        let sketch_path = null
        if (event.sketch_path) {
          const { data: file, error: downloadError } = await supabase.storage.from('project-drafts').download(event.sketch_path)
          if (downloadError) throw downloadError
          sketch_path = `${user.id}/${crypto.randomUUID()}.png`
          const { error: uploadError } = await supabase.storage.from('project-media').upload(sketch_path, file, { contentType: 'image/png' })
          if (uploadError) throw uploadError
          uploaded.push(sketch_path)
        }
        events.push({ title: event.title, description: event.description, details: event.details, sketch_path })
      }
      const nodes = []
      for (const node of draft.nodes.filter((item) => selectedPublic.includes(item.id))) {
        let image_path = null
        if (node.image_path) {
          const { data: file, error: downloadError } = await supabase.storage.from('project-drafts').download(node.image_path)
          if (downloadError) throw downloadError
          image_path = `${user.id}/${crypto.randomUUID()}.${file.type.split('/')[1] || 'png'}`
          const { error: uploadError } = await supabase.storage.from('project-media').upload(image_path, file, { contentType: file.type })
          if (uploadError) throw uploadError
          uploaded.push(image_path)
        }
        nodes.push({ id: node.id, canvas_kind: node.canvas_kind, title: node.title, details: node.details, image_path })
      }
      const nodeIds = new Set(nodes.map((node) => node.id))
      const links = draft.links.filter((edge) => nodeIds.has(edge.source_id) && nodeIds.has(edge.target_id)).map(({ source_id, target_id, canvas_kind, label, detail }) => ({ source_id, target_id, canvas_kind, label, detail }))
      const snapshot = { sections, events, nodes, links }
      const cover_path = sections.find((section) => section.content?.image_path)?.content.image_path || nodes.find((node) => node.image_path)?.image_path || null
      const { error: publishError } = await supabase.from('projects').update({ public_snapshot: snapshot, cover_path, status: 'published', visibility: 'showcase', published_at: new Date().toISOString(), contact_open: draft.contact_open, allow_copy: draft.allow_copy, allow_export: draft.allow_export }).eq('id', projectId)
      if (publishError) throw publishError
      const previous = draft.public_snapshot
      update({ status: 'published', visibility: 'showcase', public_snapshot: snapshot, cover_path })
      try { await removePublicAssets(previous) }
      catch (cleanupError) { setError(`Bản mới đã công khai nhưng chưa xóa được ảnh của bản cũ: ${cleanupError.message}`) }
      setSaveStatus('Đã công khai bản nội dung được chọn')
    } catch (caught) {
      if (uploaded.length) await supabase.storage.from('project-media').remove(uploaded)
      setError(caught.message)
    } finally { setPublishing(false) }
  }

  function exportLocal() {
    const text = JSON.stringify({ ...draft, exported_at: new Date().toISOString() }, null, 2)
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `mora-project-${draft.id}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 3000)
  }
  function exportPdf() {
    if (!local && !isOwner && !draft.allow_export) { setError('Chủ dự án chưa cấp quyền xuất tài liệu.'); return }
    if (!selectedPublic.length) { setError('Chọn ít nhất một mục để đưa vào tài liệu.'); return }
    document.body.classList.add('printing-project')
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-project'), 1000) }, 80)
  }

  if (error && !draft) return <ErrorState message={error} retry={() => navigate('/studio/projects')} />
  if (!draft) return <LoadingState />
  const tabs = ['overview','story','character','land','skill','reference','palette','material','document','custom','events','share']
  const visibleSections = draft.sections.filter((section) => section.section_type === tab)
  const imageUrl = (item) => item.image_data || item.content?.image_data || imageUrls[item.image_path || item.content?.image_path] || null
  return <div className="content-page project-workspace"><Link to="/studio/projects" className="project-back"><ArrowLeft size={16} /> Dự án của tôi</Link><header className="project-editor-head glass-card"><div><span className="eyebrow purple"><span /> {local ? 'CHỈ TRÊN THIẾT BỊ NÀY' : 'MORA STUDIO'}</span><h1>{draft.name}</h1><p>{local ? 'Người khác không thể mở liên kết tới bản nháp này. Dữ liệu chỉ nằm trong trình duyệt hiện tại.' : 'Dữ liệu nội bộ không tự xuất hiện trên Feed hoặc khu Dự án công khai.'}</p><small aria-live="polite">{saveStatus}</small></div><div className="project-editor-actions">{local ? <><button className="secondary-button" onClick={exportLocal}><Download size={15} /> Tải bản nháp</button>{!localOnly && <button className="primary-button" onClick={syncToMora} disabled={working}><Upload size={15} /> {working ? 'Đang đồng bộ…' : 'Đồng bộ để cộng tác'}</button>}</> : draft.status === 'published' ? <><Link className="secondary-button" to={`/projects/${projectId}`}><Globe2 size={15} /> Xem trang công khai</Link>{isOwner && <button className="secondary-button" disabled={publishing} onClick={unpublish}>Ẩn công khai</button>}</> : <span className="visibility"><LockKeyhole size={15} /> Chưa công khai</span>}</div></header>
    {error && <p className="form-message error" role="alert">{error}</p>}
    <nav className="project-tabs">{tabs.filter((key) => key !== 'skill' || draft.project_type === 'Game').map((key) => <button className={tab === key ? 'active' : ''} key={key} onClick={() => setTab(key)}>{kinds[key] || (key === 'share' ? 'Chia sẻ & quyền' : 'Sự kiện')}</button>)}</nav>
    {tab === 'share' ? <div className="project-share-grid"><section className="glass-card project-panel"><h2>Thông tin dự án</h2><label>Tên<input value={draft.name} disabled={!isOwner} onChange={(event) => update({ name: event.target.value })} /></label><label>Mô tả công khai<input value={draft.summary || ''} disabled={!isOwner} onChange={(event) => update({ summary: event.target.value })} /></label><label>Thể loại<input value={draft.genre || ''} disabled={!isOwner} onChange={(event) => update({ genre: event.target.value })} /></label><label>Giai đoạn<select value={draft.stage || 'Idea'} disabled={!isOwner} onChange={(event) => update({ stage: event.target.value })}>{['Idea','Planning','In Development','Prototype','Completed'].map((stage) => <option key={stage}>{stage}</option>)}</select></label><label><input type="checkbox" checked={!!draft.contact_open} disabled={!isOwner} onChange={(event) => update({ contact_open: event.target.checked })} /> Cho phép người xem gửi lời mời hợp tác/trao đổi/đầu tư</label><label><input type="checkbox" checked={!!draft.allow_copy} disabled={!isOwner} onChange={(event) => update({ allow_copy: event.target.checked })} /> Cho phép sao chép văn bản trong giao diện</label><label><input type="checkbox" checked={!!draft.allow_export} disabled={!isOwner} onChange={(event) => update({ allow_export: event.target.checked })} /> Cho phép thành viên xuất tài liệu</label><p className="privacy-note">Tùy chọn sao chép chỉ hạn chế thao tác trong trình duyệt, không ngăn được chụp màn hình.</p></section>
      <section className="glass-card project-panel"><h2>Cộng tác riêng tư</h2>
        {local ? <p>{localOnly ? 'Bản này chỉ ở trên thiết bị hiện tại. Liên kết mời và đồng bộ sẽ mở sau khi cơ sở dữ liệu riêng tư được cập nhật; chưa có dữ liệu nào được gửi lên Mora.' : 'Đồng bộ lên Mora trước khi tạo liên kết mời. Bản chỉ trên máy không thể được mở từ thiết bị khác.'}</p> : !isOwner ? <p>Chỉ chủ dự án được tạo liên kết mời.</p> : <>
          <p>Liên kết dùng một lần và hết hạn sau 7 ngày. Chỉ người nhận đăng nhập mới tham gia.</p>
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="viewer">Chỉ xem</option><option value="editor">Chỉnh sửa</option></select>
          <button className="secondary-button" disabled={working} onClick={makeInvite}><Link2 size={15} /> Tạo liên kết mời</button>
          {inviteUrl && <div className="invite-link"><input readOnly value={inviteUrl} aria-label="Liên kết mời" onFocus={(event) => event.target.select()} /><button onClick={() => navigator.clipboard.writeText(inviteUrl)}>Sao chép</button></div>}
          {members.length > 0 && <div className="project-team"><h3>Người tham gia</h3>{members.map((member) => <div className="project-team-row" key={member.user_id}><span>{member.person?.display_name || member.person?.username || member.user_id}</span><select aria-label="Quyền cộng tác" value={member.role} onChange={(event) => setMemberRole(member.user_id, event.target.value)}><option value="viewer">Chỉ xem</option><option value="editor">Chỉnh sửa</option>{member.role === 'manager' && <option value="manager">Quản lý (cũ)</option>}</select><button className="text-danger" onClick={() => removeMember(member.user_id)}>Gỡ</button></div>)}</div>}
          {invitations.some((item) => !item.accepted_at && !item.revoked_at && new Date(item.expires_at) > new Date()) && <div className="project-team"><h3>Liên kết đang hiệu lực</h3>{invitations.filter((item) => !item.accepted_at && !item.revoked_at && new Date(item.expires_at) > new Date()).map((item) => <div className="project-team-row" key={item.id}><span>{item.role === 'viewer' ? 'Chỉ xem' : 'Chỉnh sửa'} · hạn {new Date(item.expires_at).toLocaleDateString('vi-VN')}</span><button className="text-danger" onClick={() => revokeInvite(item.token)}>Thu hồi</button></div>)}</div>}
        </>}</section>
      <section className="glass-card project-panel"><h2>Chọn nội dung công khai hoặc xuất PDF</h2><p>Chỉ các ô được chọn sẽ đi vào bản công khai. Dự án riêng tư, bản nháp Feed và tài liệu khác không tự công bố.</p><div className="publish-picks">{[...draft.sections, ...draft.nodes, ...draft.events].map((item) => <label key={item.id}><input type="checkbox" checked={selectedPublic.includes(item.id)} onChange={(event) => setSelectedPublic((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /> {item.title} <small>{kinds[item.section_type || item.canvas_kind] || 'Sự kiện'}</small></label>)}{!draft.sections.length && !draft.nodes.length && !draft.events.length && <p>Thêm nội dung trước khi xuất bản.</p>}</div><div className="panel-actions"><button className="secondary-button" onClick={exportPdf}><Download size={15} /> In / lưu PDF 16:9</button>{!local && isOwner && <button className="primary-button" onClick={publish} disabled={publishing || !selectedPublic.length}><Globe2 size={15} /> {publishing ? 'Đang xuất bản…' : 'Công bố phần đã chọn'}</button>}</div></section>
      {!local && isOwner && <section className="glass-card project-panel"><h2>Lời nhắn về dự án</h2>{!inquiries.length ? <p>Chưa có lời mời hợp tác hay trao đổi.</p> : inquiries.map((inquiry) => <InquiryCard key={inquiry.id} inquiry={inquiry} onReply={replyToInquiry} />)}</section>}
    </div> : tab === 'character' || tab === 'land' ? <div className="project-panel glass-card"><h2>Sơ đồ {tab === 'land' ? 'vùng đất' : 'quan hệ nhân vật'}</h2><ProjectCanvas readOnly={!canEdit} kind={tab} nodes={draft.nodes} links={draft.links} onChange={handleCanvasChange} onRemoveNode={removeNode} onUpload={uploadNodeImage} imageUrl={imageUrl} /></div> : tab === 'events' ? <div className="project-panel glass-card"><div className="section-title"><div><h2>Sự kiện nội bộ</h2><p>Ghi cốt truyện, nhân vật tham gia và định hướng skin/phác thảo cho đội.</p></div><button className="primary-button small" onClick={addEvent} disabled={!canEdit}><Plus size={15} /> Thêm sự kiện</button></div>{draft.events.map((event) => <div key={event.id} className="project-entry"><input value={event.title} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { title: e.target.value })} aria-label="Tên sự kiện" /><textarea value={event.description} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { description: e.target.value })} placeholder="Cốt truyện sự kiện" /><label>Nhân vật tham gia<textarea value={event.details?.participants || ''} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { details: { ...event.details, participants: e.target.value } })} /></label><label>Skin / hình tham chiếu / phác thảo<textarea value={event.details?.skins || ''} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { details: { ...event.details, skins: e.target.value } })} /></label>{(event.details?.sketch_data || sketchUrls[event.sketch_path]) && <img className="event-sketch" src={event.details?.sketch_data || sketchUrls[event.sketch_path]} alt="Phác thảo sự kiện" />}<button className="secondary-button" disabled={!canEdit} onClick={() => setSketching(sketching === event.id ? null : event.id)}>Phác thảo / chú thích ảnh</button>{sketching === event.id && <SketchPad initialImage={event.details?.sketch_data || sketchUrls[event.sketch_path]} onSave={(blob) => saveSketch(event.id, blob)} disabled={!canEdit} />}<button className="text-danger" disabled={!canEdit} onClick={() => remove('project_events', event.id, 'events')}>Xóa sự kiện</button></div>)}</div> : <div className="project-panel glass-card"><div className="section-title"><div><h2>{kinds[tab]}</h2><p>Mỗi mục có thể tùy chỉnh theo dự án truyện hoặc game; không bắt buộc điền mọi mục.</p></div><button className="primary-button small" onClick={addSection} disabled={!canEdit}><Plus size={15} /> Thêm mục</button></div>{!visibleSections.length && <p className="inline-empty">Chưa có nội dung trong mục này.</p>}{visibleSections.map((item) => <div className="project-entry" key={item.id}>
      <label>Tiêu đề<input value={item.title} disabled={!canEdit} onChange={(event) => patchSection(item.id, { title: event.target.value })} /></label>
      <label>Nội dung<textarea value={item.content?.text || ''} disabled={!canEdit} onChange={(event) => patchSection(item.id, { content: { ...item.content, text: event.target.value } })} /></label>
      {tab === 'skill' && ['effect','character','event'].map((field) => <label key={field}>{({ effect: 'Hiệu ứng / chỉ số', character: 'Nhân vật liên quan', event: 'Sự kiện liên quan' })[field]}<textarea value={item.content?.[field] || ''} disabled={!canEdit} onChange={(change) => patchSection(item.id, { content: { ...item.content, [field]: change.target.value } })} /></label>)}
      <label>Thông tin tùy chỉnh / ghi chú<textarea value={item.content?.extra || ''} disabled={!canEdit} onChange={(event) => patchSection(item.id, { content: { ...item.content, extra: event.target.value } })} /></label>
      <label>Ảnh tham chiếu<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!canEdit} onChange={(event) => uploadSectionImage(item.id, event.target.files?.[0])} /></label>
      {imageUrl(item) && <img className="event-sketch" src={imageUrl(item)} alt={`Hình tham chiếu ${item.title}`} />}
      <button className="text-danger" disabled={!canEdit} onClick={() => remove('project_sections', item.id, 'sections')}>Xóa mục</button>
    </div>)}</div>}
    <div className="presentation" aria-hidden="true"><article className="presentation-slide"><h1>{draft.name}</h1><p>{draft.summary}</p><small>Mora · Mour Studio</small></article>{draft.sections.filter((item) => selectedPublic.includes(item.id)).map((item) => <article className="presentation-slide" key={item.id}><h2>{item.title}</h2><p>{item.content?.text}</p>{imageUrl(item) && <img src={imageUrl(item)} alt="" />}<p>{[item.content?.effect,item.content?.character,item.content?.event,item.content?.extra].filter(Boolean).join(' · ')}</p></article>)}{draft.nodes.filter((item) => selectedPublic.includes(item.id)).map((node) => <article className="presentation-slide" key={node.id}><h2>{node.title}</h2>{imageUrl(node) && <img src={imageUrl(node)} alt="" />}<p>{Object.values(node.details || {}).filter(Boolean).join(' · ')}</p></article>)}{draft.links.some((edge) => selectedPublic.includes(edge.source_id) && selectedPublic.includes(edge.target_id)) && <article className="presentation-slide"><h2>Quan hệ quan trọng</h2>{draft.links.filter((edge) => selectedPublic.includes(edge.source_id) && selectedPublic.includes(edge.target_id)).map((edge) => <p key={edge.id}>{draft.nodes.find((n) => n.id === edge.source_id)?.title} ↔ {draft.nodes.find((n) => n.id === edge.target_id)?.title}: {edge.label} {edge.detail}</p>)}</article>}{draft.events.filter((item) => selectedPublic.includes(item.id)).map((event) => <article className="presentation-slide" key={event.id}><h2>{event.title}</h2><p>{event.description}</p><p>{event.details?.participants}</p><p>{event.details?.skins}</p>{(event.details?.sketch_data || sketchUrls[event.sketch_path]) && <img src={event.details?.sketch_data || sketchUrls[event.sketch_path]} alt="" />}</article>)}</div>
  </div>
}

export function ProjectDetailPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [kind, setKind] = useState('collaboration')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)
  const [myInquiries, setMyInquiries] = useState([])
  useEffect(() => { let active = true; supabase.from('project_showcases').select('id,name,summary,project_type,stage,genre,looking_for,cover_path,owner_id,contact_open,allow_copy,public_snapshot,visibility,owner_username,owner_display_name').eq('id', projectId).single().then(({ data, error: loadError }) => { if (!active) return; if (loadError) setError(loadError.message || 'Dự án này chưa công khai.'); else setProject(data); setLoading(false) }); return () => { active = false } }, [projectId])
  useEffect(() => { if (!user) return; supabase.from('project_inquiries').select('id,kind,message,reply_text,created_at').eq('project_id', projectId).eq('sender_id', user.id).order('created_at', { ascending: false }).then(({ data }) => setMyInquiries(data || [])) }, [projectId, user])
  async function sendInquiry(event) { event.preventDefault(); if (!message.trim()) return; const { data, error: insertError } = await supabase.from('project_inquiries').insert({ project_id: projectId, sender_id: user.id, kind, message: message.trim() }).select('id,kind,message,reply_text,created_at').single(); if (insertError) setError(insertError.message); else { setSent(true); setMessage(''); setMyInquiries((items) => [data, ...items]) } }
  if (loading) return <LoadingState />
  if (!project) return <ErrorState message={error} />
  const snapshot = project.public_snapshot || {}
  return <div className={`content-page project-public${project.allow_copy ? '' : ' no-copy'}`} onCopy={(event) => { if (!project.allow_copy) event.preventDefault() }}><Link to="/projects" className="project-back"><ArrowLeft size={16} /> Khám phá dự án</Link><section className="projects-hero glass-card"><div><span className="eyebrow"><span /> MORA · CREATE & CONNECT</span><h1>{project.name}</h1><p>{project.summary}</p><small>{project.project_type} · {project.stage} · Bởi {project.owner_display_name || project.owner_username}</small></div></section><div className="project-public-body">{project.cover_path && <img className="project-public-cover" src={publicStorageUrl('project-media', project.cover_path)} alt="" />}{(snapshot.sections || []).map((section, i) => <PublicSection key={i} section={section} />)}{(snapshot.nodes || []).length > 0 && <section className="glass-card project-panel"><h2>Nhân vật & vùng đất được giới thiệu</h2><div className="project-public-nodes">{snapshot.nodes.map((node) => <article key={node.id}>{node.image_path && <img src={publicStorageUrl('project-media', node.image_path)} alt="" />}<strong>{node.title}</strong><p>{Object.values(node.details || {}).filter(Boolean).join(' · ')}</p></article>)}</div>{(snapshot.links || []).map((edge, i) => <p key={i} className="public-link">{snapshot.nodes.find((n) => n.id === edge.source_id)?.title} ↔ {snapshot.nodes.find((n) => n.id === edge.target_id)?.title}: {edge.label} {edge.detail}</p>)}</section>}{(snapshot.events || []).map((event, i) => <section className="glass-card project-panel" key={i}><h2>{event.title}</h2><p>{event.description}</p>{event.sketch_path && <img className="event-sketch" src={publicStorageUrl('project-media', event.sketch_path)} alt="Phác thảo sự kiện" />}</section>)}<section className="glass-card project-panel"><h2>Liên hệ nhóm dự án</h2>{project.looking_for?.length > 0 && <p>{project.looking_for.join(' · ')}</p>}{project.owner_id === user.id ? <p>Đây là dự án của bạn. Quản lý lời nhắn trong Studio.</p> : project.contact_open ? sent ? <p>Đã gửi lời nhắn đến chủ dự án.</p> : <form onSubmit={sendInquiry}><label>Mục đích<select value={kind} onChange={(event) => setKind(event.target.value)}><option value="collaboration">Mời hợp tác</option><option value="expertise">Trao đổi chuyên môn</option><option value="funding">Đề nghị đầu tư (chỉ liên hệ)</option></select></label><label>Lời nhắn<textarea value={message} required minLength="10" maxLength="3000" onChange={(event) => setMessage(event.target.value)} /></label><button className="primary-button"><Send size={15} /> Gửi lời nhắn</button>{error && <p className="form-message error">{error}</p>}</form> : <p>Chủ dự án chưa mở nhận lời nhắn. Không có giao dịch đầu tư trực tiếp trên Mora.</p>}</section>{myInquiries.length > 0 && <section className="glass-card project-panel"><h2>Lời nhắn của bạn</h2>{myInquiries.map((inquiry) => <div className="project-entry" key={inquiry.id}><strong>{inquiry.kind}</strong><p>{inquiry.message}</p><p>{inquiry.reply_text ? `Phản hồi từ nhóm: ${inquiry.reply_text}` : "Đang chờ phản hồi"}</p></div>)}</section>}</div><p className="privacy-note">Giới hạn sao chép chỉ là tiện ích trình duyệt, không thể ngăn chụp màn hình tuyệt đối.</p></div>
}

export function ProjectInvitePage() {
  const { token } = useParams()
  const { session } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function accept() { setBusy(true); setError(''); const { data, error: inviteError } = await supabase.rpc('accept_project_invitation', { access_token: token }); if (inviteError) setError(inviteError.message); else { clearInvite(); navigate(`/studio/projects/${data}`, { replace: true }) } setBusy(false) }
  return <div className="admin-gate"><section className="glass-card"><ShieldCheck /><h1>Lời mời dự án Mora</h1><p>Để xem hoặc chỉnh sửa dự án nội bộ, bạn cần đăng nhập và chấp nhận lời mời. Liên kết chỉ dùng một lần.</p>{!session ? <Link to="/login" state={{ from: { pathname: `/invite/${token}` } }} className="primary-button">Đăng nhập để tiếp tục</Link> : <button className="primary-button" disabled={busy} onClick={accept}>{busy ? 'Đang tham gia…' : 'Chấp nhận lời mời'}</button>}{error && <p className="form-message error">{error}</p>}</section></div>
}
