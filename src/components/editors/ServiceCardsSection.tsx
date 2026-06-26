import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
import { TextField, TextareaField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { ServiceCard } from '@/lib/types'

export function ServiceCardsSection() {
  const [items, setItems] = useState<ServiceCard[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChildItems('service_cards')
      .then(data => setItems(data as ServiceCard[]))
      .catch(() => toast.error('Failed to load service cards'))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(), title: '', body_text: null, link_url: null,
      background_image_url: null, sort_order: prev.length,
    }])
  }

  function updateItem(i: number, patch: Partial<ServiceCard>) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  async function removeItem(item: ServiceCard, i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    await deleteChildItem('service_cards', item.id).catch(() => null)
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
        items.map((item, i) => upsertChildItem('service_cards', { ...item, sort_order: i } as Record<string, unknown>))
      )
      toast.success('Service cards saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--ci-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ci-muted)' }}>
          Service Cards
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--ci-navy)', color: 'var(--ci-hover)' }}>
            <Plus size={12} /> Add Card
          </button>
          <button onClick={save} disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl"
            style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}>
            <div className="flex flex-col gap-1 pt-6 flex-shrink-0">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: 'var(--ci-muted)' }}>
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: 'var(--ci-muted)' }}>
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex-1 flex flex-col gap-3">
              <TextField label="Title" value={item.title}
                onChange={e => updateItem(i, { title: e.target.value })} />
              <TextareaField label="Body Text" rows={3} value={item.body_text ?? ''}
                onChange={e => updateItem(i, { body_text: e.target.value || null })} />
              <TextField label="Link URL" type="url" value={item.link_url ?? ''}
                onChange={e => updateItem(i, { link_url: e.target.value || null })} />
              <ImageUpload
                label="Background Image (optional)"
                value={item.background_image_url}
                altValue={item.title || 'Service background'}
                onChange={url => updateItem(i, { background_image_url: url || null })}
                onAltChange={() => {}}
                cropViews={[{ label: '16:9', ratio: 9 / 16 }]}
              />
            </div>
            <button onClick={() => removeItem(item, i)}
              className="mt-6 w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: 'var(--ci-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ci-muted)' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No service cards yet — click Add Card to create one.</p>
        )}
      </div>
    </section>
  )
}
