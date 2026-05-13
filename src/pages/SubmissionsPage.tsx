import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Inbox, ChevronDown, ChevronUp } from 'lucide-react'
import { getContactSubmissions, updateSubmissionStatus } from '@/lib/queries'
import type { ContactSubmission } from '@/lib/types'

type SubStatus = ContactSubmission['status']

const statusConfig: Record<SubStatus, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#1e40af', bg: '#dbeafe' },
  read: { label: 'Read', color: '#6b6b6b', bg: '#f0f0f0' },
  replied: { label: 'Replied', color: '#166534', bg: '#dcfce7' },
  archived: { label: 'Archived', color: '#9a3412', bg: '#ffedd5' },
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    getContactSubmissions()
      .then(data => setSubmissions(data as ContactSubmission[]))
      .catch(() => toast.error('Failed to load submissions'))
      .finally(() => setLoading(false))
  }, [])

  async function changeStatus(id: string, status: SubStatus) {
    try {
      await updateSubmissionStatus(id, status)
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-8 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}>
        <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>Contact Submissions</h1>
        <span className="text-sm" style={{ color: '#6b6b6b' }}>
          {submissions.filter(s => s.status === 'new').length} new
        </span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#f4bf00', borderTopColor: 'transparent' }} />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Inbox size={40} style={{ color: '#e8e8e8' }} />
            <p className="text-sm" style={{ color: '#6b6b6b' }}>No submissions yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {submissions.map(sub => {
              const s = statusConfig[sub.status]
              const isExpanded = expanded === sub.id
              return (
                <div key={sub.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <div className="flex items-center gap-4 px-8 py-4 cursor-pointer transition-colors"
                    style={{ background: sub.status === 'new' ? '#fffbeb' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = sub.status === 'new' ? '#fff8d6' : '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = sub.status === 'new' ? '#fffbeb' : 'transparent')}
                    onClick={() => {
                      setExpanded(isExpanded ? null : sub.id)
                      if (sub.status === 'new') changeStatus(sub.id, 'read')
                    }}>
                    <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#111111' }}>{sub.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#6b6b6b' }}>{sub.email}</p>
                      </div>
                      <p className="text-sm" style={{ color: '#6b6b6b' }}>{sub.enquiry_type ?? '—'}</p>
                      <p className="text-sm truncate" style={{ color: '#6b6b6b' }}>{sub.message}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: s.color, background: s.bg }}>{s.label}</span>
                        <div className="flex items-center gap-1" style={{ color: '#6b6b6b' }}>
                          <span className="text-xs">
                            {new Date(sub.submitted_at).toLocaleDateString('en-AU')}
                          </span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-8 pb-5" style={{ background: '#fafafa' }}>
                      <div className="rounded-xl p-5" style={{ border: '1px solid #e8e8e8', background: '#ffffff' }}>
                        {sub.phone && (
                          <p className="text-sm mb-3" style={{ color: '#6b6b6b' }}>
                            <strong>Phone:</strong> {sub.phone}
                          </p>
                        )}
                        <p className="text-sm mb-4" style={{ color: '#2b2b2b', whiteSpace: 'pre-wrap' }}>
                          {sub.message}
                        </p>
                        <div className="flex gap-2">
                          {(['read', 'replied', 'archived'] as SubStatus[]).map(status => (
                            sub.status !== status && (
                              <button key={status} onClick={() => changeStatus(sub.id, status)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg capitalize transition-colors"
                                style={{ border: '1px solid #e8e8e8', color: '#2b2b2b', background: '#ffffff' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
                                onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}>
                                Mark as {status}
                              </button>
                            )
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
