import { useState } from 'react'
import { ArrowUpRight, BookOpen, BriefcaseBusiness, Heart, Link2, MessageCircle, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { sampleCourse, samplePeople, samplePosts } from '../data/sampleCommunity'

function Face({ person }) {
  return <span className="demo-face" aria-hidden="true" style={{ '--face-color': person.color }}>{person.name.slice(0, 1)}</span>
}

const personLink = (id) => `/community?person=${id}#community-people`

export function FeaturedPeople() {
  return <section className="community-preview-block"><div className="section-title"><div><span className="eyebrow purple">GẶP GỠ NGƯỜI SÁNG TẠO</span><h2>Nhóm Morimori</h2><p>Bốn hồ sơ trong tình huống mẫu. Người dùng thật không tự được thêm bạn.</p></div><Link to="/community#community-people">Khám phá nhóm <ArrowUpRight size={15} /></Link></div><div className="community-people-list">{samplePeople.map((person) => <Link className="glass-card community-person-card" to={personLink(person.id)} key={person.id}><Face person={person} /><strong>{person.name}</strong><span>{person.role}</span>{person.followers && <small>{person.followers} theo dõi · mẫu</small>}</Link>)}</div></section>
}

export function FeaturedProject() {
  return <section className="community-preview-block"><div className="section-title"><div><span className="eyebrow purple">DỰ ÁN ĐƯỢC GIỚI THIỆU</span><h2>Nhóm cùng xây dựng Morimori</h2><p>Ví dụ: một dự án có cả gameplay, nhân vật, lore và kế hoạch.</p></div></div><Link className="glass-card community-project-card" to="/community#community-project"><span className="community-project-mark"><BriefcaseBusiness size={29} /></span><div><small>GAME · DỰ ÁN MẪU</small><h3>Morimori</h3><p>Mabi cùng Mina, An Nhiên và Bảo Lam phát triển game. Khám phá cách nhóm phân quyền, chọn phần công khai và đón nhận góp ý.</p><span className="community-inline-link">Xem hồ sơ dự án <ArrowUpRight size={15} /></span></div></Link></section>
}

export function FeaturedCourse() {
  return <Link className="glass-card community-course-card" to="/community#community-learn"><BookOpen size={28} /><div><small>KHÓA HỌC MẪU · MABI · MIỄN PHÍ</small><h3>{sampleCourse.title}</h3><p>{sampleCourse.description}</p><span className="community-inline-link">Xem nội dung khóa học <ArrowUpRight size={15} /></span></div></Link>
}

function SamplePost({ post }) {
  const [liked, setLiked] = useState(false)
  const [choice, setChoice] = useState('')
  const [reply, setReply] = useState('')
  const [messages, setMessages] = useState([])
  const [showReply, setShowReply] = useState(false)
  const person = samplePeople.find((item) => item.id === post.id)
  return <article className="glass-card community-post-card"><header><Link to={personLink(person.id)}><Face person={person} /><span><strong>{person.name}</strong><small>{person.role}</small></span></Link><span className="community-sample-label">Mẫu</span></header><strong className="community-post-title">{post.title}</strong><p>{post.text}</p><Link className="linked-project" to="/community#community-project"><Link2 size={15} /> Morimori · Dự án nhóm</Link>{post.id === 'lam' && <div className="demo-vote" aria-label="Bình chọn trong tình huống mẫu">{['Nhân vật', 'Lore truyện', 'Kế hoạch phát triển'].map((option) => <button type="button" className={choice === option ? 'selected' : ''} onClick={() => setChoice(option)} key={option}>{option}</button>)}</div>}{choice && <small className="community-sample-response">Bạn đã chọn {choice} trong tình huống mẫu.</small>}<footer><button type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /> {liked ? 'Đã thích' : 'Thích'}</button><button type="button" aria-expanded={showReply} onClick={() => setShowReply(!showReply)}><MessageCircle size={17} /> Thảo luận</button><Link to="/community#community-feed">Xem thêm <ArrowUpRight size={14} /></Link></footer>{showReply && <div className="community-post-replies">{messages.map((message, index) => <p key={`${index}-${message}`}>Bạn: {message}</p>)}<form onSubmit={(event) => { event.preventDefault(); if (reply.trim()) { setMessages([...messages, reply.trim()]); setReply('') } }}><input aria-label="Phản hồi thử" value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Góp ý trong tình huống mẫu…" maxLength={600} /><button type="submit" disabled={!reply.trim()}>Gửi</button></form></div>}</article>
}

export function FeaturedPosts() {
  return <section className="community-preview-block featured-posts"><div className="section-title"><div><span className="eyebrow purple">DÒNG CHẢY SÁNG TẠO</span><h2>Cùng theo dõi một dự án</h2><p>Nhóm mẫu Morimori chia sẻ quá trình làm game; bạn có thể thử phản hồi ngay ở đây.</p></div><Link to="/community#community-feed"><UsersRound size={15} /> Gặp cả nhóm</Link></div><div className="community-post-grid">{samplePosts.map((post) => <SamplePost key={post.id} post={post} />)}</div></section>
}
