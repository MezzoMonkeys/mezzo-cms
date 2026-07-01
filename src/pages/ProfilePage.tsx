import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TextField } from '@/components/editors/fields'

const MIN_PASSWORD = 8

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function updatePassword() {
    if (newPassword.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters`)
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      toast.success('Password updated')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg = (err as { message?: string })?.message || 'unknown error'
      toast.error(`Could not update password: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}
      >
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ci-navy)' }}>Profile</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="flex flex-col gap-6" style={{ maxWidth: 520 }}>
          {/* Account */}
          <section
            className="rounded-xl p-6"
            style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ci-navy)' }}>Account</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>Email</span>
                <span className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>{user?.email}</span>
              </div>
              {profile?.role && (
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--ci-muted)' }}>Role</span>
                  <span className="text-sm font-medium capitalize" style={{ color: 'var(--ci-navy)' }}>{profile.role}</span>
                </div>
              )}
            </div>
          </section>

          {/* Change password */}
          <section
            className="rounded-xl p-6"
            style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}
          >
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--ci-navy)' }}>Change password</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--ci-muted)' }}>
              At least {MIN_PASSWORD} characters. You'll stay signed in after changing it.
            </p>
            <div className="flex flex-col gap-3">
              <TextField
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <TextField
                label="Confirm new password"
                type="password"
                autoComplete="new-password"
                error={confirmPassword.length > 0 && confirmPassword !== newPassword ? 'Passwords do not match' : undefined}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
              <div>
                <button
                  type="button"
                  onClick={updatePassword}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
                  style={{ background: 'var(--ci-yellow)', color: 'var(--ci-navy)' }}
                >
                  {saving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </div>
          </section>

          {/* Sign out */}
          <section
            className="rounded-xl p-6"
            style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}
          >
            <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--ci-navy)' }}>Session</h2>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#fee2e2'
                e.currentTarget.style.color = '#ef4444'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#ffffff'
                e.currentTarget.style.color = 'var(--ci-navy)'
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}