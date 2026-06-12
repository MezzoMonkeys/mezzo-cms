import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getWorkImages, upsertChildItem } from '@/lib/queries'
import ImageUpload from '@/components/editors/ImageUpload'
import type { WorkImage } from '@/lib/types'

// Fixed slots for the Our Work landing collage. sort_order == slot index.
// Slot 0 is the central image; 1–6 are the scatter positions (must match
// SCATTER_SLOTS order in src/pages/our-work/index.astro on the site).
const SLOTS = [
  { label: 'Central — sits over the “Our Work” wordmark', ratio: 4 / 3 },
  { label: 'Top left', ratio: 5 / 4 },
  { label: 'Top right', ratio: 5 / 4 },
  { label: 'Bottom left', ratio: 5 / 4 },
  { label: 'Bottom right', ratio: 5 / 4 },
  { label: 'Mid left', ratio: 5 / 4 },
  { label: 'Mid right', ratio: 5 / 4 },
  { label: 'Final reveal — full-screen image that expands at the end of the scroll', ratio: 16 / 9 },
]

function blankSlot(i: number): WorkImage {
  return {
    id: crypto.randomUUID(), page: 'our-work',
    image_url: '', image_alt: '', focal_x: null, focal_y: null, sort_order: i,
  }
}

export function OurWorkHeroSection() {
  const [slots, setSlots] = useState<WorkImage[]>(SLOTS.map((_, i) => blankSlot(i)))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCount, setUploadingCount] = useState(0)

  useEffect(() => {
    getWorkImages('our-work')
      .then(rows => {
        const data = rows as WorkImage[]
        setSlots(SLOTS.map((_, i) => data.find(r => r.sort_order === i) ?? blankSlot(i)))
      })
      .catch(() => toast.error('Failed to load hero gallery'))
      .finally(() => setLoading(false))
  }, [])

  function update(i: number, patch: Partial<WorkImage>) {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, ...patch } : s))
  }

  function trackUploading(active: boolean) {
    setUploadingCount(c => Math.max(0, c + (active ? 1 : -1)))
  }

  async function save() {
    if (uploadingCount > 0) {
      toast.error('Media still uploading — wait for it to finish before saving')
      return
    }
    setSaving(true)
    try {
      await Promise.all(
        slots.map((s, i) => upsertChildItem('work_images', { ...s, sort_order: i } as Record<string, unknown>))
      )
      toast.success('Hero gallery saved')
    } catch {
      toast.error('Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm" style={{ color: '#6b6b6b' }}>Loading…</p>

  return (
    <section>
      <div className="flex items-center justify-between mb-2 pb-2" style={{ borderBottom: '1px solid #e8e8e8' }}>
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#6b6b6b' }}>
          Hero Gallery (landing scatter)
        </h3>
        <button onClick={save} disabled={saving || uploadingCount > 0}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
          style={{ background: '#f4bf00', color: '#111111' }}>
          {uploadingCount > 0 ? 'Uploading…' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: '#6b6b6b' }}>
        Eight fixed slots. Slots 1–7 stream through as the parallax collage; slot 8 is the final
        full-screen reveal at the end of the scroll. Each can be an image <em>or</em> a video —
        videos autoplay muted &amp; looped. Leave a slot empty to skip it.
      </p>
      <div className="grid grid-cols-2 gap-4">
        {SLOTS.map((slot, i) => (
          <div key={slots[i].id} className="p-4 rounded-xl"
            style={{ border: '1px solid #e8e8e8', background: i === 0 ? '#fffdf5' : '#ffffff' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#2b2b2b' }}>
              {i + 1}. {slot.label}
            </p>
            <ImageUpload
              label=""
              value={slots[i].image_url || null}
              altValue={slots[i].image_alt}
              onChange={url => update(i, { image_url: url ?? '' })}
              onAltChange={alt => update(i, { image_alt: alt })}
              focalX={slots[i].focal_x}
              focalY={slots[i].focal_y}
              onFocalChange={(x, y) => update(i, { focal_x: x, focal_y: y })}
              onUploadingChange={trackUploading}
              cropViews={[{ label: i === 0 ? 'Slot (3:4)' : 'Slot (4:5)', ratio: slot.ratio }]}
              allowVideo
            />
          </div>
        ))}
      </div>
    </section>
  )
}
