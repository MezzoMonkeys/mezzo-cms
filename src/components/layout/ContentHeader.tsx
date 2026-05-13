import { Loader2, Eye } from 'lucide-react'
import type { Status } from '@/lib/types'

interface Props {
  title: string
  status: Status
  saving: boolean
  onSave: () => void
  onSaveAndPreview: () => void
  onSaveAndPublish: () => void
}

const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: '#6b6b6b', bg: '#f0f0f0' },
  published: { label: 'Published', color: '#166534', bg: '#dcfce7' },
  scheduled: { label: 'Scheduled', color: '#1e40af', bg: '#dbeafe' },
}

export default function ContentHeader({ title, status, saving, onSave, onSaveAndPreview, onSaveAndPublish }: Props) {
  const s = statusConfig[status]

  return (
    <div
      className="flex items-center justify-between px-8 py-4 flex-shrink-0"
      style={{ background: '#ffffff', borderBottom: '1px solid #e8e8e8' }}
    >
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold" style={{ color: '#111111' }}>
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
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#6b6b6b' }}>
            <Loader2 size={14} className="animate-spin" />
            Saving…
          </div>
        )}

        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ border: '1px solid #e8e8e8', color: '#2b2b2b', background: '#ffffff' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          Save
        </button>

        <button
          onClick={onSaveAndPreview}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          style={{ border: '1px solid #e8e8e8', color: '#2b2b2b', background: '#ffffff' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#f7f7f7')}
          onMouseLeave={e => (e.currentTarget.style.background = '#ffffff')}
        >
          <Eye size={14} />
          Save & Preview
        </button>

        <button
          onClick={onSaveAndPublish}
          disabled={saving}
          className="px-4 py-2 text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
          style={{ background: '#f4bf00', color: '#111111' }}
        >
          Save & Publish
        </button>
      </div>
    </div>
  )
}
