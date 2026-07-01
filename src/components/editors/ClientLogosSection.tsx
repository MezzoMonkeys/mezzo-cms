import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem, classifyError } from '@/lib/queries'
import { TextField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { ClientLogo } from '@/lib/types'

export function ClientLogosSection() {
  const [items, setItems] = useState<ClientLogo[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChildItems('client_logos')
      .then(data => setItems(data as ClientLogo[]))
      .catch(() => toast.error('Failed to load client logos'))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(), name: '', logo_url: '', logo_alt: '',
      background_image_url: '', background_image_alt: '',
      website_url: null, sort_order: prev.length,
    }])
  }

  function updateItem(i: number, patch: Partial<ClientLogo>) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  async function removeItem(item: ClientLogo, i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    await deleteChildItem('client_logos', item.id).catch(() => null)
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
        items.map((item, i) => upsertChildItem('client_logos', { ...item, sort_order: i } as Record<string, unknown>))
      )
      toast.success('Client logos saved')
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
          Client Cards
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
            <div className="flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Client Name" value={item.name}
                  onChange={e => updateItem(i, { name: e.target.value })} />
                <TextField label="Website URL" type="url" value={item.website_url ?? ''}
                  onChange={e => updateItem(i, { website_url: e.target.value || null })} />
              </div>
              <ImageUpload
                label="Card Image"
                value={item.background_image_url || null}
                altValue={item.background_image_alt}
                onChange={url => updateItem(i, { background_image_url: url ?? '' })}
                onAltChange={alt => updateItem(i, { background_image_alt: alt })}
                required
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
          <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No client cards yet — click Add Card to create one.</p>
        )}
      </div>
    </section>
  )
}
