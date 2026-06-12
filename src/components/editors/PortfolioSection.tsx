import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import toast from 'react-hot-toast'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { getChildItems, upsertChildItem, deleteChildItem } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import { TextField, TextareaField } from '@/components/editors/fields'
import ImageUpload from '@/components/editors/ImageUpload'
import type { PortfolioItem } from '@/lib/types'

const BLANK: Omit<PortfolioItem, 'id' | 'sort_order'> = {
  title: '', image_url: '', image_alt: '', image_focal_x: null, image_focal_y: null,
  brand: null, brand_logo_url: null, brand_logo_alt: null,
  date: null, description: null, link_url: null,
  article_slug: null,
}

interface ArticleOption { article_title: string; slug: string }

export interface PortfolioSectionHandle {
  save: () => Promise<void>
}

export const PortfolioSection = forwardRef<PortfolioSectionHandle>(function PortfolioSection(_, ref) {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [articles, setArticles] = useState<ArticleOption[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploadingCount, setUploadingCount] = useState(0)
  const itemsRef = useRef<PortfolioItem[]>([])
  const uploadingRef = useRef(0)

  useEffect(() => { itemsRef.current = items }, [items])

  function trackUploading(active: boolean) {
    uploadingRef.current = Math.max(0, uploadingRef.current + (active ? 1 : -1))
    setUploadingCount(uploadingRef.current)
  }

  useEffect(() => {
    Promise.all([
      getChildItems('portfolio_items'),
      supabase.from('articles').select('article_title, slug').order('article_title', { ascending: true }),
    ])
      .then(([portfolioData, { data: articleData }]) => {
        setItems(portfolioData as PortfolioItem[])
        setArticles(articleData ?? [])
      })
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
    if (uploadingRef.current > 0) {
      // Abort both save paths: the portfolio button (catches below) and the
      // parent page save (EditorPage surfaces this message via classifyError).
      throw new Error('Images still uploading — wait for them to finish before saving')
    }
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

  if (loading) return <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2" style={{ borderBottom: '1px solid var(--ci-border)' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--ci-muted)' }}>
          Portfolio Items
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={addItem}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--ci-navy)', color: 'var(--ci-hover)' }}>
            <Plus size={12} /> Add Item
          </button>
          <button onClick={() => save().catch(err => toast.error(err.message))} disabled={saving || uploadingCount > 0}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#f4bf00', color: 'var(--ci-navy)' }}>
            {uploadingCount > 0 ? 'Uploading…' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={item.id} className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--ci-border)', background: '#ffffff' }}>
            <div className="flex items-center justify-between px-4 py-2"
              style={{ background: 'var(--ci-hover)', borderBottom: '1px solid var(--ci-border)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--ci-navy)' }}>
                {item.title || `Item ${i + 1}`}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => moveItem(i, -1)} disabled={i === 0}
                  className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: 'var(--ci-muted)' }}>
                  <ChevronUp size={14} />
                </button>
                <button onClick={() => moveItem(i, 1)} disabled={i === items.length - 1}
                  className="w-7 h-7 flex items-center justify-center rounded disabled:opacity-30"
                  style={{ color: 'var(--ci-muted)' }}>
                  <ChevronDown size={14} />
                </button>
                <button onClick={() => removeItem(item, i)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg ml-1"
                  style={{ color: 'var(--ci-muted)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--ci-muted)' }}>
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
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--ci-muted)' }}>
                    Project Article
                  </label>
                  <select
                    value={item.article_slug ?? ''}
                    onChange={e => updateItem(i, { article_slug: e.target.value || null })}
                    className="text-sm rounded-lg px-3 py-2"
                    style={{ border: '1px solid var(--ci-border)', color: 'var(--ci-navy)', background: '#ffffff' }}>
                    <option value="">— No article linked —</option>
                    {articles.map(a => (
                      <option key={a.slug} value={a.slug}>{a.article_title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <TextareaField label="Description" rows={3} value={item.description ?? ''}
                onChange={e => updateItem(i, { description: e.target.value || null })} />
              <ImageUpload
                label="Portfolio Image"
                value={item.image_url || null}
                altValue={item.image_alt}
                onChange={url => updateItem(i, { image_url: url ?? '' })}
                onAltChange={alt => updateItem(i, { image_alt: alt })}
                focalX={item.image_focal_x}
                focalY={item.image_focal_y}
                onFocalChange={(x, y) => updateItem(i, { image_focal_x: x, image_focal_y: y })}
                onUploadingChange={trackUploading}
                cropViews={[{ label: 'Cube face (1:1)', ratio: 1 }]}
                required
              />
              <ImageUpload
                label="Brand Logo"
                value={item.brand_logo_url || null}
                altValue={item.brand_logo_alt ?? ''}
                onChange={url => updateItem(i, { brand_logo_url: url })}
                onAltChange={alt => updateItem(i, { brand_logo_alt: alt || null })}
                onUploadingChange={trackUploading}
              />
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--ci-muted)' }}>No portfolio items yet — click Add Item to create one.</p>
        )}
      </div>
    </section>
  )
})
