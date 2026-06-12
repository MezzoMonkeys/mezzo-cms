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
    <div className="min-h-screen flex items-center justify-center ci-aurora px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div
              className="flex items-center justify-center rounded-2xl"
              style={{ width: 60, height: 60, background: 'var(--ci-navy-deep)' }}
            >
              <img src="/mezzo-logo.png" alt="Mezzo" style={{ height: 38, width: 'auto', display: 'block' }} />
            </div>
          </div>
          <span className="font-bold text-2xl tracking-tight" style={{ color: 'var(--ci-navy)' }}>
            MEZZO <span style={{ color: 'var(--ci-orange)' }}>CMS</span>
          </span>
          <p style={{ color: 'var(--ci-muted)', fontSize: '14px', marginTop: 4 }}>Content Management System</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: '#ffffff', border: '1px solid var(--ci-border)', boxShadow: '0 24px 60px rgba(21,39,92,0.10)' }}
        >
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
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
                  background: 'var(--ci-linen)',
                  border: '1px solid var(--ci-border)',
                  color: 'var(--ci-navy)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--ci-yellow)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  background: 'var(--ci-linen)',
                  border: '1px solid var(--ci-border)',
                  color: 'var(--ci-navy)',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--ci-yellow)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{ background: '#fdecec', color: '#b42318', border: '1px solid #f7d4d0' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--ci-yellow)', color: 'var(--ci-navy)' }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
