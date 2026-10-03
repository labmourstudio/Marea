import { Link } from 'react-router-dom'

export default function CreatorName({ person, fallback = 'Người sáng tạo' }) {
  const name = <strong>{person?.display_name || person?.username || fallback}</strong>
  return person?.username ? <Link to={`/u/${person.username}`}>{name}</Link> : name
}
