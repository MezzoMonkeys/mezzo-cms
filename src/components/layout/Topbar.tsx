import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <header
      className="h-12 flex items-center justify-between px-5 flex-shrink-0"
      style={{ background: 'var(--ci-navy-deep)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
    >
      <div className="flex items-center gap-3">
        <img src="/mezzo-wordmark.png" alt="Mezzo Collective" style={{ height: 22, width: 'auto', display: 'block' }} />
        <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.35)', letterSpacing: '0.18em', fontSize: 10 }}>
          CMS
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = 'rgba(255,255,255,0.6)'
            e.currentTarget.style.background = 'transparent'
          }}
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
