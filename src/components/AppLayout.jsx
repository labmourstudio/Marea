import { useState } from 'react'
import { Bell, BookOpen, BriefcaseBusiness, Compass, Globe2, LogOut, MessageCircle, Search, Settings, UserRound, UsersRound } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { publicStorageUrl } from '../lib/supabase'
import Brand from './Brand'
import LanguageToggle from './LanguageToggle'

const navItems = [
  ['/feed', 'feed', Compass],
  ['/friends', 'friends', UsersRound],
  ['/worlds', 'worlds', Globe2],
  ['/projects', 'projects', BriefcaseBusiness],
  ['/learn', 'learn', BookOpen],
  ['/profile', 'profile', UserRound],
]

function Avatar({ profile }) {
  const url = publicStorageUrl('avatars', profile?.avatar_path)
  return url ? <img className="avatar avatar-sm" src={url} alt="" /> : <span className="avatar avatar-fallback avatar-sm">{(profile?.display_name || profile?.username || 'M').slice(0, 1).toUpperCase()}</span>
}

export default function AppLayout() {
  const { profile, signOut } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [accountOpen, setAccountOpen] = useState(false)

  function go(path) { setAccountOpen(false); navigate(path) }

  return <div className="app-shell">
    <span className="aurora app-a" /><span className="aurora app-b" />
    <header className="site-header glass-panel">
      <div className="site-header-primary">
        <NavLink className="header-brand" to="/feed" aria-label="Mora · Bảng tin"><Brand /><small>by Mour Studio</small></NavLink>
        <button className="search-box" onClick={() => go('/search')}><Search size={17} /><span>{t.search}</span><kbd>⌘ K</kbd></button>
        <div className="top-actions">
          <LanguageToggle />
          <button className="icon-button" aria-label={t.messages} title="Tin nhắn đang phát triển" disabled><MessageCircle /></button>
          <button className="icon-button" aria-label={t.notifications} title="Thông báo đang phát triển" disabled><Bell /></button>
          <div className="header-account">
            <button className="top-avatar" aria-label="Menu tài khoản" aria-expanded={accountOpen} onClick={() => setAccountOpen((value) => !value)}><Avatar profile={profile} /></button>
            {accountOpen && <div className="account-pop glass-card">
              <div className="account-identity"><strong>{profile?.display_name || profile?.username}</strong><small>@{profile?.username}</small></div>
              <button onClick={() => go('/profile')}><UserRound /> {t.profile}</button>
              <button onClick={() => go('/studio')}><Settings /> {t.studio}</button>
              {['owner', 'admin', 'moderator'].includes(profile?.platform_role) && <button onClick={() => go('/admin')}><Settings /> Quản trị</button>}
              <button onClick={() => { setAccountOpen(false); signOut() }}><LogOut /> {t.signout}</button>
            </div>}
          </div>
        </div>
      </div>
      <nav className="main-nav" aria-label="Điều hướng chính">
        {navItems.map(([to, key, Icon]) => <NavLink key={to} to={to} onClick={() => setAccountOpen(false)}><Icon /><span>{t[key]}</span></NavLink>)}
        <NavLink className="nav-studio" to="/studio" onClick={() => setAccountOpen(false)}><Settings /><span>{t.studio}</span></NavLink>
      </nav>
    </header>
    <main className="app-main"><div className="page-container"><Outlet /></div></main>
    <nav className="mobile-nav glass-panel" aria-label="Điều hướng điện thoại">
      {navItems.map(([to, key, Icon]) => <NavLink key={to} to={to}><Icon /><span>{t[key]}</span></NavLink>)}
    </nav>
  </div>
}
