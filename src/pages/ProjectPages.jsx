import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, Download, Globe2, Link2, LockKeyhole, Plus, ShieldCheck, Upload } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ProjectCanvas from '../components/ProjectCanvas'
import SketchPad from '../components/SketchPad'
import GameDesignPanel from '../components/GameDesignPanel'
import CharacterGallery from '../components/CharacterGallery'
import ProjectBoard from '../components/ProjectBoard'
import { ProjectEditorToolbar, ProjectWorkspaceNav } from '../components/ProjectWorkspaceShell'
import { ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { getLocalProject, listLocalProjects, putLocalProject, readImage } from '../lib/localProjects'
import { supabase } from '../lib/supabase'
import { clearInvite, rememberInvite } from '../lib/pendingInvite'
import { isGameProject, projectWorkflow, sectionBelongsToTab, sectionForTab } from '../lib/projectWorkflows'
import { useBackend } from '../context/BackendContext'
import { createSaveQueue, workspacePayload } from '../lib/projectData'
import { prepareCloudProject, preparePublicSnapshot, publicSnapshotAssets, uploadPrivateProjectImage } from '../lib/projectCloud'

const kinds = { overview: 'Tổng quan', story: 'Cốt truyện', character: 'Nhân vật', land: 'Vùng đất', skill: 'Kỹ năng', reference: 'Hình tham chiếu', palette: 'Bảng màu', material: 'Chất liệu', document: 'Tài liệu', custom: 'Mục tùy chỉnh' }
const projectUrl = (path) => `${window.location.origin}${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

function InquiryCard({ inquiry, onReply }) {
  const [reply, setReply] = useState(inquiry.reply_text || '')
  return <article className="project-entry"><strong>{inquiry.sender?.display_name || inquiry.sender?.username}</strong><small> · {inquiry.kind} · {new Date(inquiry.created_at).toLocaleDateString('vi-VN')}</small><p>{inquiry.message}</p><label>Phản hồi<textarea value={reply} onChange={(event) => setReply(event.target.value)} maxLength="3000" /></label><button className="secondary-button" disabled={!reply.trim()} onClick={() => onReply(inquiry.id, reply)}>Gửi phản hồi trong Mora</button></article>
}

async function privateImageUrl(path) {
  if (!path) return null
  const { data, error } = await supabase.storage.from('project-drafts').createSignedUrl(path, 600)
  if (error) throw error
  return data.signedUrl
}

export function ProjectStudioPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { project_workspace: cloudReady, loading: checkingBackend } = useBackend()
  const local = projectId.startsWith('local-')
  const canLoadWorkspace = local || cloudReady
  const [draft, setDraft] = useState(null)
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('Đang mở…')
  const [tab, setTab] = useState('overview')
  const [characterView, setCharacterView] = useState('cards')
  const [selectedCharacterId, setSelectedCharacterId] = useState(null)
  const [connectingBoard, setConnectingBoard] = useState(false)
  const [textSize, setTextSize] = useState(16)
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
  const [localProjects, setLocalProjects] = useState([])
  const ready = useRef(false)
  const pendingSave = useRef(null)
  const savedDraft = useRef(null)
  const version = useRef(0)
  const mounted = useRef(true)
  const conflicted = useRef(false)
  const saving = useRef(0)
  const saveFailed = useRef(false)
  const saveQueue = useRef(Promise.resolve())
  const enqueue = useRef(null)
  useEffect(() => { enqueue.current = createSaveQueue(async (snapshot) => {
    if (conflicted.current) throw new Error('Tải bản dự phòng rồi mở lại dự án để xử lý xung đột.')
    saving.current += 1
    try {
    if (local) await putLocalProject({ ...snapshot, updated_at: new Date().toISOString() })
    else {
      const result = await supabase.rpc('save_project_workspace', { target_project: projectId, expected_version: version.current, workspace: workspacePayload(snapshot) })
      if (result.error) { if (result.error.code === '40001') conflicted.current = true; throw result.error }
      version.current = result.data
    }
    savedDraft.current = snapshot
    saveFailed.current = false
    } finally { saving.current -= 1 }
    if (mounted.current && !pendingSave.current) setSaveStatus(local ? 'Đã lưu trên thiết bị này' : 'Đã lưu trên Mora')
  }) }, [local, projectId])
  const flushSave = useCallback(() => {
    if (pendingSave.current) {
      const snapshot = structuredClone(pendingSave.current)
      pendingSave.current = null
      saveQueue.current = enqueue.current(snapshot).catch((caught) => {
        saveFailed.current = true
        if (mounted.current) { setSaveStatus('Lưu thất bại — tải bản dự phòng'); setError(caught.message) }
        throw caught
      })
    }
    return saveQueue.current
  }, [])

  useEffect(() => {
    let active = true
    const refresh = () => { listLocalProjects().then((projects) => { if (active) setLocalProjects(projects.filter((project) => project.owner_id === user.id)) }).catch(() => {}) }
    refresh()
    window.addEventListener('focus', refresh)
    return () => { active = false; window.removeEventListener('focus', refresh) }
  }, [user.id, projectId])
  useEffect(() => {
    let active = true
    ready.current = false
    if (!canLoadWorkspace) return undefined
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
        if (active) { version.current = next.workspace_version || 0; savedDraft.current = next; ready.current = true; setDraft(next); setSelectedPublic([...(next.public_snapshot?.sections || []), ...(next.public_snapshot?.nodes || []), ...(next.public_snapshot?.events || [])].map((item) => item.id).filter(Boolean)); setSaveStatus(local ? 'Chỉ lưu trên thiết bị này' : 'Đã lưu trên Mora') }
      } catch (caught) { if (active) setError(caught.message) }
    }
    load()
    return () => { active = false; ready.current = false }
  }, [local, projectId, user.id, canLoadWorkspace])

  useLayoutEffect(() => {
    if (!draft || !ready.current || draft === savedDraft.current || (!local && draft.owner_id !== user.id && !['editor','manager'].includes(draft.member_role))) return undefined
    pendingSave.current = draft
    setSaveStatus('Đang lưu…')
    const timer = setTimeout(() => { flushSave().catch(() => {}) }, local ? 150 : 850)
    return () => clearTimeout(timer)
  }, [draft, local, user.id, flushSave])

  useEffect(() => {
    mounted.current = true
    const warn = (event) => { if (pendingSave.current || saving.current || saveFailed.current || conflicted.current) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => { flushSave().catch(() => {}); mounted.current = false; window.removeEventListener('beforeunload', warn) }
  }, [flushSave])

  const assetPaths = [...new Set([...(draft?.nodes || []).flatMap((node) => [node.image_path, node.details?.flashart_path]), ...(draft?.sections || []).map((item) => item.content?.image_path), ...(draft?.events || []).map((item) => item.sketch_path), draft?.draft_cover_path].filter(Boolean))].sort().join('|')
  useEffect(() => {
    if (local || !assetPaths) return undefined
    let active = true
    const refresh = async () => {
      const results = await Promise.allSettled(assetPaths.split('|').map(async (path) => [path, await privateImageUrl(path)]))
      if (active) { const urls = Object.fromEntries(results.filter((result) => result.status === 'fulfilled').map((result) => result.value)); setImageUrls(urls); setSketchUrls(urls) }
    }
    refresh()
    const timer = setInterval(refresh, 480000)
    window.addEventListener('focus', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', refresh) }
  }, [local, assetPaths])

  const update = (patch) => { if (canEdit) setDraft((current) => ({ ...current, ...patch })) }
  const canEdit = !working && !publishing && (local || draft?.owner_id === user.id || ['editor','manager'].includes(draft?.member_role))
  const isOwner = local || draft?.owner_id === user.id
  async function remove(_table, id, collection) {
    if (!canEdit) return
    try {
      update({ [collection]: draft[collection].filter((item) => item.id !== id) })
    } catch (caught) { setError(caught.message) }
  }
  async function removeNode(id) {
    if (!canEdit) return
    update({ nodes: draft.nodes.filter((node) => node.id !== id), links: draft.links.filter((edge) => edge.source_id !== id && edge.target_id !== id) })
  }
  function handleCanvasChange(nodes, links) {
    if (!canEdit) return
    update({ nodes, links })
  }
  function addCanvasNode(kind) {
    if (!canEdit) return
    const node = { id: crypto.randomUUID(), canvas_kind: kind, title: kind === 'character' ? (isGameProject(draft.project_type) ? 'Tướng mới' : 'Nhân vật mới') : 'Vùng đất mới', details: {}, pos_x: 120 + (draft.nodes.length % 5) * 150, pos_y: 120 + (draft.nodes.length % 4) * 90 }
    update({ nodes: [...draft.nodes, node] })
    if (kind === 'character') { setSelectedCharacterId(node.id); setCharacterView('detail') }
  }
  function addBoardElement(kind) {
    if (!canEdit) return
    const count = draft.sections.filter((item) => item.content?.category === 'board_element' && item.content.board_tab === tab).length
    update({ sections: [...draft.sections, { id: crypto.randomUUID(), section_type: 'custom', title: 'Bảng ý tưởng', sort_order: draft.sections.length, content: { category: 'board_element', board_tab: tab, kind, x: 80 + (count % 4) * 210, y: 85 + (count % 5) * 85, font_size: textSize, text: '' } }] })
  }
  function toolbarCommand(command) {
    if (tab === 'character') {
      if (command === 'connect') setCharacterView('canvas')
      else addCanvasNode('character')
    } else if (tab === 'land') {
      if (command === 'add') addCanvasNode('land')
      else if (command === 'connect') document.querySelector('.canvas-workspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (command === 'connect') setConnectingBoard(true)
    else addBoardElement(command)
  }
  async function uploadFlashart(id, file) {
    if (!canEdit || !file) return
    try {
      const data = await readImage(file)
      if (local) update({ nodes: draft.nodes.map((node) => node.id === id ? { ...node, details: { ...node.details, flashart_data: data } } : node) })
      else { const path = await uploadPrivateProjectImage(projectId, file); setImageUrls((current) => ({ ...current, [path]: null })); const url = await privateImageUrl(path); setImageUrls((current) => ({ ...current, [path]: url })); update({ nodes: draft.nodes.map((node) => node.id === id ? { ...node, details: { ...node.details, flashart_path: path } } : node) }) }
    } catch (caught) { setError(caught.message) }
  }
  async function uploadProjectCover(file) {
    if (!isOwner || !file) return
    try {
      if (local) update({ cover_data: await readImage(file) })
      else { const path = await uploadPrivateProjectImage(projectId, file); const url = await privateImageUrl(path); setImageUrls((current) => ({ ...current, [path]: url })); update({ draft_cover_path: path }) }
    } catch (caught) { setError(caught.message) }
  }
  async function uploadNodeImage(id, file) {
    if (!canEdit) return
    if (!file) return
    try {
      const data = await readImage(file)
      if (local) update({ nodes: draft.nodes.map((node) => node.id === id ? { ...node, image_data: data } : node) })
      else {
        const path = await uploadPrivateProjectImage(projectId, file)
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
        const path = await uploadPrivateProjectImage(projectId, file)
        const url = await privateImageUrl(path)
        setImageUrls((current) => ({ ...current, [path]: url }))
        update({ sections: draft.sections.map((item) => item.id === id ? { ...item, content: { ...item.content, image_path: path } } : item) })
      }
    } catch (caught) { setError(caught.message) }
  }
  function addSection() { update({ sections: [...draft.sections, sectionForTab(tab, projectWorkflow(draft.project_type).labels[tab] || 'Mục mới', draft.sections.length)] }) }
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
    if (!local || !cloudReady || !window.confirm('Tải toàn bộ bản nháp và ảnh lên vùng riêng tư của Mora để cộng tác? Bản trên máy vẫn được giữ.')) return
    setWorking(true); setError('')
    let uploaded = []
    try {
      await flushSave()
      let nextId = draft.pending_cloud_id
      if (nextId) {
        const existing = await supabase.from('projects').select('id,workspace_version').eq('id', nextId).eq('owner_id', user.id).maybeSingle()
        if (existing.error) throw existing.error
        if (existing.data?.workspace_version > 0) { navigate(`/studio/projects/${nextId}`); return }
        if (!existing.data) nextId = null
      }
      if (!nextId) {
        const result = await supabase.from('projects').insert({ owner_id: user.id, name: draft.name, project_type: draft.project_type, visibility: 'private', status: 'draft' }).select('id').single()
        if (result.error) throw result.error
        nextId = result.data.id
        await putLocalProject({ ...draft, pending_cloud_id: nextId, updated_at: new Date().toISOString() })
        update({ pending_cloud_id: nextId })
      }
      const prepared = await prepareCloudProject(draft, nextId)
      uploaded = prepared.uploaded
      const result = await supabase.rpc('save_project_workspace', { target_project: nextId, expected_version: 0, workspace: prepared.workspace })
      if (result.error) throw result.error
      uploaded = []
      navigate(`/studio/projects/${nextId}`)
    } catch (caught) {
      if (uploaded.length) await supabase.storage.from('project-drafts').remove(uploaded)
      setError(`Đồng bộ chưa hoàn tất: ${caught.message}. Bản trên máy vẫn được giữ.`)
    } finally { setWorking(false) }
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
    const paths = publicSnapshotAssets(snapshot)
    if (paths.length) { const result = await supabase.storage.from('project-media').remove(paths); if (result.error) throw result.error }
  }

  async function unpublish() {
    if (!isOwner || local || !window.confirm('Ẩn dự án khỏi trang công khai? Các liên kết và bản sao đã được người khác lưu trước đó vẫn có thể tồn tại.')) return
    setPublishing(true); setError('')
    try {
      await flushSave()
      const previous = draft.public_snapshot
      const { data: hidden, error: hideError } = await supabase.from('projects').update({ status: 'draft', visibility: 'private', public_snapshot: {}, cover_path: null, published_at: null }).eq('id', projectId).select('workspace_version').single()
      if (hideError) throw hideError
      version.current = hidden.workspace_version
      update({ status: 'draft', visibility: 'private', public_snapshot: {}, cover_path: null })
      await removePublicAssets(previous)
      setSaveStatus('Đã ẩn dự án công khai')
    } catch (caught) { setError(`Dự án đã được ẩn nếu cập nhật thành công; hãy kiểm tra ảnh công khai cũ: ${caught.message}`) }
    finally { setPublishing(false) }
  }

  async function publish() {
    if (!isOwner || local || !selectedPublic.length || publishing) return
    if (!window.confirm('Công khai đúng các mục và ảnh đã chọn? Dữ liệu nội bộ khác vẫn riêng tư.')) return
    setPublishing(true); setError('')
    let uploaded = []
    try {
      await flushSave()
      const prepared = await preparePublicSnapshot(draft, selectedPublic, user.id)
      uploaded = prepared.uploaded
      const result = await supabase.from('projects').update({ public_snapshot: prepared.snapshot, cover_path: prepared.cover, status: 'published', visibility: 'showcase', published_at: new Date().toISOString() }).eq('id', projectId).select('workspace_version').single()
      if (result.error) throw result.error
      version.current = result.data.workspace_version
      uploaded = []
      const previous = draft.public_snapshot
      update({ status: 'published', visibility: 'showcase', public_snapshot: prepared.snapshot, cover_path: prepared.cover })
      await removePublicAssets(previous)
      setSaveStatus('Đã công khai phần được chọn')
    } catch (caught) { if (uploaded.length) await supabase.storage.from('project-media').remove(uploaded); setError(caught.message) }
    finally { setPublishing(false) }
  }

  async function exportLocal() {
    if (!local && !isOwner && !draft.allow_export) { setError('Chủ dự án chưa cấp quyền xuất tài liệu.'); return }
    try {
      const backup = structuredClone(draft)
      if (!local) {
        const download = async (path) => { const result = await supabase.storage.from('project-drafts').download(path); if (result.error) throw result.error; return readImage(result.data) }
        if (backup.draft_cover_path) backup.cover_data = await download(backup.draft_cover_path)
        delete backup.draft_cover_path
        for (const node of backup.nodes) {
          if (node.image_path) node.image_data = await download(node.image_path)
          delete node.image_path
          if (node.details?.flashart_path) node.details.flashart_data = await download(node.details.flashart_path)
          delete node.details?.flashart_path
        }
        for (const section of backup.sections) {
          if (section.content?.image_path) section.content.image_data = await download(section.content.image_path)
          delete section.content?.image_path
        }
        for (const event of backup.events) {
          if (event.sketch_path) event.details.sketch_data = await download(event.sketch_path)
          delete event.sketch_path
        }
      }
      delete backup.share_token; delete backup.public_snapshot; delete backup.member_role
      backup.exported_at = new Date().toISOString()
      const blob = new Blob([JSON.stringify(backup,null,2)],{ type:'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a'); anchor.href=url; anchor.download=`mora-project-${draft.id}.json`; anchor.click(); setTimeout(() => URL.revokeObjectURL(url),3000)
    } catch (caught) { setError(`Không xuất được bản sao lưu đầy đủ: ${caught.message}`) }
  }
  function exportPdf() {
    if (!local && !isOwner && !draft.allow_export) { setError('Chủ dự án chưa cấp quyền xuất tài liệu.'); return }
    if (!selectedPublic.length) { setError('Chọn ít nhất một mục để đưa vào tài liệu.'); return }
    document.body.classList.add('printing-project')
    setTimeout(() => { window.print(); setTimeout(() => document.body.classList.remove('printing-project'), 1000) }, 80)
  }

  if (!local && !cloudReady) return checkingBackend ? <LoadingState /> : <ErrorState message="Không gian cộng tác đang chờ migration Mora trên Supabase. Bản nháp trên thiết bị vẫn dùng được trong Không gian của tôi." retry={() => navigate('/studio/projects')} />
  if (error && !draft) return <ErrorState message={error} retry={() => navigate('/studio/projects')} />
  if (!draft) return <LoadingState />
  const workflow = projectWorkflow(draft.project_type)
  const tabs = [...workflow.tabs.slice(0, -1), ...['lore', 'gameplay', 'skill', 'palette', 'material'].filter((key) => !workflow.tabs.includes(key) && draft.sections.some((section) => sectionBelongsToTab(section, key))), 'share']
  const visibleSections = draft.sections.filter((section) => sectionBelongsToTab(section, tab))
  const imageUrl = (item) => item.image_data || item.content?.image_data || imageUrls[item.image_path || item.content?.image_path] || null
  const boardEnabled = !['share', 'character', 'land', 'currency', 'items', 'skins', 'game_events', 'economy', 'events'].includes(tab)
  return <div className="content-page project-workspace"><Link to="/studio/projects" className="project-back"><ArrowLeft size={16} /> Dự án của tôi</Link><header className="project-editor-head glass-card"><div><span className="eyebrow purple"><span /> {local ? 'CHỈ TRÊN THIẾT BỊ NÀY' : 'MORA STUDIO'}</span><h1>{draft.name}</h1><p>{local ? 'Người khác không thể mở liên kết tới bản nháp này. Dữ liệu chỉ nằm trong trình duyệt hiện tại.' : 'Dữ liệu nội bộ không tự xuất hiện trên Feed hoặc khu Dự án công khai.'}</p><small aria-live="polite">{saveStatus}</small></div><div className="project-editor-actions">{local ? <><button className="secondary-button" onClick={exportLocal}><Download size={15} /> Tải bản nháp</button>{cloudReady && <button className="primary-button" onClick={syncToMora} disabled={working}><Upload size={15} /> {working ? 'Đang đồng bộ…' : 'Đồng bộ để cộng tác'}</button>}</> : draft.status === 'published' ? <><Link className="secondary-button" to={`/projects/${projectId}`}><Globe2 size={15} /> Xem trang công khai</Link>{isOwner && <button className="secondary-button" disabled={publishing} onClick={unpublish}>Ẩn công khai</button>}</> : <span className="visibility"><LockKeyhole size={15} /> Chưa công khai</span>}</div></header>
    {error && <div className="form-message error" role="alert">{error} <button className="secondary-button" onClick={exportLocal}>Tải bản dự phòng</button>{canEdit && <button className="secondary-button" onClick={() => { pendingSave.current = draft; setError(''); flushSave().catch(() => {}) }}>Lưu lại</button>}</div>}
    <section className="project-workflow-intro"><span>{workflow.label}</span><p>{workflow.description}</p></section>
    <div className="project-space-layout"><ProjectWorkspaceNav title={draft.name} tabs={tabs} labels={workflow.labels} active={tab} onSelect={(key) => { setTab(key); setConnectingBoard(false) }} footer={local ? 'Bản nháp chỉ trên thiết bị này' : 'Dữ liệu chưa chọn công khai vẫn riêng tư'} /><main className="project-space-main">
    <ProjectEditorToolbar label={workflow.labels[tab] || kinds[tab] || tab} character={tab === 'character'} land={tab === 'land'} board={boardEnabled} textSize={textSize} onSize={setTextSize} onCommand={toolbarCommand} canEdit={canEdit} />
    {boardEnabled && <ProjectBoard tab={tab} sections={draft.sections} onChange={(sections) => update({ sections })} onAdd={addBoardElement} connecting={connectingBoard} onConnectionDone={() => setConnectingBoard(false)} textSize={textSize} readOnly={!canEdit} />}
    {tab === 'share' ? <div className="project-share-grid"><section className="glass-card project-panel"><h2>Thông tin dự án</h2><label>Tên<input value={draft.name} disabled={!isOwner || working || publishing} onChange={(event) => update({ name: event.target.value })} /></label><label>Ảnh bìa dự án 3:4<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={!isOwner || working || publishing} onChange={(event) => { uploadProjectCover(event.target.files?.[0]); event.target.value = '' }} /></label>{(draft.cover_data || imageUrls[draft.draft_cover_path]) && <img className="project-cover-preview" src={draft.cover_data || imageUrls[draft.draft_cover_path]} alt={`Bìa ${draft.name}`} />}<small>Ảnh bìa chỉ công khai khi bạn chọn công bố dự án.</small><label>Mô tả công khai<input value={draft.summary || ''} disabled={!isOwner || working || publishing} onChange={(event) => update({ summary: event.target.value })} /></label><label>Thể loại<input value={draft.genre || ''} disabled={!isOwner || working || publishing} onChange={(event) => update({ genre: event.target.value })} /></label><label>Giai đoạn<select value={draft.stage || 'Idea'} disabled={!isOwner || working || publishing} onChange={(event) => update({ stage: event.target.value })}>{['Idea','Planning','In Development','Prototype','Completed'].map((stage) => <option key={stage}>{stage}</option>)}</select></label><label><input type="checkbox" checked={!!draft.contact_open} disabled={!isOwner || working || publishing} onChange={(event) => update({ contact_open: event.target.checked })} /> Cho phép người xem gửi lời mời hợp tác/trao đổi/đầu tư</label><label><input type="checkbox" checked={!!draft.allow_copy} disabled={!isOwner || working || publishing} onChange={(event) => update({ allow_copy: event.target.checked })} /> Cho phép sao chép văn bản trong giao diện</label><label><input type="checkbox" checked={!!draft.allow_export} disabled={!isOwner || working || publishing} onChange={(event) => update({ allow_export: event.target.checked })} /> Cho phép thành viên xuất tài liệu</label><p className="privacy-note">Tùy chọn sao chép chỉ hạn chế thao tác trong trình duyệt, không ngăn được chụp màn hình.</p></section>
      <section className="glass-card project-panel"><h2>Cộng tác riêng tư</h2>
        {local ? <p>{cloudReady ? 'Đồng bộ lên Mora trước khi tạo liên kết mời. Bản chỉ trên máy không thể được mở từ thiết bị khác.' : 'Cộng tác chưa mở trên hệ thống. Bản nháp hiện chỉ lưu trên thiết bị này.'}</p> : !isOwner ? <p>Chỉ chủ dự án được tạo liên kết mời.</p> : <>
          <p>Liên kết dùng một lần và hết hạn sau 7 ngày. Chỉ người nhận đăng nhập mới tham gia.</p>
          <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}><option value="viewer">Chỉ xem</option><option value="editor">Chỉnh sửa</option></select>
          <button className="secondary-button" disabled={working} onClick={makeInvite}><Link2 size={15} /> Tạo liên kết mời</button>
          {inviteUrl && <div className="invite-link"><input readOnly value={inviteUrl} aria-label="Liên kết mời" onFocus={(event) => event.target.select()} /><button onClick={() => navigator.clipboard.writeText(inviteUrl)}>Sao chép</button></div>}
          {members.length > 0 && <div className="project-team"><h3>Người tham gia</h3>{members.map((member) => <div className="project-team-row" key={member.user_id}><span>{member.person?.display_name || member.person?.username || member.user_id}</span><select aria-label="Quyền cộng tác" value={member.role} onChange={(event) => setMemberRole(member.user_id, event.target.value)}><option value="viewer">Chỉ xem</option><option value="editor">Chỉnh sửa</option>{member.role === 'manager' && <option value="manager">Quản lý (cũ)</option>}</select><button className="text-danger" onClick={() => removeMember(member.user_id)}>Gỡ</button></div>)}</div>}
          {invitations.some((item) => !item.accepted_at && !item.revoked_at && new Date(item.expires_at) > new Date()) && <div className="project-team"><h3>Liên kết đang hiệu lực</h3>{invitations.filter((item) => !item.accepted_at && !item.revoked_at && new Date(item.expires_at) > new Date()).map((item) => <div className="project-team-row" key={item.id}><span>{item.role === 'viewer' ? 'Chỉ xem' : 'Chỉnh sửa'} · hạn {new Date(item.expires_at).toLocaleDateString('vi-VN')}</span><button className="text-danger" onClick={() => revokeInvite(item.token)}>Thu hồi</button></div>)}</div>}
        </>}</section>
      <section className="glass-card project-panel"><h2>Chọn nội dung công khai hoặc xuất PDF</h2><p>Chỉ các ô được chọn sẽ đi vào bản công khai. Dự án riêng tư, bản nháp Feed và tài liệu khác không tự công bố.</p><div className="publish-picks">{[...draft.sections, ...draft.nodes, ...draft.events].map((item) => <label key={item.id}><input type="checkbox" checked={selectedPublic.includes(item.id)} onChange={(event) => setSelectedPublic((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} /> {item.title} <small>{workflow.labels[item.content?.category || item.section_type || item.canvas_kind] || kinds[item.section_type || item.canvas_kind] || workflow.labels.events}</small></label>)}{!draft.sections.length && !draft.nodes.length && !draft.events.length && <p>Thêm nội dung trước khi xuất bản.</p>}</div><div className="panel-actions"><button className="secondary-button" onClick={exportPdf}><Download size={15} /> In / lưu PDF 16:9</button>{!local && isOwner && <button className="primary-button" onClick={publish} disabled={publishing || !selectedPublic.length}><Globe2 size={15} /> {publishing ? 'Đang xuất bản…' : 'Công bố phần đã chọn'}</button>}</div></section>
      {!local && isOwner && <section className="glass-card project-panel"><h2>Lời nhắn về dự án</h2>{!inquiries.length ? <p>Chưa có lời mời hợp tác hay trao đổi.</p> : inquiries.map((inquiry) => <InquiryCard key={inquiry.id} inquiry={inquiry} onReply={replyToInquiry} />)}</section>}
    </div> : ['currency', 'items', 'skins', 'game_events', 'economy'].includes(tab) ? <GameDesignPanel tab={tab} draft={draft} canEdit={canEdit} onChange={update} localProjects={localProjects} ownerId={user.id} /> : tab === 'character' ? <CharacterGallery projectType={draft.project_type} nodes={draft.nodes} links={draft.links} view={characterView} selectedId={selectedCharacterId} onView={setCharacterView} onSelect={setSelectedCharacterId} onAdd={() => addCanvasNode('character')} onChange={handleCanvasChange} onRemoveNode={removeNode} onUploadAvatar={uploadNodeImage} onUploadFlashart={uploadFlashart} imageUrl={imageUrl} flashartUrl={(node) => node.details?.flashart_data || imageUrls[node.details?.flashart_path]} readOnly={!canEdit} /> : tab === 'land' ? <div className="project-panel glass-card"><h2>{workflow.labels.land}</h2><p>Thêm vùng đất, kéo vị trí và nối các vùng để diễn tả quan hệ địa lý hay cốt truyện.</p><ProjectCanvas readOnly={!canEdit} kind="land" projectType={draft.project_type} nodes={draft.nodes} links={draft.links} onChange={handleCanvasChange} onRemoveNode={removeNode} onUpload={uploadNodeImage} imageUrl={imageUrl} /></div> : tab === 'events' ? <div className="project-panel glass-card"><div className="section-title"><div><h2>{workflow.labels.events}</h2><p>{isGameProject(draft.project_type) ? 'Lưu diễn biến sự kiện, nhân vật tham gia và hình phác thảo cho nhóm.' : 'Lưu các mốc quan trọng của câu chuyện và mối liên hệ giữa các nhân vật.'}</p></div><button className="primary-button small" onClick={addEvent} disabled={!canEdit}><Plus size={15} /> Thêm sự kiện</button></div>{draft.events.map((event) => <div key={event.id} className="project-entry"><input value={event.title} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { title: e.target.value })} aria-label="Tên sự kiện" /><textarea value={event.description} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { description: e.target.value })} placeholder="Diễn biến / mốc sự kiện" /><label>Nhân vật tham gia<textarea value={event.details?.participants || ''} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { details: { ...event.details, participants: e.target.value } })} /></label><label>{isGameProject(draft.project_type) ? 'Skin / hình tham chiếu / phác thảo' : 'Hình tham chiếu / phác thảo'}<textarea value={event.details?.skins || ''} disabled={!canEdit} onChange={(e) => patchEvent(event.id, { details: { ...event.details, skins: e.target.value } })} /></label>{(event.details?.sketch_data || sketchUrls[event.sketch_path]) && <img className="event-sketch" src={event.details?.sketch_data || sketchUrls[event.sketch_path]} alt="Phác thảo sự kiện" />}<button className="secondary-button" disabled={!canEdit} onClick={() => setSketching(sketching === event.id ? null : event.id)}>Phác thảo / chú thích ảnh</button>{sketching === event.id && <SketchPad initialImage={event.details?.sketch_data || sketchUrls[event.sketch_path]} onSave={(blob) => saveSketch(event.id, blob)} disabled={!canEdit} />}<button className="text-danger" disabled={!canEdit} onClick={() => remove('project_events', event.id, 'events')}>Xóa sự kiện</button></div>)}</div> : <div className="project-panel glass-card"><div className="section-title"><div><h2>{workflow.labels[tab] || kinds[tab]}</h2><p>{tab === 'lore' ? 'Ghi quy luật thế giới, lịch sử và chi tiết nhất quán của truyện.' : tab === 'gameplay' ? 'Ghi vòng lặp chơi, cơ chế, mục tiêu và trải nghiệm người chơi.' : 'Mỗi mục có thể tùy chỉnh; không bắt buộc điền mọi mục.'}</p></div><button className="primary-button small" onClick={addSection} disabled={!canEdit}><Plus size={15} /> Thêm mục</button></div>{!visibleSections.length && <p className="inline-empty">Chưa có nội dung trong mục này.</p>}{visibleSections.map((item) => <div className="project-entry" key={item.id}>
      <label>Tiêu đề<input value={item.title} disabled={!canEdit} onChange={(event) => patchSection(item.id, { title: event.target.value })} /></label>
      <label>Nội dung<textarea aria-label="Nội dung" value={item.content?.text || ''} disabled={!canEdit} onChange={(event) => patchSection(item.id, { content: { ...item.content, text: event.target.value } })} /></label>
      {tab === 'skill' && ['effect','character','event'].map((field) => <label key={field}>{({ effect: 'Hiệu ứng / chỉ số', character: 'Nhân vật liên quan', event: 'Sự kiện liên quan' })[field]}<textarea value={item.content?.[field] || ''} disabled={!canEdit} onChange={(change) => patchSection(item.id, { content: { ...item.content, [field]: change.target.value } })} /></label>)}
      <label>Thông tin tùy chỉnh / ghi chú<textarea aria-label="Thông tin tùy chỉnh / ghi chú" value={item.content?.extra || ''} disabled={!canEdit} onChange={(event) => patchSection(item.id, { content: { ...item.content, extra: event.target.value } })} /></label>
      <label>Ảnh tham chiếu<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={!canEdit} onChange={(event) => uploadSectionImage(item.id, event.target.files?.[0])} /></label>
      {imageUrl(item) && <img className="event-sketch" src={imageUrl(item)} alt={`Hình tham chiếu ${item.title}`} />}
      <button className="text-danger" disabled={!canEdit} onClick={() => remove('project_sections', item.id, 'sections')}>Xóa mục</button>
    </div>)}</div>}
    </main></div>
    <div className="presentation" aria-hidden="true"><article className="presentation-slide"><h1>{draft.name}</h1><p>{draft.summary}</p><small>Mora · Mour Studio</small></article>{draft.sections.filter((item) => selectedPublic.includes(item.id)).map((item) => <article className="presentation-slide" key={item.id}><h2>{item.title}</h2><p>{item.content?.text}</p>{imageUrl(item) && <img src={imageUrl(item)} alt="" />}<p>{[item.content?.effect,item.content?.character,item.content?.event,item.content?.extra].filter(Boolean).join(' · ')}</p></article>)}{draft.nodes.filter((item) => selectedPublic.includes(item.id)).map((node) => <article className="presentation-slide" key={node.id}><h2>{node.title}</h2>{imageUrl(node) && <img src={imageUrl(node)} alt="" />}<p>{Object.entries(node.details || {}).filter(([key,value]) => !/(_data|_path)$/.test(key) && typeof value === 'string' && value).map(([key,value]) => `${key}: ${value}`).join(' · ')}</p></article>)}{draft.links.some((edge) => selectedPublic.includes(edge.source_id) && selectedPublic.includes(edge.target_id)) && <article className="presentation-slide"><h2>Quan hệ quan trọng</h2>{draft.links.filter((edge) => selectedPublic.includes(edge.source_id) && selectedPublic.includes(edge.target_id)).map((edge) => <p key={edge.id}>{draft.nodes.find((n) => n.id === edge.source_id)?.title} ↔ {draft.nodes.find((n) => n.id === edge.target_id)?.title}: {edge.label} {edge.detail}</p>)}</article>}{draft.events.filter((item) => selectedPublic.includes(item.id)).map((event) => <article className="presentation-slide" key={event.id}><h2>{event.title}</h2><p>{event.description}</p><p>{event.details?.participants}</p><p>{event.details?.skins}</p>{(event.details?.sketch_data || sketchUrls[event.sketch_path]) && <img src={event.details?.sketch_data || sketchUrls[event.sketch_path]} alt="" />}</article>)}</div>
  </div>
}

export function ProjectInvitePage() {
  const { token } = useParams()
  const { session, profile } = useAuth()
  const { project_workspace: cloudReady, loading: checking } = useBackend()
  useEffect(() => { rememberInvite(`/invite/${token}`) }, [token])
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function accept() { if (!/^[a-f0-9]{64}$/i.test(token)) { setError('Liên kết mời không hợp lệ.'); return } setBusy(true); setError(''); const { data, error: inviteError } = await supabase.rpc('accept_project_invitation', { access_token: token }); if (inviteError) setError(inviteError.message); else { clearInvite(); navigate(`/studio/projects/${data}`, { replace: true }) } setBusy(false) }
  return <div className="admin-gate"><section className="glass-card"><ShieldCheck /><h1>Lời mời dự án Mora</h1><p>Để xem hoặc chỉnh sửa dự án nội bộ, bạn cần đăng nhập và chấp nhận lời mời. Liên kết chỉ dùng một lần.</p>{!session ? <Link to="/login" state={{ from: { pathname: `/invite/${token}` } }} className="primary-button">Đăng nhập để tiếp tục</Link> : !profile?.onboarding_completed ? <Link className="primary-button" to="/onboarding">Hoàn thành hồ sơ</Link> : !cloudReady ? <p>{checking ? 'Đang kiểm tra hệ thống…' : 'Cộng tác đang chờ cập nhật Supabase.'}</p> : <button className="primary-button" disabled={busy} onClick={accept}>{busy ? 'Đang tham gia…' : 'Chấp nhận lời mời'}</button>}{error && <p className="form-message error">{error}</p>}</section></div>
}
