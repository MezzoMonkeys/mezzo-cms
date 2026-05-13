import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function AppShell() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: '#6b6b6b' }}>
            Loading…
          </span>
        </div>
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Topbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto" style={{ background: '#fafafa' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
