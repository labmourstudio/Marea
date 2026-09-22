import { useState } from 'react'
import {
  Bell, Bookmark, BookOpen, BriefcaseBusiness, Check, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, Clock3, Compass, Ellipsis,
  Eye, FileText, Globe2, GraduationCap, Heart, Home, Image as ImageIcon,
  Languages, LayoutDashboard, Link2, LockKeyhole, LogIn, Mail, Map,
  Menu, MessageCircle, MoreHorizontal, Palette, PenLine, Play,
  Plus, Search, Send, Settings, Share2, ShieldCheck, Sparkles, Star,
  User, UserPlus, Users, WandSparkles, X, Zap,
} from 'lucide-react'

const copy = {
  vi: {
    tagline: 'Nơi ý tưởng trở thành thế giới.',
    signIn: 'Đăng nhập', signUp: 'Đăng ký', continueEmail: 'Tiếp tục với email',
    email: 'Email', password: 'Mật khẩu', forgot: 'Quên mật khẩu?',
    or: 'hoặc', terms: 'Bằng việc tiếp tục, bạn đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của Marea.',
    welcome: 'Không gian cho những thế giới chưa được kể.',
    loginNote: 'Viết, xây dựng và chia sẻ — mọi thứ trong một dòng chảy sáng tạo.',
    feed: 'Bảng tin', friends: 'Bạn bè', worlds: 'Thế giới của bạn', projects: 'Dự án',
    learn: 'Khám phá', profile: 'Trang cá nhân', search: 'Tìm kiếm', notifications: 'Thông báo',
    messages: 'Tin nhắn', studio: 'Marea Studio', settings: 'Cài đặt', logout: 'Đăng xuất',
    hello: 'Chào buổi sáng, Minh', helloSub: 'Hôm nay bạn muốn đưa thế giới nào tiến thêm một bước?',
    composer: 'Chia sẻ một ý tưởng, tiến độ hoặc câu hỏi...', post: 'Đăng',
    forYou: 'Dành cho bạn', following: 'Đang theo dõi', latest: 'Mới nhất',
    worldbuilding: 'Xây dựng thế giới', gameCreation: 'Làm game', writing: 'Viết lách',
    trending: 'Chủ đề đang nổi', suggested: 'Người sáng tạo nổi bật', seeAll: 'Xem tất cả',
    follow: 'Theo dõi', followingBtn: 'Đang theo dõi', save: 'Lưu', share: 'Chia sẻ',
    newWorld: 'Tạo thế giới mới', yourWorlds: 'Không gian sáng tạo của bạn',
    worldSub: 'Phát triển lore, nhân vật và dòng thời gian — riêng tư cho đến khi bạn sẵn sàng.',
    all: 'Tất cả', private: 'Riêng tư', public: 'Công khai', showcase: 'Showcase',
    createStory: 'Thế giới truyện', createGame: 'Thế giới game',
    chooseWorld: 'Bạn đang xây dựng điều gì?', chooseWorldSub: 'Marea sẽ chuẩn bị một cấu trúc phù hợp. Bạn luôn có thể thay đổi sau.',
    continue: 'Tiếp tục', cancel: 'Hủy', newCharacter: 'Tạo nhân vật',
    projectsTitle: 'Những ý tưởng đang thành hình', projectsSub: 'Khám phá dự án, tìm cộng sự và theo dõi hành trình từ ý tưởng đến thế giới hoàn chỉnh.',
    featured: 'Nổi bật', lookingTeam: 'Đang tìm đội ngũ', viewProject: 'Xem dự án',
    learnTitle: 'Học để xây dựng tốt hơn', learnSub: 'Bài học thực hành từ những người đang tạo nên thế giới.',
    continueLearning: 'Học tiếp', free: 'Miễn phí', lessons: 'bài học',
    profileRole: 'Writer · Worldbuilder · Narrative Designer', editProfile: 'Chỉnh sửa hồ sơ',
    about: 'Giới thiệu', creations: 'Tác phẩm', posts: 'Bài viết', courses: 'Khóa học',
    setupTitle: 'Hãy tạo không gian của bạn', setupSub: 'Một vài chi tiết để Marea hiểu bạn và đề xuất đúng người, đúng thế giới.',
    back: 'Quay lại', finish: 'Hoàn tất', skip: 'Bỏ qua lúc này',
    unauthorized: 'Khu vực được bảo vệ', unauthorizedSub: 'Bạn không có quyền truy cập Marea Admin. Yêu cầu đã bị từ chối.',
    returnHome: 'Trở về Marea', requests: 'Lời mời kết bạn', discoverPeople: 'Khám phá người sáng tạo',
    mutual: 'bạn chung', addFriend: 'Kết bạn', accept: 'Chấp nhận', ignore: 'Bỏ qua',
    activity: 'Hoạt động gần đây', quickActions: 'Thao tác nhanh', privacy: 'Quyền riêng tư', appearance: 'Giao diện cá nhân',
  },
  en: {
    tagline: 'Where ideas become worlds.',
    signIn: 'Sign in', signUp: 'Create account', continueEmail: 'Continue with email',
    email: 'Email', password: 'Password', forgot: 'Forgot password?',
    or: 'or', terms: 'By continuing, you agree to Marea’s Terms of Use and Privacy Policy.',
    welcome: 'A home for worlds yet to be told.',
    loginNote: 'Write, build and share — all in one creative flow.',
    feed: 'Feed', friends: 'Friends', worlds: 'Your Worlds', projects: 'Projects',
    learn: 'Learn', profile: 'Profile', search: 'Search', notifications: 'Notifications',
    messages: 'Messages', studio: 'Marea Studio', settings: 'Settings', logout: 'Sign out',
    hello: 'Good morning, Minh', helloSub: 'Which world will you move forward today?',
    composer: 'Share an idea, an update or a question...', post: 'Post',
    forYou: 'For You', following: 'Following', latest: 'Latest',
    worldbuilding: 'Worldbuilding', gameCreation: 'Game Creation', writing: 'Writing',
    trending: 'Trending topics', suggested: 'Featured creators', seeAll: 'See all',
    follow: 'Follow', followingBtn: 'Following', save: 'Save', share: 'Share',
    newWorld: 'Create new world', yourWorlds: 'Your creative space',
    worldSub: 'Develop lore, characters and timelines — private until you are ready.',
    all: 'All', private: 'Private', public: 'Public', showcase: 'Showcase',
    createStory: 'Story World', createGame: 'Game World',
    chooseWorld: 'What are you building?', chooseWorldSub: 'Marea will prepare the right structure. You can always change this later.',
    continue: 'Continue', cancel: 'Cancel', newCharacter: 'Create character',
    projectsTitle: 'Ideas taking shape', projectsSub: 'Discover projects, find collaborators and follow the journey from idea to a finished world.',
    featured: 'Featured', lookingTeam: 'Looking for team', viewProject: 'View project',
    learnTitle: 'Learn to build better', learnSub: 'Practical lessons from people creating worlds.',
    continueLearning: 'Continue learning', free: 'Free', lessons: 'lessons',
    profileRole: 'Writer · Worldbuilder · Narrative Designer', editProfile: 'Edit profile',
    about: 'About', creations: 'Creations', posts: 'Posts', courses: 'Courses',
    setupTitle: 'Make this space yours', setupSub: 'A few details help Marea connect you with the right people and worlds.',
    back: 'Back', finish: 'Finish', skip: 'Skip for now',
    unauthorized: 'Protected area', unauthorizedSub: 'You do not have permission to access Marea Admin. The request was denied.',
    returnHome: 'Return to Marea', requests: 'Friend requests', discoverPeople: 'Discover creators',
    mutual: 'mutual friends', addFriend: 'Add friend', accept: 'Accept', ignore: 'Ignore',
    activity: 'Recent activity', quickActions: 'Quick actions', privacy: 'Privacy', appearance: 'Personal appearance',
  },
}

const navItems = [
  ['feed', Home], ['friends', Users], ['worlds', Globe2],
  ['projects', Compass], ['learn', GraduationCap], ['profile', User],
]

const avatarMap = {
  linh: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=160&q=85',
  an: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&q=85',
  duy: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=85',
  mai: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=160&q=85',
  khoa: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=160&q=85',
  minh: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=85',
}

const projectImages = {
  vespers: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=85',
  signal: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1200&q=85',
  lantern: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1200&q=85',
  tide: 'https://images.unsplash.com/photo-1498623116890-37e912163d5d?auto=format&fit=crop&w=1200&q=85',
}

function Logo({ compact = false, light = false }) {
  return <div className={`brand ${compact ? 'compact' : ''} ${light ? 'light' : ''}`}>
    <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
    {!compact && <span>Marea</span>}
  </div>
}

function Avatar({ src = avatarMap.minh, size = 'md', alt = '' }) {
  return <img className={`avatar avatar-${size}`} src={src} alt={alt} />
}

function LanguageToggle({ lang, setLang, glass = false }) {
  return <button className={`language-toggle ${glass ? 'glass' : ''}`} onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')} aria-label="Switch language">
    <Languages size={17} /><span>{lang === 'vi' ? 'VI' : 'EN'}</span><span className="lang-divider" />
    <span className="lang-muted">{lang === 'vi' ? 'EN' : 'VI'}</span>
  </button>
}

function App() {
  const [lang, setLang] = useState('vi')
  const [auth, setAuth] = useState('login')
  const t = copy[lang]

  if (window.location.pathname.startsWith('/admin')) {
    return <AdminGate t={t} lang={lang} setLang={setLang} />
  }

  if (auth === 'login') return <LoginScreen t={t} lang={lang} setLang={setLang} onLogin={() => setAuth('app')} onRegister={() => setAuth('onboarding')} />
  if (auth === 'onboarding') return <Onboarding t={t} lang={lang} setLang={setLang} onFinish={() => setAuth('app')} />
  return <MainApp t={t} lang={lang} setLang={setLang} onLogout={() => setAuth('login')} />
}

function LoginScreen({ t, lang, setLang, onLogin, onRegister }) {
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState('login')
  const submit = (e) => { e.preventDefault(); mode === 'login' ? onLogin() : onRegister() }
  return <main className="auth-shell">
    <div className="aurora auth-a" /><div className="aurora auth-b" /><div className="aurora auth-c" />
    <header className="auth-header"><Logo /><LanguageToggle lang={lang} setLang={setLang} glass /></header>
    <section className="auth-visual">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      <div className="world-sphere">
        <div className="sphere-core"><Sparkles size={28} /><span>CREATE</span></div>
        <div className="float-chip chip-a"><PenLine size={16} /> Story</div>
        <div className="float-chip chip-b"><Map size={16} /> World</div>
        <div className="float-chip chip-c"><Palette size={16} /> Art</div>
      </div>
      <div className="auth-story">
        <div className="eyebrow"><span /> THE CREATIVE NETWORK</div>
        <h1>{t.welcome}</h1><p>{t.loginNote}</p>
        <div className="creative-count"><div className="avatar-stack"><Avatar src={avatarMap.linh} size="sm" /><Avatar src={avatarMap.an} size="sm" /><Avatar src={avatarMap.duy} size="sm" /></div><span><strong>12,000+</strong><br />{lang === 'vi' ? 'người sáng tạo đang xây dựng' : 'creators are building'}</span></div>
      </div>
    </section>
    <section className="auth-panel-wrap">
      <div className="auth-panel glass-panel">
        <div className="auth-title"><Logo /><h2>{mode === 'login' ? t.signIn : t.signUp}</h2><p>{t.tagline}</p></div>
        {!showForm ? <>
          <button className="social-button" onClick={mode === 'login' ? onLogin : onRegister}><span className="google-g">G</span>{lang === 'vi' ? 'Tiếp tục với Google' : 'Continue with Google'}</button>
          <button className="social-button" onClick={mode === 'login' ? onLogin : onRegister}><span className="apple-logo">●</span>{lang === 'vi' ? 'Tiếp tục với Apple' : 'Continue with Apple'}</button>
          <div className="separator"><span />{t.or}<span /></div>
          <button className="primary-button full" onClick={() => setShowForm(true)}><Mail size={18} />{t.continueEmail}</button>
        </> : <form className="email-form" onSubmit={submit}>
          <label>{t.email}<input autoFocus type="email" placeholder="hello@marea.world" required /></label>
          <label>{t.password}<input type="password" placeholder="••••••••••" required minLength="6" /></label>
          <div className="form-row"><label className="check-label"><input type="checkbox" />{lang === 'vi' ? 'Ghi nhớ tôi' : 'Remember me'}</label><button type="button" className="text-button">{t.forgot}</button></div>
          <button className="primary-button full" type="submit"><LogIn size={18} />{mode === 'login' ? t.signIn : t.signUp}</button>
          <button type="button" className="back-email" onClick={() => setShowForm(false)}><ChevronLeft size={16} />{t.back}</button>
        </form>}
        <p className="auth-switch">{mode === 'login' ? (lang === 'vi' ? 'Chưa có tài khoản?' : 'New to Marea?') : (lang === 'vi' ? 'Đã có tài khoản?' : 'Already a member?')} <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setShowForm(false) }}>{mode === 'login' ? t.signUp : t.signIn}</button></p>
        <p className="terms">{t.terms}</p>
      </div>
    </section>
  </main>
}

function Onboarding({ t, lang, setLang, onFinish }) {
  const [step, setStep] = useState(1)
  const [roles, setRoles] = useState(['Writer', 'Worldbuilder'])
  const [genres, setGenres] = useState(['Fantasy', 'RPG'])
  const toggle = (value, list, setter) => setter(list.includes(value) ? list.filter(x => x !== value) : [...list, value])
  return <main className="onboarding-shell">
    <div className="aurora onboard-a" /><div className="aurora onboard-b" />
    <header className="onboard-header"><Logo /><div className="onboard-tools"><span>{lang === 'vi' ? `Bước ${step} / 3` : `Step ${step} of 3`}</span><LanguageToggle lang={lang} setLang={setLang} glass /></div></header>
    <div className="onboard-progress"><span style={{ width: `${step * 33.333}%` }} /></div>
    <section className="onboard-card glass-panel">
      <div className="onboard-heading"><div className="step-icon">{step === 1 ? <User /> : step === 2 ? <Sparkles /> : <Users />}</div><h1>{step === 1 ? t.setupTitle : step === 2 ? (lang === 'vi' ? 'Bạn sáng tạo điều gì?' : 'What do you create?') : (lang === 'vi' ? 'Điều gì truyền cảm hứng cho bạn?' : 'What inspires you?')}</h1><p>{step === 1 ? t.setupSub : step === 2 ? (lang === 'vi' ? 'Chọn một hoặc nhiều vai trò. Đây không phải là nhãn cố định.' : 'Choose one or more roles. These are never fixed labels.') : (lang === 'vi' ? 'Cá nhân hóa bảng tin đầu tiên của bạn.' : 'Personalize your first feed.')}</p></div>
      {step === 1 && <div className="profile-setup">
        <div className="cover-upload"><div className="cover-gradient" /><button><ImageIcon size={16} />{lang === 'vi' ? 'Thêm ảnh bìa' : 'Add cover'}</button><div className="avatar-upload"><Avatar size="xl" /><span><ImageIcon size={16} /></span></div></div>
        <div className="field-grid"><label>{lang === 'vi' ? 'Tên hiển thị' : 'Display name'}<input defaultValue="Minh Nguyễn" /></label><label>Username<div className="prefix-input"><span>@</span><input defaultValue="minhbuilds" /></div></label><label className="span-2">Bio<textarea defaultValue={lang === 'vi' ? 'Viết những câu chuyện về ký ức, thành phố và những vì sao.' : 'Writing stories about memory, cities and distant stars.'} /></label></div>
      </div>}
      {step === 2 && <div className="selection-area"><p className="selection-label">{lang === 'vi' ? 'Vai trò sáng tạo' : 'Creative roles'}</p><div className="select-grid">{[['Writer',PenLine],['Game Designer',Zap],['Artist',Palette],['Illustrator',ImageIcon],['Worldbuilder',Globe2],['Learner',BookOpen]].map(([role,Icon]) => <button key={role} onClick={() => toggle(role, roles, setRoles)} className={roles.includes(role) ? 'selected' : ''}><Icon size={22} /><span>{role}</span>{roles.includes(role) && <Check size={16} className="select-check" />}</button>)}</div><p className="selection-label second">{lang === 'vi' ? 'Ngôn ngữ bạn sử dụng' : 'Languages you use'}</p><div className="language-pills"><button className="active">Tiếng Việt</button><button className="active">English</button><button>{lang === 'vi' ? 'Thêm ngôn ngữ' : 'Add language'} +</button></div></div>}
      {step === 3 && <div className="selection-area"><p className="selection-label">{lang === 'vi' ? 'Thể loại yêu thích' : 'Favorite genres'}</p><div className="genre-cloud">{['Fantasy','Sci-fi','Horror','Romance','RPG','MOBA','Comic','Visual Novel'].map(g => <button key={g} onClick={() => toggle(g, genres, setGenres)} className={genres.includes(g) ? 'selected' : ''}>{g}{genres.includes(g) && <Check size={14} />}</button>)}</div><p className="selection-label second">{lang === 'vi' ? 'Bắt đầu với vài người truyền cảm hứng' : 'Start with a few inspiring creators'}</p><div className="mini-creators">{[['Linh Trần','Fantasy Writer',avatarMap.linh],['An Lê','Concept Artist',avatarMap.an],['Duy Phạm','Game Designer',avatarMap.duy]].map(([name,role,src], i) => <div key={name}><Avatar src={src} /><span><strong>{name}</strong><small>{role}</small></span><button className={i < 2 ? 'chosen' : ''}>{i < 2 ? <Check size={16} /> : <Plus size={16} />}</button></div>)}</div></div>}
      <div className="onboard-actions"><button className="ghost-button" onClick={() => step > 1 ? setStep(step - 1) : onFinish()}>{step > 1 ? <><ChevronLeft size={17} />{t.back}</> : t.skip}</button><button className="primary-button" onClick={() => step < 3 ? setStep(step + 1) : onFinish()}>{step === 3 ? t.finish : t.continue}{step < 3 && <ChevronRight size={18} />}</button></div>
    </section>
  </main>
}

function MainApp({ t, lang, setLang, onLogout }) {
  const [page, setPage] = useState('feed')
  const [panel, setPanel] = useState(null)
  const [modal, setModal] = useState(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const navigate = (next) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <div className="app-shell">
    <div className="aurora app-a" /><div className="aurora app-b" />
    <Sidebar t={t} page={page} navigate={navigate} onLogout={onLogout} mobileMenu={mobileMenu} close={() => setMobileMenu(false)} />
    <div className="app-main">
      <Topbar t={t} lang={lang} setLang={setLang} page={page} navigate={navigate} setPanel={setPanel} openMenu={() => setMobileMenu(true)} />
      <div className="page-container">
        {page === 'feed' && <FeedPage t={t} lang={lang} navigate={navigate} />}
        {page === 'friends' && <FriendsPage t={t} lang={lang} />}
        {page === 'worlds' && <WorldsPage t={t} lang={lang} setModal={setModal} />}
        {page === 'projects' && <ProjectsPage t={t} lang={lang} />}
        {page === 'learn' && <LearnPage t={t} lang={lang} />}
        {page === 'profile' && <ProfilePage t={t} lang={lang} navigate={navigate} />}
        {page === 'studio' && <StudioPage t={t} lang={lang} setModal={setModal} navigate={navigate} />}
      </div>
    </div>
    <MobileNav t={t} page={page} navigate={navigate} />
    {panel && <SidePanel type={panel} t={t} lang={lang} close={() => setPanel(null)} />}
    {modal === 'new-world' && <WorldModal t={t} lang={lang} close={() => setModal(null)} onCharacter={() => setModal('character')} />}
    {modal === 'character' && <CharacterModal t={t} lang={lang} close={() => setModal(null)} />}
  </div>
}

function Sidebar({ t, page, navigate, onLogout, mobileMenu, close }) {
  const [account, setAccount] = useState(false)
  return <><aside className={`sidebar glass-panel ${mobileMenu ? 'mobile-open' : ''}`}>
    <div className="sidebar-top"><Logo /><button className="mobile-close" onClick={close}><X /></button></div>
    <nav className="main-nav">{navItems.map(([id,Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={20} strokeWidth={1.9} /><span>{t[id]}</span>{id === 'friends' && <b>3</b>}</button>)}</nav>
    <div className="sidebar-create"><p>{t.quickActions}</p><button onClick={() => navigate('worlds')}><span><Plus size={18} /></span>{t.newWorld}</button><button onClick={() => navigate('studio')}><span><PenLine size={17} /></span>{t.newCharacter}</button></div>
    <div className="sidebar-space" />
    <button className="studio-link" onClick={() => navigate('studio')}><div><LayoutDashboard size={19} /></div><span><strong>{t.studio}</strong><small>{t.activity}</small></span><ChevronRight size={17} /></button>
    <div className="account-block"><button className="account-button" onClick={() => setAccount(!account)}><Avatar size="sm" /><span><strong>Minh Nguyễn</strong><small>@minhbuilds</small></span><MoreHorizontal size={18} /></button>{account && <div className="account-pop glass-panel"><button onClick={() => navigate('profile')}><User size={16} />{t.profile}</button><button><Settings size={16} />{t.settings}</button><button onClick={onLogout}><LogIn size={16} />{t.logout}</button></div>}</div>
  </aside>{mobileMenu && <div className="scrim menu-scrim" onClick={close} />}</>
}

function Topbar({ t, lang, setLang, page, navigate, setPanel, openMenu }) {
  const pageTitle = page === 'studio' ? t.studio : t[page]
  return <header className="topbar glass-panel"><div className="topbar-left"><button className="menu-button" onClick={openMenu}><Menu /></button><h2>{pageTitle}</h2></div><button className="search-box" onClick={() => setPanel('search')}><Search size={18} /><span>{lang === 'vi' ? 'Tìm thế giới, người sáng tạo, dự án...' : 'Search worlds, creators, projects...'}</span><kbd>⌘ K</kbd></button><div className="top-actions"><LanguageToggle lang={lang} setLang={setLang} /><button className="icon-button" onClick={() => setPanel('messages')}><MessageCircle size={19} /><span className="indicator">2</span></button><button className="icon-button" onClick={() => setPanel('notifications')}><Bell size={19} /><span className="dot" /></button><button className="top-avatar" onClick={() => navigate('profile')}><Avatar size="sm" /></button></div></header>
}

function MobileNav({ t, page, navigate }) {
  return <nav className="mobile-nav glass-panel">{navItems.slice(0,5).map(([id,Icon]) => <button key={id} className={page === id ? 'active' : ''} onClick={() => navigate(id)}><Icon size={20} /><span>{t[id]}</span></button>)}</nav>
}

function FeedPage({ t, lang, navigate }) {
  const [tab, setTab] = useState('forYou')
  const [liked, setLiked] = useState([false, true])
  const [saved, setSaved] = useState([false, false])
  const [text, setText] = useState('')
  const tabs = ['forYou','following','latest','worldbuilding','gameCreation','writing']
  return <div className="feed-layout"><main className="feed-main">
    <section className="welcome-row"><div><h1>{t.hello}</h1><p>{t.helloSub}</p></div><div className="daily-prompt"><Sparkles size={18} /><span>{lang === 'vi' ? 'Gợi ý hôm nay' : 'Today’s prompt'}</span><strong>{lang === 'vi' ? 'Một nơi không ai có thể nhớ tên mình.' : 'A place where no one can remember their name.'}</strong></div></section>
    <section className="composer glass-card"><div className="composer-top"><Avatar /><textarea value={text} onChange={e => setText(e.target.value)} placeholder={t.composer} rows="2" /></div><div className="composer-actions"><div><button><ImageIcon size={18} />{lang === 'vi' ? 'Ảnh' : 'Image'}</button><button><Play size={18} />Video</button><button><Globe2 size={18} />World</button></div><button className="primary-button small" disabled={!text.trim()} onClick={() => setText('')}>{t.post}<Send size={15} /></button></div></section>
    <div className="feed-tabs">{tabs.map(id => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>{t[id]}</button>)}</div>
    <article className="post-card glass-card">
      <div className="post-header"><Avatar src={avatarMap.linh} /><div><div className="name-line"><strong>Linh Trần</strong><span className="verified"><Check size={11} /></span></div><p>@linhdrawsworlds · 34m</p></div><button className="follow-pill">+ {t.follow}</button><button className="plain-icon"><Ellipsis /></button></div>
      <p className="post-copy">{lang === 'vi' ? 'Mình vừa hoàn thiện bản đồ ánh sáng cho Vespers — một thành phố chỉ tồn tại giữa hai lần hoàng hôn. Mỗi quận được đánh dấu bằng thứ ký ức mà cư dân phải từ bỏ để được bước vào.' : 'I just finished the light map for Vespers — a city that only exists between two sunsets. Each district is marked by the memory its residents must surrender to enter.'}</p>
      <div className="post-tags"><span>#worldbuilding</span><span>#fantasy</span><span>#mapmaking</span></div>
      <div className="post-media vespers-media"><div className="media-overlay"><span>THE CITY BETWEEN</span><strong>VESPERS</strong><small>World map · Chapter 04</small></div></div>
      <div className="post-stats"><span><b>{liked[0] ? '1,285' : '1,284'}</b> {lang === 'vi' ? 'lượt thích' : 'likes'}</span><span><b>96</b> {lang === 'vi' ? 'bình luận' : 'comments'} · <b>43</b> {lang === 'vi' ? 'lượt chia sẻ' : 'shares'}</span></div>
      <div className="post-actions"><button className={liked[0] ? 'liked' : ''} onClick={() => setLiked([!liked[0], liked[1]])}><Heart size={19} fill={liked[0] ? 'currentColor' : 'none'} />{lang === 'vi' ? 'Thích' : 'Like'}</button><button><MessageCircle size={19} />{lang === 'vi' ? 'Bình luận' : 'Comment'}</button><button onClick={() => setSaved([!saved[0], saved[1]])} className={saved[0] ? 'saved' : ''}><Bookmark size={19} fill={saved[0] ? 'currentColor' : 'none'} />{t.save}</button><button><Share2 size={19} />{t.share}</button></div>
    </article>
    <article className="post-card glass-card compact-post">
      <div className="post-header"><Avatar src={avatarMap.duy} /><div><div className="name-line"><strong>Duy Phạm</strong></div><p>@duycombat · 2h</p></div><button className="following-pill"><Check size={14} />{t.followingBtn}</button><button className="plain-icon"><Ellipsis /></button></div>
      <p className="post-copy">{lang === 'vi' ? 'Câu hỏi cho các game designer: Khi một kỹ năng “tua ngược” sát thương, bạn sẽ truyền đạt giới hạn của nó bằng VFX hay bằng UI? Mình đang thử ba hướng cho Project: TIDE.' : 'Question for game designers: When an ability “rewinds” damage, would you communicate its limits through VFX or UI? I’m testing three directions for Project: TIDE.'}</p>
      <div className="poll"><button><span>VFX-first</span><b>47%</b><i style={{ width: '47%' }} /></button><button><span>UI-first</span><b>31%</b><i style={{ width: '31%' }} /></button><button><span>Both, subtly</span><b>22%</b><i style={{ width: '22%' }} /></button><small>428 votes · 21h left</small></div>
      <div className="post-actions"><button className={liked[1] ? 'liked' : ''} onClick={() => setLiked([liked[0], !liked[1]])}><Heart size={19} fill={liked[1] ? 'currentColor' : 'none'} />192</button><button><MessageCircle size={19} />48</button><button onClick={() => setSaved([saved[0], !saved[1]])} className={saved[1] ? 'saved' : ''}><Bookmark size={19} fill={saved[1] ? 'currentColor' : 'none'} /></button><button><Share2 size={19} /></button></div>
    </article>
  </main><aside className="feed-right">
    <section className="side-card glass-card"><div className="section-title"><h3>{t.trending}</h3><button>{t.seeAll}</button></div>{[['#WorldbuildingSeptember','2.8K'],['#CharacterArc','1.6K'],['#IndieGameDev','1.2K'],['#LoreDrop','986']].map(([tag,count],i) => <button className="trend-item" key={tag}><span>{i+1}</span><div><strong>{tag}</strong><small>{count} posts</small></div><ChevronRight size={16} /></button>)}</section>
    <section className="side-card glass-card"><div className="section-title"><h3>{t.suggested}</h3><button onClick={() => navigate('friends')}>{t.seeAll}</button></div>{[['An Lê','Concept Artist',avatarMap.an],['Khoa Vũ','Sci-fi Writer',avatarMap.khoa],['Mai Hoàng','Narrative Designer',avatarMap.mai]].map(([name,role,src]) => <CreatorRow key={name} name={name} role={role} src={src} t={t} />)}</section>
    <section className="ad-placeholder"><small>MAREA FOR CREATORS</small><strong>{lang === 'vi' ? 'Không gian cho ý tưởng của bạn.' : 'Room for your ideas.'}</strong><span>{lang === 'vi' ? 'Vị trí giới thiệu chọn lọc' : 'Curated spotlight placement'}</span></section>
    <footer className="micro-footer">About · Guidelines · Privacy · © 2026 Marea</footer>
  </aside></div>
}

function CreatorRow({ name, role, src, t }) {
  const [followed, setFollowed] = useState(false)
  return <div className="creator-row"><Avatar src={src} size="sm" /><span><strong>{name}</strong><small>{role}</small></span><button className={followed ? 'followed' : ''} onClick={() => setFollowed(!followed)}>{followed ? <Check size={15} /> : <Plus size={15} />}{followed ? '' : t.follow}</button></div>
}

function FriendsPage({ t, lang }) {
  const [accepted, setAccepted] = useState([])
  const people = [
    ['Gia Hân','Character Artist · Illustrator',avatarMap.an,'18'],
    ['Quang Lâm','Writer · Worldbuilder',avatarMap.khoa,'12'],
    ['Mira Vũ','Game Designer · Artist',avatarMap.mai,'9'],
    ['Tú Anh','Comic Artist · Writer',avatarMap.linh,'7'],
    ['Khôi Trần','Narrative Designer',avatarMap.duy,'15'],
    ['Yến Nhi','Learner · Illustrator',avatarMap.minh,'6'],
  ]
  return <div className="content-page"><section className="page-hero simple"><div><span className="eyebrow purple"><Users size={15} />CREATIVE CIRCLE</span><h1>{t.friends}</h1><p>{lang === 'vi' ? 'Kết nối với những người hiểu quá trình biến một ý tưởng thành cả thế giới.' : 'Connect with people who understand what it takes to turn one idea into a whole world.'}</p></div><button className="primary-button"><UserPlus size={18} />{lang === 'vi' ? 'Tìm bạn' : 'Find people'}</button></section>
    <div className="content-tabs"><button className="active">{t.discoverPeople}</button><button>{lang === 'vi' ? 'Bạn bè' : 'Friends'} <span>128</span></button><button>{lang === 'vi' ? 'Đang theo dõi' : 'Following'} <span>246</span></button></div>
    <section className="requests glass-card"><div className="section-title"><h3>{t.requests}</h3><span>3</span></div><div className="request-grid">{[['Thảo Nhi','Fantasy Writer',avatarMap.mai],['Leo Đặng','Environment Artist',avatarMap.duy],['Nam Phan','Indie Game Dev',avatarMap.khoa]].map(([name,role,src]) => <div className="request-item" key={name}><Avatar src={src} /><div><strong>{name}</strong><span>{role}</span><small>6 {t.mutual}</small></div><div><button className="accept"><Check size={16} />{t.accept}</button><button className="ignore"><X size={16} /></button></div></div>)}</div></section>
    <section><div className="list-heading"><div><h2>{lang === 'vi' ? 'Những người bạn có thể hợp tác' : 'People you could create with'}</h2><p>{lang === 'vi' ? 'Dựa trên thể loại, kỹ năng và dự án bạn quan tâm.' : 'Based on your genres, skills and project interests.'}</p></div><button className="filter-button"><Settings size={16} />{lang === 'vi' ? 'Bộ lọc' : 'Filters'}</button></div><div className="people-grid">{people.map(([name,role,src,mutual],i) => <article className="person-card glass-card" key={name}><div className={`person-cover cover-${i%3}`} /><Avatar src={src} size="lg" /><h3>{name}</h3><p>{role}</p><span>{mutual} {t.mutual}</span><div className="person-tags"><i>{i%2?'Sci-fi':'Fantasy'}</i><i>{i%3?'Writing':'RPG'}</i></div><button className={accepted.includes(i) ? 'connected' : ''} onClick={() => setAccepted(accepted.includes(i) ? accepted.filter(x => x !== i) : [...accepted,i])}>{accepted.includes(i) ? <><Check size={16} />{lang === 'vi' ? 'Đã gửi lời mời' : 'Request sent'}</> : <><UserPlus size={16} />{t.addFriend}</>}</button></article>)}</div></section>
  </div>
}

function WorldsPage({ t, lang, setModal }) {
  const [filter, setFilter] = useState('all')
  const worlds = [
    { name:'Vespers', type:'Story World', genre:'Dark Fantasy', status:'Private', image:projectImages.vespers, count:'14 characters · 28 locations', progress:72 },
    { name:'Project: TIDE', type:'Game World', genre:'Sci-fi RPG', status:'Showcase', image:projectImages.tide, count:'8 champions · 5 factions', progress:48 },
    { name:'The Signal Garden', type:'Story World', genre:'Solarpunk', status:'Public', image:projectImages.signal, count:'9 characters · 16 locations', progress:35 },
  ]
  return <div className="content-page worlds-page"><section className="page-hero worlds-hero glass-card"><div><span className="eyebrow purple"><Sparkles size={15} />YOUR CREATIVE UNIVERSE</span><h1>{t.yourWorlds}</h1><p>{t.worldSub}</p><div className="hero-metrics"><span><strong>3</strong>{lang === 'vi' ? 'thế giới' : 'worlds'}</span><span><strong>31</strong>{lang === 'vi' ? 'nhân vật' : 'characters'}</span><span><strong>49</strong>{lang === 'vi' ? 'địa điểm' : 'locations'}</span></div></div><div className="world-orb"><Globe2 size={42} /><i /><i /></div></section>
    <div className="toolbar"><div className="filter-pills">{['all','private','public','showcase'].map(x => <button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{t[x]}</button>)}</div><div><button className="secondary-button"><Search size={17} /></button><button className="primary-button" onClick={() => setModal('new-world')}><Plus size={18} />{t.newWorld}</button></div></div>
    <div className="world-grid">{worlds.filter(w => filter === 'all' || w.status.toLowerCase() === filter).map((w,i) => <article className="world-card glass-card" key={w.name}><div className="world-cover" style={{backgroundImage:`linear-gradient(180deg, transparent 30%, rgba(10,12,30,.78)), url(${w.image})`}}><span className={`privacy-badge ${w.status.toLowerCase()}`}>{w.status==='Private'?<LockKeyhole size={13}/>:<Eye size={13}/>} {w.status}</span><button><Ellipsis size={19}/></button><div><small>{w.type}</small><h2>{w.name}</h2><p>{w.genre}</p></div></div><div className="world-info"><div className="world-progress"><span><small>{lang==='vi'?'Tiến độ xây dựng':'World progress'}</small><b>{w.progress}%</b></span><div><i style={{width:`${w.progress}%`}}/></div></div><p><Users size={15}/>{w.count}</p><div className="world-actions"><button>{lang==='vi'?'Mở workspace':'Open workspace'}<ChevronRight size={17}/></button><button onClick={()=>setModal('character')}><Plus size={17}/>{lang==='vi'?'Nhân vật':'Character'}</button></div></div></article>)}
      <button className="new-world-card" onClick={()=>setModal('new-world')}><span><Plus size={28}/></span><strong>{t.newWorld}</strong><small>{lang==='vi'?'Bắt đầu từ một ý tưởng trống':'Start from a blank idea'}</small></button>
    </div>
    <section className="workflow-card glass-card"><div className="section-title"><div><span className="eyebrow purple"><ShieldCheck size={15}/>PRIVATE BY DEFAULT</span><h2>{lang==='vi'?'Ý tưởng của bạn, quyền kiểm soát của bạn.':'Your ideas, under your control.'}</h2></div><button><CircleHelp size={17}/></button></div><div className="workflow-steps">{[[LockKeyhole,lang==='vi'?'Xây dựng riêng tư':'Build privately'],[WandSparkles,lang==='vi'?'Chọn nội dung công khai':'Select what to reveal'],[BriefcaseBusiness,lang==='vi'?'Tạo project showcase':'Create a showcase'],[Globe2,lang==='vi'?'Chia sẻ với cộng đồng':'Share with the community']].map(([Icon,label],i)=><div key={label}><span><Icon size={19}/></span><p><b>0{i+1}</b>{label}</p>{i<3&&<ChevronRight size={16}/>}</div>)}</div></section>
  </div>
}

function ProjectsPage({ t, lang }) {
  const [type, setType] = useState('All')
  const projects = [
    {title:'Project: TIDE',type:'Game',genre:'Sci-fi RPG',stage:'Prototype',image:projectImages.tide,need:['Game Dev','Artist'],desc:lang==='vi'?'Một action RPG nơi ký ức vận hành như thủy triều — có thể rút đi, dâng lên và thay đổi chiến trường.':'An action RPG where memory behaves like a tide — receding, rising and reshaping the battlefield.'},
    {title:'Vespers',type:'Novel',genre:'Dark Fantasy',stage:'In Development',image:projectImages.vespers,need:['Illustrator'],desc:lang==='vi'?'Thành phố xuất hiện giữa hai lần hoàng hôn, nơi mỗi cánh cửa được mở bằng một ký ức.':'A city appearing between two sunsets, where every door is opened with a memory.'},
    {title:'The Signal Garden',type:'Comic',genre:'Solarpunk',stage:'Planning',image:projectImages.signal,need:['Writer','Colorist'],desc:lang==='vi'?'Một khu vườn lưu giữ tín hiệu cuối cùng của những nền văn minh đã biến mất.':'A living garden preserving the last signals of civilizations that disappeared.'},
    {title:'Lanterns of Eira',type:'Visual Novel',genre:'Mystery',stage:'Idea',image:projectImages.lantern,need:['Developer','Funding'],desc:lang==='vi'?'Mỗi chiếc đèn lồng trong thị trấn đều chứa một lời nói dối chưa được thú nhận.':'Every lantern in this town contains a lie no one has confessed.'},
  ]
  return <div className="content-page projects-page"><section className="projects-hero"><div><span className="eyebrow purple"><Compass size={15}/>DISCOVER · CONNECT · CREATE</span><h1>{t.projectsTitle}</h1><p>{t.projectsSub}</p><button className="primary-button"><Plus size={18}/>{lang==='vi'?'Đăng dự án':'Publish a project'}</button></div><div className="project-collage"><div style={{backgroundImage:`url(${projectImages.vespers})`}}/><div style={{backgroundImage:`url(${projectImages.signal})`}}/><div style={{backgroundImage:`url(${projectImages.tide})`}}/><span><Sparkles/>37<br/><small>{lang==='vi'?'dự án mới tuần này':'new this week'}</small></span></div></section>
    <div className="project-filterbar glass-card"><div className="filter-pills">{['All','Game','Novel','Comic','RPG','Visual Novel'].map(x=><button className={type===x?'active':''} key={x} onClick={()=>setType(x)}>{x==='All'?t.all:x}</button>)}</div><div><button><Languages size={16}/>{lang==='vi'?'Ngôn ngữ':'Language'}<ChevronDown size={14}/></button><button><Zap size={16}/>{lang==='vi'?'Giai đoạn':'Stage'}<ChevronDown size={14}/></button><button><Users size={16}/>{lang==='vi'?'Tìm đội ngũ':'Looking for'}<ChevronDown size={14}/></button></div></div>
    <div className="project-grid">{projects.filter(p=>type==='All'||p.type===type).map((p,i)=><article className="project-card glass-card" key={p.title}><div className="project-image" style={{backgroundImage:`linear-gradient(180deg, transparent 30%, rgba(7,9,24,.8)),url(${p.image})`}}><span>{i===0?<><Star size={13} fill="currentColor"/>{t.featured}</>:p.stage}</span><button><Bookmark size={18}/></button><div><small>{p.type} · {p.genre}</small><h2>{p.title}</h2></div></div><div className="project-body"><p>{p.desc}</p><div className="project-need"><small>{t.lookingTeam}</small>{p.need.map(n=><span key={n}>+ {n}</span>)}</div><div className="project-owner"><Avatar src={[avatarMap.duy,avatarMap.linh,avatarMap.an,avatarMap.mai][i]} size="sm"/><span><small>{lang==='vi'?'Dẫn dắt bởi':'Led by'}</small><strong>{['Duy Phạm','Linh Trần','An Lê','Mai Hoàng'][i]}</strong></span><div className="avatar-stack mini"><Avatar src={avatarMap.minh} size="xs"/><Avatar src={avatarMap.khoa} size="xs"/><i>+{i+2}</i></div></div><button className="project-link">{t.viewProject}<ChevronRight size={17}/></button></div></article>)}</div>
  </div>
}

function LearnPage({ t, lang }) {
  const [category,setCategory]=useState('All')
  const courses=[
    {title:lang==='vi'?'Worldbuilding từ ý tưởng đầu tiên':'Worldbuilding from the first idea',teacher:'Linh Trần',level:'Beginner',lessons:8,time:'1h 40m',progress:62,image:projectImages.vespers,cat:'Worldbuilding'},
    {title:lang==='vi'?'Thiết kế nhân vật game có chiều sâu':'Designing game characters with depth',teacher:'Duy Phạm',level:'Intermediate',lessons:12,time:'2h 15m',progress:28,image:projectImages.tide,cat:'Game Design'},
    {title:lang==='vi'?'Dùng AI để kiểm tra mâu thuẫn lore':'Using AI to audit lore contradictions',teacher:'Mai Hoàng',level:'All levels',lessons:6,time:'55m',progress:0,image:projectImages.signal,cat:'AI for Creators'},
  ]
  return <div className="content-page learn-page"><section className="learn-hero glass-card"><div><span className="eyebrow purple"><GraduationCap size={15}/>MAREA LEARN</span><h1>{t.learnTitle}</h1><p>{t.learnSub}</p><div className="learn-search"><Search size={18}/><input placeholder={lang==='vi'?'Bạn muốn học điều gì hôm nay?':'What do you want to learn today?'}/><button>{t.search}</button></div></div><div className="learn-illustration"><div className="book-shape"><BookOpen size={60}/><i/><i/></div><span className="spark s1">✦</span><span className="spark s2">✦</span></div></section>
    <div className="learning-streak"><div><span><Zap size={19}/></span><div><strong>{lang==='vi'?'4 ngày liên tiếp':'4 day streak'}</strong><small>{lang==='vi'?'Bạn đã học 35 phút tuần này':'You learned 35 minutes this week'}</small></div></div><div className="week-dots">{['M','T','W','T','F','S','S'].map((d,i)=><span key={i} className={i<4?'done':i===4?'today':''}>{i<4?<Check size={13}/>:d}</span>)}</div><button>{lang==='vi'?'Xem hành trình':'View journey'}<ChevronRight size={16}/></button></div>
    <div className="list-heading"><div><h2>{lang==='vi'?'Tiếp tục học':'Continue learning'}</h2><p>{lang==='vi'?'Tiếp tục từ nơi bạn dừng lại.':'Pick up where you left off.'}</p></div><button>{t.seeAll}</button></div>
    <div className="course-grid">{courses.map((c,i)=><article className="course-card glass-card" key={c.title}><div className="course-image" style={{backgroundImage:`linear-gradient(135deg,rgba(18,20,49,.1),rgba(15,18,40,.72)),url(${c.image})`}}><span>{c.cat}</span><button><Play size={22} fill="currentColor"/></button>{c.progress>0&&<div className="image-progress"><i style={{width:`${c.progress}%`}}/></div>}</div><div className="course-body"><div className="course-meta"><span>{c.level}</span><span><Clock3 size={14}/>{c.time}</span></div><h3>{c.title}</h3><p>{c.teacher} · {c.lessons} {t.lessons}</p><button>{c.progress>0?t.continueLearning:(lang==='vi'?'Bắt đầu học':'Start course')}<ChevronRight size={16}/></button></div></article>)}</div>
    <div className="list-heading topic-heading"><div><h2>{lang==='vi'?'Khám phá theo chủ đề':'Explore by topic'}</h2></div></div><div className="topic-grid">{[[Globe2,'Worldbuilding','28'],[User,'Character Design','19'],[PenLine,'Storytelling','24'],[Zap,'Game Design','17'],[Palette,'Concept Art','13'],[WandSparkles,'AI for Creators','11']].map(([Icon,name,count],i)=><button key={name} className={`topic topic-${i}`}><span><Icon size={23}/></span><div><strong>{name}</strong><small>{count} {lang==='vi'?'khóa học':'courses'}</small></div><ChevronRight size={18}/></button>)}</div>
  </div>
}

function ProfilePage({ t, lang, navigate }) {
  const [tab,setTab]=useState('creations')
  return <div className="profile-page"><section className="profile-hero glass-card"><div className="profile-cover"><div className="cover-sky"><span/><i/></div><button className="cover-more"><Ellipsis/></button></div><div className="profile-main"><Avatar size="xxl"/><div className="profile-identity"><div><h1>Minh Nguyễn <span className="verified"><Check size={12}/></span></h1><p>@minhbuilds</p></div><div className="profile-buttons"><button className="secondary-button"><Share2 size={17}/></button><button className="secondary-button" onClick={()=>navigate('studio')}><PenLine size={17}/>{t.editProfile}</button></div></div><p className="profile-bio">{lang==='vi'?'Mình viết những câu chuyện về ký ức, thành phố và những vì sao. Hiện đang xây dựng Vespers & Project: TIDE.':'I write stories about memory, cities and distant stars. Currently building Vespers & Project: TIDE.'}</p><div className="profile-roles"><span>Writer</span><span>Worldbuilder</span><span>Narrative Designer</span></div><div className="profile-stats"><button><strong>1.2K</strong><small>{lang==='vi'?'Người theo dõi':'Followers'}</small></button><button><strong>486</strong><small>{lang==='vi'?'Đang theo dõi':'Following'}</small></button><button><strong>128</strong><small>{t.friends}</small></button><span/><a href="#"><Link2 size={15}/>minhnguyen.studio</a></div></div></section>
    <div className="profile-layout"><main><div className="content-tabs profile-tabs">{['creations','posts','courses','about'].map(x=><button key={x} className={tab===x?'active':''} onClick={()=>setTab(x)}>{t[x]}</button>)}</div>{tab==='creations'&&<><div className="list-heading"><div><h2>{lang==='vi'?'Dự án nổi bật':'Featured projects'}</h2></div><button>{t.seeAll}</button></div><div className="profile-projects"><article style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(7,9,30,.88)),url(${projectImages.tide})`}}><span>GAME · PROTOTYPE</span><h2>Project: TIDE</h2><p>Sci-fi action RPG</p></article><article style={{backgroundImage:`linear-gradient(180deg,transparent,rgba(7,9,30,.88)),url(${projectImages.vespers})`}}><span>NOVEL · IN DEVELOPMENT</span><h2>Vespers</h2><p>Dark fantasy novel</p></article></div><div className="list-heading"><div><h2>{lang==='vi'?'Thế giới công khai':'Public worlds'}</h2></div></div><div className="mini-world-list glass-card"><div className="mini-world-image" style={{backgroundImage:`url(${projectImages.signal})`}}/><div><span>STORY WORLD</span><h3>The Signal Garden</h3><p>{lang==='vi'?'9 nhân vật · 16 địa điểm · cập nhật 3 ngày trước':'9 characters · 16 locations · updated 3 days ago'}</p></div><button><ChevronRight/></button></div></>}{tab!=='creations'&&<div className="empty-tab glass-card"><Sparkles/><h3>{lang==='vi'?'Nội dung đang được sắp xếp':'Content is being curated'}</h3><p>{lang==='vi'?'Khu vực này sẽ hiển thị nội dung tương ứng trong hồ sơ công khai.':'This area will show the corresponding public profile content.'}</p></div>}</main><aside><section className="profile-side glass-card"><h3>{t.about}</h3><div><Map size={17}/><span>{lang==='vi'?'Sống tại':'Based in'} <strong>Hồ Chí Minh, Việt Nam</strong></span></div><div><Languages size={17}/><span>Tiếng Việt · English</span></div><div><Clock3 size={17}/><span>{lang==='vi'?'Tham gia tháng 9, 2026':'Joined September 2026'}</span></div></section><section className="profile-side glass-card"><div className="section-title"><h3>{lang==='vi'?'Huy hiệu':'Badges'}</h3><button>{t.seeAll}</button></div><div className="badge-row"><span className="badge purple">✦</span><span className="badge blue">◈</span><span className="badge coral">◆</span><span className="badge green">●</span></div></section><section className="profile-side glass-card"><h3>{lang==='vi'?'Kỹ năng cộng tác':'Open to collaborate'}</h3><div className="skill-list"><span>Narrative Design</span><span>Worldbuilding</span><span>Story Editing</span></div></section></aside></div>
  </div>
}

function StudioPage({ t, lang, setModal, navigate }) {
  return <div className="content-page studio-page"><section className="page-hero simple"><div><span className="eyebrow purple"><LayoutDashboard size={15}/>CREATOR WORKSPACE</span><h1>{t.studio}</h1><p>{lang==='vi'?'Quản lý mọi phần trong hành trình sáng tạo của bạn từ một nơi.':'Manage every part of your creative journey in one place.'}</p></div><button className="primary-button"><Plus size={18}/>{lang==='vi'?'Tạo mới':'Create new'}<ChevronDown size={15}/></button></section>
    <div className="studio-metrics">{[[Globe2,'3',lang==='vi'?'Thế giới':'Worlds','+1'],[User,'31',lang==='vi'?'Nhân vật':'Characters','+6'],[Compass,'4',lang==='vi'?'Dự án':'Projects','+2'],[Eye,'8.4K',lang==='vi'?'Lượt xem':'Views','+18%']].map(([Icon,n,label,growth])=><article className="glass-card" key={label}><span><Icon/></span><div><strong>{n}</strong><small>{label}</small></div><i>{growth}</i></article>)}</div>
    <div className="studio-grid"><section className="studio-main glass-card"><div className="section-title"><div><h2>{t.activity}</h2><p>{lang==='vi'?'Tiếp tục công việc gần nhất':'Continue your latest work'}</p></div><button>{t.seeAll}</button></div>{[[projectImages.vespers,'Vespers',lang==='vi'?'Đã chỉnh sửa Địa điểm: The Glass Ward':'Edited Location: The Glass Ward','12 min'],[projectImages.tide,'Project: TIDE',lang==='vi'?'Cập nhật kỹ năng: Rewind':'Updated ability: Rewind','2h'],[projectImages.signal,'The Signal Garden',lang==='vi'?'Thêm nhân vật: Ilya':'Added character: Ilya','Yesterday']].map(([img,name,action,time])=><div className="activity-row" key={name}><div style={{backgroundImage:`url(${img})`}}/><span><strong>{name}</strong><p>{action}</p></span><small>{time}</small><button><ChevronRight/></button></div>)}</section><section className="studio-actions glass-card"><div className="section-title"><h2>{t.quickActions}</h2></div><button onClick={()=>setModal('new-world')}><span className="purple-bg"><Globe2/></span><div><strong>{t.newWorld}</strong><small>{lang==='vi'?'Truyện hoặc game':'Story or game'}</small></div><Plus/></button><button onClick={()=>setModal('character')}><span className="blue-bg"><User/></span><div><strong>{t.newCharacter}</strong><small>Story · Game</small></div><Plus/></button><button onClick={()=>navigate('projects')}><span className="coral-bg"><Compass/></span><div><strong>{lang==='vi'?'Đăng project':'Publish project'}</strong><small>Showcase</small></div><Plus/></button></section></div>
    <section className="management-card glass-card"><div className="section-title"><div><h2>{lang==='vi'?'Quản lý không gian của bạn':'Manage your space'}</h2><p>{lang==='vi'?'Cài đặt nội dung, quyền riêng tư và giao diện hồ sơ.':'Content, privacy and profile appearance settings.'}</p></div></div><div className="management-grid">{[[User,t.profile,'@minhbuilds'],[Globe2,t.worlds,'3 worlds'],[Compass,t.projects,'4 projects'],[GraduationCap,t.courses,'1 draft'],[ShieldCheck,t.privacy,lang==='vi'?'Được bảo vệ':'Protected'],[Palette,t.appearance,lang==='vi'?'Aurora tím':'Violet aurora']].map(([Icon,name,status])=><button key={name}><span><Icon/></span><div><strong>{name}</strong><small>{status}</small></div><ChevronRight/></button>)}</div></section>
  </div>
}

function SidePanel({ type, t, lang, close }) {
  return <><div className="scrim" onClick={close}/><aside className="side-panel glass-panel"><header><div><span className="eyebrow purple">MAREA</span><h2>{type==='search'?t.search:type==='messages'?t.messages:t.notifications}</h2></div><button className="icon-button" onClick={close}><X/></button></header>{type==='search'?<div className="panel-search"><div><Search/><input autoFocus placeholder={lang==='vi'?'Tìm kiếm trong Marea...':'Search Marea...'}/></div><p>{lang==='vi'?'Tìm kiếm gần đây':'Recent searches'}</p>{['Vespers world map','Narrative designer','#CharacterArc'].map(x=><button key={x}><Clock3 size={16}/>{x}<ChevronRight size={16}/></button>)}</div>:type==='messages'?<div className="panel-list">{[['Linh Trần','Bản đồ mới đẹp quá! Phần...','2m',avatarMap.linh],['Duy Phạm','Mình gửi bạn bản prototype rồi nhé.','1h',avatarMap.duy],['Marea Course Team','Khóa học đã được duyệt.','1d',avatarMap.mai]].map(([name,msg,time,src],i)=><button key={name}><Avatar src={src}/><span><strong>{name}</strong><p>{msg}</p></span><small>{time}</small>{i<2&&<i/>}</button>)}</div>:<div className="panel-list notifications">{[[Heart,'Linh và 18 người khác đã thích bài viết của bạn.','5m'],[UserPlus,'Thảo Nhi đã gửi lời mời kết bạn.','28m'],[MessageCircle,'Duy đã bình luận trong Project: TIDE.','2h'],[ShieldCheck,'Project Vespers đã được duyệt showcase.','1d']].map(([Icon,msg,time],i)=><button key={msg}><span className={`notice-icon n-${i}`}><Icon/></span><p>{msg}<small>{time}</small></p>{i<2&&<i/>}</button>)}</div>}</aside></>
}

function WorldModal({ t, lang, close, onCharacter }) {
  const [choice,setChoice]=useState(null)
  const [created,setCreated]=useState(false)
  return <div className="modal-layer"><div className="scrim" onClick={close}/><section className="modal glass-panel world-modal"><header><div><span className="eyebrow purple">CREATE · BUILD · SHARE</span><h2>{t.chooseWorld}</h2><p>{t.chooseWorldSub}</p></div><button className="icon-button" onClick={close}><X/></button></header>{!created?<><div className="world-choice"><button className={choice==='story'?'selected':''} onClick={()=>setChoice('story')}><span className="choice-art story-choice"><PenLine/><i/><i/></span><div><h3>{t.createStory}</h3><p>{lang==='vi'?'Cho tiểu thuyết, truyện ngắn, comic và visual novel.':'For novels, short stories, comics and visual novels.'}</p><small>Characters · Lore · Plot · Timeline</small></div>{choice==='story'&&<b><Check/></b>}</button><button className={choice==='game'?'selected':''} onClick={()=>setChoice('game')}><span className="choice-art game-choice"><Zap/><i/><i/></span><div><h3>{t.createGame}</h3><p>{lang==='vi'?'Cho RPG, MOBA, game indie và hệ thống gameplay.':'For RPGs, MOBAs, indie games and gameplay systems.'}</p><small>Champions · Skills · Balance · Factions</small></div>{choice==='game'&&<b><Check/></b>}</button></div><div className="modal-actions"><button className="ghost-button" onClick={close}>{t.cancel}</button><button className="primary-button" disabled={!choice} onClick={()=>setCreated(true)}>{t.continue}<ChevronRight size={17}/></button></div></>:<div className="created-state"><span><Check/></span><h2>{lang==='vi'?'Workspace đã sẵn sàng!':'Your workspace is ready!'}</h2><p>{lang==='vi'?'Thế giới mới đang ở chế độ Riêng tư. Hãy bắt đầu bằng nhân vật đầu tiên hoặc mở workspace.':'Your new world is Private. Start with your first character or open the workspace.'}</p><div><button className="secondary-button" onClick={close}>{lang==='vi'?'Mở workspace':'Open workspace'}</button><button className="primary-button" onClick={onCharacter}><Plus size={17}/>{t.newCharacter}</button></div></div>}</section></div>
}

function CharacterModal({ t, lang, close }) {
  const [type,setType]=useState('story')
  const [section,setSection]=useState('identity')
  return <div className="modal-layer"><div className="scrim" onClick={close}/><section className="modal glass-panel character-modal"><header><div><span className="eyebrow purple">CHARACTER BUILDER</span><h2>{t.newCharacter}</h2></div><button className="icon-button" onClick={close}><X/></button></header><div className="builder-switch"><button className={type==='story'?'active':''} onClick={()=>setType('story')}><PenLine size={16}/>Story</button><button className={type==='game'?'active':''} onClick={()=>setType('game')}><Zap size={16}/>Game</button></div><div className="builder-body"><nav>{[['identity',User,lang==='vi'?'Danh tính':'Identity'],['visual',Palette,'Visual'],['story',BookOpen,lang==='vi'?'Câu chuyện':'Story'],['relations',Users,lang==='vi'?'Quan hệ':'Relations'],['notes',FileText,lang==='vi'?'Ghi chú':'Notes']].map(([id,Icon,label])=><button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}><Icon size={17}/>{label}<ChevronRight size={14}/></button>)}</nav><div className="builder-form"><div className="character-image-upload"><User size={30}/><button><ImageIcon size={15}/>{lang==='vi'?'Thêm concept art':'Add concept art'}</button></div><div className="field-grid"><label>{lang==='vi'?'Tên nhân vật':'Character name'}<input placeholder={lang==='vi'?'Ví dụ: Ilya Venn':'e.g. Ilya Venn'}/></label><label>{type==='story'?(lang==='vi'?'Tuổi':'Age'):(lang==='vi'?'Danh hiệu':'Title')}<input placeholder="—"/></label><label>{type==='story'?(lang==='vi'?'Giới tính':'Gender'):(lang==='vi'?'Vai trò':'Role')}<select><option>{lang==='vi'?'Chọn...':'Select...'}</option></select></label><label>{type==='story'?(lang==='vi'?'Vai trò trong truyện':'Story role'):(lang==='vi'?'Vị trí trong game':'Game position')}<select><option>{lang==='vi'?'Chọn...':'Select...'}</option></select></label><label className="span-2">{type==='story'?(lang==='vi'?'Mục tiêu':'Goal'):(lang==='vi'?'Phong cách chơi':'Playstyle')}<textarea placeholder={lang==='vi'?'Điều gì thúc đẩy nhân vật này?':'What drives this character?'}/></label></div></div></div><div className="modal-actions"><span><ShieldCheck size={15}/>{lang==='vi'?'Tự động lưu · Riêng tư':'Autosaved · Private'}</span><div><button className="ghost-button" onClick={close}>{t.cancel}</button><button className="primary-button" onClick={close}><Check size={17}/>{lang==='vi'?'Lưu nhân vật':'Save character'}</button></div></div></section></div>
}

function AdminGate({ t, lang, setLang }) {
  return <main className="admin-gate"><div className="aurora auth-a"/><header><Logo/><LanguageToggle lang={lang} setLang={setLang} glass/></header><section className="glass-panel"><span className="gate-icon"><ShieldCheck/></span><small>HTTP 403 · MAREA ADMIN</small><h1>{t.unauthorized}</h1><p>{t.unauthorizedSub}</p><div className="security-list"><span><Check/>{lang==='vi'?'Phiên đã được kiểm tra':'Session checked'}</span><span><X/>{lang==='vi'?'Không có vai trò Admin':'Admin role missing'}</span><span><FileText/>{lang==='vi'?'Yêu cầu đã được ghi nhật ký':'Request logged'}</span></div><button className="primary-button" onClick={()=>{window.history.replaceState({},'', '/');window.location.reload()}}><ChevronLeft/>{t.returnHome}</button></section></main>
}

export default App
