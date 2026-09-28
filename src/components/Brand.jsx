export default function Brand({ compact = false }) {
  return (
    <div className={`brand${compact ? ' compact' : ''}`} aria-label="Mora — Create & Connect">
      <span className="brand-name">{compact ? 'M' : 'Mora'}</span>
    </div>
  )
}
