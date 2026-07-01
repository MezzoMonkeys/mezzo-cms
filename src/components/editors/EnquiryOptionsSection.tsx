import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem, classifyError } from '@/lib/queries'
import { TextField } from '@/components/editors/fields'
import type { EnquiryOption } from '@/lib/types'

export function EnquiryOptionsSection() {
  const [items, setItems] = useState<EnquiryOption[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChildItems('enquiry_options')
      .then(data => setItems(data as EnquiryOption[]))
      .catch(() => toast.error('Failed to load enquiry options'))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, { id: crypto.randomUUID(), label: '', sort_order: prev.length }])
  }

  function updateItem(i: number, label: string) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, label } : item))
  }

  async function removeItem(item: EnquiryOption, i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    await deleteChildItem('enquiry_options', item.id).catch(() => null)
  }

  function moveItem(i: number, dir: -1 | 1) {
    setItems(prev => {
      const next = [...prev]
      const swap = i + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[i], next[swap]] = [next[swap], next[i]]
      return next
    })
  }

  async function save() {
    setSaving(true)
    try {
      await Promise.all(
        items.map((item, i) =>
          upsertChildItem('enquiry_options', { ...item, sort_order: i } as Record<string, unknown>)
        )
      )
      toast.success('Enquiry options saved')
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--ci-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ci-muted)' }}>
          Enquiry Options
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--ci-navy)', color: 'var(--ci-hover)' }}>
            <Plus size={12} /> Add Option
          </button>
          <button onClick={save} disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--ci-muted)' }}>
        These appear as dropdown choices in the contact form's "What can we help you with?" field.
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                className="w-6 h-5 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: 'var(--ci-muted)' }}>
                <ChevronUp size={12} />
              </button>
              <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                className="w-6 h-5 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: 'var(--ci-muted)' }}>
                <ChevronDown size={12} />
              </button>
            </div>
            <div className="flex-1">
              <TextField label="" value={item.label}
                placeholder="e.g. Brand Identity"
                onChange={e => updateItem(i, e.target.value)} />
            </div>
            <button onClick={() => removeItem(item, i)}
              className="w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0"
              style={{ color: 'var(--ci-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ci-muted)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No enquiry options yet — click Add Option to create one.</p>
        )}
      </div>
    </section>
  )
}
