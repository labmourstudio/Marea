export default function Brand({ compact = false }) {
  return (
    <div className={`brand${compact ? ' compact' : ''}`} aria-label="Mayo — Create & Connect">
      <svg className="brand-star" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 1C18.1 10.4 21.6 13.9 31 16c-9.4 2.1-12.9 5.6-15 15-2.1-9.4-5.6-12.9-15-15C10.4 13.9 13.9 10.4 16 1Z" /></svg>
      <span>Mayo</span>
    </div>
  )
}
