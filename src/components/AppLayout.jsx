import { useState } from 'react'
import { Bell, BookOpen, BriefcaseBusiness, ChevronDown, Compass, Globe2, LogOut, Menu, MessageCircle, Search, Settings, UserRound, UsersRound, X } from 'lucide-react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { publicStorageUrl } from '../lib/supabase'
import Brand from './Brand'
import LanguageToggle from './LanguageToggle'
import { useLanguage } from '../context/LanguageContext'

const navItems = [
  ['/feed', 'feed', Compass],
  ['/friends', 'friends', UsersRound],
  ['/worlds', 'worlds', Globe2],
  ['/projects', 'projects', BriefcaseBusiness],
  ['/learn', 'learn', BookOpen],
  ['/profile', 'profile', UserRound],
]

function Avatar({ profile, size = 'avatar-sm' }) {
  const url = publicStorageUrl('avatars', profile?.avatar_path)
  if (url) return <img className={`avatar ${size}`} src={url} alt="" />
  return <span className={`avatar avatar-fallback ${size}`}>{(profile?.display_name || profile?.username || 'M').slice(0, 1).toUpperCase()}</span>
}

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const section = location.pathname.split('/')[1]

  return (
    <div className="app-shell">
      <span className="aurora app-a" /><span className="aurora app-b" />
      {menuOpen && <button className="scrim menu-scrim" aria-label="Đóng menu" onClick={() => setMenuOpen(false)} />}
      <aside className={`sidebar glass-panel${menuOpen ? ' mobile-open' : ''}`}>
        <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="Đóng"><X /></button>
        <div className="sidebar-top"><Brand /></div>
        <nav className="main-nav">
          {navItems.map(([to, key, Icon]) => <NavLink key={to} to={to} onClick={() => setMenuOpen(false)}><Icon /><span>{t[key]}</span></NavLink>)}
        </nav>
        <div className="sidebar-space" />
        <button className="studio-link" onClick={() => navigate('/studio')}>
          <div><Settings size={17} /></div><span><strong>{t.studio}</strong><small>Quản lý nội dung</small></span>
        </button>
        <div className="account-block">
          {accountOpen && <div className="account-pop glass-card">
            <button onClick={() => navigate('/profile')}><UserRound /> Hồ sơ</button>
            {['owner', 'admin', 'moderator'].includes(profile?.platform_role) && <button onClick={() => navigate('/admin')}><Settings /> Quản trị</button>}
            <button onClick={signOut}><LogOut /> {t.signout}</button>
          </div>}
          <button className="account-button" onClick={() => setAccountOpen((value) => !value)}>
            <Avatar profile={profile} />
            <span><strong>{profile?.display_name || profile?.username}</strong><small>@{profile?.username}</small></span><ChevronDown size={15} />
          </button>
        </div>
      </aside>
      <main className="app-main">
        <header className="topbar glass-panel">
          <div className="topbar-left"><button className="menu-button" onClick={() => setMenuOpen(true)}><Menu /></button><h2>{t[section] || 'Marea'}</h2></div>
          <button className="search-box" onClick={() => navigate('/search')}><Search size={16} /><span>{t.search}</span><kbd>⌘ K</kbd></button>
          <div className="top-actions"><LanguageToggle /><button className="icon-button" aria-label={t.messages}><MessageCircle /></button><button className="icon-button" aria-label={t.notifications}><Bell /></button><button className="top-avatar" onClick={() => setAccountOpen((value) => !value)}><Avatar profile={profile} /></button></div>
        </header>
        <div className="page-container"><Outlet /></div>
      </main>
      <nav className="mobile-nav glass-panel">
        {navItems.slice(0, 5).map(([to, key, Icon]) => <NavLink key={to} to={to}><Icon /><span>{t[key]}</span></NavLink>)}
      </nav>
    </div>
  )
}
