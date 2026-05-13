import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
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
      id: crypto.randomUUID(), name: '', logo_url: '', logo_alt: '', website_url: null, sort_order: prev.length,
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
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
          Client Logos
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#111111', color: '#f7f7f7' }}>
            <Plus size={12} /> Add Logo
          </button>
          <button onClick={save} disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: '#111111' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-3 p-4 rounded-xl"
            style={{ border: '1px solid #e8e8e8', background: '#ffffff' }}>
            <div className="flex flex-col gap-1 pt-6 flex-shrink-0">
              <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: '#6b6b6b' }}>
                <ChevronUp size={14} />
              </button>
              <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                className="w-6 h-6 flex items-center justify-center rounded disabled:opacity-30"
                style={{ color: '#6b6b6b' }}>
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <TextField label="Client Name" value={item.name}
                onChange={e => updateItem(i, { name: e.target.value })} />
              <TextField label="Website URL" type="url" value={item.website_url ?? ''}
                onChange={e => updateItem(i, { website_url: e.target.value || null })} />
              <div className="col-span-2">
                <ImageUpload
                  label="Logo"
                  value={item.logo_url || null}
                  altValue={item.logo_alt}
                  onChange={url => updateItem(i, { logo_url: url ?? '' })}
                  onAltChange={alt => updateItem(i, { logo_alt: alt })}
                  required
                />
              </div>
            </div>
            <button onClick={() => removeItem(item, i)}
              className="mt-6 w-7 h-7 flex items-center justify-center rounded-lg"
              style={{ color: '#6b6b6b' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: '#6b6b6b' }}>No client logos yet — click Add Logo to create one.</p>
        )}
      </div>
    </section>
  )
}
