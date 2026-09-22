import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const translations = {
  vi: { feed: 'Bảng tin', friends: 'Bạn bè', worlds: 'Thế giới của bạn', projects: 'Dự án', learn: 'Học tập', profile: 'Hồ sơ', studio: 'Marea Studio', search: 'Tìm thế giới, dự án và người sáng tạo', messages: 'Tin nhắn', notifications: 'Thông báo', signout: 'Đăng xuất' },
  en: { feed: 'Feed', friends: 'Friends', worlds: 'Your Worlds', projects: 'Projects', learn: 'Learn', profile: 'Profile', studio: 'Marea Studio', search: 'Search worlds, projects and creators', messages: 'Messages', notifications: 'Notifications', signout: 'Sign out' },
}

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('marea-language') || 'vi')
  useEffect(() => { localStorage.setItem('marea-language', language); document.documentElement.lang = language }, [language])
  const value = useMemo(() => ({ language, setLanguage, toggle: () => setLanguage((current) => current === 'vi' ? 'en' : 'vi'), t: translations[language] }), [language])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() { return useContext(LanguageContext) }

