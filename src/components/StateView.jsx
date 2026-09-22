import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react'

export function LoadingState({ label = 'Đang tải dữ liệu…' }) {
  return <div className="state-view"><LoaderCircle className="spin" /><p>{label}</p></div>
}

export function EmptyState({ title, description, action }) {
  return <div className="state-view glass-card"><Inbox /><h3>{title}</h3><p>{description}</p>{action}</div>
}

export function ErrorState({ message, retry }) {
  return <div className="state-view error-state"><AlertCircle /><h3>Không thể tải dữ liệu</h3><p>{message}</p>{retry && <button className="secondary-button" onClick={retry}>Thử lại</button>}</div>
}

