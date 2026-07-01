export default function Topbar() {
  return (
    <header
      className="h-12 flex items-center px-5 flex-shrink-0"
      style={{ background: 'var(--ci-navy-deep)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <img src="/mezzo-wordmark.png" alt="Mezzo Collective" style={{ height: 22, width: 'auto', display: 'block' }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', fontSize: 10 }}>
          CMS
        </span>
      </div>
    </header>
  )
}
