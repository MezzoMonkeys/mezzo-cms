import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span style={{ color: '#f4bf00', fontSize: '24px' }}>▪</span>
            <span className="text-white font-bold text-2xl tracking-tight">MEZZO CMS</span>
          </div>
          <p style={{ color: '#6b6b6b', fontSize: '14px' }}>Content Management System</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#f7f7f7' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#111111',
                  border: '1px solid #333',
                  color: '#f7f7f7',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#f7f7f7' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: '#111111',
                  border: '1px solid #333',
                  color: '#f7f7f7',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
                onBlur={e => (e.currentTarget.style.borderColor = '#333')}
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: '#2a1a1a', color: '#ff6b6b', border: '1px solid #3a1a1a' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#f4bf00', color: '#111111' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
