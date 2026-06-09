import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AcceptInvitePage() {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()

  // Capture whether the URL hash contains an invite token before Supabase consumes it
  const isInviteFlow = useRef(
    typeof window !== 'undefined' && window.location.hash.includes('access_token'),
  )

  const [ready, setReady] = useState(false)
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (authLoading) return

    if (!isInviteFlow.current) {
      // Not an invite link — redirect
      navigate(session ? '/' : '/login', { replace: true })
      return
    }

    if (session) {
      setReady(true)
    }
  }, [authLoading, session, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!session) return
    setError(null)
    setSubmitting(true)
    try {
      if (password) {
        const { error: pwErr } = await supabase.auth.updateUser({ password })
        if (pwErr) throw pwErr
      }
      if (fullName.trim()) {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() })
          .eq('id', session.user.id)
        if (profileErr) throw profileErr
      }
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  // Waiting for Supabase to process the invite hash
  if (authLoading || (isInviteFlow.current && !ready)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#111111' }}>
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: '#6b6b6b' }}>Setting up your account…</span>
        </div>
      </div>
    )
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
          <p style={{ color: '#6b6b6b', fontSize: '14px' }}>You've been invited to the team</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: '#1c1c1c', border: '1px solid #2a2a2a' }}
        >
          <p className="text-sm mb-6" style={{ color: '#a0a0a0' }}>
            Welcome,{' '}
            <span style={{ color: '#f7f7f7' }}>{session?.user.email}</span>. Complete your
            profile to get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: '#f7f7f7' }}>
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                autoFocus
                placeholder="Your name"
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
                minLength={8}
                placeholder="Choose a password (min 8 chars)"
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
              disabled={submitting}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#f4bf00', color: '#111111' }}
            >
              {submitting ? 'Setting up…' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
