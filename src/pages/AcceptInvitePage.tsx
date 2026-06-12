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
      <div className="min-h-screen flex items-center justify-center ci-aurora">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--ci-navy)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>Setting up your account…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center ci-aurora">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <img src="/mezzo-wordmark.png" alt="Mezzo Collective" style={{ height: 32, width: 'auto', display: 'block', filter: 'brightness(0) saturate(100%) invert(13%) sepia(47%) saturate(1200%) hue-rotate(204deg) brightness(90%)' }} />
          </div>
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'var(--ci-muted)', letterSpacing: '0.18em' }}>
            You've been invited to the team
          </span>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: '#ffffff', border: '1px solid var(--ci-border)', boxShadow: '0 24px 60px rgba(21,39,92,0.10)' }}
        >
          <p className="text-sm mb-6" style={{ color: 'var(--ci-muted)' }}>
            Welcome,{' '}
            <span style={{ color: 'var(--ci-navy)', fontWeight: 600 }}>{session?.user.email}</span>. Complete your
            profile to get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
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
                minLength={8}
                placeholder="Choose a password (min 8 chars)"
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
              disabled={submitting}
              className="w-full rounded-lg py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--ci-yellow)', color: 'var(--ci-navy)' }}
            >
              {submitting ? 'Setting up…' : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
