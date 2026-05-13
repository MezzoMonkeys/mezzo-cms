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
      style={{ background: '#111111', borderBottom: '1px solid #1e1e1e' }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color: '#f4bf00', fontSize: '16px', lineHeight: 1 }}>▪</span>
        <span className="text-white font-bold text-sm tracking-tight">MEZZO CMS</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm" style={{ color: '#6b6b6b' }}>
          {user?.email}
        </span>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
          style={{ color: '#6b6b6b' }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#f7f7f7'
            e.currentTarget.style.background = '#1c1c1c'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = '#6b6b6b'
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
