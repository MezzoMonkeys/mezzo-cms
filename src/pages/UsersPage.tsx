import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Mail, X, Plus, ChevronDown } from 'lucide-react'
import {
  getUsers,
  getSites,
  getPendingInvitations,
  updateUserRole,
  updateUserStatus,
  setUserSiteAccess,
  revokeInvitation,
  sendInvite,
  classifyError,
} from '@/lib/queries'
import type { UserWithAccess, Site, Invitation, UserRole } from '@/lib/types'
import { useAuth } from '@/contexts/AuthContext'

const roleConfig: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin:  { label: 'Admin',  color: '#7c3aed', bg: '#ede9fe' },
  editor: { label: 'Editor', color: '#0369a1', bg: '#e0f2fe' },
}

function Avatar({ name, email }: { name: string | null; email: string }) {
  const letter = (name ?? email).charAt(0).toUpperCase()
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
      style={{ background: '#f4bf0015', color: '#b8860b', border: '1px solid #f4bf0030' }}
    >
      {letter}
    </div>
  )
}

// ── Invite Modal ──────────────────────────────────────────────────────────────

interface InviteModalProps {
  sites: Site[]
  onClose: () => void
  onInvited: () => void
}

function InviteModal({ sites, onClose, onInvited }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('editor')
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(sites.map(s => s.id))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await sendInvite(email.trim().toLowerCase(), role, selectedSiteIds)
      toast.success(`Invite sent to ${email}`)
      onInvited()
    } catch (err) {
      setError(classifyError(err))
    } finally {
      setLoading(false)
    }
  }

  function toggleSite(siteId: string) {
    setSelectedSiteIds(prev =>
      prev.includes(siteId) ? prev.filter(id => id !== siteId) : [...prev, siteId],
    )
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{ background: '#ffffff', border: '1px solid var(--ci-border)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold" style={{ color: 'var(--ci-navy)' }}>
            Invite Team Member
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--ci-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#f0f0f0')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="colleague@example.com"
              className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-all"
              style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}
              onFocus={e => (e.currentTarget.style.borderColor = '#f4bf00')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--ci-border)')}
            />
          </div>

          {/* Role */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
              Role
            </label>
            <div className="flex gap-2">
              {(['editor', 'admin'] as UserRole[]).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                  style={{
                    border: `1px solid ${role === r ? roleConfig[r].color : 'var(--ci-border)'}`,
                    background: role === r ? roleConfig[r].bg : '#ffffff',
                    color: role === r ? roleConfig[r].color : 'var(--ci-muted)',
                  }}
                >
                  {roleConfig[r].label}
                </button>
              ))}
            </div>
            <p className="text-xs" style={{ color: 'var(--ci-muted)' }}>
              {role === 'admin'
                ? 'Full access — can manage users, all pages, and settings.'
                : 'Can edit content and articles. Cannot manage team.'}
            </p>
          </div>

          {/* Site access */}
          {sites.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
                Site access
              </label>
              <div className="flex flex-col gap-1.5">
                {sites.map(site => (
                  <label
                    key={site.id}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                    style={{ border: '1px solid var(--ci-border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--ci-linen)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSiteIds.includes(site.id)}
                      onChange={() => toggleSite(site.id)}
                      style={{ accentColor: '#f4bf00', width: 14, height: 14 }}
                    />
                    <span className="text-sm" style={{ color: 'var(--ci-navy)' }}>{site.name}</span>
                    {site.domain && (
                      <span className="text-xs ml-auto" style={{ color: '#9b9b9b' }}>
                        {site.domain}
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p
              className="text-sm rounded-lg px-3 py-2"
              style={{ background: '#fff0f0', color: '#dc2626', border: '1px solid #fecaca' }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-muted)', background: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--ci-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity disabled:opacity-50"
              style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}
            >
              {loading ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { profile: currentProfile } = useAuth()
  const [users, setUsers] = useState<UserWithAccess[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null)

  async function load() {
    try {
      const [u, inv, s] = await Promise.all([getUsers(), getPendingInvitations(), getSites()])
      setUsers(u)
      setInvitations(inv)
      setSites(s)
    } catch {
      toast.error('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleRoleChange(userId: string, role: UserRole) {
    try {
      await updateUserRole(userId, role)
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role } : u)))
      setRoleDropdown(null)
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  async function handleToggleStatus(userId: string, current: string) {
    const next = current === 'disabled' ? 'active' : 'disabled'
    try {
      await updateUserStatus(userId, next)
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, status: next as 'active' | 'disabled' } : u)))
      toast.success(next === 'active' ? 'User enabled' : 'User disabled')
    } catch {
      toast.error('Failed to update user')
    }
  }

  async function handleSiteToggle(userId: string, siteId: string, currentIds: string[]) {
    const next = currentIds.includes(siteId)
      ? currentIds.filter(id => id !== siteId)
      : [...currentIds, siteId]
    try {
      await setUserSiteAccess(userId, next)
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, site_ids: next } : u)))
    } catch {
      toast.error('Failed to update site access')
    }
  }

  async function handleRevoke(invId: string) {
    try {
      await revokeInvitation(invId)
      setInvitations(prev => prev.filter(i => i.id !== invId))
      toast.success('Invitation revoked')
    } catch {
      toast.error('Failed to revoke invitation')
    }
  }

  const activeUsers   = users.filter(u => u.status !== 'disabled')
  const disabledUsers = users.filter(u => u.status === 'disabled')

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}
      >
        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--ci-navy)' }}>Team</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ci-muted)' }}>
            Manage who has access to Mezzo CMS
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-opacity"
          style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={14} />
          Invite Member
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div
              className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-8 py-6 flex flex-col gap-6">

            {/* Active Members */}
            <section>
              <h2
                className="text-xs font-semibold tracking-widest uppercase mb-3"
                style={{ color: 'var(--ci-muted)' }}
              >
                Members ({activeUsers.length})
              </h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ci-border)' }}>
                {activeUsers.length === 0 ? (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No active members.</p>
                  </div>
                ) : (
                  activeUsers.map((user, i) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-5 py-4"
                      style={{
                        background: '#ffffff',
                        borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      <Avatar name={user.full_name} email={user.email} />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ci-navy)' }}>
                          {user.full_name ?? '—'}
                          {user.id === currentProfile?.id && (
                            <span className="ml-1.5 text-xs font-normal" style={{ color: '#9b9b9b' }}>
                              you
                            </span>
                          )}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--ci-muted)' }}>
                          {user.email}
                        </p>
                      </div>

                      {/* Role dropdown */}
                      <div className="relative">
                        <button
                          onClick={() =>
                            setRoleDropdown(roleDropdown === user.id ? null : user.id)
                          }
                          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-opacity"
                          style={{
                            color: roleConfig[user.role].color,
                            background: roleConfig[user.role].bg,
                          }}
                          disabled={user.id === currentProfile?.id}
                        >
                          {roleConfig[user.role].label}
                          {user.id !== currentProfile?.id && <ChevronDown size={10} />}
                        </button>
                        {roleDropdown === user.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setRoleDropdown(null)}
                            />
                            <div
                              className="absolute right-0 top-full mt-1 z-20 rounded-lg py-1 min-w-28"
                              style={{
                                background: '#ffffff',
                                border: '1px solid var(--ci-border)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                              }}
                            >
                              {(['admin', 'editor'] as UserRole[]).map(r => (
                                <button
                                  key={r}
                                  onClick={() => handleRoleChange(user.id, r)}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors"
                                  style={{
                                    background: user.role === r ? 'var(--ci-hover)' : 'transparent',
                                    color: 'var(--ci-navy)',
                                    fontWeight: user.role === r ? 500 : 400,
                                  }}
                                  onMouseEnter={e =>
                                    (e.currentTarget.style.background = 'var(--ci-hover)')
                                  }
                                  onMouseLeave={e =>
                                    (e.currentTarget.style.background =
                                      user.role === r ? 'var(--ci-hover)' : 'transparent')
                                  }
                                >
                                  {roleConfig[r].label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Site pills */}
                      <div className="flex gap-1">
                        {sites.map(site => {
                          const has = user.site_ids.includes(site.id)
                          return (
                            <button
                              key={site.id}
                              onClick={() => handleSiteToggle(user.id, site.id, user.site_ids)}
                              title={`${has ? 'Remove' : 'Grant'} access to ${site.name}`}
                              className="text-xs px-2 py-0.5 rounded-full transition-all"
                              style={{
                                background: has ? '#fef3c7' : '#f0f0f0',
                                color: has ? '#92400e' : '#9b9b9b',
                                border: `1px solid ${has ? '#fde68a' : 'var(--ci-border)'}`,
                              }}
                            >
                              {site.name.split(' ')[0]}
                            </button>
                          )
                        })}
                      </div>

                      {/* Disable */}
                      {user.id !== currentProfile?.id && (
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ color: '#dc2626', border: '1px solid #fecaca' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fff0f0')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          Disable
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Disabled Users */}
            {disabledUsers.length > 0 && (
              <section>
                <h2
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: 'var(--ci-muted)' }}
                >
                  Disabled ({disabledUsers.length})
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ci-border)' }}>
                  {disabledUsers.map((user, i) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-4 px-5 py-4"
                      style={{
                        background: 'var(--ci-linen)',
                        borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                        opacity: 0.65,
                      }}
                    >
                      <Avatar name={user.full_name} email={user.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ci-muted)' }}>
                          {user.full_name ?? '—'}
                        </p>
                        <p className="text-xs truncate" style={{ color: '#9b9b9b' }}>
                          {user.email}
                        </p>
                      </div>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: '#f0f0f0', color: 'var(--ci-muted)' }}
                      >
                        Disabled
                      </span>
                      <button
                        onClick={() => handleToggleStatus(user.id, user.status)}
                        className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                        style={{ color: '#166534', border: '1px solid #bbf7d0' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0fdf4')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        Enable
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Invitations */}
            {invitations.length > 0 && (
              <section>
                <h2
                  className="text-xs font-semibold tracking-widest uppercase mb-3"
                  style={{ color: 'var(--ci-muted)' }}
                >
                  Pending Invitations ({invitations.length})
                </h2>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--ci-border)' }}>
                  {invitations.map((inv, i) => (
                    <div
                      key={inv.id}
                      className="flex items-center gap-4 px-5 py-4"
                      style={{
                        background: '#ffffff',
                        borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#f0f0f0' }}
                      >
                        <Mail size={15} style={{ color: '#9b9b9b' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ci-navy)' }}>
                          {inv.email}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--ci-muted)' }}>
                          Expires {new Date(inv.expires_at).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      <span
                        className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{
                          color: roleConfig[inv.role].color,
                          background: roleConfig[inv.role].bg,
                        }}
                      >
                        {roleConfig[inv.role].label}
                      </span>
                      <button
                        onClick={() => handleRevoke(inv.id)}
                        title="Revoke invitation"
                        className="p-1.5 rounded-lg transition-all"
                        style={{ color: '#9b9b9b' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = '#fff0f0'
                          e.currentTarget.style.color = '#dc2626'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#9b9b9b'
                        }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {users.length === 0 && invitations.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>
                  No team members yet. Invite someone to get started.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {showInviteModal && (
        <InviteModal
          sites={sites}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            setShowInviteModal(false)
            load()
          }}
        />
      )}
    </div>
  )
}
