export default function Brand({ compact = false }) {
  return (
    <div className={`brand${compact ? ' compact' : ''}`} aria-label="Mora — Create & Connect">
      <img className="brand-liquid-star" src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" />
      <span className="brand-liquid-text" data-text="Mora">Mora</span>
    </div>
  )
}
