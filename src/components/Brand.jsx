export default function Brand({ compact = false }) {
  return (
    <div className={`brand${compact ? ' compact' : ''}`} aria-label="Mora — Create & Connect">
      <img className="brand-wordmark brand-wordmark-light" src={`${import.meta.env.BASE_URL}brand/mora-wordmark.svg`} alt="" />
      <img className="brand-wordmark brand-wordmark-dark" src={`${import.meta.env.BASE_URL}brand/mora-wordmark-inverse.svg`} alt="" />
    </div>
  )
}
