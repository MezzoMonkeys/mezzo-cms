import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
import { TextField, TextareaField, SelectField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { PortfolioItem } from '@/lib/types'

const BLANK: Omit<PortfolioItem, 'id' | 'sort_order'> = {
  title: '', image_url: '', image_alt: '', brand: null, date: null,
  description: null, layout_side: 'left', colour_scheme: 'light', link_url: null,
}

export interface PortfolioSectionHandle {
  save: () => Promise<void>
}

export const PortfolioSection = forwardRef<PortfolioSectionHandle>(function PortfolioSection(_, ref) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef<PortfolioItem[]>([])

  useEffect(() => { itemsRef.current = items }, [items])

  useEffect(() => {
    getChildItems('portfolio_items')
      .then(data => setItems(data as PortfolioItem[]))
      .catch(() => toast.error('Failed to load portfolio items'))
      .finally(() => setLoading(false))
  }, [])

  function addItem() {
    setItems(prev => [...prev, { id: crypto.randomUUID(), sort_order: prev.length, ...BLANK }])
  }

  function updateItem(i: number, patch: Partial<PortfolioItem>) {
    setItems(prev => prev.map((item, idx) => idx === i ? { ...item, ...patch } : item))
  }

  async function removeItem(item: PortfolioItem, i: number) {
    setItems(prev => prev.filter((_, idx) => idx !== i))
    await deleteChildItem('portfolio_items', item.id).catch(() => null)
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

  async function save(silent = false) {
    setSaving(true)
    try {
      await Promise.all(
        itemsRef.current.map((item, i) =>
          upsertChildItem('portfolio_items', { ...item, sort_order: i } as Record<string, unknown>)
        )
      )
      if (!silent) toast.success('Portfolio items saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save: () => save(true) }))

  if (loading) return <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
          Portfolio Items
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: '#111111', color: '#f7f7f7' }}>
            <Plus size={12} /> Add Item
          </button>
          <button onClick={save} disabled={saving}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: '#111111' }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #e8e8e8', background: '#ffffff' }}>
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: '#f7f7f7', borderBottom: '1px solid #e8e8e8' }}>
              <span className="text-sm font-medium" style={{ color: '#2b2b2b' }}>
                {item.title || `Item ${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: '#6b6b6b' }}>
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: '#6b6b6b' }}>
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeItem(item, i)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg ml-1"
                  style={{ color: '#6b6b6b' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b6b6b' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <TextField label="Title" value={item.title}
                  onChange={e => updateItem(i, { title: e.target.value })} />
                <TextField label="Brand" value={item.brand ?? ''}
                  onChange={e => updateItem(i, { brand: e.target.value || null })} />
                <TextField label="Date" value={item.date ?? ''}
                  placeholder="e.g. March 2024"
                  onChange={e => updateItem(i, { date: e.target.value || null })} />
                <TextField label="Link URL" type="url" value={item.link_url ?? ''}
                  onChange={e => updateItem(i, { link_url: e.target.value || null })} />
                <SelectField label="Layout Side" value={item.layout_side}
                  onChange={v => updateItem(i, { layout_side: v as 'left' | 'right' })}
                  options={[{ value: 'left', label: 'Image Left' }, { value: 'right', label: 'Image Right' }]} />
                <SelectField label="Colour Scheme" value={item.colour_scheme}
                  onChange={v => updateItem(i, { colour_scheme: v as 'light' | 'dark' })}
                  options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]} />
              </div>
              <TextareaField label="Description" rows={3} value={item.description ?? ''}
                onChange={e => updateItem(i, { description: e.target.value || null })} />
              <ImageUpload
                label="Portfolio Image"
                value={item.image_url || null}
                altValue={item.image_alt}
                onChange={url => updateItem(i, { image_url: url ?? '' })}
                onAltChange={alt => updateItem(i, { image_alt: alt })}
                required
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: '#6b6b6b' }}>No portfolio items yet — click Add Item to create one.</p>
        )}
      </div>
    </section>
  )
})
