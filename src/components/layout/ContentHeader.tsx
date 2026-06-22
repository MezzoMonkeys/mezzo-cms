import { Loader2, Eye, Clock } from 'lucide-react'
import type { Status } from '@/lib/types'

interface Props {
  title: string
  status: Status
  saving: boolean
  onSave: () => void
  onSaveAndPreview: () => void
  onSaveAndPublish: () => void
  onSchedule?: () => void
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6b6f7e', bg: '#ece7da' },
  published: { label: 'Published', color: '#166534', bg: '#dcfce7' },
  scheduled: { label: 'Scheduled', color: '#1e40af', bg: '#dbeafe' },
}

export default function ContentHeader({ title, status, saving, onSave, onSaveAndPreview, onSaveAndPublish, onSchedule }: Props) {
  const s = statusConfig[status]

  return (
    <div
      className="flex items-center justify-between px-8 py-4 flex-shrink-0"
      style={{ background: '#ffffff', borderBottom: '1px solid var(--ci-border)' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--ci-navy)' }}>
          {title}
        </h1>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: s.color, background: s.bg }}
        >
          {s.label}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {saving && (
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--ci-muted)' }}>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </div>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--ci-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          Save
        </button>

        <button
          onClick={onSaveAndPreview}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--ci-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          <Eye size={14} />
          Save & Preview
        </button>

        {onSchedule && (
          <button
            onClick={onSchedule}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
            style={{ background: '#dbeafe', color: '#1e40af' }}
          >
            <Clock size={14} />
            Schedule
          </button>
        )}

        <button
          onClick={onSaveAndPublish}
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
          style={{ background: 'var(--ci-yellow)', color: 'var(--ci-navy)' }}
        >
          Save & Publish
        </button>
      </div>
    </div>
  )
}
