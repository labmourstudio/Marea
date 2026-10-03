import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Save, Trash2 } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/StateView'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl, supabase } from '../lib/supabase'

export function CoursePage() {
  const { courseId } = useParams()
  const [state, setState] = useState({ loading: true })
  const [lessonId, setLessonId] = useState(null)
  useEffect(() => {
    let active = true
    async function load() {
      if (!supabase) throw new Error('Chưa kết nối Supabase.')
      const result = await supabase.from('courses').select('id,title,description,topic,language,creator:profiles!courses_creator_id_fkey(username,display_name),course_lessons(*)').eq('id', courseId).eq('status', 'published').eq('visibility', 'public').maybeSingle()
      if (result.error) throw result.error
      if (!result.data) throw new Error('Khóa học chưa được duyệt công khai hoặc không tồn tại.')
      if (active) setState({ loading: false, course: result.data })
    }
    load().catch((error) => { if (active) setState({ loading: false, error: error.message }) })
    return () => { active = false }
  }, [courseId])
  if (state.loading) return <LoadingState />
  if (state.error) return <ErrorState message={state.error} />
  const course = state.course
  const lessons = [...course.course_lessons].sort((a,b) => a.lesson_order - b.lesson_order)
  const lesson = lessons.find((item) => item.id === lessonId) || lessons[0]
  return <div className="content-page course-reader"><Link to="/learn">← Học tập</Link><header className="glass-card settings-panel"><span className="eyebrow purple"><BookOpen size={16} /> {course.topic} · Miễn phí</span><h1>{course.title}</h1><p>{course.description}</p><Link to={`/u/${course.creator?.username}`}>{course.creator?.display_name || course.creator?.username}</Link></header><div className="course-reader-layout"><nav className="glass-card settings-panel" aria-label="Danh sách bài học">{lessons.map((item,index) => <button className={`secondary-button ${lesson?.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setLessonId(item.id)}>{index+1}. {item.title}</button>)}</nav><article className="glass-card settings-panel">{lesson ? <><h2>{lesson.title}</h2><div className="lesson-text">{lesson.content}</div>{lesson.video_path && <video controls playsInline preload="metadata" src={publicStorageUrl('course-media', lesson.video_path)} />}{lesson.image_paths?.map((path) => <img key={path} src={publicStorageUrl('course-media', path)} alt="Hình bài học" loading="lazy" />)}{lesson.exercise?.prompt && <section className="lesson-exercise"><h3>Bài tập</h3><p>{lesson.exercise.prompt}</p></section>}{lesson.attachment_paths?.map((path,index) => <a className="secondary-button" key={path} href={publicStorageUrl('course-media', path)} download target="_blank" rel="noopener noreferrer">Tài liệu {index+1}</a>)}</> : <p>Khóa học chưa có bài học.</p>}</article></div></div>
}

export function CourseEditorPage() {
  const { courseId } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [targetId, setTargetId] = useState(courseId)
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [removed, setRemoved] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const allowed = ['course_creator','owner','admin','moderator'].includes(profile.platform_role)
  const load = useCallback(async () => {
    try {
      if (!courseId) { setCourse({ title:'', description:'', topic:'', language:'English', status:'draft' }); setLessons([]); return }
      const result = await supabase.from('courses').select('*,course_lessons(*)').eq('id', courseId).eq('creator_id', user.id).single()
      if (result.error) throw result.error
      setCourse(result.data); setLessons([...result.data.course_lessons].sort((a,b) => a.lesson_order-b.lesson_order))
    } catch (caught) { setError(caught.message) }
  }, [courseId,user.id])
  useEffect(() => { load() }, [load])
  async function save(submit = false) {
    if (!course.title.trim() || lessons.some((item) => !item.title.trim())) { setError('Nhập tên khóa học và tên mỗi bài học.'); return }
    if (submit && !lessons.length) { setError('Thêm ít nhất một bài học trước khi gửi duyệt.'); return }
    setBusy(true); setError(''); setMessage('')
    try {
      const values = { creator_id:user.id, title:course.title.trim(), description:course.description, topic:course.topic, language:course.language, status:'draft', visibility:'private' }
      const result = targetId ? await supabase.from('courses').update(values).eq('id',targetId).eq('creator_id',user.id).select('id').single() : await supabase.from('courses').insert(values).select('id').single()
      if (result.error) throw result.error
      const id = result.data.id
      // Once created, retries edit this same course instead of creating duplicates.
      setTargetId(id)
      if (removed.length) { const deletion = await supabase.from('course_lessons').delete().eq('course_id',id).in('id',removed); if (deletion.error) throw deletion.error; setRemoved([]) }
      if (lessons.length) {
        const rows = lessons.map((item,index) => ({ id:item.id, course_id:id, title:item.title.trim(), content:item.content || '', exercise:{ prompt:item.exercise?.prompt || '' }, lesson_order:index }))
        const saved = await supabase.from('course_lessons').upsert(rows)
        if (saved.error) throw saved.error
      }
      if (submit) { const review = await supabase.from('courses').update({ status:'pending_review' }).eq('id',id).eq('creator_id',user.id); if (review.error) throw review.error }
      setCourse((current) => ({ ...current, status:submit ? 'pending_review' : 'draft' }))
      if (!courseId) navigate(`/studio/courses/${id}`, { replace:true })
      setMessage(submit ? 'Đã gửi duyệt. Khóa học chỉ xuất hiện sau khi được duyệt.' : 'Đã lưu riêng tư. Chỉnh sửa một khóa đã công bố sẽ gửi lại quy trình duyệt.')
    } catch (caught) { setError(`Lưu chưa hoàn tất: ${caught.message}. Kiểm tra lại trước khi rời trang.`) }
    finally { setBusy(false) }
  }
  if (!allowed) return <ErrorState message="Cần quyền Course Creator để tạo hoặc sửa khóa học. Liên hệ quản trị viên để cấp quyền." />
  if (!course) return error ? <ErrorState message={error} retry={load} /> : <LoadingState />
  return <div className="content-page"><Link to="/studio">← Không gian của tôi</Link><form className="glass-card settings-panel course-editor" onSubmit={(event) => { event.preventDefault(); save(false) }}><header><h1>{courseId ? 'Chỉnh sửa khóa học' : 'Tạo khóa học'}</h1><small>{course.status}</small></header><label>Tên khóa học<input required maxLength="200" value={course.title} onChange={(event) => setCourse({ ...course,title:event.target.value })} /></label><label>Mô tả<textarea value={course.description || ''} onChange={(event) => setCourse({ ...course,description:event.target.value })} /></label><div className="field-grid"><label>Chủ đề<input value={course.topic || ''} onChange={(event) => setCourse({ ...course,topic:event.target.value })} /></label><label>Ngôn ngữ<select value={course.language} onChange={(event) => setCourse({ ...course,language:event.target.value })}>{['English','Vietnamese','Bilingual','Other'].map((value) => <option key={value}>{value}</option>)}</select></label></div>{lessons.map((item,index) => <section className="project-entry" key={item.id}><h2>Bài {index+1}</h2><label>Tên bài<input required value={item.title} onChange={(event) => setLessons((items) => items.map((row) => row.id === item.id ? { ...row,title:event.target.value } : row))} /></label><label>Nội dung<textarea rows="8" value={item.content || ''} onChange={(event) => setLessons((items) => items.map((row) => row.id === item.id ? { ...row,content:event.target.value } : row))} /></label><label>Bài tập<textarea value={item.exercise?.prompt || ''} onChange={(event) => setLessons((items) => items.map((row) => row.id === item.id ? { ...row,exercise:{ prompt:event.target.value } } : row))} /></label><button type="button" className="text-danger" disabled={busy} onClick={() => { setRemoved([...removed,item.id]); setLessons(lessons.filter((row) => row.id !== item.id)) }}><Trash2 size={16} /> Xóa bài học</button></section>)}<button className="secondary-button" type="button" disabled={busy} onClick={() => setLessons([...lessons,{ id:crypto.randomUUID(),title:'',content:'',exercise:{} }])}><Plus size={16} /> Thêm bài học</button><footer className="panel-actions"><button className="secondary-button" disabled={busy}><Save size={16} /> Lưu riêng tư</button><button type="button" className="primary-button" disabled={busy} onClick={() => save(true)}>{busy ? 'Đang lưu…' : 'Lưu và gửi duyệt'}</button></footer>{error && <p role="alert" className="form-message error">{error}</p>}{message && <p role="status" className="form-message success">{message}</p>}</form></div>
}
