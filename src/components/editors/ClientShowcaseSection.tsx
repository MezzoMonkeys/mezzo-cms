import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem, classifyError } from '@/lib/queries'
import { TextField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { ClientShowcase } from '@/lib/types'

export function ClientShowcaseSection() {
  const [items, setItems] = useState<ClientShowcase[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getChildItems('client_showcase')
      .then(data => setItems(data as ClientShowcase[]))
      .catch(() => toast.error('Failed to load showcase cards'))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(), label: '',
      front_image_url: '', front_image_alt: '',
      back_image_url: '', back_image_alt: '',
      sort_order: prev.length,
    }])
  }

  function updateItem(i: number, patch: Partial<ClientShowcase>) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  async function removeItem(item: ClientShowcase, i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    await deleteChildItem('client_showcase', item.id).catch(() => null)
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
        items.map((item, i) => upsertChildItem('client_showcase', { ...item, sort_order: i } as Record<string, unknown>))
      )
      toast.success('Showcase cards saved')
    } catch (err) {
      toast.error(classifyError(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-1 pb-2" style={{ borderBottom: '1px solid var(--ci-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ci-muted)' }}>
          Clients Showcase (orbit cards)
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
      <p className="text-xs mb-4" style={{ color: 'var(--ci-muted)' }}>
        Each card orbits the screen and flips from its front image to its lifestyle (back) image mid-orbit.
      </p>
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
              <TextField label="Label" value={item.label}
                onChange={e => updateItem(i, { label: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <ImageUpload
                  label="Front Image"
                  value={item.front_image_url || null}
                  altValue={item.front_image_alt}
                  onChange={url => updateItem(i, { front_image_url: url ?? '' })}
                  onAltChange={alt => updateItem(i, { front_image_alt: alt })}
                  required
                />
                <ImageUpload
                  label="Back / Lifestyle Image"
                  value={item.back_image_url || null}
                  altValue={item.back_image_alt}
                  onChange={url => updateItem(i, { back_image_url: url ?? '' })}
                  onAltChange={alt => updateItem(i, { back_image_alt: alt })}
                />
              </div>
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
          <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No showcase cards yet — click Add Card to create one.</p>
        )}
      </div>
    </section>
  )
}
